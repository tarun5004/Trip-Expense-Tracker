# SplitSmart — Product Requirements Document

**Version:** 1.0  
**Status:** Draft  
**Date:** 2026-03-29  
**Author:** Product Architecture Team  

---

## 1. Executive Summary

SplitSmart is an expense-tracking and debt-splitting application designed for groups of people who share costs — roommates, travel companions, friend circles, and small teams. It eliminates the friction of "who owes whom" by providing real-time shared ledgers, intelligent debt simplification that minimizes the number of transactions needed to settle up, and a clean, transparent interface that keeps every participant informed. The product targets the gap between manual spreadsheets (error-prone, no notifications) and existing solutions (cluttered UIs, poor simplification algorithms, limited offline tolerance) to deliver a fast, trustworthy, and delightful splitting experience.

---

## 2. User Personas

### 2.1 Priya — The Travel Organizer

| Attribute | Detail |
|---|---|
| **Age** | 27 |
| **Occupation** | Marketing Manager |
| **Tech Comfort** | High — uses 15+ apps daily |
| **Context** | Organizes 2–3 group trips per year with 4–10 friends |
| **Goals** | Log expenses on-the-go (often with spotty connectivity), see a clear per-person breakdown at the end of a trip, and close out all debts within a week of returning home |
| **Frustrations** | Manually tallying receipts in a notes app; friends claiming they "already paid" with no audit trail; having to send 8 individual payment reminders |
| **Key Need** | A single, shareable trip ledger that everyone trusts as the source of truth |

### 2.2 Arjun — The Frugal Roommate

| Attribute | Detail |
|---|---|
| **Age** | 23 |
| **Occupation** | Graduate Student |
| **Tech Comfort** | Medium — prefers simple interfaces |
| **Context** | Shares an apartment with 2 roommates; splits rent, utilities, groceries monthly |
| **Goals** | Know exactly what he owes (and is owed) at any point in time without doing mental math; settle debts at month-end with minimal transactions |
| **Frustrations** | Rent is split equally but groceries are split by usage — existing apps don't handle mixed split types well; gets anxious about being over-charged but doesn't want to seem petty |
| **Key Need** | Transparent, itemized breakdowns with support for multiple split methods within the same group |

### 2.3 Meera — The Small-Team Lead

| Attribute | Detail |
|---|---|
| **Age** | 34 |
| **Occupation** | Startup Founder (5-person team) |
| **Tech Comfort** | High — values speed and keyboard shortcuts |
| **Context** | Team frequently shares meals, co-working passes, and client entertainment costs; needs to export data for bookkeeping |
| **Goals** | Quickly log shared team expenses, categorize them (meals, transport, supplies), and export a clean monthly summary for the company accountant |
| **Frustrations** | Current tools mix personal and business expenses; no export capability; can't restrict who can edit past entries |
| **Key Need** | Categorized expense tracking with export functionality and basic access controls |

---

## 3. Core User Journeys

### 3.1 Adding an Expense

| Step | Actor | Action | System Response |
|---|---|---|---|
| 1 | User | Opens a group and taps "Add Expense" | System presents an expense entry form |
| 2 | User | Enters a description (e.g., "Dinner at Olive Garden") | Field accepts free text; auto-suggests from history if similar descriptions exist |
| 3 | User | Enters the total amount (e.g., ₹2,400) | Amount validated as a positive number with up to 2 decimal places |
| 4 | User | Selects who paid (single payer or multiple payers with amounts) | Payer list defaults to the logged-in user; allows selecting any group member(s) |
| 5 | User | Selects how to split (equal, exact amounts, percentage, or by shares) | Split calculator shows a real-time preview of each participant's share |
| 6 | User | Optionally adds a category, date, and note/photo of receipt | Date defaults to today; category defaults to "General" |
| 7 | User | Taps "Save" | System validates that paid amounts = total and split amounts = total; saves the expense; recalculates all group balances; notifies affected group members |
| 8 | All group members | Receive a notification | Notification shows: "[User] added ₹2,400 for Dinner at Olive Garden — you owe ₹600" |

**Business Rules:**
- The sum of all payer contributions must exactly equal the expense total.
- The sum of all participant shares must exactly equal the expense total.
- An expense must have at least one payer and at least two participants (a split implies more than one person).
- The expense creator can edit or delete the expense within 48 hours unless a related settlement has been recorded. After a settlement references this expense's balances, the expense is locked.

### 3.2 Settling Up

| Step | Actor | Action | System Response |
|---|---|---|---|
| 1 | User | Opens the group and views the "Balances" tab | System shows a list of simplified debts (e.g., "You owe Priya ₹1,200") |
| 2 | User | Taps "Settle Up" next to a specific debt | System presents settlement options: record a cash payment, or mark as settled via external payment app |
| 3 | User | Selects payment method and confirms the amount | Amount defaults to the full balance owed; user may enter a partial amount |
| 4 | User | Taps "Confirm Settlement" | System records the settlement; reduces the outstanding balance by the settled amount; notifies the creditor |
| 5 | Creditor | Receives a notification and reviews the settlement | Creditor can confirm or dispute the settlement within 72 hours |
| 6 | System | If no dispute within 72 hours | Settlement is auto-confirmed; balances are finalized |

**Business Rules:**
- A user cannot settle more than they owe to a specific person.
- Partial settlements are allowed; remaining balance persists.
- A settlement requires acknowledgment from the receiving party (explicit confirmation or auto-confirm after 72 hours).
- Settlement history is immutable once confirmed — reversals create a new counter-entry.

### 3.3 Viewing Balances

| Step | Actor | Action | System Response |
|---|---|---|---|
| 1 | User | Opens the app dashboard | System shows a summary card: total amount the user owes across all groups, and total amount owed to the user |
| 2 | User | Taps on a specific group | System shows per-member balances in the group after debt simplification |
| 3 | User | Taps "Details" on a specific balance | System shows a chronological list of all expenses and settlements between the user and that member |
| 4 | User | Toggles between "Simplified" and "Original" views | Simplified view shows the minimum number of transactions to settle all debts; Original view shows raw per-expense debts |

**Business Rules:**
- Balances are always displayed after debt simplification by default.
- A user's net balance across a group must always equal the sum of their individual original debts (simplification changes who pays whom, not how much).
- Balances must update within 3 seconds of any expense or settlement being recorded by any group member.

---

## 4. Feature List by Priority Tier

### P0 — MVP (Must-Have for Launch)

| ID | Feature | User Story | Acceptance Criteria |
|---|---|---|---|
| P0-01 | User Registration & Login | As **any user**, I want to create an account and log in securely so that my data is private and persistent across devices. | Users can register with email + password or social login; sessions persist across app restarts; password reset flow exists. |
| P0-02 | Create & Manage Groups | As **Priya**, I want to create a group and invite friends by email or link so that we have a shared space for our trip expenses. | Groups support 2–50 members; invitation via email, shareable link, or in-app contact search; group creator can rename or archive the group. |
| P0-03 | Add Expense (Equal Split) | As **Arjun**, I want to add an expense and split it equally among selected group members so that everyone pays the same share. | Expense form captures: description, amount, payer, participants; equal split auto-calculates per-person share; split totals validated against expense total. |
| P0-04 | Add Expense (Unequal Split) | As **Priya**, I want to split an expense by exact amounts, percentages, or shares so that I can handle cases where people consumed different amounts. | Three split modes available: exact amount, percentage, shares; real-time preview updates as values change; validation ensures split sums to 100% / total amount. |
| P0-05 | View Group Balances | As **Arjun**, I want to see how much I owe or am owed in a group at a glance so that I always know where I stand financially. | Balance summary visible on group page; shows net balance per member; updates within 3 seconds of any change. |
| P0-06 | Debt Simplification | As **Priya**, I want the app to minimize the number of payments needed to settle all debts so that we don't have to make unnecessary transfers. | Algorithm reduces N*(N-1)/2 potential debts to at most N-1 transactions; net balances preserved exactly; user can view simplified vs. original debts. |
| P0-07 | Record Settlement | As **Arjun**, I want to record that I paid someone back so that my balance updates accordingly. | Settlement supports full or partial amounts; updates balances immediately; notifies the receiving party; settlement amount cannot exceed outstanding debt. |
| P0-08 | Expense History | As **Meera**, I want to view a chronological list of all expenses in a group so that I can audit past entries. | Filterable by date range, payer, and category; shows expense details on tap; indicates who added each expense and when. |
| P0-09 | Real-Time Sync | As **Priya**, I want to see expenses added by other group members appear instantly without refreshing so that I always have up-to-date information. | Changes propagate to all group members within 3 seconds; no manual refresh required; conflict resolution for simultaneous edits (last-write-wins with audit trail). |
| P0-10 | Push Notifications | As **Arjun**, I want to be notified when someone adds an expense that involves me or when someone settles a debt with me so that I stay informed without checking the app. | Notifications for: new expense involving user, settlement received, settlement confirmation request, group invitation; users can mute per-group. |
| P0-11 | Dashboard / Home Screen | As **any user**, I want a dashboard showing my total owed and total owing across all groups so that I get a financial snapshot instantly. | Displays: net balance (owed vs. owing), list of groups with per-group summary, recent activity feed. |

---

### P1 — Important (Launch + 30 Days)

| ID | Feature | User Story | Acceptance Criteria |
|---|---|---|---|
| P1-01 | Expense Categories | As **Meera**, I want to categorize expenses (food, transport, supplies, entertainment) so that I can analyze spending patterns. | Predefined category list with icons; custom category creation; category filter on expense history; category-wise spending summary per group. |
| P1-02 | Receipt Attachment | As **Priya**, I want to attach a photo of a receipt to an expense so that there is proof of the purchase. | Supports camera capture and gallery upload; accepts JPEG, PNG, PDF; max file size 10 MB; receipt viewable by all group members. |
| P1-03 | Multi-Currency Support | As **Priya**, I want to log expenses in foreign currencies during international trips so that I don't have to convert manually. | User selects currency per expense; exchange rate fetched automatically (with manual override); group balances displayed in a single base currency chosen by the group creator. |
| P1-04 | Recurring Expenses | As **Arjun**, I want to set up recurring expenses (e.g., monthly rent) so that I don't have to re-enter them every month. | Supports daily, weekly, monthly, and custom recurrence; auto-creates expense entries at the scheduled time; user can pause, edit, or cancel recurrence. |
| P1-05 | Expense Comments & Reactions | As **Arjun**, I want to comment on an expense (e.g., "I didn't eat the appetizer") so that I can flag discrepancies without being confrontational. | Threaded comments on each expense; emoji reactions; comment notifications sent to the expense creator. |
| P1-06 | Activity Log | As **Meera**, I want to see a chronological audit trail of all actions in a group (edits, deletions, settlements) so that I have full transparency. | Logs: expense added, edited, deleted; settlement recorded, confirmed, disputed; member added, removed; entries are immutable. |
| P1-07 | Export Data | As **Meera**, I want to export group expenses as a CSV or PDF so that I can share them with my accountant. | Export options: CSV (raw data), PDF (formatted report); filters apply to export (date range, category); export includes expense details, payer, split breakdown, settlements. |
| P1-08 | Payment Reminders | As **Priya**, I want to send a gentle reminder to friends who owe me money so that debts don't linger. | One-tap "Remind" button on outstanding balances; reminder sent as in-app notification + optional push; rate-limited to 1 reminder per debtor per 24 hours. |
| P1-09 | Search | As **Meera**, I want to search expenses by description, amount, or person so that I can quickly find a specific transaction. | Full-text search across expense descriptions; filter by amount range, person, date; results sorted by relevance with date as tiebreaker. |
| P1-10 | User Profile & Preferences | As **any user**, I want to set my display name, avatar, default currency, and notification preferences so that the app feels personalized. | Editable display name and avatar; default currency setting applied to new expenses; per-group notification mute; dark mode toggle. |

---

### P2 — Nice-to-Have (Future)

| ID | Feature | User Story | Acceptance Criteria |
|---|---|---|---|
| P2-01 | In-App Payments | As **Arjun**, I want to pay a friend directly within the app so that I can settle up without switching to a payment app. | Integration with at least one payment gateway; payment status synced with settlement record; payment failures handled gracefully with retry. |
| P2-02 | Spending Analytics | As **Meera**, I want to see charts showing spending trends by category and over time so that I can make better financial decisions. | Monthly and weekly spend charts; category breakdown pie/donut chart; per-member contribution bar chart; date range selector. |
| P2-03 | Smart Suggestions | As **Priya**, I want the app to auto-suggest descriptions, amounts, and splits based on my history so that adding expenses is faster. | Description auto-complete from past 50 expenses; amount suggestion based on similar past expenses; split defaults remembered per group. |
| P2-04 | Offline Mode | As **Priya**, I want to add expenses even when I have no internet connection so that I can log expenses during travel. | Expenses saved locally when offline; auto-synced when connectivity is restored; conflict resolution with clear user prompts for ambiguous cases. |
| P2-05 | Group Templates | As **Priya**, I want to create a group from a template (e.g., "Road Trip", "Apartment") so that it comes pre-configured with relevant categories and recurrences. | At least 3 built-in templates; custom template creation from existing groups; templates include: categories, default split method, suggested recurring expenses. |
| P2-06 | Settle-Up Suggestions | As **Arjun**, I want the app to suggest the optimal set of payments to clear all group debts with the fewest transactions so that settling up is effortless. | Suggestions computed from the debt simplification algorithm; one-tap "Settle All" initiates all suggested payments; handles partial settlements gracefully. |
| P2-07 | Multi-Payer Expenses | As **Priya**, I want to record an expense where multiple people paid different amounts so that I can handle situations like "I paid for the hotel and Raj paid for food." | Multiple payers per expense with individual paid amounts; payer total must equal expense total; balances calculated correctly for multi-payer scenarios. |
| P2-08 | Archival & Trip Summary | As **Priya**, I want to archive a trip group and get a summary report so that I can revisit the trip's finances later without it cluttering my active groups. | Archive action hides group from default view; summary includes: total spent, per-person totals, category breakdown, outstanding debts; archived groups accessible via a separate "Archived" tab. |

---

## 5. Non-Functional Requirements

### 5.1 Performance Targets

| Metric | Target |
|---|---|
| API response time (p50) | ≤ 200 ms |
| API response time (p95) | ≤ 500 ms |
| API response time (p99) | ≤ 1,000 ms |
| Time-to-interactive (initial page load) | ≤ 2 seconds on 4G connection |
| Subsequent page navigation | ≤ 500 ms |
| Real-time sync latency | ≤ 3 seconds after event |
| Debt simplification computation | ≤ 100 ms for groups of up to 50 members |
| Search results returned | ≤ 1 second for groups with up to 10,000 expenses |

### 5.2 Scale Targets

| Phase | Users | Groups | Expenses/Month |
|---|---|---|---|
| Launch (Month 1–3) | 10,000 | 25,000 | 500,000 |
| Growth (Month 4–12) | 100,000 | 250,000 | 5,000,000 |
| Maturity (Year 2+) | 1,000,000 | 2,500,000 | 50,000,000 |

**Scaling Principles:**
- The system must support horizontal scaling without architectural change.
- No single expense or settlement operation should degrade in performance as group size grows (up to the 50-member cap).
- Data partitioning strategy must support multi-region deployment by Year 2.

### 5.3 Availability Target

| Metric | Target |
|---|---|
| Uptime SLA | 99.9% (≤ 8.76 hours downtime/year) |
| Planned maintenance window | ≤ 1 hour/month, announced 48 hours in advance |
| Recovery Time Objective (RTO) | ≤ 30 minutes |
| Recovery Point Objective (RPO) | ≤ 5 minutes (no more than 5 minutes of data loss) |

### 5.4 Security Requirements

| Requirement | Detail |
|---|---|
| Authentication | Multi-factor authentication support; session tokens with configurable expiry; secure password hashing with salting |
| Authorization | Users can only view groups they belong to; expense edit/delete restricted to the creator (within the edit window); group admin role for managing members |
| Data Encryption | All data encrypted in transit (TLS 1.2+); sensitive data (passwords, payment info) encrypted at rest |
| Input Validation | All user inputs sanitized server-side; protection against SQL injection, XSS, CSRF |
| Audit Trail | All write operations logged with actor, timestamp, and before/after state |
| Privacy | User data not sold or shared with third parties; GDPR-compliant data deletion on account closure; minimal data collection principle |
| Rate Limiting | API rate limiting to prevent abuse; brute-force protection on login endpoints |
| Compliance | SOC 2 Type I by end of Year 1; PCI-DSS compliance if/when in-app payments are introduced (P2-01) |

---

## 6. Domain Glossary

| Term | Definition |
|---|---|
| **Expense** | A recorded financial transaction within a group representing money spent by one or more members on behalf of the group. An expense has a total amount, one or more payers, and a split rule that determines each participant's share. |
| **Split** | The rule that defines how an expense's total amount is divided among participants. Supported split types: equal (everyone pays the same), exact (specific amounts per person), percentage (each person's share as a % of the total), and shares (proportional units, e.g., 2 shares vs. 1 share). |
| **Settlement** | A recorded payment from one group member to another to reduce or eliminate an outstanding debt. A settlement reduces the payer's "owes" balance and the recipient's "is owed" balance by the settled amount. |
| **Balance** | The net financial position between two group members, or between a member and the group as a whole. A positive balance means the member is owed money; a negative balance means the member owes money. Balances are derived from the sum of all expenses and settlements. |
| **Group** | A named collection of 2–50 users who share expenses. A group has a creator (who becomes the default admin), a list of members, and a ledger of expenses and settlements. Groups can be active or archived. |
| **Debt Simplification** | An algorithmic process that reduces the number of inter-member payments required to settle all debts within a group, without changing any member's net balance. For example, if A owes B ₹100 and B owes C ₹100, simplification produces: A owes C ₹100 (1 payment instead of 2). |
| **Payer** | The group member(s) who physically paid for an expense. A single expense may have multiple payers if the bill was split at the point of sale. |
| **Participant** | A group member who is included in an expense's split — i.e., who consumed or benefited from the purchase and therefore owes a share. |
| **Recurrence** | A schedule attached to an expense template that auto-generates identical expenses at regular intervals (daily, weekly, monthly, custom). |
| **Activity Feed** | A reverse-chronological stream of events in a group (expenses added, edited, deleted; settlements recorded; members joined/left) serving as the group's audit log. |

---

## 7. Out-of-Scope Boundary (v1)

The following are **explicitly excluded** from v1 of SplitSmart:

| Exclusion | Rationale |
|---|---|
| **In-app payment processing** | Requires payment gateway integration, PCI-DSS compliance, and escrow management. Deferred to P2. Users will settle externally and record the payment in SplitSmart. |
| **Bank account or credit card linking** | High regulatory burden; not required for core value proposition. |
| **Expense OCR / receipt scanning** | Valuable but not essential for MVP; receipt photo attachment (P1-02) provides partial value. |
| **Budget tracking or spending limits** | SplitSmart is a splitting tool, not a personal finance manager. |
| **Tax calculation or invoicing** | Out of domain; export (P1-07) provides raw data for external tax tools. |
| **Integration with accounting software** | Deferred; CSV/PDF export serves as a manual bridge. |
| **Chat or messaging between group members** | Expense comments (P1-05) cover transactional communication; full chat is out of scope. |
| **Public/anonymous groups** | All groups are private and require invitation. |
| **Cryptocurrency support** | Adds complexity with no proportional user demand at launch scale. |
| **Multi-tenancy for organizations** | SplitSmart targets informal groups, not enterprise accounts. |
| **Desktop native application** | Web and mobile (responsive web or native) are sufficient for target users. |

---

## 8. Success Metrics

### 8.1 Acquisition & Growth

| Metric | Definition | Target (Month 3) | Target (Month 12) |
|---|---|---|---|
| Registered Users | Total accounts created | 10,000 | 100,000 |
| Monthly Active Users (MAU) | Users who perform at least 1 action/month | 5,000 | 60,000 |
| Groups Created | Total groups across all users | 25,000 | 250,000 |
| Viral Coefficient | Avg. new users invited per existing user | ≥ 1.2 | ≥ 1.5 |
| Organic Sign-Up Rate | % of registrations from group invitations (not marketing) | ≥ 40% | ≥ 55% |

### 8.2 Engagement

| Metric | Definition | Target |
|---|---|---|
| Expenses Added / Active User / Month | Average number of expenses logged per MAU | ≥ 8 |
| DAU / MAU Ratio | Daily to monthly active user ratio (stickiness) | ≥ 0.25 |
| Time-to-First-Expense | Median time from registration to first expense added | ≤ 5 minutes |
| Group Activity Rate | % of groups with ≥ 1 expense in the last 30 days | ≥ 60% |
| Feature Utilization: Unequal Split | % of expenses using non-equal split | ≥ 20% |

### 8.3 Retention

| Metric | Definition | Target |
|---|---|---|
| Day 7 Retention | % of users who return 7 days after registration | ≥ 45% |
| Day 30 Retention | % of users who return 30 days after registration | ≥ 30% |
| Monthly Churn Rate | % of MAU who become inactive the following month | ≤ 15% |
| Group Re-Use Rate | % of users who create or join a second group within 60 days | ≥ 35% |

### 8.4 Satisfaction & Quality

| Metric | Definition | Target |
|---|---|---|
| Net Promoter Score (NPS) | In-app survey after 30 days of usage | ≥ 40 |
| App Store Rating | Average rating on iOS App Store and Google Play | ≥ 4.5 |
| Settlement Success Rate | % of recorded settlements confirmed (not disputed) | ≥ 95% |
| Support Ticket Volume | Tickets per 1,000 MAU per month | ≤ 10 |
| Crash-Free Session Rate | % of sessions without fatal errors | ≥ 99.5% |

### 8.5 North Star Metric

> **Settlements Completed per Month** — the number of debts fully resolved through the platform. This metric captures the end-to-end value chain: users must create groups, add expenses, trust the balances, and act on them. Growth in this metric signals that SplitSmart is delivering on its core promise.

---

## Appendix A: Business Rule Summary

| Rule ID | Rule | Applies To |
|---|---|---|
| BR-01 | Expense total must equal the sum of all payer contributions | Expense creation |
| BR-02 | Expense total must equal the sum of all participant shares | Expense creation |
| BR-03 | An expense must have ≥ 1 payer and ≥ 2 participants | Expense creation |
| BR-04 | Expense edit/delete allowed within 48 hours, unless a referencing settlement exists | Expense management |
| BR-05 | Settlement amount must not exceed the outstanding balance owed to the recipient | Settlement creation |
| BR-06 | Settlement requires explicit or auto-confirmed (72-hour) acknowledgment from the recipient | Settlement confirmation |
| BR-07 | Confirmed settlements are immutable; reversals create counter-entries | Settlement integrity |
| BR-08 | Debt simplification must preserve every member's net balance exactly | Debt simplification |
| BR-09 | Group membership capped at 50 members | Group management |
| BR-10 | Payment reminders rate-limited to 1 per debtor per 24-hour period | Payment reminders |
| BR-11 | All monetary values stored and computed with 2 decimal-place precision | All financial operations |
| BR-12 | Exchange rates for multi-currency expenses fetched at time of creation and stored immutably | Multi-currency (P1-03) |

---

*End of Document*
