# SplitSmart — Database Index Strategy

**Version:** 1.0  
**Date:** 2026-03-29  
**Engine:** PostgreSQL 16  
**Companion to:** DATABASE_SCHEMA.md, SYSTEM_DESIGN.md  

---

## Design Philosophy

1. **Index for the query, not the table.** Every index maps to a specific query executed by a known application code path. No speculative indexes.
2. **Partial indexes where possible.** Soft-deleted rows are filtered out of most indexes using `WHERE deleted_at IS NULL` or equivalent. This keeps indexes smaller and faster.
3. **Covering indexes for hot paths.** The balance computation query (the single most critical query in the system) uses covering indexes to avoid heap lookups.
4. **Measure before adding.** This document represents the launch-day index set. Additional indexes should be added only after query profiling reveals slow queries (≥200ms p50 target from PRD §5.1).

---

## Index Inventory

### `users`

| Index Name | Columns | Type | Partial Filter | Query It Serves | Reasoning |
|---|---|---|---|---|---|
| `uq_users_email_active` | `email` | Unique, B-tree | `WHERE deleted_at IS NULL` | `SELECT ... WHERE email = ?` (login, registration duplicate check) | Login is the most frequent users query. Partial filter ensures deleted accounts don't block email reuse. |
| `uq_users_phone_active` | `phone` | Unique, B-tree | `WHERE deleted_at IS NULL AND phone IS NOT NULL` | `SELECT ... WHERE phone = ?` (contact-based friend lookup) | Supports invite-by-phone without full table scan. Partial filter excludes nulls and deleted users. |

**Not indexed:** `name` — searched only within small group member lists (≤50), never across the full user table.

---

### `groups`

| Index Name | Columns | Type | Partial Filter | Query It Serves | Reasoning |
|---|---|---|---|---|---|
| `idx_groups_created_by` | `created_by` | B-tree | `WHERE deleted_at IS NULL` | `SELECT ... WHERE created_by = ?` (user's created groups) | Low-cardinality query but avoids full scan. Filtered to exclude archived groups. |

**Not indexed separately:** `name` — groups are always accessed via `group_members` join (user's groups), never by name search across all groups.

---

### `group_members`

| Index Name | Columns | Type | Partial Filter | Query It Serves | Reasoning |
|---|---|---|---|---|---|
| `uq_group_members_active` | `(group_id, user_id)` | Unique, B-tree | `WHERE left_at IS NULL` | Membership uniqueness constraint | Prevents duplicate active memberships while allowing historical rejoin records. |
| `idx_group_members_user_id` | `user_id` | B-tree | `WHERE left_at IS NULL` | `SELECT ... WHERE user_id = ? AND left_at IS NULL` (list user's active groups = Dashboard) | **Hot path.** The dashboard loads all groups for the current user on every app open. Filtered to active memberships only. |
| `idx_group_members_group_id` | `group_id` | B-tree | `WHERE left_at IS NULL` | `SELECT ... WHERE group_id = ? AND left_at IS NULL` (list group's active members = authorization check) | **Hot path.** Every group API call first checks membership. Filtered to active only. |

**Why two single-column indexes instead of one composite?** The user-ID lookup (dashboard) and group-ID lookup (auth check) are independent queries that never appear together. Separate indexes are more efficient than a composite for single-column predicates.

---

### `expenses`

| Index Name | Columns | Type | Partial Filter | Query It Serves | Reasoning |
|---|---|---|---|---|---|
| `idx_expenses_group_id_date` | `(group_id, expense_date DESC)` | B-tree | `WHERE deleted_at IS NULL` | `SELECT ... WHERE group_id = ? ORDER BY expense_date DESC LIMIT 20` (group expense list, paginated) | **Hot path.** The most viewed screen in the app. Composite index supports both filter and sort. DESC ordering matches the default display order. |
| `idx_expenses_paid_by` | `(paid_by_user_id, created_at DESC)` | B-tree | `WHERE deleted_at IS NULL` | Balance computation: `WHERE paid_by_user_id = ?`; also "my expenses" personal view | Used in the balance computation join. Serves as a secondary access pattern. |
| `idx_expenses_group_category` | `(group_id, category)` | B-tree | `WHERE deleted_at IS NULL AND category IS NOT NULL` | Category filter on expense history (P1-01) | Lower priority; only needed after P1-01 is in production. Included at launch to avoid a future migration. |
| `idx_expenses_title_search` | `to_tsvector('english', title)` | GIN | None | `WHERE to_tsvector('english', title) @@ plainto_tsquery(?)` (full-text search, P1-09) | GIN index on tsvector enables sub-second full-text search across thousands of expenses without `LIKE '%...%'` full scans. |

**Not indexed:** `currency` — always queried alongside `group_id`, which is already covered. `created_by` — rarely queried independently; the `paid_by` index covers the common case where creator = payer.

---

### `expense_splits`

| Index Name | Columns | Type | Partial Filter | Query It Serves | Reasoning |
|---|---|---|---|---|---|
| `uq_expense_splits_expense_user` | `(expense_id, user_id)` | Unique, B-tree | None | Uniqueness constraint + `SELECT ... WHERE expense_id = ?` (load all splits for an expense) | The unique index doubles as the primary lookup index. No filter needed — splits don't have soft delete. |
| `idx_expense_splits_user_id` | `user_id` | B-tree | None | `SELECT ... WHERE user_id = ?` (balance computation: all expenses a user participates in) | **Critical for balance computation.** Without this, computing a user's balance requires scanning all splits across all groups. |
| `idx_expense_splits_expense_id_user_id` | `(expense_id, user_id, amount_cents)` | B-tree (covering) | None | Balance computation join: returns `amount_cents` without heap lookup | **Covering index** for the most expensive query in the system. Including `amount_cents` means PostgreSQL can answer the balance query entirely from the index without touching the heap. |

**Why both `uq_expense_splits_expense_user` and `idx_expense_splits_expense_id_user_id`?** The unique index enforces the constraint at write time. The covering index is optimized for the read-heavy balance computation query. PostgreSQL may use either depending on the query plan, but the covering index avoids heap fetches for the hot path.

---

### `payments`

| Index Name | Columns | Type | Partial Filter | Query It Serves | Reasoning |
|---|---|---|---|---|---|
| `idx_payments_group_id` | `(group_id, created_at DESC)` | B-tree | `WHERE deleted_at IS NULL` | `SELECT ... WHERE group_id = ? ORDER BY created_at DESC` (settlement history in group) | Composite supports filter + sort for the settlements tab. |
| `idx_payments_pending_auto_confirm` | `created_at` | B-tree | `WHERE status = 'pending' AND deleted_at IS NULL` | `SELECT ... WHERE status = 'pending' AND created_at < NOW() - INTERVAL '72 hours'` (auto-confirm worker) | **Specialized job index.** The BullMQ worker runs this query every hour. Without a filtered index, it would scan all payments. This index contains only pending payments (typically <5% of total). |
| `idx_payments_paid_by` | `(group_id, paid_by_user_id)` | B-tree | `WHERE status = 'confirmed' AND deleted_at IS NULL` | Balance computation: `SUM(amount_cents) WHERE group_id = ? AND paid_by_user_id = ?` | Filtered to confirmed-only because pending/disputed payments don't affect balances. |
| `idx_payments_paid_to` | `(group_id, paid_to_user_id)` | B-tree | `WHERE status = 'confirmed' AND deleted_at IS NULL` | Balance computation: `SUM(amount_cents) WHERE group_id = ? AND paid_to_user_id = ?` | Mirror of the `paid_by` index for the creditor side of the balance query. |

---

### `activity_log`

| Index Name | Columns | Type | Partial Filter | Query It Serves | Reasoning |
|---|---|---|---|---|---|
| `idx_activity_log_group_created` | `(group_id, created_at DESC)` | B-tree | None | `SELECT ... WHERE group_id = ? ORDER BY created_at DESC LIMIT 20` (activity feed, paginated) | Primary access pattern. No filter because activity logs are never deleted. |
| `idx_activity_log_actor` | `(actor_user_id, created_at DESC)` | B-tree | None | `SELECT ... WHERE actor_user_id = ?` (admin: "what did this user do?") | Infrequent but important for dispute resolution and security auditing. |
| `idx_activity_log_entity` | `(entity_type, entity_id)` | B-tree | None | `SELECT ... WHERE entity_type = ? AND entity_id = ?` (history of a specific expense/payment) | Supports the "Details" view that shows all actions on a specific entity. |
| `idx_activity_log_metadata` | `metadata_json` | GIN | None | JSONB containment queries: `@>` operator on metadata | Future-proofing for ad-hoc queries on audit data. GIN indexes on JSONB are compact and useful for `@>` containment checks. |

---

### `notifications`

| Index Name | Columns | Type | Partial Filter | Query It Serves | Reasoning |
|---|---|---|---|---|---|
| `idx_notifications_user_unread` | `(user_id, created_at DESC)` | B-tree | `WHERE is_read = FALSE` | `SELECT ... WHERE user_id = ? AND is_read = FALSE` (notification bell count + dropdown) | **Hot path.** Checked on every page load. Filtered to unread-only keeps the index small as notifications accumulate. |
| `idx_notifications_user_all` | `(user_id, created_at DESC)` | B-tree | None | `SELECT ... WHERE user_id = ? ORDER BY created_at DESC LIMIT 20` (full notification list, paginated) | Secondary access pattern for the "View All Notifications" page. |

---

### `sessions`

| Index Name | Columns | Type | Partial Filter | Query It Serves | Reasoning |
|---|---|---|---|---|---|
| `uq_sessions_refresh_token` | `refresh_token_hash` | Unique, B-tree (implicit) | None | `SELECT ... WHERE refresh_token_hash = ?` (token refresh endpoint) | Created by the `UNIQUE` constraint. Ensures token uniqueness and provides fast lookup. |
| `idx_sessions_user_active` | `user_id` | B-tree | `WHERE revoked_at IS NULL` | `SELECT ... WHERE user_id = ? AND revoked_at IS NULL` (list active sessions / device management) | Filtered to active sessions only. Also used for "revoke all sessions" feature. |
| `idx_sessions_token_active` | `refresh_token_hash` | B-tree | `WHERE revoked_at IS NULL AND expires_at > NOW()` | `SELECT ... WHERE refresh_token_hash = ? AND revoked_at IS NULL AND expires_at > NOW()` (validate refresh token) | More selective than the unique index because it excludes revoked and expired tokens. The `NOW()` filter is evaluated at query time, so expired sessions are naturally excluded from scan. |

---

## Index Cost/Benefit Summary

| Table | Total Row Estimate (Year 1) | Index Count | Write Overhead | Justification |
|---|---|---|---|---|
| `users` | 100K | 2 | Minimal — users are written rarely | Both indexes serve login (the highest-frequency query against this table) |
| `groups` | 250K | 1 | Minimal | Groups are read-heavy after creation |
| `group_members` | 500K | 3 | Low — memberships change rarely | Auth check on every API call makes these critical |
| `expenses` | 5M | 4 | Moderate — 4 indexes on every insert | The expense insert path is the #1 write operation, but all 4 indexes serve critical read paths. Acceptable trade-off. |
| `expense_splits` | 15M | 3 | Moderate — typically 3-5 rows per expense | Balance computation is the #1 read path; covering index is essential |
| `payments` | 500K | 4 | Low — settlements are infrequent | The pending auto-confirm index is essential for the 72h worker |
| `activity_log` | 20M | 4 | Highest — log every write operation | Append-only table; no updates mean index fragmentation is manageable. GIN on JSONB is the most expensive to maintain but justified for auditability. |
| `notifications` | 50M | 2 | Moderate — high-volume table | The filtered unread index is the key optimization; keeps hot-path fast despite table growth |
| `sessions` | 1M | 3 | Low — sessions created ~1x per device per week | Token lookup speed is critical (on every authenticated request via refresh) |

**Total indexes: 26** across 9 tables.

---

## Maintenance Recommendations

1. **Auto-vacuum tuning.** `activity_log` and `notifications` are append-heavy tables. Set `autovacuum_vacuum_scale_factor = 0.01` and `autovacuum_analyze_scale_factor = 0.005` on these tables to keep statistics fresh and prevent bloat.

2. **Periodic REINDEX.** Schedule `REINDEX CONCURRENTLY` on `idx_expenses_title_search` (GIN) and `idx_activity_log_metadata` (GIN) monthly during low-traffic hours. GIN indexes are more prone to internal fragmentation.

3. **Unused index detection.** After 90 days in production, query `pg_stat_user_indexes` for indexes with `idx_scan = 0` and evaluate for removal. Likely candidates: `idx_activity_log_metadata` (may not be queried until analytics features ship).

4. **Partition planning (Year 2).** When `activity_log` exceeds 50M rows, partition by `created_at` monthly. When `notifications` exceeds 100M rows, partition by `user_id` hash (16 partitions). The existing indexes are compatible with declarative partitioning.

---

*End of Document*
