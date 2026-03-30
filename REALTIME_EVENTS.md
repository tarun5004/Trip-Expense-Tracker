# SplitSmart Realtime Events Catalog

> Complete reference for all WebSocket events in the SplitSmart application.
> All events require an authenticated Socket.IO connection (JWT token in `handshake.auth.token`).

---

## Connection Lifecycle

### `connection:established` (S→C)

| Property | Description |
|---|---|
| **Trigger** | Immediately after successful Socket.IO authentication |
| **Direction** | Server → Client (to the connecting socket only) |

```typescript
interface ConnectionEstablished {
  userId: string;          // Authenticated user's UUID
  socketId: string;        // Socket.IO socket ID
  serverTimestamp: string;  // ISO 8601
  joinedRooms: string[];   // All rooms auto-joined (e.g., ["user:uuid", "group:uuid"])
  message: string;         // Human-readable welcome message
}
```

**React Query invalidation:** None — used for UI connection indicator only.

---

### `connection:error` (S→C)

| Property | Description |
|---|---|
| **Trigger** | When connection setup fails after successful auth |
| **Direction** | Server → Client |

```typescript
interface ConnectionError {
  error: 'CONNECTION_SETUP_FAILED';
  message: string;
}
```

---

## Group Room Management

### `group:join` (C→S)

| Property | Description |
|---|---|
| **Trigger** | Client navigates to a group page |
| **Direction** | Client → Server |

```typescript
// Client sends:
interface GroupJoinRequest {
  groupId: string;  // UUID of the group to join
}

// Server responds (via ack callback):
interface GroupJoinResult {
  success: boolean;
  room?: string;         // "group:{groupId}"
  memberCount?: number;  // Connected sockets in room
  error?: 'NOT_A_MEMBER' | 'MISSING_GROUP_ID' | 'INTERNAL_ERROR';
}
```

---

### `group:leave` (C→S)

| Property | Description |
|---|---|
| **Trigger** | Client navigates away from a group page |
| **Direction** | Client → Server |

```typescript
// Client sends:
interface GroupLeaveRequest {
  groupId: string;
}

// Server responds (via ack callback):
interface GroupLeaveResult {
  success: boolean;
  room: string;
}
```

---

### `member:online` (S→C)

| Property | Description |
|---|---|
| **Trigger** | Another group member joins the group room |
| **Direction** | Server → All group members (excluding the joining member) |

```typescript
interface MemberOnline {
  eventId: string;        // UUID for idempotency
  userId: string;         // Who came online
  name: string;           // Display name
  groupId: string;
  timestamp: string;      // ISO 8601
}
```

**React Query invalidation:** `['group', groupId, 'online-members']`

---

### `member:offline` (S→C)

| Property | Description |
|---|---|
| **Trigger** | A group member leaves the group room or disconnects |
| **Direction** | Server → All group members (excluding the leaving member) |

```typescript
interface MemberOffline {
  eventId: string;
  userId: string;
  name: string;
  groupId: string;
  timestamp: string;
}
```

**React Query invalidation:** `['group', groupId, 'online-members']`

---

## Expense Events

### `expense:created` (S→C)

| Property | Description |
|---|---|
| **Trigger** | A new expense is created via `POST /api/v1/expenses` |
| **Direction** | Server → All members of the expense's group room |

```typescript
interface ExpenseCreated {
  eventId: string;             // UUID for idempotency
  timestamp: string;           // ISO 8601
  expenseId: string;           // Created expense UUID
  title: string;
  totalAmountCents: number;    // Integer (cents/paise)
  splitType: 'equal' | 'exact' | 'percentage' | 'shares';
  paidByUserId: string;        // Who paid
  actorUserId: string;         // Who created the expense
  participantIds: string[];    // UUIDs of all participants
}
```

**React Query invalidation:**
- `['expenses', groupId]` — expense list
- `['balances', groupId]` — group balances
- `['activity', groupId]` — activity feed

---

### `expense:updated` (S→C)

| Property | Description |
|---|---|
| **Trigger** | An expense is updated via `PATCH /api/v1/expenses/:id` |
| **Direction** | Server → All members of the expense's group room |

```typescript
interface ExpenseUpdated {
  eventId: string;
  timestamp: string;
  expenseId: string;
  updatedFields: string[];     // Which fields changed (e.g., ["title", "total_amount_cents"])
  actorUserId: string;
}
```

**React Query invalidation:**
- `['expenses', groupId]` — expense list
- `['expense', expenseId]` — individual expense detail
- `['balances', groupId]` — group balances

---

### `expense:deleted` (S→C)

| Property | Description |
|---|---|
| **Trigger** | An expense is soft-deleted via `DELETE /api/v1/expenses/:id` |
| **Direction** | Server → All members of the expense's group room |

```typescript
interface ExpenseDeleted {
  eventId: string;
  timestamp: string;
  expenseId: string;
  actorUserId: string;
}
```

**React Query invalidation:**
- `['expenses', groupId]` — expense list
- `['expense', expenseId]` — remove from cache
- `['balances', groupId]` — group balances

---

## Payment Events

### `payment:recorded` (S→C)

| Property | Description |
|---|---|
| **Trigger** | A new settlement is recorded via `POST /api/v1/payments` |
| **Direction** | Server → All members of the payment's group room |

```typescript
interface PaymentRecorded {
  eventId: string;
  timestamp: string;
  paymentId: string;
  paidByUserId: string;       // Debtor who paid
  paidToUserId: string;       // Creditor who received
  amountCents: number;        // Integer (cents/paise)
  actorUserId: string;
}
```

**React Query invalidation:**
- `['payments', groupId]` — payment list
- `['balances', groupId]` — group balances
- `['activity', groupId]` — activity feed

---

### `payment:deleted` (S→C)

| Property | Description |
|---|---|
| **Trigger** | A pending payment is deleted via `DELETE /api/v1/payments/:id` |
| **Direction** | Server → All members of the payment's group room |

```typescript
interface PaymentDeleted {
  eventId: string;
  timestamp: string;
  paymentId: string;
  actorUserId: string;
}
```

**React Query invalidation:**
- `['payments', groupId]` — payment list
- `['balances', groupId]` — group balances

---

## Balance Events

### `balance:updated` (S→C)

| Property | Description |
|---|---|
| **Trigger** | Any expense or payment mutation that changes group balances |
| **Direction** | Server → All members of the affected group room |

```typescript
interface BalanceUpdated {
  eventId: string;
  timestamp: string;
  reason: 'expense_created' | 'expense_updated' | 'expense_deleted' | 'payment_recorded' | 'payment_deleted';
  expenseId?: string;          // Present if triggered by expense mutation
  paymentId?: string;          // Present if triggered by payment mutation
}
```

**React Query invalidation:**
- `['balances', groupId]` — raw balances
- `['balances', groupId, 'simplified']` — simplified settlement plan

---

## Membership Events

### `member:joined` (S→C)

| Property | Description |
|---|---|
| **Trigger** | A new member is added to the group via `POST /api/v1/groups/:id/members` |
| **Direction** | Server → All members of the affected group room |

```typescript
interface MemberJoined {
  eventId: string;
  timestamp: string;
  userId: string;             // New member's UUID
  groupId: string;
  actorUserId: string;        // Admin who added them
}
```

**React Query invalidation:**
- `['group', groupId]` — group detail (member count changed)
- `['group', groupId, 'members']` — member list

---

### `member:left` (S→C)

| Property | Description |
|---|---|
| **Trigger** | A member leaves or is removed from the group |
| **Direction** | Server → All members of the affected group room |

```typescript
interface MemberLeft {
  eventId: string;
  timestamp: string;
  userId: string;             // Member who left/was removed
  groupId: string;
  actorUserId: string;        // Could be self (left) or admin (removed)
}
```

**React Query invalidation:**
- `['group', groupId]` — group detail
- `['group', groupId, 'members']` — member list
- `['balances', groupId]` — may affect balances

---

## Group Metadata Events

### `group:updated` (S→C)

| Property | Description |
|---|---|
| **Trigger** | Group name/description updated via `PATCH /api/v1/groups/:id` |
| **Direction** | Server → All members of the group room |

```typescript
interface GroupUpdated {
  eventId: string;
  timestamp: string;
  groupId: string;
  actorUserId: string;
}
```

**React Query invalidation:** `['group', groupId]`, `['groups']`

---

### `group:archived` (S→C)

| Property | Description |
|---|---|
| **Trigger** | Group is soft-deleted via `DELETE /api/v1/groups/:id` |
| **Direction** | Server → All members of the group room |

```typescript
interface GroupArchived {
  eventId: string;
  timestamp: string;
  groupId: string;
  actorUserId: string;
}
```

**React Query invalidation:** `['groups']`, remove `['group', groupId]`

---

## Notification Events

### `notification:created` (S→C)

| Property | Description |
|---|---|
| **Trigger** | A notification is created for a specific user |
| **Direction** | Server → Target user's personal room (`user:{userId}`) |
| **Note** | This targets a SINGLE user, not a group room |

```typescript
interface NotificationCreated {
  eventId: string;
  timestamp: string;
  notificationType: string;
  title: string;
  body: string;
  metadata: {
    entityType?: string;
    entityId?: string;
  };
}
```

**React Query invalidation:** `['notifications']`, `['notifications', 'unread-count']`

---

## Health Check

### `ping` (C→S) / `pong` (S→C)

| Property | Description |
|---|---|
| **Trigger** | Client-initiated connection health check |
| **Direction** | Client → Server → Client |

```typescript
// Client sends:
interface PingPayload {
  clientTimestamp?: string;   // ISO 8601
}

// Server responds:
interface PongPayload {
  serverTimestamp: string;
  clientTimestamp: string | null;
  latencyMs?: number;        // Server-calculated one-way latency
}
```

---

## Typing Indicators

### `typing:start` / `typing:stop` (C→S, S→C)

| Property | Description |
|---|---|
| **Trigger** | User starts/stops typing a comment or note |
| **Direction** | Bidirectional — client sends, server broadcasts to group (excluding sender) |

```typescript
interface TypingEvent {
  userId: string;
  name?: string;    // Present on server broadcast only
  groupId: string;
  timestamp: string;
}
```

**React Query invalidation:** None — used for ephemeral UI indicators only.

---

## Idempotency

All **Server → Client** events include an `eventId` (UUID v4) in their payload.

The client socket utility (`client/src/utils/socket.js`) maintains a `Set<string>` of processed event IDs and automatically drops duplicates. This handles:
- Socket.IO reconnection replays via Connection State Recovery
- Race conditions during network transitions
- Server-side retry logic

The set is capped at 1,000 entries with automatic LRU eviction.

---

## Room Architecture

```
user:{userId}     ← Personal notification channel (1 per connected user)
group:{groupId}   ← Group room (1 per group, N members)
```

| Feature | Room Type | Example |
|---|---|---|
| Expense/Payment events | `group:*` | `group:abc-123` |
| Balance updates | `group:*` | `group:abc-123` |
| Member online/offline | `group:*` | `group:abc-123` |
| Personal notifications | `user:*` | `user:def-456` |

---

*14 event types · 6 S→C events · 4 C→S events · 4 bidirectional events*
