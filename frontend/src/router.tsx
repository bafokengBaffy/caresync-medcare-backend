import { lazy, Suspense, type ReactNode } from 'react';
import { createBrowserRouter, Navigate, Outlet, useParams } from 'react-router-dom';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { RoleGate } from './components/auth/RoleGate';
import { AppLayout } from './components/layout/AppLayout';
import { AuthLayout } from './components/layout/AuthLayout';
import { PublicLayout } from './components/layout/PublicLayout';
import { ROLES, type Role } from './lib/constants';
import { useAuthStore } from './stores/auth-store';
import LandingPage from './pages/LandingPage';
import ErrorPage from './pages/ErrorPage';
import NotFoundPage from './pages/NotFoundPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import PendingApprovalPage from './pages/auth/PendingApprovalPage';
import PatientDashboardPage from './pages/patient-portal/PatientDashboardPage';
import MyAppointmentsPage from './pages/patient-portal/MyAppointmentsPage';
import MyRecordsPage from './pages/patient-portal/MyRecordsPage';
import MyBillingPage from './pages/patient-portal/MyBillingPage';
import DentalChartsPage from './pages/clinical/DentalChartsPage';
import EyeExamsPage from './pages/clinical/EyeExamsPage';
import LabResultsPage from './pages/clinical/LabResultsPage';
const AdminDashboardPage = lazy(() => import('./pages/admin/dashboard/AdminDashboardPage'));
const SuperAdminDashboardPage = lazy(() => import('./pages/admin/super-admin/dashboard/SuperAdminDashboardPage'));
const SuperAdminUserListPage = lazy(() => import('./pages/admin/super-admin/users/UserListPage'));
const SuperAdminUserDetailPage = lazy(() => import('./pages/admin/super-admin/users/UserDetailPage'));
const SuperAdminUserCreatePage = lazy(() => import('./pages/admin/super-admin/users/UserCreatePage'));
const SuperAdminTenantListPage = lazy(() => import('./pages/admin/super-admin/tenants/TenantListPage'));
const SuperAdminTenantDetailPage = lazy(() => import('./pages/admin/super-admin/tenants/TenantDetailPage'));
const SuperAdminTenantCreatePage = lazy(() => import('./pages/admin/super-admin/tenants/TenantCreatePage'));
const TenantAdminsPage = lazy(() => import('./pages/admin/super-admin/tenants/TenantAdminsPage'));
const RegistrationRequestsPage = lazy(() => import('./pages/admin/super-admin/registration/RegistrationRequestsPage'));
const PendingActivationsPage = lazy(() => import('./pages/admin/super-admin/registration/PendingActivationsPage'));
const ProvisionStaffPage = lazy(() => import('./pages/admin/super-admin/registration/ProvisionStaffPage'));
const RegistrationSettingsPage = lazy(() => import('./pages/admin/super-admin/registration/RegistrationSettingsPage'));
const SuperAdminRoleManagementPage = lazy(() => import('./pages/admin/super-admin/roles/RoleManagementPage'));
const SuperAdminAuditLogPage = lazy(() => import('./pages/admin/super-admin/audit/AuditLogPage'));
const SystemActivityPage = lazy(() => import('./pages/admin/super-admin/audit/SystemActivityPage'));
const GlobalSettingsPage = lazy(() => import('./pages/admin/super-admin/system/GlobalSettingsPage'));
const IntegrationsPage = lazy(() => import('./pages/admin/super-admin/system/IntegrationsPage'));
const RevenuePage = lazy(() => import('./pages/admin/super-admin/billing/RevenuePage'));
const SubscriptionsPage = lazy(() => import('./pages/admin/super-admin/billing/SubscriptionsPage'));
const TenantAdminDashboardPage = lazy(() => import('./pages/admin/tenant-admin/dashboard/TenantAdminDashboardPage'));
const StaffListPage = lazy(() => import('./pages/admin/tenant-admin/staff/StaffListPage'));
const StaffCreatePage = lazy(() => import('./pages/admin/tenant-admin/staff/StaffCreatePage'));
const StaffDetailPage = lazy(() => import('./pages/admin/tenant-admin/staff/StaffDetailPage'));
const StaffInvitePage = lazy(() => import('./pages/admin/tenant-admin/staff/StaffInvitePage'));
const TenantUserListPage = lazy(() => import('./pages/admin/tenant-admin/users/TenantUserListPage'));
const TenantUserCreatePage = lazy(() => import('./pages/admin/tenant-admin/users/TenantUserCreatePage'));
const TenantUserDetailPage = lazy(() => import('./pages/admin/tenant-admin/users/TenantUserDetailPage'));
const PatientRegistrationsPage = lazy(() => import('./pages/admin/tenant-admin/registration/PatientRegistrationsPage'));
const PendingApprovalsPage = lazy(() => import('./pages/admin/tenant-admin/registration/PendingApprovalsPage'));
const StaffProvisioningPage = lazy(() => import('./pages/admin/tenant-admin/registration/StaffProvisioningPage'));
const TenantRoleManagementPage = lazy(() => import('./pages/admin/tenant-admin/roles/TenantRoleManagementPage'));
const TenantSettingsPage = lazy(() => import('./pages/admin/tenant-admin/settings/TenantSettingsPage'));
const TenantAuditLogPage = lazy(() => import('./pages/admin/tenant-admin/audit/TenantAuditLogPage'));
import SettingsPage from './pages/shared/SettingsPage';
import ProfilePage from './pages/shared/ProfilePage';
import SecurityPage from './pages/shared/SecurityPage';
import NotificationsPage from './pages/shared/NotificationsPage';
import CompliancePage from './pages/shared/CompliancePage';
import ApiKeysPage from './pages/shared/ApiKeysPage';
import BillingSettingsPage from './pages/reception/billing/BillingSettingsPage';
import InvoicesListPage from './pages/reception/billing/InvoicesListPage';
import InvoiceCreatePage from './pages/reception/billing/InvoiceCreatePage';
import InvoiceDetailPage from './pages/reception/billing/InvoiceDetailPage';
import InvoiceEditPage from './pages/reception/billing/InvoiceEditPage';
import PaymentsPage from './pages/finance/payments/PaymentsPage';
import ServiceFeesPage from './pages/finance/billing/ServiceFeesPage';
import FinancialReportsPage from './pages/finance/reports/FinancialReportsPage';

const allRoles: Role[] = [...ROLES];
const adminRoles: Role[] = ['SUPER_ADMIN', 'TENANT_ADMIN'];
const clinicalRoles: Role[] = ['PROVIDER', 'CLINICIAN'];
const receptionRoles: Role[] = ['RECEPTION', 'RECEPTIONIST', 'STAFF'];
const financeRoles: Role[] = ['FINANCE', 'MANAGER'];

const guard = (roles: Role[], page: ReactNode) => (
  <RoleGate allow={roles} fallback={<Navigate to="/unauthorized" replace />}>
    {page}
  </RoleGate>
);

function RoleHomeRedirect() {
  const role = useAuthStore((state) => state.user?.role);
  const homeByRole: Record<Role, string> = {
    SUPER_ADMIN: '/admin/super',
    TENANT_ADMIN: '/admin/tenant',
    PROVIDER: '/clinical/dashboard',
    CLINICIAN: '/clinical/dashboard',
    RECEPTION: '/reception/dashboard',
    RECEPTIONIST: '/reception/dashboard',
    STAFF: '/reception/dashboard',
    FINANCE: '/finance/dashboard',
    MANAGER: '/finance/dashboard',
    PATIENT: '/portal',
    CONSENT_MANAGER: '/shared/settings',
    PRIVACY_OFFICER: '/shared/settings',
  };
  return <Navigate to={role ? homeByRole[role] : '/not-found'} replace />;
}

function AdminHomeRedirect() {
  const role = useAuthStore((state) => state.user?.role);
  const home = role === 'SUPER_ADMIN'
    ? '/admin/super'
    : role === 'TENANT_ADMIN' ? '/admin/tenant' : '/unauthorized';
  return <Navigate to={home} replace />;
}

function LegacyAdminSectionRedirect({ section }: { section: 'audit' | 'roles' }) {
  const role = useAuthStore((state) => state.user?.role);
  if (role === 'SUPER_ADMIN') return <Navigate to={`/admin/super/${section}`} replace />;
  if (role === 'TENANT_ADMIN') return <Navigate to={`/admin/tenant/${section}`} replace />;
  return <Navigate to="/unauthorized" replace />;
}

function LegacyAdminUsersRedirect() {
  const role = useAuthStore((state) => state.user?.role);
  const { userId } = useParams();
  const target = role === 'SUPER_ADMIN' ? '/admin/super/users' : role === 'TENANT_ADMIN' ? '/admin/tenant/users' : '/unauthorized';
  return <Navigate to={userId ? `${target}/${encodeURIComponent(userId)}` : target} replace />;
}

export const router = createBrowserRouter([
  {
    path: '/',
    element: <PublicLayout />,
    children: [
      { index: true, element: <LandingPage /> },
      {
        path: 'auth',
        element: <AuthLayout />,
        children: [
          { path: 'login', element: <LoginPage /> },
          { path: 'register', element: <RegisterPage /> },
          { path: 'forgot-password', element: <ForgotPasswordPage /> },
          { path: 'reset-password', element: <ResetPasswordPage /> },
          { path: 'verify-email', element: <VerifyEmailPage /> },
          { path: 'pending-approval', element: <PendingApprovalPage /> },
        ],
      },
      {
        path: 'login',
        element: <AuthLayout />,
        children: [{ index: true, element: <LoginPage /> }],
      },
    ],
  },
  {
    path: '/',
    element: <ProtectedRoute><Suspense fallback={<div className="flex min-h-screen items-center justify-center" role="status">Loading page…</div>}><AppLayout /></Suspense></ProtectedRoute>,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: guard(allRoles, <RoleHomeRedirect />) },
      { path: 'dashboard', element: guard(allRoles, <RoleHomeRedirect />) },
      { path: 'not-found', element: <NotFoundPage /> },
      { path: 'unauthorized', element: <NotFoundPage /> },
      {
        path: 'admin',
        element: guard(adminRoles, <Outlet />),
        children: [
          { index: true, element: <AdminHomeRedirect /> },
          { path: 'dashboard', element: <AdminHomeRedirect /> },
          { path: 'audit', element: <LegacyAdminSectionRedirect section="audit" /> },
          { path: 'users', element: <LegacyAdminUsersRedirect /> },
          { path: 'users/:userId', element: <LegacyAdminUsersRedirect /> },
          { path: 'roles', element: <LegacyAdminSectionRedirect section="roles" /> },
          { path: 'super', element: guard(['SUPER_ADMIN'], <SuperAdminDashboardPage />) },
          { path: 'super/dashboard', element: guard(['SUPER_ADMIN'], <SuperAdminDashboardPage />) },
          { path: 'super/health', element: guard(['SUPER_ADMIN'], <AdminDashboardPage platformMode />) },
          { path: 'super/users', element: guard(['SUPER_ADMIN'], <SuperAdminUserListPage />) },
          { path: 'super/users/new', element: guard(['SUPER_ADMIN'], <SuperAdminUserCreatePage />) },
          { path: 'super/users/create', element: guard(['SUPER_ADMIN'], <SuperAdminUserCreatePage />) },
          { path: 'super/users/:userId', element: guard(['SUPER_ADMIN'], <SuperAdminUserDetailPage />) },
          { path: 'super/tenants', element: guard(['SUPER_ADMIN'], <SuperAdminTenantListPage />) },
          { path: 'super/tenants/new', element: guard(['SUPER_ADMIN'], <SuperAdminTenantCreatePage />) },
          { path: 'super/tenants/create', element: guard(['SUPER_ADMIN'], <SuperAdminTenantCreatePage />) },
          { path: 'super/tenants/:tenantId/admins', element: guard(['SUPER_ADMIN'], <TenantAdminsPage />) },
          { path: 'super/tenants/:tenantId', element: guard(['SUPER_ADMIN'], <SuperAdminTenantDetailPage />) },
          { path: 'super/registration/requests', element: guard(['SUPER_ADMIN'], <RegistrationRequestsPage />) },
          { path: 'super/registration/activations', element: guard(['SUPER_ADMIN'], <PendingActivationsPage />) },
          { path: 'super/registration/pending-activations', element: guard(['SUPER_ADMIN'], <PendingActivationsPage />) },
          { path: 'super/registration/provision-staff', element: guard(['SUPER_ADMIN'], <ProvisionStaffPage />) },
          { path: 'super/registration/provision', element: guard(['SUPER_ADMIN'], <ProvisionStaffPage />) },
          { path: 'super/registration/settings', element: guard(['SUPER_ADMIN'], <RegistrationSettingsPage />) },
          { path: 'super/roles', element: guard(['SUPER_ADMIN'], <SuperAdminRoleManagementPage />) },
          { path: 'super/audit', element: guard(['SUPER_ADMIN'], <SuperAdminAuditLogPage />) },
          { path: 'super/activity', element: guard(['SUPER_ADMIN'], <SystemActivityPage />) },
          { path: 'super/settings', element: guard(['SUPER_ADMIN'], <GlobalSettingsPage />) },
          { path: 'super/integrations', element: guard(['SUPER_ADMIN'], <IntegrationsPage />) },
          { path: 'super/revenue', element: guard(['SUPER_ADMIN'], <RevenuePage />) },
          { path: 'super/subscriptions', element: guard(['SUPER_ADMIN'], <SubscriptionsPage />) },
          { path: 'tenants', element: guard(['SUPER_ADMIN'], <SuperAdminTenantListPage />) },
          { path: 'tenant', element: guard(['TENANT_ADMIN'], <TenantAdminDashboardPage />) },
          { path: 'tenant/staff', element: guard(['TENANT_ADMIN'], <StaffListPage />) },
          { path: 'tenant/staff/new', element: guard(['TENANT_ADMIN'], <StaffCreatePage />) },
          { path: 'tenant/staff/invite', element: guard(['TENANT_ADMIN'], <StaffInvitePage />) },
          { path: 'tenant/staff/:userId', element: guard(['TENANT_ADMIN'], <StaffDetailPage />) },
          { path: 'tenant/users', element: guard(['TENANT_ADMIN'], <TenantUserListPage />) },
          { path: 'tenant/users/new', element: guard(['TENANT_ADMIN'], <TenantUserCreatePage />) },
          { path: 'tenant/users/:userId', element: guard(['TENANT_ADMIN'], <TenantUserDetailPage />) },
          { path: 'tenant/registration/patients', element: guard(['TENANT_ADMIN'], <PatientRegistrationsPage />) },
          { path: 'tenant/registration/approvals', element: guard(['TENANT_ADMIN'], <PendingApprovalsPage />) },
          { path: 'tenant/registration/staff', element: guard(['TENANT_ADMIN'], <StaffProvisioningPage />) },
          { path: 'tenant/roles', element: guard(['TENANT_ADMIN'], <TenantRoleManagementPage />) },
          { path: 'tenant/settings', element: guard(['TENANT_ADMIN'], <TenantSettingsPage />) },
          { path: 'tenant/audit', element: guard(['TENANT_ADMIN'], <TenantAuditLogPage />) },
        ],
      },
      {
        path: 'clinical',
        element: guard(clinicalRoles, <Outlet />),
        children: [
          { index: true, element: <Navigate to="/clinical/dashboard" replace /> },
          { path: 'dashboard', element: <Navigate to="/clinical/dental-charts" replace /> },
          { path: 'dental-charts', element: <DentalChartsPage /> },
          { path: 'eye-exams', element: <EyeExamsPage /> },
          { path: 'lab-results', element: <LabResultsPage /> },
        ],
      },
      {
        path: 'reception',
        element: guard(receptionRoles, <Outlet />),
        children: [
          { index: true, element: <Navigate to="/reception/dashboard" replace /> },
          { path: 'dashboard', element: <Navigate to="/reception/billing/invoices" replace /> },
          { path: 'billing/settings', element: <BillingSettingsPage /> },
          { path: 'billing/invoices', element: <InvoicesListPage /> },
          { path: 'billing/invoices/new', element: <InvoiceCreatePage /> },
          { path: 'billing/invoices/:invoiceId/edit', element: <InvoiceEditPage /> },
          { path: 'billing/invoices/:invoiceId', element: <InvoiceDetailPage /> },
        ],
      },
      {
        path: 'finance',
        element: guard(financeRoles, <Outlet />),
        children: [
          { index: true, element: <Navigate to="/finance/dashboard" replace /> },
          { path: 'dashboard', element: <Navigate to="/finance/reports" replace /> },
          { path: 'payments', element: <PaymentsPage /> },
          { path: 'service-fees', element: <ServiceFeesPage /> },
          { path: 'reports', element: <FinancialReportsPage /> },
          { path: 'invoices/:invoiceId', element: <InvoiceDetailPage /> },
        ],
      },
      {
        path: 'portal',
        element: guard(['PATIENT'], <Outlet />),
        children: [
          { index: true, element: <PatientDashboardPage /> },
          { path: 'appointments', element: <MyAppointmentsPage /> },
          { path: 'records', element: <MyRecordsPage /> },
          { path: 'billing', element: <MyBillingPage /> },
        ],
      },
      {
        path: 'shared',
        element: guard(allRoles, <Outlet />),
        children: [
          { index: true, element: <Navigate to="/shared/settings" replace /> },
          { path: 'settings', element: <SettingsPage /> },
          { path: 'profile', element: <ProfilePage /> },
          { path: 'security', element: guard(allRoles.filter((role) => role !== 'PATIENT'), <SecurityPage />) },
          { path: 'notifications', element: guard(allRoles.filter((role) => role !== 'PATIENT'), <NotificationsPage />) },
          { path: 'compliance', element: guard(['SUPER_ADMIN', 'TENANT_ADMIN', 'CONSENT_MANAGER', 'PRIVACY_OFFICER'], <CompliancePage />) },
          { path: 'api-keys', element: guard(['SUPER_ADMIN', 'TENANT_ADMIN'], <ApiKeysPage />) },
        ],
      },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
