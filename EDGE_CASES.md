# QA Edge Case Documentation

A comprehensive mapping of all boundary conditions handled natively by the SplitSmart algorithms and architecture. These scenarios dictate the rigid constraints of the `expenseEngine` and React Query invalidation loops.

---

## 💰 FINANCIAL EDGE CASES

### 1. Split amounts don't sum to total due to rounding
**Scenario:** $10.00 split equally among 3 people. ($3.33 + $3.33 + $3.33 = $9.99). Where does the $0.01 go?
- **Root Cause:** IEEE 754 Floating-point fractions losing state infinitely.
- **Expected Resolution:** Handled gracefully by `splitCalculator.js -> calculateEqualSplit`. The system scales amounts to `1000` integer cents. It uses standard modulo `%` operators, discovering a remainder of `1`. This 1 cent is padding added exactly to the first user in the array. 
- **Result:** Participant 1 pays `$3.34`. Participant 2 & 3 pay `$3.33`.

### 2. Payment amount exactly equals owed amount
**Scenario:** Alice owes Bob $50. Alice transfers $50 exactly.
- **Root Cause:** Base settlement flow.
- **Expected Resolution:** Bob's absolute net credit shrinks to `0`. Alice's absolute net deficit shrinks to `0`. The algorithm strictly filters nodes containing `0` removing them from the simplified debt graph natively.
- **Result:** The debt disappears from the UI entirely and records as "Settled Up".

### 3. Group member added after expenses already exist
**Scenario:** Charlie joins the "Mountain Trip" via Invite Code on Day 3. $500 of expenses already exist.
- **Root Cause:** Late addition logic.
- **Expected Resolution:** Charlie initiates with a Net Balance of `0`. His user UUID is not retroactively added to past `exact` or `equal` splits. He will only appear in calculations submitted *after* his join date.

### 4. Expense deleted after partial payment recorded
**Scenario:** Bob pays Alice $25 for a $50 Pizza expense. Alice deletes the $50 Pizza expense later.
- **Root Cause:** Asymmetrical history modification.
- **Expected Resolution:** Expense deletion triggers a native `status = 'deleted'` soft flag or full cascade. The $25 payment *remains* valid in the DB because payments are decoupled from individual expenses—they exist to settle *global group balances*. 
- **Result:** Alice now owes Bob $25 (since the debt vanished, but he paid her anyway!).

### 5. All group members pay equally and owe equally
**Scenario:** A buys Lunch ($30). B buys Dinner ($30). C buys Drinks ($30).
- **Root Cause:** Perfect equilibrium mathematically.
- **Expected Resolution:** `balanceCalculator` yields `{A: 0, B: 0, C: 0}`.
- **Result:** Empty simplified debt array mapping `[]`. Native UI displays "All Settled Up".

### 6. Circular debt: A owes B $10, B owes C $10, C owes A $10
**Scenario:** The classic debt spiral.
- **Root Cause:** Isolated independent transactions building an infinite cycle.
- **Expected Resolution:** Handled by `debtSimplifier.js`. Rather than blindly mapping debts edge-by-edge, the simplifier purely relies on absolute net values. 
- **Result:** Since each person's net is `$0` natively, the entire cycle is mapped implicitly into `0` transactions requiring zero movement!

### 7. Two users both simultaneously try to record the same payment
**Scenario:** A and B both hit "Settle Up" for the $50 identical debt at precisely the same millisecond.
- **Root Cause:** Distributed UX concurrency latency.
- **Expected Resolution:** Can trigger duplicate Postgres inserts. Prevented exclusively at the Database Layer using an explicit composite UUID lock or an `eventId` idempotency token supplied by the frontend React Query Mutator.

---

## 🔒 AUTH EDGE CASES

### 8. User makes request exactly as token expires (race condition)
- **Expected Resolution:** Handled by `client/src/api/client.js`. The 401 interceptor queues the outgoing request, automatically rotates the `refresh_token` over a secure `HttpOnly` cookie, stores the new JWT, and natively flushes the request pipeline causing no visual disruption to the user.

### 9. User logs out on device A while device B has valid session
- **Expected Resolution:** If Device A clicks logout, the REST API wipes the `refresh_token` cookie or marks the JWT generation family as voided in the database mapping.
- **Result:** When Device B's 15-minute access token organically expires, the refresh call fails globally, instantly logging them out on B natively.

### 10. Refresh token rotated — old refresh token rejected
- **Expected Resolution:** Typical of strict rotation policies tracking malicious stealing. Fails cleanly forcing a `/auth?expired=true` reboot.

---

## 💾 DATA EDGE CASES

### 11. Expense description with emoji, special characters, RTL text
- **Expected Resolution:** Standard `utf8mb4` encoding rules defined natively inside PostgreSQL schemas ensures `🍕 Dinner` parses flawlessly rendering identical on UI.

### 12. User name with SQL injection attempt
- **Expected Resolution:** Parameterized PostgreSQL `pg` queries (used internally) block native syntax injection natively rendering payload drops (e.g. `' OR 1=1;--`).

### 13. Amount of $0.01 (minimum valid amount)
- **Expected Resolution:** Accepted flawlessly. `toCents(0.01) -> 1`. Evaluated gracefully.

### 14. Amount of $999,999.99 (near maximum)
- **Expected Resolution:** Maps to `99,999,999` cents. Still fits comfortably and deeply natively within a standard Postgres `INT` (Max: ~2.1 Billion cents -> ~$21 Million limit), thus avoiding overflow crashes!

### 15. Group with 100 members — debt simplification performance
- **Expected Resolution:** `O(N)` linear simplifier runtime sorting ensures even massive vectors mapping 100 people traverse locally under `< 50ms`.

---

## 🌐 REALTIME EDGE CASES

### 16. User goes offline, others make changes, user comes back online
- **Expected Resolution:** Hook logic inside `useRealtime.js` triggers aggressive `invalidateQueries({ queryKey: queryKeys.groups.all })` instantly upon the socket emitting a generic reconnect block preventing stale views permanently natively!

### 17. Duplicate socket events processed twice
- **Expected Resolution:** Internal `LRU Set` tracking the `eventId` UUIDs instantly blocks identical IDs spanning limits! User never sees identical toasts!

### 18. Socket disconnect during multi-step expense creation
- **Expected Resolution:** Normal `Axios` logic acts natively independent of Sockets returning traditional Promises natively ensuring safe completion.
