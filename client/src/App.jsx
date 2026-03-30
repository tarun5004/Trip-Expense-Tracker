import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import ROUTES from './constants/routes';

// Layouts
import AppShell from './layouts/AppShell';
import AuthLayout from './layouts/AuthLayout';

// Pages
import AuthPage from './pages/AuthPage';
import DashboardPage from './pages/DashboardPage';
import GroupDetailPage from './pages/GroupDetailPage';
import AddExpensePage from './pages/AddExpensePage';
import ExpenseDetailPage from './pages/ExpenseDetailPage';
import SettleUpPage from './pages/SettleUpPage';
import ActivityPage from './pages/ActivityPage';
import ProfilePage from './pages/ProfilePage';

function App() {
  return (
    <BrowserRouter>
      <Routes>
        {/* Public Routes */}
        <Route element={<AuthLayout />}>
          <Route path={ROUTES.AUTH} element={<AuthPage />} />
        </Route>

        {/* Protected Routes inside AppShell */}
        <Route element={<AppShell />}>
          <Route path={ROUTES.HOME} element={<Navigate to={ROUTES.DASHBOARD} replace />} />
          <Route path={ROUTES.DASHBOARD} element={<DashboardPage />} />
          
          {/* Groups */}
          {/* Redirect /groups to /dashboard if we don't have a dedicated groups list page yet */}
          <Route path={ROUTES.GROUPS} element={<Navigate to={ROUTES.DASHBOARD} replace />} />
          <Route path={ROUTES.GROUP_DETAIL()} element={<GroupDetailPage />} />
          <Route path={ROUTES.ADD_EXPENSE()} element={<AddExpensePage />} />
          <Route path={ROUTES.EXPENSE_DETAIL()} element={<ExpenseDetailPage />} />
          <Route path={ROUTES.SETTLE_UP()} element={<SettleUpPage />} />
          
          <Route path={ROUTES.ACTIVITY} element={<ActivityPage />} />
          <Route path={ROUTES.PROFILE} element={<ProfilePage />} />
        </Route>

        {/* Catch-all */}
        <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;
