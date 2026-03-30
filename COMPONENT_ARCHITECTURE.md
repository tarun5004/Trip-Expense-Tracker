# SplitSmart Component Architecture

This document describes the atomic React component architecture for the SplitSmart frontend application.

## Core Rules & Constraints

1. **Mobile-First & Responsiveness:** All components must function gracefully at a minimum viewport width of 320px.
2. **Interactive States:** All clickable/focusable components must define styles for `:hover`, `:focus-visible` (focus rings), `:active`, and `:disabled`.
3. **Pure Presentation:** Atoms and Molecules do NOT fetch data. They accept data via props.
4. **Resilience:** All data-reliant components support `loading`, `error`, and `empty` variants.

---

## 🟢 ATOMS
*Fundamental UI building blocks.*

### 1. `Button`
- **Renders:** `<button>` or `<Link>` styled as a button.
- **Props:** `variant` (primary, secondary, ghost, danger), `size` (sm, md, lg), `loading` (boolean), `disabled` (boolean), `leftIcon` (ReactNode), `rightIcon` (ReactNode), `onClick`, `children`.
- **States:** Default, hover, active, focus-visible, disabled, loading (renders Spinner & masks text).

### 2. `Input`
- **Renders:** Stylized `<input>` element.
- **Props:** `type`, `placeholder`, `error` (string), `label` (string), `helperText` (string), `leftAddon` (ReactNode), `rightAddon` (ReactNode), `disabled`, `value`, `onChange`.
- **States:** Default, focused (ring), error (red ring & text), disabled.

### 3. `Avatar`
- **Renders:** User image `<img>` or initial fallback.
- **Props:** `src` (string), `name` (string), `size` (xs/sm/md/lg/xl), `badge` ('online', 'offline', null), `fallback` (string UI).
- **States:** Loading (skeleton), Error (shows fallback initials).

### 4. `Badge`
- **Renders:** Small informational pill `<span>`.
- **Props:** `variant` (success, warning, danger, info, neutral), `size` (sm, md), `label` (string).
- **States:** Only default variations based on variant prop.

### 5. `Spinner`
- **Renders:** SVG loading animation.
- **Props:** `size` (sm, md, lg), `color` (primary, white, neutral), `label` (string - for screen readers default "Loading").

### 6. `Divider`
- **Renders:** `<hr>` or `<div>` separator.
- **Props:** `orientation` (horizontal, vertical), `label` (optional text embedded in the middle).

### 7. `Icon`
- **Renders:** Lucide React icon.
- **Props:** `name` (Lucide icon identifier), `size` (number/string), `color`.

### 8. `Tooltip`
- **Renders:** Popper.js / Framer Motion accessible floating tooltip.
- **Props:** `content` (ReactNode), `placement` (top, bottom, left, right), `trigger` (hover/click).

### 9. `Toggle`
- **Renders:** Switch style `<input type="checkbox">` alternative.
- **Props:** `checked` (boolean), `onChange` (function), `label` (string), `disabled` (boolean).
- **States:** On, off, disabled, focus-visible.

### 10. `Select`
- **Renders:** Stylized dropdown (native `<select>` for mobile, custom for desktop).
- **Props:** `options` (Array of {value, label}), `value`, `onChange`, `placeholder`, `error` (string).
- **States:** Default, open/expanded, focus, error, disabled.

### 11. `AmountDisplay`
- **Renders:** Formatted semantic currency string.
- **Props:** `amountCents` (number), `currency` (string, default 'INR'), `variant` (positive, negative, neutral), `size` (sm, md, lg).
- **States:** Renders "owed" (green/positive) vs "owes" (red/negative) based on variant.

### 12. `EmptyState`
- **Renders:** Centered illustration/icon with text for empty lists.
- **Props:** `icon` (ReactNode/Lucide), `title` (string), `description` (string), `action` (Button component).

---

## 🟡 MOLECULES
*Composed from multiple Atoms to form reusable sub-components.*

### 1. `FormField`
- **Contains:** `<label>` + `Input` or `Select` + `helperText/error` display atom.
- **Props:** Similar to Input, wraps the layout.

### 2. `AmountInput`
- **Contains:** `Input` + Currency Symbol Addon.
- **Props:** Handles parsing integers to cents and restricting input to digits/decimals. Includes formatting mask.

### 3. `UserChip`
- **Contains:** `Avatar` + Name Text + Optional trailing `Icon` (X for remove).
- **Props:** `user` object, `removable` (boolean), `onRemove` (function).
- **States:** Hover background, Focus ring if removable.

### 4. `BalancePill`
- **Contains:** `Avatar` + User Name + `AmountDisplay`.
- **Props:** `user` object, `amount` (cents), `direction` ('owes', 'owed', 'settled').
- **States:** Positive (green tint), Negative (red tint), Neutral.

### 5. `ExpenseCard`
- **Contains:** `Icon` (Category) + Title + `AmountDisplay` + Paid By text + Date + Context Menu (`Icon` button).
- **Props:** `expense` object, `onClick` handler.
- **States:** Hover state (elevation/cursor), Loading (skeleton variant).

### 6. `PaymentRow`
- **Contains:** `Avatar` (from) + Arrow `Icon` + `Avatar` (to) + `AmountDisplay` + Date + Note.
- **Props:** `payment` object.
- **States:** Default list item view.

### 7. `GroupCard`
- **Contains:** Title + `Avatar` block (member previews) + `AmountDisplay` (your balance in group) + Last Activity text.
- **Props:** `group` object, `userBalance` (cents).
- **States:** Hover state, Focus state.

### 8. `SplitTypeSelector`
- **Contains:** Horizontal segmented tab control.
- **Props:** `options` (equal, exact, percentage, shares), `selectedType`, `onChange`.

---

## 🟠 ORGANISMS
*Complex, functional blocks composed of molecules and atoms.*

### 1. `ExpenseForm`
- **Contains:** `FormField`, `AmountInput`, `SplitTypeSelector`, member list array of `UserChip` / custom split inputs.
- **Props:** `groupId`, `initialData` (for edit), `onSubmit`, `onCancel`.
- **States:** Validating, Submitting (loading), Error summary.

### 2. `GroupBalancePanel`
- **Contains:** List of `BalancePill` molecules + Simplify Debts `Toggle` + Settle Up `Button`.
- **Props:** `balances` array, `isSimplified` (boolean), `onToggleSimplify`, `onSettleInitiated`.
- **States:** Loading balances, Empty (everyone settled).

### 3. `ActivityFeed`
- **Contains:** List of structured activity rows (e.g., "User added Expense", "User settled with User").
- **Props:** `activities` array, `isLoading`, `hasMore`, `onLoadMore`.
- **States:** Loading state, Empty feed, Loading More spinner at the bottom.

### 4. `GroupMemberList`
- **Contains:** Grid/List of `UserChip` with role `Badge`s and contextual `BalancePill`.
- **Props:** `members` array, `adminId`.
- **States:** Loading members.

### 5. `DashboardSummary`
- **Contains:** Large `AmountDisplay` (Net total) + small summary text + Quick actions + `GroupCard` list snippet.
- **Props:** `overallBalance`, `recentGroups`, `isLoading`.

### 6. `PaymentFlow`
- **Contains:** Wizard container: Select Payee (if not preset) → `AmountInput` → Select Method → Confirm.
- **Props:** `groupId`, `availableBalances`, `onSubmit`.

---

## 🟣 LAYOUTS

### 1. `AppShell`
- **Contains:** Top Header (mobile), `Sidebar` (Desktop) or `BottomNav` (Mobile), `<main>` content area.
- **Props:** `children` (page content), `user` object (for profile snippet).

### 2. `AuthLayout`
- **Contains:** Centered authentication card on a subtle aesthetic background.
- **Props:** `children`.

### 3. `ModalLayout`
- **Contains:** Overlay backdrop, white card container, close `Icon` button, header title.
- **Props:** `isOpen`, `onClose`, `title`, `children`.
- **Behavior:** Traps focus, prevents body scroll, closes on ESC.

---

## 🔵 PAGES
*Top-level route components. They connect directly to custom hooks (React Query) and inject data down.*

1. **`DashboardPage`** - Wraps `DashboardSummary`. Fetches overall user metrics.
2. **`GroupDetailPage`** - Main hub for a group. Uses `Tabs` to show either `ExpenseCard` list or `GroupBalancePanel`.
3. **`AddExpensePage`** - Wraps `ExpenseForm`.
4. **`ExpenseDetailPage`** - Shows full split breakdown and provides Edit/Delete actions.
5. **`SettleUpPage`** - Wraps `PaymentFlow`.
6. **`ActivityPage`** - Wraps global `ActivityFeed`.
7. **`ProfilePage`** - Form for updating user info and settings.
8. **`AuthPage`** - Tabs for Login / Register form.
