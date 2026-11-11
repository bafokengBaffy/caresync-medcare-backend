import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { RoleGate } from './components/auth/RoleGate';
import { AppLayout } from './components/layout/AppLayout';
import { AuthLayout } from './components/layout/AuthLayout';
import { PublicLayout } from './components/layout/PublicLayout';
import LandingPage from './pages/LandingPage';
import DashboardPage from './pages/dashboard/DashboardPage';
import PatientsListPage from './pages/patients/PatientsListPage';
import PatientCreatePage from './pages/patients/PatientCreatePage';
import PatientDetailPage from './pages/patients/PatientDetailPage';
import PatientEditPage from './pages/patients/PatientEditPage';
import PatientDocumentsPage from './pages/patients/PatientDocumentsPage';
import ProvidersListPage from './pages/providers/ProvidersListPage';
import ProviderDetailPage from './pages/providers/ProviderDetailPage';
import ProviderCreatePage from './pages/providers/ProviderCreatePage';
import ProviderEditPage from './pages/providers/ProviderEditPage';
import AppointmentsListPage from './pages/appointments/AppointmentsListPage';
import AppointmentCreatePage from './pages/appointments/AppointmentCreatePage';
import AppointmentDetailPage from './pages/appointments/AppointmentDetailPage';
import CalendarPage from './pages/appointments/CalendarPage';
import AvailabilityPage from './pages/appointments/AvailabilityPage';
import NotesListPage from './pages/clinical-notes/NotesListPage';
import NoteCreatePage from './pages/clinical-notes/NoteCreatePage';
import NoteDetailPage from './pages/clinical-notes/NoteDetailPage';
import InvoicesListPage from './pages/billing/InvoicesListPage';
import InvoiceCreatePage from './pages/billing/InvoiceCreatePage';
import InvoiceDetailPage from './pages/billing/InvoiceDetailPage';
import InvoiceEditPage from './pages/billing/InvoiceEditPage';
import PaymentsPage from './pages/billing/PaymentsPage';
import SettingsPage from './pages/settings/SettingsPage';
import ProfilePage from './pages/settings/ProfilePage';
import AuditLogPage from './pages/admin/audit/AuditLogPage';
import TenantAdminPage from './pages/admin/TenantAdminPage';
import LoginPage from './pages/auth/LoginPage';
import RegisterPage from './pages/auth/RegisterPage';
import ForgotPasswordPage from './pages/auth/ForgotPasswordPage';
import ResetPasswordPage from './pages/auth/ResetPasswordPage';
import VerifyEmailPage from './pages/auth/VerifyEmailPage';
import PendingApprovalPage from './pages/auth/PendingApprovalPage';
import NotFoundPage from './pages/NotFoundPage';
import ErrorPage from './pages/ErrorPage';
import PatientDashboardPage from './pages/patient-portal/PatientDashboardPage';
import MyAppointmentsPage from './pages/patient-portal/MyAppointmentsPage';
import MyRecordsPage from './pages/patient-portal/MyRecordsPage';
import MyBillingPage from './pages/patient-portal/MyBillingPage';
import SuperAdminDashboardPage from './pages/admin/super-admin/dashboard/SuperAdminDashboardPage';
import SuperAdminUserListPage from './pages/admin/super-admin/users/UserListPage';
import SuperAdminUserDetailPage from './pages/admin/super-admin/users/UserDetailPage';
import SuperAdminUserCreatePage from './pages/admin/super-admin/users/UserCreatePage';
import SuperAdminTenantListPage from './pages/admin/super-admin/tenants/TenantListPage';
import SuperAdminTenantDetailPage from './pages/admin/super-admin/tenants/TenantDetailPage';
import SuperAdminTenantCreatePage from './pages/admin/super-admin/tenants/TenantCreatePage';
import TenantAdminsPage from './pages/admin/super-admin/tenants/TenantAdminsPage';
import DentalChartsPage from './pages/clinical/DentalChartsPage';
import EyeExamsPage from './pages/clinical/EyeExamsPage';
import LabResultsPage from './pages/clinical/LabResultsPage';
import RegistrationRequestsPage from './pages/admin/super-admin/registration/RegistrationRequestsPage';
import PendingActivationsPage from './pages/admin/super-admin/registration/PendingActivationsPage';
import ProvisionStaffPage from './pages/admin/super-admin/registration/ProvisionStaffPage';
import RegistrationSettingsPage from './pages/admin/super-admin/registration/RegistrationSettingsPage';
import SuperAdminRoleManagementPage from './pages/admin/super-admin/roles/RoleManagementPage';
import SuperAdminAuditLogPage from './pages/admin/super-admin/audit/AuditLogPage';
import SystemActivityPage from './pages/admin/super-admin/audit/SystemActivityPage';
import GlobalSettingsPage from './pages/admin/super-admin/system/GlobalSettingsPage';
import IntegrationsPage from './pages/admin/super-admin/system/IntegrationsPage';
import RevenuePage from './pages/admin/super-admin/billing/RevenuePage';
import SubscriptionsPage from './pages/admin/super-admin/billing/SubscriptionsPage';
import TenantAdminDashboardPage from './pages/admin/tenant-admin/dashboard/TenantAdminDashboardPage';
import StaffListPage from './pages/admin/tenant-admin/staff/StaffListPage';
import StaffCreatePage from './pages/admin/tenant-admin/staff/StaffCreatePage';
import StaffDetailPage from './pages/admin/tenant-admin/staff/StaffDetailPage';
import StaffInvitePage from './pages/admin/tenant-admin/staff/StaffInvitePage';
import TenantUserListPage from './pages/admin/tenant-admin/users/TenantUserListPage';
import TenantUserCreatePage from './pages/admin/tenant-admin/users/TenantUserCreatePage';
import TenantUserDetailPage from './pages/admin/tenant-admin/users/TenantUserDetailPage';
import PatientRegistrationsPage from './pages/admin/tenant-admin/registration/PatientRegistrationsPage';
import PendingApprovalsPage from './pages/admin/tenant-admin/registration/PendingApprovalsPage';
import StaffProvisioningPage from './pages/admin/tenant-admin/registration/StaffProvisioningPage';
import TenantRoleManagementPage from './pages/admin/tenant-admin/roles/TenantRoleManagementPage';
import TenantSettingsPage from './pages/admin/tenant-admin/settings/TenantSettingsPage';
import TenantAuditLogPage from './pages/admin/tenant-admin/audit/TenantAuditLogPage';

const staffRoles = ['SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'PROVIDER', 'CLINICIAN', 'STAFF', 'RECEPTION', 'RECEPTIONIST', 'MANAGER'] as const;
const patientOperationsRoles = ['SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'PROVIDER', 'CLINICIAN', 'STAFF', 'RECEPTION', 'RECEPTIONIST', 'MANAGER'] as const;
const appointmentRoles = ['SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'PROVIDER', 'CLINICIAN', 'STAFF', 'RECEPTION', 'RECEPTIONIST', 'MANAGER'] as const;
const clinicalRoles = ['SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'PROVIDER', 'CLINICIAN'] as const;
const clinicalRecordRoles = ['TENANT_ADMIN', 'ADMIN', 'PROVIDER', 'CLINICIAN', 'STAFF', 'RECEPTION', 'MANAGER'] as const;
const billingRoles = ['SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'FINANCE', 'MANAGER'] as const;

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
    ],
  },
  {
    path: '/',
    element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <RoleGate allow={[...staffRoles]}><DashboardPage /></RoleGate> },
      { path: 'patients', element: <RoleGate allow={[...patientOperationsRoles]}><PatientsListPage /></RoleGate> },
      { path: 'patients/new', element: <RoleGate allow={['SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'STAFF', 'RECEPTION', 'RECEPTIONIST']}><PatientCreatePage /></RoleGate> },
      { path: 'patients/:patientId', element: <RoleGate allow={[...patientOperationsRoles]}><PatientDetailPage /></RoleGate> },
      { path: 'patients/:patientId/edit', element: <RoleGate allow={['SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'STAFF', 'RECEPTION', 'RECEPTIONIST']}><PatientEditPage /></RoleGate> },
      { path: 'patients/:patientId/documents', element: <RoleGate allow={[...patientOperationsRoles]}><PatientDocumentsPage /></RoleGate> },
      { path: 'providers', element: <RoleGate allow={[...clinicalRoles, 'MANAGER']}><ProvidersListPage /></RoleGate> },
      { path: 'providers/create', element: <RoleGate allow={['SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'MANAGER']}><ProviderCreatePage /></RoleGate> },
      { path: 'providers/:providerId/edit', element: <RoleGate allow={['SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'MANAGER']}><ProviderEditPage /></RoleGate> },
      { path: 'providers/:providerId', element: <RoleGate allow={[...clinicalRoles, 'MANAGER']}><ProviderDetailPage /></RoleGate> },
      { path: 'appointments', element: <RoleGate allow={[...appointmentRoles]}><AppointmentsListPage /></RoleGate> },
      { path: 'appointments/new', element: <RoleGate allow={['SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'STAFF', 'RECEPTION', 'RECEPTIONIST']}><AppointmentCreatePage /></RoleGate> },
      { path: 'appointments/:id', element: <RoleGate allow={[...appointmentRoles]}><AppointmentDetailPage /></RoleGate> },
      { path: 'appointments/calendar', element: <RoleGate allow={[...appointmentRoles]}><CalendarPage /></RoleGate> },
      { path: 'appointments/availability', element: <RoleGate allow={[...clinicalRoles, 'MANAGER']}><AvailabilityPage /></RoleGate> },
      { path: 'notes', element: <RoleGate allow={[...clinicalRoles]}><NotesListPage /></RoleGate> },
      { path: 'notes/new', element: <RoleGate allow={['ADMIN', 'TENANT_ADMIN', 'PROVIDER', 'CLINICIAN']}><NoteCreatePage /></RoleGate> },
      { path: 'notes/:id', element: <RoleGate allow={[...clinicalRoles]}><NoteDetailPage /></RoleGate> },
      { path: 'clinical/dental-charts', element: <RoleGate allow={[...clinicalRecordRoles]}><DentalChartsPage /></RoleGate> },
      { path: 'clinical/eye-exams', element: <RoleGate allow={[...clinicalRecordRoles]}><EyeExamsPage /></RoleGate> },
      { path: 'clinical/lab-results', element: <RoleGate allow={[...clinicalRecordRoles]}><LabResultsPage /></RoleGate> },
      { path: 'invoices', element: <RoleGate allow={[...billingRoles]}><InvoicesListPage /></RoleGate> },
      { path: 'invoices/new', element: <RoleGate allow={['SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'FINANCE']}><InvoiceCreatePage /></RoleGate> },
      { path: 'invoices/:invoiceId/edit', element: <RoleGate allow={['SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'FINANCE']}><InvoiceEditPage /></RoleGate> },
      { path: 'invoices/:invoiceId', element: <RoleGate allow={[...billingRoles]}><InvoiceDetailPage /></RoleGate> },
      { path: 'billing/invoices', element: <RoleGate allow={[...billingRoles]}><InvoicesListPage /></RoleGate> },
      { path: 'billing/invoices/create', element: <RoleGate allow={['SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'FINANCE']}><InvoiceCreatePage /></RoleGate> },
      { path: 'billing/invoices/:invoiceId/edit', element: <RoleGate allow={['SUPER_ADMIN', 'TENANT_ADMIN', 'ADMIN', 'FINANCE']}><InvoiceEditPage /></RoleGate> },
      { path: 'billing/invoices/:invoiceId', element: <RoleGate allow={[...billingRoles]}><InvoiceDetailPage /></RoleGate> },
      { path: 'payments', element: <RoleGate allow={[...billingRoles]}><PaymentsPage /></RoleGate> },
      { path: 'settings', element: <RoleGate allow={[...staffRoles, 'FINANCE', 'CONSENT_MANAGER', 'PRIVACY_OFFICER']}><SettingsPage /></RoleGate> },
      { path: 'settings/profile', element: <ProfilePage /> },
      { path: 'portal', element: <RoleGate allow={['PATIENT']}><PatientDashboardPage /></RoleGate> },
      { path: 'portal/appointments', element: <RoleGate allow={['PATIENT']}><MyAppointmentsPage /></RoleGate> },
      { path: 'portal/records', element: <RoleGate allow={['PATIENT']}><MyRecordsPage /></RoleGate> },
      { path: 'portal/billing', element: <RoleGate allow={['PATIENT']}><MyBillingPage /></RoleGate> },
      { path: 'admin/super', element: <RoleGate allow={['SUPER_ADMIN']}><SuperAdminDashboardPage /></RoleGate> },
      { path: 'admin/super/users', element: <RoleGate allow={['SUPER_ADMIN']}><SuperAdminUserListPage /></RoleGate> },
      { path: 'admin/super/users/new', element: <RoleGate allow={['SUPER_ADMIN']}><SuperAdminUserCreatePage /></RoleGate> },
      { path: 'admin/super/users/:userId', element: <RoleGate allow={['SUPER_ADMIN']}><SuperAdminUserDetailPage /></RoleGate> },
      { path: 'admin/super/tenants', element: <RoleGate allow={['SUPER_ADMIN']}><SuperAdminTenantListPage /></RoleGate> },
      { path: 'admin/super/tenants/new', element: <RoleGate allow={['SUPER_ADMIN']}><SuperAdminTenantCreatePage /></RoleGate> },
      { path: 'admin/super/tenants/:tenantId/admins', element: <RoleGate allow={['SUPER_ADMIN']}><TenantAdminsPage /></RoleGate> },
      { path: 'admin/super/tenants/:tenantId', element: <RoleGate allow={['SUPER_ADMIN']}><SuperAdminTenantDetailPage /></RoleGate> },
      { path: 'admin/super/registration/requests', element: <RoleGate allow={['SUPER_ADMIN']}><RegistrationRequestsPage /></RoleGate> },
      { path: 'admin/super/registration/activations', element: <RoleGate allow={['SUPER_ADMIN']}><PendingActivationsPage /></RoleGate> },
      { path: 'admin/super/registration/provision-staff', element: <RoleGate allow={['SUPER_ADMIN']}><ProvisionStaffPage /></RoleGate> },
      { path: 'admin/super/registration/settings', element: <RoleGate allow={['SUPER_ADMIN']}><RegistrationSettingsPage /></RoleGate> },
      { path: 'admin/super/roles', element: <RoleGate allow={['SUPER_ADMIN']}><SuperAdminRoleManagementPage /></RoleGate> },
      { path: 'admin/super/audit', element: <RoleGate allow={['SUPER_ADMIN']}><SuperAdminAuditLogPage /></RoleGate> },
      { path: 'admin/super/activity', element: <RoleGate allow={['SUPER_ADMIN']}><SystemActivityPage /></RoleGate> },
      { path: 'admin/super/settings', element: <RoleGate allow={['SUPER_ADMIN']}><GlobalSettingsPage /></RoleGate> },
      { path: 'admin/super/integrations', element: <RoleGate allow={['SUPER_ADMIN']}><IntegrationsPage /></RoleGate> },
      { path: 'admin/super/revenue', element: <RoleGate allow={['SUPER_ADMIN']}><RevenuePage /></RoleGate> },
      { path: 'admin/super/subscriptions', element: <RoleGate allow={['SUPER_ADMIN']}><SubscriptionsPage /></RoleGate> },
      { path: 'admin/tenant', element: <RoleGate allow={['TENANT_ADMIN']}><TenantAdminDashboardPage /></RoleGate> },
      { path: 'admin/tenant/staff', element: <RoleGate allow={['TENANT_ADMIN']}><StaffListPage /></RoleGate> },
      { path: 'admin/tenant/staff/new', element: <RoleGate allow={['TENANT_ADMIN']}><StaffCreatePage /></RoleGate> },
      { path: 'admin/tenant/staff/invite', element: <RoleGate allow={['TENANT_ADMIN']}><StaffInvitePage /></RoleGate> },
      { path: 'admin/tenant/staff/:userId', element: <RoleGate allow={['TENANT_ADMIN']}><StaffDetailPage /></RoleGate> },
      { path: 'admin/tenant/users', element: <RoleGate allow={['TENANT_ADMIN']}><TenantUserListPage /></RoleGate> },
      { path: 'admin/tenant/users/new', element: <RoleGate allow={['TENANT_ADMIN']}><TenantUserCreatePage /></RoleGate> },
      { path: 'admin/tenant/users/:userId', element: <RoleGate allow={['TENANT_ADMIN']}><TenantUserDetailPage /></RoleGate> },
      { path: 'admin/tenant/registration/patients', element: <RoleGate allow={['TENANT_ADMIN']}><PatientRegistrationsPage /></RoleGate> },
      { path: 'admin/tenant/registration/approvals', element: <RoleGate allow={['TENANT_ADMIN']}><PendingApprovalsPage /></RoleGate> },
      { path: 'admin/tenant/registration/staff', element: <RoleGate allow={['TENANT_ADMIN']}><StaffProvisioningPage /></RoleGate> },
      { path: 'admin/tenant/roles', element: <RoleGate allow={['TENANT_ADMIN']}><TenantRoleManagementPage /></RoleGate> },
      { path: 'admin/tenant/settings', element: <RoleGate allow={['TENANT_ADMIN']}><TenantSettingsPage /></RoleGate> },
      { path: 'admin/tenant/audit', element: <RoleGate allow={['TENANT_ADMIN']}><TenantAuditLogPage /></RoleGate> },
      { path: 'admin/audit', element: <RoleGate allow={['SUPER_ADMIN', 'TENANT_ADMIN', 'PRIVACY_OFFICER']}><AuditLogPage /></RoleGate> },
      { path: 'admin/tenants', element: <RoleGate allow={['SUPER_ADMIN']}><SuperAdminTenantListPage /></RoleGate> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
