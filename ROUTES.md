# SplitSmart Frontend Routing Structure

This document outlines the routing architecture for the SplitSmart frontend React application, leveraging client-side routing.

## Global Rules
- **No data fetching in presentation components.** Route components (pages) dispatch fetches via React Query / custom hooks, then pass props down.
- **Error Boundaries.** Every layout and page route is wrapped in a React Error Boundary (`<ErrorBoundary />`) that catches runtime errors.
- **Suspense / Loaders.** Every route includes a `<Suspense fallback={<PageSpinner />} />` wrapper or a loading equivalent.
- **Mobile First.** All page structures are designed from a 320px base width upwards.

---

## Route Definitions

### Public Routes
Used for unauthenticated interactions.

| Path | Component | Auth Required? | Layout Used | Params / Query Params |
|---|---|---|---|---|
| `/` | `LandingPage` | No | `WebLayout` (Optional marketing shell) | None |
| `/auth` | `AuthPage` | No | `AuthLayout` | `?tab=login` or `?tab=register` |

### Protected Routes (App Core)
AppShell includes `Sidebar` (desktop) and `BottomNav` (mobile).

| Path | Component | Auth Required? | Layout Used | Params / Query Params |
|---|---|---|---|---|
| `/dashboard` | `DashboardPage` | **Yes** | `AppShell` | None |
| `/groups/:groupId` | `GroupDetailPage` | **Yes** | `AppShell` | `groupId` (param), `?tab=expenses|balances` |
| `/groups/:groupId/members` | `GroupMembersPage` | **Yes** | `AppShell` | `groupId` (param) |
| `/groups/:groupId/expenses/new` | `AddExpensePage` | **Yes** | `AppShell` | `groupId` (param) |
| `/groups/:groupId/expenses/:expenseId` | `ExpenseDetailPage` | **Yes** | `AppShell` | `groupId` (param), `expenseId` (param) |
| `/groups/:groupId/settle` | `SettleUpPage` | **Yes** | `AppShell` | `groupId` (param), `?payeeId=xxx` |
| `/activity` | `ActivityPage` | **Yes** | `AppShell` | `?filter=group\|payments` |
| `/profile` | `ProfilePage` | **Yes** | `AppShell` | None |

## Route Protection Implementation
React Router `Loader` functions or a `<ProtectedRoute>` wrapper handles redirecting unauthenticated users from `/dashboard` (and subpaths) back to `/auth?tab=login`.

```tsx
// Example Route Guard Concept
<Route element={<ProtectedRoute />}>
  <Route element={<AppShell />}>
    <Route path="/dashboard" element={<DashboardPage />} />
    <Route path="/groups/:groupId" element={<GroupDetailPage />} />
    {/* ...other routes... */}
  </Route>
</Route>
```

## Common Query Parameters
- `?tab=` - Used mainly on `AuthPage` and `GroupDetailPage` to toggle sub-views without pushing deeply nested routes.
- `?payeeId=` - If navigated from a specific balance, auto-fills the user to pay.
