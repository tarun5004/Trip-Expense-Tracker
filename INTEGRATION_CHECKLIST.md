# Integration Checklist

This manual verification sequence ensures that the complex multi-layer integrations traversing Frontend React UI, Axios Interceptor Middleware, Express Security, and PostgreSQL logic are functional end-to-end.

## 🔲 Phase 1: Authentication & Security Integrity
- [ ] **Registration Flow:** Load the `AuthPage.jsx` and submit a registration. Verify the Postgres `users` table successfully injects the hashed password.
- [ ] **Login & In-Memory Token:** Log out, then log in. Inspect the browser's `localStorage` and `sessionStorage`. Verify that the JWT Access Token is **nowhere** to be found (confirming `auth.js` memory lock).
- [ ] **httpOnly Cookie Tracking:** Open browser developer tools → Network → Cookies. Verify that `refreshToken` exists, contains a large JWT, and is marked as `HttpOnly`.
- [ ] **Silent Token Refreshing:** Set your Node environmental config `JWT_ACCESS_EXPIRES=1m`. Log in, wait 61 seconds, and click "Dashboard". 
  - [ ] Verify the network tab fires a background request to `/auth/refresh` automatically.
  - [ ] Verify the original request was queued and subsequently fulfilled flawlessly without the user noticing.
- [ ] **Logout Eviction:** Click "Logout". Verify the Frontend redirects to `/auth` and the httpOnly cookie is stripped.

## 🔲 Phase 2: Expense Creation Engine (Optimistic → Settled)
- [ ] **Group Creation:** Create a group. Ensure `queryClient` invalidates the sidebar natively, placing the new group in the list instantly.
- [ ] **Expense Form Wizard:** Open the `ExpenseForm.jsx` Organism.
  - [ ] Intentionally select "Exact Amounts" and type amounts that *do not* equal the Total. Verify the submit button remains strictly disabled.
  - [ ] Hit exact percentages, submit the form.
- [ ] **Optimistic Rendering Bounce:** Verify the `ExpenseCard` appears on the UI instantaneously, followed a split second later by the background network request resolving.
- [ ] **Database Integrity:** Using `pgAdmin4` (accessible at `http://localhost:5050` from docker), inspect the `expenses` and `expense_splits` tables. Ensure the values mathematically equate to integer `cents` without floating point drifting.

## 🔲 Phase 3: Realtime Websocket Synchronization
- [ ] **Open Browser A:** Log in as User 1.
- [ ] **Open Browser B (Incognito):** Log in as User 2.
- [ ] Navigate both users to the exact same *Group Detail Page*.
- [ ] In Browser A, click "Add Expense" and create a $50 Pizza expense.
- [ ] **Verification:** Browser B must instantly re-render the Expense Feed *and* the `GroupBalancePanel` showing the new debt shift *without any page refresh* or manual polling.

## 🔲 Phase 4: Resilience & Graceful Fallbacks (Chaos Testing)
- [ ] **Database Crash Simulation:** Turn off the PostgreSQL docker container (`docker stop splitsmart-db`).
  - [ ] Attempt to load the Dashboard.
  - [ ] Verify the UI fails gracefully, rendering standard error states without white-screening.
  - [ ] Turn the Database back on. Verify `React Query`'s native retry/focus mechanisms auto-heal the view within 30 seconds.
- [ ] **WebSocket Hang Simulation:** Close the NodeJS server instance using `CTRL+C`. 
  - [ ] Validate that the console logs print `Starting graceful shutdown...` and that it waits for DB pools to close before immediately releasing the port.
