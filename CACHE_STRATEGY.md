# CACHE_STRATEGY

This document outlines the strict caching and invalidation constraints driving SplitSmart's synchronization engine.

## The Dual-Layer Architecture

We strictly divide state responsibility to avoid duplicate sources of truth and complex hydration issues generic in SPA frameworks.

### Layer 1: Ephemeral UI / Client State `(Zustand)`
**Purpose:** Handles data that is inherently ephemeral and does not exist in the database.
- `authStore`: Only holds the volatile JWT token block and current User profile cache memory. Never persisted to `localStorage` (XSS protection).
- `uiStore`: Responsible for global `activeGroupId` references, modals, lateral navigation toggles, and notification Toasts.
- `draftStore`: Specifically wraps Zustand's `persist(sessionStorage)` middleware to freeze an `ExpenseForm`'s progress automatically, preserving complex arrays mapped during "Shares/Exact/Percentage" entries if a user accidentally alt-tabs or reloads on mobile.

### Layer 2: Server State `(React Query v5)`
**Purpose:** Represents an exact replica of the PostgreSQL server state. It owns all financial mathematical blocks, ensuring no desync bugs occur due to aggressive frontend math.

**Global Settings:**
- `staleTime: 5 minutes`
- `gcTime: 10 minutes`
- `refetchOnWindowFocus: true` (Aggressive syncing when swapping between browser tabs)

## Mutation & Invalidations Topology

The system uses specific deterministic `queryKeys` exported as a single factory variable to avoid typos.

### 1. Expense Workflows (`useOptimisticExpense`)

**Adding an Expense**
- **Action:** User submits a 10-person split calculation.
- **Optimism:** Immediate insertion matching `queryKeys.expenses.list(groupId)` injected with `status: 'pending'`. The UI reads this and renders it immediately in the Activity loop allowing immediate user gratification.
- **Settlement:** Upon Ack from POST `/expenses`, we indiscriminately trigger:
  1. `invalidate(expenses.list)`
  2. `invalidate(balances.group)` -> because debts natively change
  3. `invalidate(activity.group)` -> because new audit logs generated.

### 2. Settle Up Flow (`useBalances`)

**Recording Payment**
- **Action:** User explicitly clears a debt (`$25` owed to Bob).
- **Optimism:** We calculate a safe 1:1 deduction reducing the Viewer's absolute negative index matching the payee.
- **Validation Pipeline:**
  1. Freeze outgoing overlapping balances Queries.
  2. Override array.
  3. `onError` -> Restoring balance map snapshot context.

### 3. The Realtime Synchronizer (`useRealtime.js`)

SplitSmart uses `Socket.IO` attached directly inside a custom React hook to catch "out of band" pushes (e.g., *Bob* added an expense on his phone, and you are staring at the Desktop UI).

The hook leverages an LRU `processedEvents Set` watching for backend `eventId` UUIDs. By tracking this Set, if the backend emits `expense:updated`, the frontend ensures it was not *the author* of the action (which naturally handles its own Query Invalidations directly after Axios), preventing double-renders and flickering. 

**Socket Invalidation Rules:**
- Event `expense:created` -> Invalidates -> `expenses.list`
- Event `payment:recorded` -> Invalidates -> `balances.group`, `balances.simplified`
- Event `expense:deleted` -> Overrides via `setQueryData` filtering out `expenseId` explicitly saving a network call latency.
