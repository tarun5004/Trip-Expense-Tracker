# SplitSmart — System Design Document

**Version:** 1.0  
**Status:** Draft  
**Date:** 2026-03-29  
**Input:** PRODUCT_SPEC.md v1.0  
**Author:** Systems Architecture Team  

---

## 1. Technology Stack

### 1.1 Runtime & Framework

| Layer | Technology | Justification |
|---|---|---|
| **Server Runtime** | Node.js 20 LTS | Non-blocking I/O is ideal for the high-concurrency, I/O-bound workload of real-time expense sync and notification fan-out (PRD targets ≤3s sync latency for 50-member groups). |
| **HTTP Framework** | Express 4.x | The most mature Node.js framework with the largest middleware ecosystem, enabling rapid implementation of versioned REST APIs, request validation, and rate limiting. |
| **Database** | PostgreSQL 16 | ACID transactions are non-negotiable for financial data (BR-01, BR-02, BR-05); native support for JSONB (flexible split rules), full-text search (P1-09), and declarative partitioning (Year 2 multi-region). |
| **Real-Time** | Socket.IO 4.x | Provides WebSocket transport with automatic HTTP long-polling fallback, rooms-based broadcasting (maps directly to group membership), and built-in reconnection — satisfying the ≤3s sync requirement (P0-09). |
| **Frontend** | React 18 | Concurrent rendering and Suspense enable the responsive ≤500ms navigation target; component model supports the complex split calculator UI and real-time balance updates. |
| **CSS Framework** | Tailwind CSS 3.x | Utility-first approach enables rapid, consistent UI development without context-switching between CSS files, and tree-shaking produces minimal production bundles (≤2s TTI target). |
| **Client State** | React Query 5 + Zustand | React Query handles server-state caching with automatic background refetch (balances stay fresh); Zustand provides minimal boilerplate client-state (active group, theme, modals) without Redux overhead. |
| **Authentication** | JWT (access + refresh) in httpOnly cookies | httpOnly cookies prevent XSS-based token theft; short-lived access tokens (15 min) + long-lived refresh tokens (7 days) balance security with session persistence (P0-01). |
| **Caching** | Redis 7.x | In-memory store for session state, computed group balances (hot path), rate-limit counters, and Socket.IO adapter (multi-instance pub/sub) — all sub-millisecond reads. |
| **ORM / Query Builder** | Prisma 5.x | Type-safe schema-driven client with auto-generated migrations aligns with PostgreSQL; introspection and relation queries simplify the Group→Expense→Split→Settlement graph. |
| **Validation** | Zod 3.x | TypeScript-native schema validation used on both client (form validation) and server (request body parsing), ensuring a single source of truth for input shapes. |
| **Testing** | Vitest + React Testing Library + Supertest + Playwright | Vitest for fast unit/integration tests (shared Vite config with frontend); RTL for component tests; Supertest for API endpoint tests; Playwright for E2E flows (add expense → verify balance). |
| **File Storage** | S3-Compatible Object Store | Receipt images (P1-02) stored externally to keep the app server stateless; pre-signed URLs prevent unauthorized access and offload bandwidth. |
| **Job Scheduler** | BullMQ (Redis-backed) | Handles recurring expense generation (P1-04), settlement auto-confirmation (72h timer, BR-06), payment reminder rate limiting (BR-10), and CSV/PDF export generation (P1-07). |
| **Logging** | Pino | Structured JSON logging with negligible performance overhead; integrates with any log aggregation service for the audit trail requirement. |

---

## 2. High-Level Architecture

```
┌─────────────────────────────────────────────────────────────────┐
│                        CLIENT (React SPA)                       │
│  React 18 · Tailwind · React Query · Zustand · Socket.IO Client │
└────────────────────┬───────────────────┬────────────────────────┘
                     │ HTTPS (REST)      │ WSS (Socket.IO)
                     ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                      LOAD BALANCER / CDN                        │
│               (Static assets cached at edge)                    │
└────────────────────┬───────────────────┬────────────────────────┘
                     │                   │
                     ▼                   ▼
┌─────────────────────────────────────────────────────────────────┐
│                     API SERVER (Node.js)                         │
│  Express · JWT Middleware · Rate Limiter · Zod Validation        │
│  ┌──────────┐  ┌──────────┐  ┌──────────┐  ┌────────────────┐  │
│  │Controller│→ │ Service  │→ │Repository│→ │   Prisma ORM   │  │
│  └──────────┘  └──────────┘  └──────────┘  └────────────────┘  │
│                                    │                            │
│  ┌──────────────┐  ┌──────────────┐│  ┌──────────────────────┐  │
│  │Socket.IO Srv │  │  BullMQ      ││  │  Notification Svc    │  │
│  └──────────────┘  │  Workers     ││  └──────────────────────┘  │
│                    └──────────────┘│                            │
└─────────────┬──────────┬──────────┼────────────────────────────┘
              │          │          │
              ▼          ▼          ▼
        ┌──────────┐ ┌───────┐ ┌───────────────┐
        │PostgreSQL│ │ Redis │ │  Object Store │
        │  (Primary│ │       │ │  (Receipts)   │
        │  + Read  │ │       │ │               │
        │  Replica)│ │       │ │               │
        └──────────┘ └───────┘ └───────────────┘
```

### Data Flow: Client → API → DB → Response

1. **Client** sends an HTTPS request (e.g., `POST /api/v1/expenses`) with a JSON body and an httpOnly cookie containing the JWT access token.
2. **Load Balancer** terminates TLS, forwards the request to an API server instance.
3. **Auth Middleware** extracts and verifies the JWT; rejects with `401` if invalid/expired.
4. **Rate Limiter Middleware** checks Redis counters; rejects with `429` if limit exceeded.
5. **Zod Validation Middleware** parses the request body against the endpoint's schema; rejects with `400` and field-level errors if invalid.
6. **Controller** orchestrates the request: calls the appropriate Service method.
7. **Service** contains business logic (e.g., BR-01 validation: sum of payer contributions = total). Calls Repository methods within a Prisma transaction.
8. **Repository** executes Prisma queries against PostgreSQL. Returns domain objects.
9. **Service** post-processing: enqueues a BullMQ job for notifications, emits a Socket.IO event to the group room for real-time sync.
10. **Controller** wraps the result in the standard response envelope and returns it.
11. **Response** travels back through the load balancer as JSON.

---

## 3. Folder Structure

### 3.1 Server (`/server`)

```
server/
├── src/
│   ├── app.ts                          # Express app factory (middleware registration)
│   ├── server.ts                       # HTTP server bootstrap + Socket.IO attach
│   ├── config/
│   │   ├── index.ts                    # Validated env config (uses Zod)
│   │   ├── database.ts                 # Prisma client singleton
│   │   ├── redis.ts                    # Redis client singleton
│   │   └── socket.ts                   # Socket.IO server config
│   ├── middleware/
│   │   ├── authenticate.ts             # JWT verification + user injection
│   │   ├── authorize.ts                # Role/permission checks (group membership)
│   │   ├── rateLimiter.ts              # Redis-backed rate limiting
│   │   ├── validate.ts                 # Zod schema validation factory
│   │   ├── errorHandler.ts             # Global error handler (catches AppError hierarchy)
│   │   └── requestLogger.ts            # Pino request/response logging
│   ├── modules/
│   │   ├── auth/
│   │   │   ├── auth.controller.ts      # POST /auth/register, /auth/login, /auth/refresh
│   │   │   ├── auth.service.ts         # Password hashing, token issuance, refresh rotation
│   │   │   ├── auth.repository.ts      # User lookups for auth
│   │   │   ├── auth.schema.ts          # Zod schemas: registerBody, loginBody
│   │   │   ├── auth.routes.ts          # Express router
│   │   │   └── auth.types.ts           # Module-specific TypeScript interfaces
│   │   ├── users/
│   │   │   ├── user.controller.ts
│   │   │   ├── user.service.ts
│   │   │   ├── user.repository.ts
│   │   │   ├── user.schema.ts
│   │   │   ├── user.routes.ts
│   │   │   └── user.types.ts
│   │   ├── groups/
│   │   │   ├── group.controller.ts
│   │   │   ├── group.service.ts
│   │   │   ├── group.repository.ts
│   │   │   ├── group.schema.ts
│   │   │   ├── group.routes.ts
│   │   │   └── group.types.ts
│   │   ├── expenses/
│   │   │   ├── expense.controller.ts
│   │   │   ├── expense.service.ts      # Split calculation, BR-01/BR-02/BR-03 validation
│   │   │   ├── expense.repository.ts
│   │   │   ├── expense.schema.ts
│   │   │   ├── expense.routes.ts
│   │   │   └── expense.types.ts
│   │   ├── settlements/
│   │   │   ├── settlement.controller.ts
│   │   │   ├── settlement.service.ts   # BR-05/BR-06/BR-07 enforcement
│   │   │   ├── settlement.repository.ts
│   │   │   ├── settlement.schema.ts
│   │   │   ├── settlement.routes.ts
│   │   │   └── settlement.types.ts
│   │   ├── balances/
│   │   │   ├── balance.controller.ts
│   │   │   ├── balance.service.ts      # Debt simplification algorithm
│   │   │   ├── balance.repository.ts
│   │   │   ├── balance.routes.ts
│   │   │   └── balance.types.ts
│   │   ├── notifications/
│   │   │   ├── notification.controller.ts
│   │   │   ├── notification.service.ts # Push notification dispatch, in-app storage
│   │   │   ├── notification.repository.ts
│   │   │   ├── notification.routes.ts
│   │   │   └── notification.types.ts
│   │   └── activity/
│   │       ├── activity.controller.ts
│   │       ├── activity.service.ts     # Immutable audit log writes
│   │       ├── activity.repository.ts
│   │       ├── activity.routes.ts
│   │       └── activity.types.ts
│   ├── jobs/
│   │   ├── queue.ts                    # BullMQ queue definitions
│   │   ├── workers/
│   │   │   ├── settlementAutoConfirm.worker.ts
│   │   │   ├── recurringExpense.worker.ts
│   │   │   ├── paymentReminder.worker.ts
│   │   │   ├── exportGeneration.worker.ts
│   │   │   └── notificationDispatch.worker.ts
│   │   └── processors/
│   │       ├── settlementAutoConfirm.processor.ts
│   │       ├── recurringExpense.processor.ts
│   │       ├── paymentReminder.processor.ts
│   │       ├── exportGeneration.processor.ts
│   │       └── notificationDispatch.processor.ts
│   ├── sockets/
│   │   ├── index.ts                    # Socket.IO event registration
│   │   ├── handlers/
│   │   │   ├── groupRoom.handler.ts    # Join/leave group rooms
│   │   │   └── presence.handler.ts     # Online status within a group
│   │   └── emitters/
│   │       ├── expenseEvents.emitter.ts
│   │       ├── settlementEvents.emitter.ts
│   │       └── balanceEvents.emitter.ts
│   ├── shared/
│   │   ├── errors/
│   │   │   ├── AppError.ts             # Base error class
│   │   │   ├── ValidationError.ts      # 400 — input validation failures
│   │   │   ├── AuthenticationError.ts  # 401 — invalid/expired credentials
│   │   │   ├── AuthorizationError.ts   # 403 — insufficient permissions
│   │   │   ├── NotFoundError.ts        # 404 — resource not found
│   │   │   ├── ConflictError.ts        # 409 — duplicate or state conflict
│   │   │   ├── RateLimitError.ts       # 429 — rate limit exceeded
│   │   │   └── InternalError.ts        # 500 — unexpected server error
│   │   ├── utils/
│   │   │   ├── debtSimplifier.ts       # Min-cash-flow algorithm implementation
│   │   │   ├── currencyConverter.ts    # Exchange rate application logic
│   │   │   ├── pagination.ts           # Cursor & offset pagination helpers
│   │   │   ├── hashing.ts             # bcrypt wrapper
│   │   │   └── tokenGenerator.ts       # JWT sign/verify helpers
│   │   ├── constants/
│   │   │   ├── httpStatus.ts
│   │   │   ├── errorCodes.ts           # Application-level error codes
│   │   │   └── limits.ts              # Magic numbers: GROUP_MAX_MEMBERS = 50, etc.
│   │   └── types/
│   │       ├── express.d.ts            # Express Request augmentation (req.user)
│   │       ├── response.ts             # Standard envelope type
│   │       └── pagination.ts           # Pagination params/meta types
│   └── __tests__/
│       ├── unit/
│       │   ├── services/
│       │   │   ├── expense.service.test.ts
│       │   │   ├── settlement.service.test.ts
│       │   │   └── balance.service.test.ts
│       │   └── utils/
│       │       └── debtSimplifier.test.ts
│       ├── integration/
│       │   ├── auth.integration.test.ts
│       │   ├── expense.integration.test.ts
│       │   └── settlement.integration.test.ts
│       ├── e2e/
│       │   └── expenseFlow.e2e.test.ts
│       └── helpers/
│           ├── testDb.ts               # Test database setup/teardown
│           └── factories.ts            # Test data factories
├── prisma/
│   ├── schema.prisma                   # Database schema
│   ├── migrations/                     # Auto-generated migration files
│   └── seed.ts                         # Development seed data
├── package.json
├── tsconfig.json
├── vitest.config.ts
└── .env.example
```

### 3.2 Client (`/client`)

```
client/
├── public/
│   ├── favicon.ico
│   ├── manifest.json
│   └── robots.txt
├── src/
│   ├── main.tsx                        # React DOM root + providers
│   ├── App.tsx                         # Root layout + router
│   ├── api/
│   │   ├── client.ts                   # Axios instance with interceptors
│   │   ├── auth.api.ts                 # register, login, logout, refresh
│   │   ├── groups.api.ts               # CRUD, invite, archive
│   │   ├── expenses.api.ts             # CRUD, receipt upload
│   │   ├── settlements.api.ts          # create, confirm, dispute
│   │   ├── balances.api.ts             # fetch simplified/original
│   │   ├── notifications.api.ts        # list, markRead
│   │   ├── activity.api.ts             # list with filters
│   │   └── users.api.ts               # profile, preferences
│   ├── hooks/
│   │   ├── queries/
│   │   │   ├── useGroups.ts            # React Query: group list + detail
│   │   │   ├── useExpenses.ts          # React Query: paginated expenses
│   │   │   ├── useBalances.ts          # React Query: group balances
│   │   │   ├── useSettlements.ts
│   │   │   ├── useNotifications.ts
│   │   │   ├── useActivity.ts
│   │   │   └── useUser.ts
│   │   ├── mutations/
│   │   │   ├── useCreateExpense.ts
│   │   │   ├── useCreateSettlement.ts
│   │   │   ├── useCreateGroup.ts
│   │   │   └── useUpdateProfile.ts
│   │   ├── useSocket.ts               # Socket.IO connection + event listeners
│   │   ├── useAuth.ts                 # Auth state + login/logout actions
│   │   └── useDebounce.ts
│   ├── stores/
│   │   ├── authStore.ts               # Zustand: user session, isAuthenticated
│   │   ├── uiStore.ts                 # Zustand: sidebar, modals, theme
│   │   └── socketStore.ts             # Zustand: connection status, pending events
│   ├── pages/
│   │   ├── LoginPage.tsx
│   │   ├── RegisterPage.tsx
│   │   ├── ForgotPasswordPage.tsx
│   │   ├── DashboardPage.tsx           # Home: net balance + group list + activity
│   │   ├── GroupDetailPage.tsx          # Expenses + Balances + Settlements tabs
│   │   ├── ExpenseDetailPage.tsx        # Single expense view + comments
│   │   ├── SettleUpPage.tsx            # Settlement flow
│   │   ├── ActivityPage.tsx            # Full group activity log
│   │   ├── ProfilePage.tsx             # User settings + preferences
│   │   └── NotFoundPage.tsx
│   ├── components/
│   │   ├── layout/
│   │   │   ├── AppShell.tsx            # Nav + sidebar + main content area
│   │   │   ├── Navbar.tsx
│   │   │   ├── Sidebar.tsx
│   │   │   └── MobileNav.tsx
│   │   ├── auth/
│   │   │   ├── LoginForm.tsx
│   │   │   ├── RegisterForm.tsx
│   │   │   └── ProtectedRoute.tsx
│   │   ├── groups/
│   │   │   ├── GroupCard.tsx
│   │   │   ├── GroupList.tsx
│   │   │   ├── CreateGroupModal.tsx
│   │   │   ├── InviteMemberModal.tsx
│   │   │   └── GroupSettingsPanel.tsx
│   │   ├── expenses/
│   │   │   ├── ExpenseCard.tsx
│   │   │   ├── ExpenseList.tsx
│   │   │   ├── AddExpenseModal.tsx
│   │   │   ├── SplitCalculator.tsx     # Equal/exact/percentage/shares UI
│   │   │   ├── PayerSelector.tsx
│   │   │   ├── ParticipantSelector.tsx
│   │   │   └── ReceiptUploader.tsx
│   │   ├── balances/
│   │   │   ├── BalanceSummaryCard.tsx
│   │   │   ├── BalanceList.tsx
│   │   │   ├── DebtGraph.tsx           # Visual debt relationships
│   │   │   └── SimplifiedToggle.tsx
│   │   ├── settlements/
│   │   │   ├── SettleUpForm.tsx
│   │   │   ├── SettlementCard.tsx
│   │   │   └── ConfirmSettlementModal.tsx
│   │   ├── notifications/
│   │   │   ├── NotificationBell.tsx
│   │   │   ├── NotificationDropdown.tsx
│   │   │   └── NotificationItem.tsx
│   │   ├── activity/
│   │   │   ├── ActivityFeed.tsx
│   │   │   └── ActivityItem.tsx
│   │   └── shared/
│   │       ├── Button.tsx
│   │       ├── Input.tsx
│   │       ├── Modal.tsx
│   │       ├── Avatar.tsx
│   │       ├── Badge.tsx
│   │       ├── Spinner.tsx
│   │       ├── EmptyState.tsx
│   │       ├── ErrorBoundary.tsx
│   │       ├── Toast.tsx
│   │       ├── CurrencyDisplay.tsx
│   │       └── Pagination.tsx
│   ├── lib/
│   │   ├── formatCurrency.ts
│   │   ├── formatDate.ts
│   │   ├── splitCalculations.ts        # Client-side split preview math
│   │   ├── validators.ts              # Shared Zod schemas (re-exported from server)
│   │   └── constants.ts
│   ├── styles/
│   │   └── globals.css                 # Tailwind directives + custom properties
│   └── types/
│       ├── api.types.ts               # Response envelope, pagination
│       ├── expense.types.ts
│       ├── group.types.ts
│       ├── settlement.types.ts
│       ├── user.types.ts
│       └── notification.types.ts
├── index.html
├── package.json
├── tailwind.config.ts
├── tsconfig.json
├── vite.config.ts
└── .env.example
```

### 3.3 Shared Package (Monorepo Root)

```
splitsmart/
├── server/                             # (structure above)
├── client/                             # (structure above)
├── packages/
│   └── shared/
│       ├── schemas/                    # Zod schemas shared between client and server
│       │   ├── expense.schema.ts
│       │   ├── settlement.schema.ts
│       │   ├── group.schema.ts
│       │   └── user.schema.ts
│       ├── constants/
│       │   ├── splitTypes.ts
│       │   ├── settlementStatus.ts
│       │   ├── categoryDefaults.ts
│       │   └── limits.ts
│       └── types/
│           ├── expense.types.ts
│           ├── group.types.ts
│           ├── settlement.types.ts
│           └── common.types.ts
├── package.json                        # Workspace root (npm workspaces)
├── turbo.json                          # Turborepo pipeline config
├── .env.example
├── docker-compose.yml                  # PostgreSQL + Redis for local dev
└── README.md
```

---

## 4. API Design Conventions

### 4.1 URL Structure

```
/api/v1/{resource}              # Collection
/api/v1/{resource}/{id}         # Single resource
/api/v1/{resource}/{id}/{sub}   # Nested resource
```

**Examples:**

| Method | URL | Description |
|---|---|---|
| `POST` | `/api/v1/auth/register` | Register a new user |
| `POST` | `/api/v1/auth/login` | Authenticate and receive tokens |
| `POST` | `/api/v1/auth/refresh` | Rotate refresh token |
| `GET` | `/api/v1/groups` | List user's groups |
| `POST` | `/api/v1/groups` | Create a new group |
| `GET` | `/api/v1/groups/:groupId` | Get group details |
| `PATCH` | `/api/v1/groups/:groupId` | Update group (rename, settings) |
| `DELETE` | `/api/v1/groups/:groupId` | Archive group |
| `POST` | `/api/v1/groups/:groupId/members` | Invite member to group |
| `DELETE` | `/api/v1/groups/:groupId/members/:userId` | Remove member from group |
| `GET` | `/api/v1/groups/:groupId/expenses` | List expenses in group (paginated) |
| `POST` | `/api/v1/groups/:groupId/expenses` | Add expense to group |
| `GET` | `/api/v1/groups/:groupId/expenses/:expenseId` | Get expense details |
| `PATCH` | `/api/v1/groups/:groupId/expenses/:expenseId` | Edit expense (within 48h window) |
| `DELETE` | `/api/v1/groups/:groupId/expenses/:expenseId` | Delete expense (within 48h window) |
| `GET` | `/api/v1/groups/:groupId/balances` | Get group balances (simplified by default) |
| `GET` | `/api/v1/groups/:groupId/balances?view=original` | Get original (unsimplified) balances |
| `POST` | `/api/v1/groups/:groupId/settlements` | Record a settlement |
| `PATCH` | `/api/v1/groups/:groupId/settlements/:settlementId` | Confirm or dispute a settlement |
| `GET` | `/api/v1/groups/:groupId/activity` | Get group activity log (paginated) |
| `GET` | `/api/v1/notifications` | List user's notifications |
| `PATCH` | `/api/v1/notifications/:notificationId` | Mark notification as read |
| `GET` | `/api/v1/users/me` | Get current user profile |
| `PATCH` | `/api/v1/users/me` | Update profile/preferences |
| `GET` | `/api/v1/users/me/dashboard` | Get dashboard summary (net balances) |

### 4.2 HTTP Method Rules

| Method | Semantics | Idempotent | Body |
|---|---|---|---|
| `GET` | Read resources; never mutates state | Yes | None |
| `POST` | Create a new resource or trigger an action | No | Required |
| `PATCH` | Partial update of an existing resource | Yes | Required (partial) |
| `DELETE` | Remove or archive a resource | Yes | None |

`PUT` is not used — all updates are partial via `PATCH`.

### 4.3 Standard Response Envelope

Every API response follows this structure:

```json
{
  "success": true,
  "data": { },
  "error": null,
  "meta": {
    "requestId": "req_abc123",
    "timestamp": "2026-03-29T13:00:00Z"
  }
}
```

**Error response:**

```json
{
  "success": false,
  "data": null,
  "error": {
    "code": "EXPENSE_SPLIT_MISMATCH",
    "message": "Split amounts do not sum to the expense total.",
    "details": [
      { "field": "splits[2].amount", "message": "Expected 600.00, received 500.00" }
    ]
  },
  "meta": {
    "requestId": "req_def456",
    "timestamp": "2026-03-29T13:00:01Z"
  }
}
```

### 4.4 Error Code Conventions

Error codes are namespaced by domain, uppercase with underscores:

| Prefix | Domain | Examples |
|---|---|---|
| `AUTH_` | Authentication | `AUTH_INVALID_CREDENTIALS`, `AUTH_TOKEN_EXPIRED`, `AUTH_REFRESH_REVOKED` |
| `GROUP_` | Groups | `GROUP_NOT_FOUND`, `GROUP_MEMBER_LIMIT`, `GROUP_NOT_MEMBER` |
| `EXPENSE_` | Expenses | `EXPENSE_NOT_FOUND`, `EXPENSE_SPLIT_MISMATCH`, `EXPENSE_LOCKED`, `EXPENSE_EDIT_WINDOW_EXPIRED` |
| `SETTLEMENT_` | Settlements | `SETTLEMENT_EXCEEDS_BALANCE`, `SETTLEMENT_ALREADY_CONFIRMED`, `SETTLEMENT_DISPUTED` |
| `RATE_` | Rate Limiting | `RATE_LIMIT_EXCEEDED`, `RATE_REMINDER_COOLDOWN` |
| `VALIDATION_` | Input | `VALIDATION_REQUIRED_FIELD`, `VALIDATION_INVALID_FORMAT` |
| `INTERNAL_` | Server | `INTERNAL_SERVER_ERROR`, `INTERNAL_DATABASE_ERROR` |

### 4.5 Versioning Strategy

- **URL-based versioning:** `/api/v1/...`
- When a breaking change is needed, a new version (`v2`) is introduced alongside `v1`.
- `v1` receives a 6-month deprecation window with `Sunset` and `Deprecation` headers.
- Non-breaking additions (new optional fields, new endpoints) are added to the current version.

### 4.6 Pagination

**Cursor-based pagination** (default for all list endpoints):

```
GET /api/v1/groups/:groupId/expenses?cursor=exp_abc123&limit=20&sortBy=createdAt&sortOrder=desc
```

Response includes pagination metadata:

```json
{
  "meta": {
    "pagination": {
      "limit": 20,
      "nextCursor": "exp_xyz789",
      "prevCursor": "exp_abc123",
      "hasMore": true,
      "totalCount": 342
    }
  }
}
```

- **Default limit:** 20
- **Max limit:** 100
- **`totalCount`** is only included when explicitly requested via `?includeTotalCount=true` (requires a `COUNT` query, so opt-in for performance).
- Cursor is an opaque encoded string (base64 of `id + sortField`).

---

## 5. Security Model

### 5.1 Authentication Flow

```
┌────────┐                    ┌────────────┐                   ┌───────┐
│ Client │                    │ API Server │                   │ Redis │
└───┬────┘                    └─────┬──────┘                   └───┬───┘
    │  POST /auth/login             │                              │
    │  { email, password }          │                              │
    │──────────────────────────────►│                              │
    │                               │ Verify password (bcrypt)     │
    │                               │ Generate access JWT (15min)  │
    │                               │ Generate refresh JWT (7d)    │
    │                               │ Store refresh token ────────►│
    │                               │                              │
    │  Set-Cookie: accessToken      │                              │
    │  Set-Cookie: refreshToken     │                              │
    │◄──────────────────────────────│                              │
    │                               │                              │
    │  GET /api/v1/groups           │                              │
    │  Cookie: accessToken=...      │                              │
    │──────────────────────────────►│                              │
    │                               │ Verify JWT signature + exp   │
    │  200 OK { groups }            │                              │
    │◄──────────────────────────────│                              │
    │                               │                              │
    │  POST /auth/refresh           │                              │
    │  Cookie: refreshToken=...     │                              │
    │──────────────────────────────►│                              │
    │                               │ Verify refresh token         │
    │                               │ Check not revoked ──────────►│
    │                               │ Rotate: issue new pair       │
    │                               │ Revoke old refresh ─────────►│
    │  Set-Cookie: new tokens       │                              │
    │◄──────────────────────────────│                              │
```

**Token configuration:**

| Token | Lifetime | Storage | httpOnly | Secure | SameSite |
|---|---|---|---|---|---|
| Access Token | 15 minutes | Cookie | Yes | Yes | Strict |
| Refresh Token | 7 days | Cookie + Redis allowlist | Yes | Yes | Strict |

**Refresh token rotation:** On every refresh, the old token is revoked and a new pair is issued. If a revoked refresh token is reused, all tokens for that user are invalidated (indicates token theft).

### 5.2 Authorization Model

Authorization is enforced at two levels:

**Level 1 — Middleware (coarse-grained):**

| Rule | Enforcement Point | Description |
|---|---|---|
| Authenticated | `authenticate` middleware | All `/api/v1/*` routes (except auth endpoints) require a valid JWT. |
| Group Membership | `authorize('group:member')` | User must be a member of `:groupId` to access any group sub-resource. |
| Group Admin | `authorize('group:admin')` | Only group admins can: invite/remove members, rename group, change settings. |

**Level 2 — Service (fine-grained):**

| Rule | Service | Description |
|---|---|---|
| Expense Edit Window | `expense.service` | Expense creator can edit/delete within 48h, unless a referencing settlement exists (BR-04). |
| Settlement Amount Cap | `settlement.service` | Settlement amount ≤ outstanding balance between the two users (BR-05). |
| Settlement Confirmation | `settlement.service` | Only the creditor (receiving party) can confirm or dispute (BR-06). |
| Reminder Rate Limit | `notification.service` | Max 1 reminder per debtor per 24h period (BR-10). |

### 5.3 RBAC

Two roles per group:

| Role | Permissions |
|---|---|
| **Admin** | All member permissions + invite/remove members + rename group + archive group + change group settings |
| **Member** | Add/view expenses + record settlements + confirm/dispute settlements on their behalf + view balances + view activity |

The group creator is assigned the `admin` role by default. Admin role can be granted to other members by an existing admin.

### 5.4 Rate Limiting Strategy

| Endpoint Category | Limit | Window | Scope | Reason |
|---|---|---|---|---|
| `POST /auth/login` | 5 requests | 15 minutes | Per IP | Brute-force protection |
| `POST /auth/register` | 3 requests | 1 hour | Per IP | Spam account prevention |
| `POST /auth/refresh` | 10 requests | 15 minutes | Per user | Token rotation abuse |
| General authenticated API | 100 requests | 1 minute | Per user | Abuse prevention |
| `POST .../settlements` | 10 requests | 1 minute | Per user | Financial operation safety |
| `POST .../expenses` | 30 requests | 1 minute | Per user | Spam prevention |
| Payment reminders | 1 reminder | 24 hours | Per (creditor, debtor) pair | BR-10 compliance |

Implementation: Redis sliding window counter using `MULTI/EXEC` for atomicity.

### 5.5 CORS Policy

| Environment | Allowed Origins | Credentials |
|---|---|---|
| Development | `http://localhost:5173` | Yes |
| Staging | `https://staging.splitsmart.app` | Yes |
| Production | `https://splitsmart.app`, `https://www.splitsmart.app` | Yes |

- Allowed methods: `GET, POST, PATCH, DELETE, OPTIONS`
- Allowed headers: `Content-Type, Authorization, X-Request-Id`
- `credentials: true` is required for httpOnly cookie transmission.
- No wildcard (`*`) origins — explicit allowlist only.

---

## 6. Caching Strategy

### 6.1 Cache Inventory

| Cache Key Pattern | Data | TTL | Invalidation Trigger | Reason |
|---|---|---|---|---|
| `user:{userId}:profile` | User display name, avatar, preferences | 1 hour | User updates profile | Avoid DB lookup on every request for user display data |
| `group:{groupId}:members` | Member list with roles | 10 minutes | Member added/removed | Member list is checked on every group operation for authorization |
| `group:{groupId}:balances` | Computed simplified balances | Until invalidated (no TTL) | Any expense added/edited/deleted OR settlement created/confirmed in the group | Hot path: balances are the most-viewed data; computing them requires aggregating all expenses and settlements |
| `group:{groupId}:balances:original` | Unsimplified per-expense balances | Until invalidated (no TTL) | Same as above | Needed for the "Original" view toggle |
| `user:{userId}:dashboard` | Net owed/owing across all groups | 5 minutes | Any balance change in any of the user's groups | Dashboard is the first screen; must load in ≤200ms |
| `ratelimit:{scope}:{key}` | Request counter | Sliding window (varies) | Auto-expires | Rate limiting (see §5.4) |
| `session:{refreshToken}` | Refresh token allowlist entry | 7 days | Token refresh/revocation | Refresh token validation without DB hit |
| `exchange:rates:{date}` | Exchange rates snapshot | 24 hours | Daily refresh | Multi-currency conversion (BR-12); rates are immutable per expense |

### 6.2 Cache Invalidation Flow

```
Expense Created/Updated/Deleted
  └──► Balance Service: recalculate group balances
        ├──► Redis DEL group:{groupId}:balances
        ├──► Redis DEL group:{groupId}:balances:original
        └──► For each group member:
              └──► Redis DEL user:{userId}:dashboard

Settlement Created/Confirmed
  └──► (same invalidation as above)
```

**Strategy:** Write-through invalidation. On any write that affects financial state, the relevant cache keys are explicitly deleted. The next read re-computes and caches. No stale reads because the Socket.IO real-time event triggers an immediate re-fetch on connected clients.

---

## 7. Error Handling Conventions

### 7.1 Error Class Hierarchy

```
AppError (abstract base)
├── ValidationError          HTTP 400    VALIDATION_*
├── AuthenticationError      HTTP 401    AUTH_*
├── AuthorizationError       HTTP 403    GROUP_NOT_MEMBER, etc.
├── NotFoundError            HTTP 404    *_NOT_FOUND
├── ConflictError            HTTP 409    EXPENSE_LOCKED, SETTLEMENT_ALREADY_CONFIRMED
├── RateLimitError           HTTP 429    RATE_*
└── InternalError            HTTP 500    INTERNAL_*
```

All `AppError` subclasses carry:
- `statusCode: number` — HTTP status
- `code: string` — Application error code (from §4.4)
- `message: string` — Human-readable message
- `details?: object[]` — Field-level errors (for validation)
- `isOperational: boolean` — `true` for expected errors, `false` for bugs

### 7.2 Error Propagation Path

```
Database (Prisma)
  │
  │  Prisma throws PrismaClientKnownRequestError
  │  (e.g., unique constraint violation)
  ▼
Repository Layer
  │
  │  Catches Prisma errors, maps to AppError subclass:
  │  - P2002 (unique violation) → ConflictError
  │  - P2025 (record not found) → NotFoundError
  │  - Unexpected → InternalError (isOperational = false)
  ▼
Service Layer
  │
  │  Throws domain-specific AppErrors:
  │  - BR-01 violation → ValidationError("EXPENSE_SPLIT_MISMATCH")
  │  - BR-05 violation → ValidationError("SETTLEMENT_EXCEEDS_BALANCE")
  │  - 48h window expired → ConflictError("EXPENSE_EDIT_WINDOW_EXPIRED")
  │  (lets repository errors bubble up unchanged)
  ▼
Controller Layer
  │
  │  Does NOT catch errors — lets them propagate to
  │  the global error handler middleware.
  ▼
Global Error Handler (middleware/errorHandler.ts)
  │
  │  if (error instanceof AppError):
  │    → Respond with error.statusCode, wrap in standard envelope
  │    → Log at WARN level (operational error)
  │  else:
  │    → Respond with 500
  │    → Log at ERROR level with full stack trace
  │    → Trigger alert (non-operational = bug)
  ▼
Client (React)
  │
  │  React Query onError handler inspects error.code:
  │  - AUTH_TOKEN_EXPIRED → Trigger silent refresh
  │  - VALIDATION_* → Display field-level errors on form
  │  - RATE_LIMIT_EXCEEDED → Show "slow down" toast
  │  - others → Show generic toast with error.message
```

### 7.3 Rules

1. **Never swallow errors silently.** Every catch block must either re-throw or log.
2. **Never expose stack traces to the client.** Stack traces are logged server-side only.
3. **Never return raw database errors.** All Prisma errors are mapped to `AppError` subclasses at the repository layer.
4. **Always include `requestId`** in error responses and logs for correlation.
5. **Distinguish operational vs. programming errors.** Operational errors (bad input, rate limit) are expected and handled gracefully. Programming errors (null dereference, unhandled promise) trigger alerts.

---

## 8. Environment Variables Schema

> Full schema documented in ENV_SCHEMA.md (see below). Summary:

| Category | Count | Examples |
|---|---|---|
| Server | 3 | `NODE_ENV`, `PORT`, `API_VERSION` |
| Database | 2 | `DATABASE_URL`, `DATABASE_POOL_SIZE` |
| Redis | 1 | `REDIS_URL` |
| Authentication | 4 | `JWT_ACCESS_SECRET`, `JWT_REFRESH_SECRET`, `JWT_ACCESS_EXPIRY`, `JWT_REFRESH_EXPIRY` |
| CORS | 1 | `CORS_ORIGINS` |
| File Storage | 3 | `S3_BUCKET`, `S3_REGION`, `S3_ACCESS_KEY_ID` |
| External Services | 1 | `EXCHANGE_RATE_API_KEY` |
| Feature Flags | 2 | `ENABLE_SOCIAL_LOGIN`, `ENABLE_PUSH_NOTIFICATIONS` |

---

## Appendix: Database Schema (Conceptual)

```
┌──────────────┐       ┌──────────────────┐       ┌──────────────────┐
│    users     │       │  group_members   │       │     groups       │
├──────────────┤       ├──────────────────┤       ├──────────────────┤
│ id (PK)      │◄──┐   │ id (PK)          │   ┌──►│ id (PK)          │
│ email        │   ├───│ user_id (FK)     │   │   │ name             │
│ password_hash│   │   │ group_id (FK)────│───┘   │ created_by (FK)  │
│ display_name │   │   │ role (enum)      │       │ base_currency    │
│ avatar_url   │   │   │ joined_at        │       │ status (enum)    │
│ default_curr │   │   └──────────────────┘       │ created_at       │
│ preferences  │   │                              └──────────────────┘
│ created_at   │   │                                      │
└──────────────┘   │   ┌──────────────────┐               │
                   │   │    expenses      │               │
                   │   ├──────────────────┤               │
                   ├───│ created_by (FK)  │               │
                   │   │ group_id (FK)────│───────────────┘
                   │   │ id (PK)          │
                   │   │ description      │
                   │   │ total_amount     │◄─────────┐
                   │   │ currency         │          │
                   │   │ category         │          │
                   │   │ split_type (enum)│          │
                   │   │ receipt_url      │          │
                   │   │ created_at       │          │
                   │   │ updated_at       │          │
                   │   └──────────────────┘          │
                   │           │                     │
                   │           │                     │
          ┌────────┴───────┐   │  ┌──────────────────┴──┐
          │ expense_payers │   │  │  expense_splits     │
          ├────────────────┤   │  ├─────────────────────┤
          │ id (PK)        │   │  │ id (PK)             │
          │ expense_id(FK)─│───┘  │ expense_id (FK)     │
          │ user_id (FK)   │      │ user_id (FK)        │
          │ amount_paid    │      │ share_amount        │
          └────────────────┘      │ share_percentage    │
                                  │ share_units         │
                                  └─────────────────────┘

┌──────────────────┐       ┌──────────────────┐
│   settlements    │       │  activity_logs   │
├──────────────────┤       ├──────────────────┤
│ id (PK)          │       │ id (PK)          │
│ group_id (FK)    │       │ group_id (FK)    │
│ payer_id (FK)    │       │ actor_id (FK)    │
│ payee_id (FK)    │       │ action (enum)    │
│ amount           │       │ entity_type      │
│ status (enum)    │       │ entity_id        │
│ payment_method   │       │ before_state     │
│ confirmed_at     │       │ after_state      │
│ created_at       │       │ created_at       │
└──────────────────┘       └──────────────────┘

┌──────────────────┐
│  notifications   │
├──────────────────┤
│ id (PK)          │
│ user_id (FK)     │
│ type (enum)      │
│ title            │
│ body             │
│ data (JSONB)     │
│ read_at          │
│ created_at       │
└──────────────────┘
```

---

*End of Document*
