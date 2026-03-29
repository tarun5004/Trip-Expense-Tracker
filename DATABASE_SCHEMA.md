# SplitSmart — Database Schema Document

**Version:** 1.0  
**Date:** 2026-03-29  
**Engine:** PostgreSQL 16  
**ORM:** Prisma 5.x (migrations authored as raw SQL for auditability)  
**Companion to:** PRODUCT_SPEC.md, SYSTEM_DESIGN.md  

---

## Design Principles

1. **Cents, not decimals.** All monetary values are `INTEGER` representing the smallest currency unit (e.g., cents, paise). This eliminates floating-point rounding errors in financial calculations. Conversion to display format (`amount_cents / 100`) happens exclusively in the application layer.
2. **UTC everywhere.** All timestamps are `TIMESTAMPTZ`. Timezone conversion happens in the client.
3. **Soft deletes where data has financial significance.** `deleted_at` is added to `users`, `groups`, `expenses`, and `payments`. Queries must filter `WHERE deleted_at IS NULL` by default. Activity logs and notifications are never deleted.
4. **UUIDs as primary keys.** `uuid_generate_v4()` provides globally unique, non-sequential IDs that are safe for distributed systems and don't leak row counts.
5. **No business logic in the database.** No triggers, no stored procedures, no computed columns. All business rules (BR-01 through BR-12) are enforced in the application service layer. Check constraints enforce structural invariants only (e.g., `amount > 0`).

---

## Entity Relationship Diagram (Text)

```
                                    ┌─────────────────┐
                                    │     sessions     │
                                    ├─────────────────┤
                                    │ user_id (FK) ───│──┐
                                    └─────────────────┘  │
                                                         │
┌─────────────────┐    ┌──────────────────┐              │
│  notifications  │    │      users       │◄─────────────┘
├─────────────────┤    ├──────────────────┤
│ user_id (FK) ───│───►│ id (PK)          │◄──────────────────────────────┐
└─────────────────┘    └──────────────────┘                               │
                              │ ▲                                         │
                              │ │                                         │
              ┌───────────────┘ │                                         │
              │                 │                                         │
              ▼                 │                                         │
     ┌──────────────────┐      │     ┌──────────────────┐                │
     │     groups       │      │     │  group_members   │                │
     ├──────────────────┤      │     ├──────────────────┤                │
     │ id (PK)          │◄─────│─────│ group_id (FK)    │                │
     │ created_by (FK)──│──────┘     │ user_id (FK) ────│────────────────┤
     └──────────────────┘            └──────────────────┘                │
              │                                                          │
              │                                                          │
     ┌────────┴──────────────────────────────────────────────┐           │
     │                       │                               │           │
     ▼                       ▼                               ▼           │
┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐        │
│    expenses      │  │    payments      │  │  activity_log    │        │
├──────────────────┤  ├──────────────────┤  ├──────────────────┤        │
│ group_id (FK)    │  │ group_id (FK)    │  │ group_id (FK)    │        │
│ paid_by (FK) ────│──│ paid_by (FK) ────│──│ actor_id (FK) ───│────────┤
│ created_by (FK)──│──│ paid_to (FK) ────│──┘                           │
└──────────────────┘  └──────────────────┘                              │
         │                                                              │
         ▼                                                              │
┌──────────────────┐                                                    │
│ expense_splits   │                                                    │
├──────────────────┤                                                    │
│ expense_id (FK)  │                                                    │
│ user_id (FK) ────│────────────────────────────────────────────────────┘
└──────────────────┘
```

---

## Table Definitions

### 1. `users`

Stores registered user accounts. Supports soft delete for GDPR-compliant account closure while preserving financial history integrity.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK, DEFAULT uuid_generate_v4()` | Unique user identifier |
| `email` | `VARCHAR(255)` | `NOT NULL, UNIQUE` | Login email; unique across non-deleted users |
| `password_hash` | `VARCHAR(255)` | `NOT NULL` | bcrypt hash (cost factor 12) |
| `name` | `VARCHAR(100)` | `NOT NULL` | Display name shown in groups |
| `avatar_url` | `VARCHAR(500)` | `NULL` | URL to profile picture in object store |
| `phone` | `VARCHAR(20)` | `NULL, UNIQUE` | Optional phone; unique if provided |
| `currency_preference` | `VARCHAR(3)` | `NOT NULL, DEFAULT 'INR'` | ISO 4217 currency code; used as default for new expenses |
| `timezone` | `VARCHAR(50)` | `NOT NULL, DEFAULT 'Asia/Kolkata'` | IANA timezone identifier for display |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Account creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Last profile update |
| `deleted_at` | `TIMESTAMPTZ` | `NULL` | Soft delete; non-null = account closed |

**Constraints:**
- `CHECK (char_length(email) >= 5)` — minimum valid email length
- `CHECK (char_length(name) >= 1)` — name cannot be empty
- `CHECK (char_length(currency_preference) = 3)` — ISO 4217 is always 3 chars
- Unique index on `email` is partial: `WHERE deleted_at IS NULL` — allows email reuse after account deletion

**Example Row:**

```json
{
  "id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "email": "priya.sharma@email.com",
  "password_hash": "$2b$12$LJ3m5...",
  "name": "Priya Sharma",
  "avatar_url": "https://cdn.splitsmart.app/avatars/a1b2c3d4.jpg",
  "phone": "+919876543210",
  "currency_preference": "INR",
  "timezone": "Asia/Kolkata",
  "created_at": "2026-01-15T10:30:00Z",
  "updated_at": "2026-03-01T14:22:00Z",
  "deleted_at": null
}
```

---

### 2. `groups`

Represents a named collection of users who share expenses. Groups can be archived (soft delete) but their financial data is preserved.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK, DEFAULT uuid_generate_v4()` | Unique group identifier |
| `name` | `VARCHAR(100)` | `NOT NULL` | Display name (e.g., "Goa Trip 2026") |
| `description` | `VARCHAR(500)` | `NULL` | Optional description/notes |
| `currency` | `VARCHAR(3)` | `NOT NULL, DEFAULT 'INR'` | Base currency for balance display (ISO 4217) |
| `created_by` | `UUID` | `NOT NULL, FK → users(id)` | User who created the group; becomes default admin |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Group creation timestamp |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Last update (rename, settings change) |
| `deleted_at` | `TIMESTAMPTZ` | `NULL` | Soft delete; non-null = group archived |

**Constraints:**
- `CHECK (char_length(name) >= 1)` — name cannot be empty
- `CHECK (char_length(currency) = 3)` — ISO 4217
- `FK created_by → users(id) ON DELETE RESTRICT` — cannot delete a user who created a group (close account via soft delete instead)

**Example Row:**

```json
{
  "id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "name": "Goa Trip 2026",
  "description": "Beach trip with college friends, March 2026",
  "currency": "INR",
  "created_by": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "created_at": "2026-03-01T08:00:00Z",
  "updated_at": "2026-03-01T08:00:00Z",
  "deleted_at": null
}
```

---

### 3. `group_members`

Junction table for the many-to-many relationship between users and groups. Tracks role (admin/member) and membership period.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK, DEFAULT uuid_generate_v4()` | Unique membership record |
| `group_id` | `UUID` | `NOT NULL, FK → groups(id)` | The group |
| `user_id` | `UUID` | `NOT NULL, FK → users(id)` | The member |
| `role` | `VARCHAR(10)` | `NOT NULL, DEFAULT 'member'` | `'admin'` or `'member'` (see RBAC in SYSTEM_DESIGN §5.3) |
| `joined_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | When the user joined the group |
| `left_at` | `TIMESTAMPTZ` | `NULL` | When the user left; NULL = active member |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Record creation |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Last update (role change) |

**Constraints:**
- `UNIQUE (group_id, user_id) WHERE left_at IS NULL` — a user can be an active member of a group only once; allows rejoin by creating a new row after leaving
- `CHECK (role IN ('admin', 'member'))` — enforced at DB level
- `FK group_id → groups(id) ON DELETE CASCADE` — if a group is hard-deleted (admin action), memberships are cleaned up
- `FK user_id → users(id) ON DELETE CASCADE` — if a user is hard-deleted, their memberships are removed

**Business Rule Annotations:**
- BR-09: Application layer enforces `COUNT(*) WHERE group_id = ? AND left_at IS NULL <= 50` before inserting
- Group creator is auto-inserted with `role = 'admin'` during group creation

**Example Row:**

```json
{
  "id": "c3d4e5f6-a7b8-9012-cdef-123456789012",
  "group_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "role": "admin",
  "joined_at": "2026-03-01T08:00:00Z",
  "left_at": null,
  "created_at": "2026-03-01T08:00:00Z",
  "updated_at": "2026-03-01T08:00:00Z"
}
```

---

### 4. `expenses`

Core financial entity. Represents a purchase made by one user on behalf of the group. The `total_amount_cents` is split among participants via `expense_splits`.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK, DEFAULT uuid_generate_v4()` | Unique expense identifier |
| `group_id` | `UUID` | `NOT NULL, FK → groups(id)` | The group this expense belongs to |
| `paid_by_user_id` | `UUID` | `NOT NULL, FK → users(id)` | The user who paid (single payer; multi-payer deferred to P2-07) |
| `title` | `VARCHAR(200)` | `NOT NULL` | Short description (e.g., "Dinner at Olive Garden") |
| `description` | `TEXT` | `NULL` | Optional longer notes |
| `total_amount_cents` | `INTEGER` | `NOT NULL` | Total expense amount in smallest currency unit |
| `currency` | `VARCHAR(3)` | `NOT NULL, DEFAULT 'INR'` | ISO 4217 currency of this expense |
| `split_type` | `VARCHAR(12)` | `NOT NULL, DEFAULT 'equal'` | How the expense is divided among participants |
| `category` | `VARCHAR(50)` | `NULL, DEFAULT 'general'` | Expense category (P1-01; nullable for MVP) |
| `expense_date` | `DATE` | `NOT NULL, DEFAULT CURRENT_DATE` | When the expense occurred (may differ from `created_at`) |
| `receipt_url` | `VARCHAR(500)` | `NULL` | S3 pre-signed URL for receipt image (P1-02) |
| `created_by` | `UUID` | `NOT NULL, FK → users(id)` | User who created the record (may differ from payer) |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Record creation |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Last edit |
| `deleted_at` | `TIMESTAMPTZ` | `NULL` | Soft delete |

**Constraints:**
- `CHECK (total_amount_cents > 0)` — expenses must be positive
- `CHECK (split_type IN ('equal', 'exact', 'percentage', 'shares'))` — valid split types
- `CHECK (char_length(title) >= 1)` — title required
- `CHECK (char_length(currency) = 3)` — ISO 4217
- `FK group_id → groups(id) ON DELETE RESTRICT` — cannot delete a group with expenses
- `FK paid_by_user_id → users(id) ON DELETE RESTRICT` — financial integrity
- `FK created_by → users(id) ON DELETE RESTRICT` — audit integrity

**Business Rule Annotations:**
- BR-01: Application layer validates `SUM(expense_payers.amount_paid_cents) = total_amount_cents` (future: multi-payer)
- BR-02: Application layer validates `SUM(expense_splits.amount_cents) = total_amount_cents`
- BR-03: Application layer validates `COUNT(expense_splits) >= 2`
- BR-04: Application layer checks `NOW() - created_at <= 48 hours` AND no settlements reference this expense before allowing edit/delete

**Example Row:**

```json
{
  "id": "d4e5f6a7-b8c9-0123-defa-234567890123",
  "group_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "paid_by_user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "title": "Dinner at Olive Garden",
  "description": "Team dinner after beach day",
  "total_amount_cents": 240000,
  "currency": "INR",
  "split_type": "equal",
  "category": "food",
  "expense_date": "2026-03-15",
  "receipt_url": null,
  "created_by": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "created_at": "2026-03-15T20:30:00Z",
  "updated_at": "2026-03-15T20:30:00Z",
  "deleted_at": null
}
```

---

### 5. `expense_splits`

Represents each participant's share of an expense. One row per participant per expense. The `amount_cents` is the canonical owed amount regardless of split type.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK, DEFAULT uuid_generate_v4()` | Unique split record |
| `expense_id` | `UUID` | `NOT NULL, FK → expenses(id)` | Parent expense |
| `user_id` | `UUID` | `NOT NULL, FK → users(id)` | Participant who owes this share |
| `amount_cents` | `INTEGER` | `NOT NULL` | Computed amount owed in smallest currency unit |
| `percentage` | `NUMERIC(5,2)` | `NULL` | Percentage share (only set when `split_type = 'percentage'`) |
| `shares` | `INTEGER` | `NULL` | Number of share units (only set when `split_type = 'shares'`) |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Record creation |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Last update |

**Constraints:**
- `CHECK (amount_cents >= 0)` — a participant's share can be zero (opted out of specific items) but not negative
- `CHECK (percentage IS NULL OR (percentage >= 0 AND percentage <= 100))` — valid percentage range
- `CHECK (shares IS NULL OR shares >= 0)` — valid share count
- `UNIQUE (expense_id, user_id)` — each user appears at most once per expense
- `FK expense_id → expenses(id) ON DELETE CASCADE` — if expense is hard-deleted, splits go with it
- `FK user_id → users(id) ON DELETE RESTRICT` — financial integrity

**Business Rule Annotations:**
- BR-02: Application layer validates that across all splits for an expense: `SUM(amount_cents) = expense.total_amount_cents`
- For `split_type = 'equal'`: `amount_cents = FLOOR(total / n)` for n-1 participants, and the remainder is added to the last participant to avoid rounding loss
- For `split_type = 'percentage'`: `amount_cents = ROUND(total * percentage / 100)`; app validates `SUM(percentage) = 100`
- For `split_type = 'shares'`: `amount_cents = ROUND(total * shares / total_shares)`; app validates integer shares sum

**Example Rows (for the ₹2,400 dinner split equally among 4 people):**

```json
[
  { "id": "e5f6a7b8-...", "expense_id": "d4e5f6a7-...", "user_id": "a1b2c3d4-...", "amount_cents": 60000, "percentage": null, "shares": null },
  { "id": "f6a7b8c9-...", "expense_id": "d4e5f6a7-...", "user_id": "user2-uuid-...", "amount_cents": 60000, "percentage": null, "shares": null },
  { "id": "a7b8c9d0-...", "expense_id": "d4e5f6a7-...", "user_id": "user3-uuid-...", "amount_cents": 60000, "percentage": null, "shares": null },
  { "id": "b8c9d0e1-...", "expense_id": "d4e5f6a7-...", "user_id": "user4-uuid-...", "amount_cents": 60000, "percentage": null, "shares": null }
]
```

---

### 6. `payments`

Records money transfers between group members (settlements). Immutable once confirmed (BR-07); reversals create a new counter-entry.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK, DEFAULT uuid_generate_v4()` | Unique payment identifier |
| `group_id` | `UUID` | `NOT NULL, FK → groups(id)` | The group context for this settlement |
| `paid_by_user_id` | `UUID` | `NOT NULL, FK → users(id)` | User who made the payment (debtor) |
| `paid_to_user_id` | `UUID` | `NOT NULL, FK → users(id)` | User who received the payment (creditor) |
| `amount_cents` | `INTEGER` | `NOT NULL` | Amount settled in smallest currency unit |
| `currency` | `VARCHAR(3)` | `NOT NULL, DEFAULT 'INR'` | ISO 4217 currency code |
| `payment_method` | `VARCHAR(20)` | `NULL, DEFAULT 'cash'` | How the payment was made (cash, upi, bank_transfer, other) |
| `note` | `VARCHAR(500)` | `NULL` | Optional note (e.g., "UPI ref: 123456") |
| `status` | `VARCHAR(12)` | `NOT NULL, DEFAULT 'pending'` | Settlement lifecycle state |
| `confirmed_at` | `TIMESTAMPTZ` | `NULL` | When the creditor confirmed receipt |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | When the payment was recorded |
| `updated_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Last status change |
| `deleted_at` | `TIMESTAMPTZ` | `NULL` | Soft delete (for admin reversal scenarios) |

**Constraints:**
- `CHECK (amount_cents > 0)` — payments must be positive
- `CHECK (paid_by_user_id != paid_to_user_id)` — cannot pay yourself
- `CHECK (status IN ('pending', 'confirmed', 'disputed'))` — valid statuses
- `CHECK (char_length(currency) = 3)` — ISO 4217
- `FK group_id → groups(id) ON DELETE RESTRICT` — cannot delete group with payments
- `FK paid_by_user_id → users(id) ON DELETE RESTRICT` — financial integrity
- `FK paid_to_user_id → users(id) ON DELETE RESTRICT` — financial integrity

**Business Rule Annotations:**
- BR-05: Application layer validates `amount_cents <= outstanding_balance(paid_by, paid_to, group)`
- BR-06: Payments start as `'pending'`; creditor confirms or disputes; 72h auto-confirm handled by BullMQ worker
- BR-07: Once `status = 'confirmed'`, the row is immutable. Reversals are new payments in the opposite direction.

**Example Row:**

```json
{
  "id": "f1e2d3c4-b5a6-7890-fedc-ba0987654321",
  "group_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "paid_by_user_id": "user2-uuid-...",
  "paid_to_user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "amount_cents": 60000,
  "currency": "INR",
  "payment_method": "upi",
  "note": "UPI ref: TXN123456789",
  "status": "confirmed",
  "confirmed_at": "2026-03-17T10:00:00Z",
  "created_at": "2026-03-16T18:00:00Z",
  "updated_at": "2026-03-17T10:00:00Z",
  "deleted_at": null
}
```

---

### 7. `activity_log`

Append-only audit trail for all group actions. Supports the Activity Feed (P1-06) and the audit trail security requirement. Rows are never updated or deleted.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK, DEFAULT uuid_generate_v4()` | Unique log entry |
| `group_id` | `UUID` | `NOT NULL, FK → groups(id)` | Which group the action occurred in |
| `actor_user_id` | `UUID` | `NOT NULL, FK → users(id)` | Who performed the action |
| `action_type` | `VARCHAR(30)` | `NOT NULL` | What happened |
| `entity_type` | `VARCHAR(20)` | `NOT NULL` | Type of entity affected |
| `entity_id` | `UUID` | `NOT NULL` | ID of the entity affected |
| `metadata_json` | `JSONB` | `NULL, DEFAULT '{}'` | Before/after state snapshot for auditing |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | When the action occurred |

**Note:** This table intentionally omits `updated_at` and `deleted_at` — log entries are immutable by design.

**Constraints:**
- `CHECK (action_type IN ('expense_created', 'expense_updated', 'expense_deleted', 'payment_created', 'payment_confirmed', 'payment_disputed', 'member_added', 'member_removed', 'member_role_changed', 'group_updated', 'group_archived'))` — valid action types
- `CHECK (entity_type IN ('expense', 'payment', 'group', 'group_member'))` — valid entity types
- `FK group_id → groups(id) ON DELETE CASCADE` — if group is purged, so is its log
- `FK actor_user_id → users(id) ON DELETE RESTRICT` — preserve audit attribution

**Example Row:**

```json
{
  "id": "01234567-89ab-cdef-0123-456789abcdef",
  "group_id": "b2c3d4e5-f6a7-8901-bcde-f12345678901",
  "actor_user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "action_type": "expense_created",
  "entity_type": "expense",
  "entity_id": "d4e5f6a7-b8c9-0123-defa-234567890123",
  "metadata_json": {
    "title": "Dinner at Olive Garden",
    "total_amount_cents": 240000,
    "split_type": "equal",
    "participant_count": 4
  },
  "created_at": "2026-03-15T20:30:00Z"
}
```

---

### 8. `notifications`

User-facing notification records. Supports in-app notification bell (P0-10), read/unread tracking, and stores data for push notification dispatch.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK, DEFAULT uuid_generate_v4()` | Unique notification |
| `user_id` | `UUID` | `NOT NULL, FK → users(id)` | Recipient |
| `type` | `VARCHAR(30)` | `NOT NULL` | Notification category for display/filtering |
| `title` | `VARCHAR(200)` | `NOT NULL` | Notification headline |
| `body` | `TEXT` | `NOT NULL` | Full notification content |
| `related_entity_type` | `VARCHAR(20)` | `NULL` | For deep-linking: entity type |
| `related_entity_id` | `UUID` | `NULL` | For deep-linking: entity ID |
| `is_read` | `BOOLEAN` | `NOT NULL, DEFAULT FALSE` | Whether the user has seen this notification |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | When the notification was created |

**Note:** `updated_at` is omitted — the only mutation is marking as read, which is tracked via `is_read`.

**Constraints:**
- `CHECK (type IN ('expense_added', 'expense_updated', 'expense_deleted', 'payment_received', 'payment_confirmation_request', 'payment_confirmed', 'payment_disputed', 'group_invitation', 'payment_reminder', 'member_joined', 'member_left'))` — valid notification types
- `FK user_id → users(id) ON DELETE CASCADE` — user deletion removes their notifications

**Example Row:**

```json
{
  "id": "abcdef01-2345-6789-abcd-ef0123456789",
  "user_id": "user2-uuid-...",
  "type": "expense_added",
  "title": "New expense in Goa Trip 2026",
  "body": "Priya added ₹2,400 for Dinner at Olive Garden — you owe ₹600",
  "related_entity_type": "expense",
  "related_entity_id": "d4e5f6a7-b8c9-0123-defa-234567890123",
  "is_read": false,
  "created_at": "2026-03-15T20:30:05Z"
}
```

---

### 9. `sessions`

Stores refresh tokens and session metadata for the JWT authentication flow (SYSTEM_DESIGN §5.1). Enables token revocation and device management.

| Column | Type | Constraints | Description |
|---|---|---|---|
| `id` | `UUID` | `PK, DEFAULT uuid_generate_v4()` | Unique session identifier |
| `user_id` | `UUID` | `NOT NULL, FK → users(id)` | Session owner |
| `refresh_token_hash` | `VARCHAR(255)` | `NOT NULL, UNIQUE` | SHA-256 hash of the refresh token (never store raw tokens) |
| `device_info` | `VARCHAR(500)` | `NULL` | User-Agent or device description |
| `ip_address` | `INET` | `NULL` | IP address at session creation |
| `created_at` | `TIMESTAMPTZ` | `NOT NULL, DEFAULT NOW()` | Session start |
| `expires_at` | `TIMESTAMPTZ` | `NOT NULL` | Refresh token expiry (7 days from creation) |
| `revoked_at` | `TIMESTAMPTZ` | `NULL` | When the session was revoked; non-null = invalid |

**Note:** `updated_at` is omitted — sessions are created and optionally revoked, never updated.

**Constraints:**
- `CHECK (expires_at > created_at)` — expiry must be in the future at creation time
- `FK user_id → users(id) ON DELETE CASCADE` — user deletion invalidates all sessions

**Example Row:**

```json
{
  "id": "12345678-abcd-ef01-2345-6789abcdef01",
  "user_id": "a1b2c3d4-e5f6-7890-abcd-ef1234567890",
  "refresh_token_hash": "e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855",
  "device_info": "Mozilla/5.0 (iPhone; CPU iPhone OS 19_0 like Mac OS X)",
  "ip_address": "203.0.113.42",
  "created_at": "2026-03-29T10:00:00Z",
  "expires_at": "2026-04-05T10:00:00Z",
  "revoked_at": null
}
```

---

## Relationship Summary

| Relationship | Type | FK Column | References | ON DELETE |
|---|---|---|---|---|
| `groups.created_by` → `users.id` | Many-to-One | `created_by` | `users(id)` | `RESTRICT` |
| `group_members.group_id` → `groups.id` | Many-to-One | `group_id` | `groups(id)` | `CASCADE` |
| `group_members.user_id` → `users.id` | Many-to-One | `user_id` | `users(id)` | `CASCADE` |
| `expenses.group_id` → `groups.id` | Many-to-One | `group_id` | `groups(id)` | `RESTRICT` |
| `expenses.paid_by_user_id` → `users.id` | Many-to-One | `paid_by_user_id` | `users(id)` | `RESTRICT` |
| `expenses.created_by` → `users.id` | Many-to-One | `created_by` | `users(id)` | `RESTRICT` |
| `expense_splits.expense_id` → `expenses.id` | Many-to-One | `expense_id` | `expenses(id)` | `CASCADE` |
| `expense_splits.user_id` → `users.id` | Many-to-One | `user_id` | `users(id)` | `RESTRICT` |
| `payments.group_id` → `groups.id` | Many-to-One | `group_id` | `groups(id)` | `RESTRICT` |
| `payments.paid_by_user_id` → `users.id` | Many-to-One | `paid_by_user_id` | `users(id)` | `RESTRICT` |
| `payments.paid_to_user_id` → `users.id` | Many-to-One | `paid_to_user_id` | `users(id)` | `RESTRICT` |
| `activity_log.group_id` → `groups.id` | Many-to-One | `group_id` | `groups(id)` | `CASCADE` |
| `activity_log.actor_user_id` → `users.id` | Many-to-One | `actor_user_id` | `users(id)` | `RESTRICT` |
| `notifications.user_id` → `users.id` | Many-to-One | `user_id` | `users(id)` | `CASCADE` |
| `sessions.user_id` → `users.id` | Many-to-One | `user_id` | `users(id)` | `CASCADE` |

---

## Balance Computation Query (Reference)

Balances are computed in the application layer, not stored. The canonical balance between any two users in a group is derived from:

```sql
-- Net amount user_a owes user_b in a group (positive = A owes B)
WITH expense_debts AS (
    SELECT
        es.user_id AS debtor_id,
        e.paid_by_user_id AS creditor_id,
        SUM(es.amount_cents) AS total_owed
    FROM expense_splits es
    JOIN expenses e ON es.expense_id = e.id
    WHERE e.group_id = :group_id
      AND e.deleted_at IS NULL
      AND es.user_id != e.paid_by_user_id
    GROUP BY es.user_id, e.paid_by_user_id
),
settlement_credits AS (
    SELECT
        paid_by_user_id AS debtor_id,
        paid_to_user_id AS creditor_id,
        SUM(amount_cents) AS total_settled
    FROM payments
    WHERE group_id = :group_id
      AND status = 'confirmed'
      AND deleted_at IS NULL
    GROUP BY paid_by_user_id, paid_to_user_id
)
SELECT
    COALESCE(d.debtor_id, s.debtor_id) AS debtor_id,
    COALESCE(d.creditor_id, s.creditor_id) AS creditor_id,
    COALESCE(d.total_owed, 0) - COALESCE(s.total_settled, 0) AS net_balance_cents
FROM expense_debts d
FULL OUTER JOIN settlement_credits s
    ON d.debtor_id = s.debtor_id AND d.creditor_id = s.creditor_id
HAVING COALESCE(d.total_owed, 0) - COALESCE(s.total_settled, 0) != 0;
```

The debt simplification algorithm (min-cash-flow) then processes these net balances in the application layer to produce the minimal set of settlements.

---

*End of Document*
