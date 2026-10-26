import { createBrowserRouter, Navigate } from 'react-router-dom';
import { ProtectedRoute } from './components/auth/ProtectedRoute';
import { AppLayout } from './components/layout/AppLayout';
import { AuthLayout } from './components/layout/AuthLayout';
import { DashboardPage } from './pages/dashboard/DashboardPage';
import { PatientsListPage } from './pages/patients/PatientsListPage';
import { PatientCreatePage } from './pages/patients/PatientCreatePage';
import { PatientDetailPage } from './pages/patients/PatientDetailPage';
import { PatientEditPage } from './pages/patients/PatientEditPage';
import { ProvidersListPage } from './pages/providers/ProvidersListPage';
import { ProviderDetailPage } from './pages/providers/ProviderDetailPage';
import { AppointmentsListPage } from './pages/appointments/AppointmentsListPage';
import { AppointmentCreatePage } from './pages/appointments/AppointmentCreatePage';
import { AppointmentDetailPage } from './pages/appointments/AppointmentDetailPage';
import { CalendarPage } from './pages/appointments/CalendarPage';
import { AvailabilityPage } from './pages/appointments/AvailabilityPage';
import { NotesListPage } from './pages/clinical-notes/NotesListPage';
import { NoteCreatePage } from './pages/clinical-notes/NoteCreatePage';
import { NoteDetailPage } from './pages/clinical-notes/NoteDetailPage';
import { InvoicesListPage } from './pages/billing/InvoicesListPage';
import { InvoiceCreatePage } from './pages/billing/InvoiceCreatePage';
import { InvoiceDetailPage } from './pages/billing/InvoiceDetailPage';
import { PaymentsPage } from './pages/billing/PaymentsPage';
import { SettingsPage } from './pages/settings/SettingsPage';
import { ProfilePage } from './pages/settings/ProfilePage';
import { AuditLogPage } from './pages/admin/AuditLogPage';
import { TenantAdminPage } from './pages/admin/TenantAdminPage';
import { LoginPage } from './pages/auth/LoginPage';
import { RegisterPage } from './pages/auth/RegisterPage';
import { ForgotPasswordPage } from './pages/auth/ForgotPasswordPage';
import { ResetPasswordPage } from './pages/auth/ResetPasswordPage';
import { NotFoundPage } from './pages/NotFoundPage';
import { ErrorPage } from './pages/ErrorPage';

export const router = createBrowserRouter([
  {
    path: '/auth',
    element: <AuthLayout />,
    children: [
      { path: 'login', element: <LoginPage /> },
      { path: 'register', element: <RegisterPage /> },
      { path: 'forgot-password', element: <ForgotPasswordPage /> },
      { path: 'reset-password', element: <ResetPasswordPage /> },
    ],
  },
  {
    path: '/',
    element: <ProtectedRoute><AppLayout /></ProtectedRoute>,
    errorElement: <ErrorPage />,
    children: [
      { index: true, element: <Navigate to="/dashboard" replace /> },
      { path: 'dashboard', element: <DashboardPage /> },
      { path: 'patients', element: <PatientsListPage /> },
      { path: 'patients/new', element: <PatientCreatePage /> },
      { path: 'patients/:id', element: <PatientDetailPage /> },
      { path: 'patients/:id/edit', element: <PatientEditPage /> },
      { path: 'providers', element: <ProvidersListPage /> },
      { path: 'providers/:id', element: <ProviderDetailPage /> },
      { path: 'appointments', element: <AppointmentsListPage /> },
      { path: 'appointments/new', element: <AppointmentCreatePage /> },
      { path: 'appointments/:id', element: <AppointmentDetailPage /> },
      { path: 'appointments/calendar', element: <CalendarPage /> },
      { path: 'appointments/availability', element: <AvailabilityPage /> },
      { path: 'notes', element: <NotesListPage /> },
      { path: 'notes/new', element: <NoteCreatePage /> },
      { path: 'notes/:id', element: <NoteDetailPage /> },
      { path: 'invoices', element: <InvoicesListPage /> },
      { path: 'invoices/new', element: <InvoiceCreatePage /> },
      { path: 'invoices/:id', element: <InvoiceDetailPage /> },
      { path: 'payments', element: <PaymentsPage /> },
      { path: 'settings', element: <SettingsPage /> },
      { path: 'settings/profile', element: <ProfilePage /> },
      { path: 'admin/audit', element: <AuditLogPage /> },
      { path: 'admin/tenants', element: <TenantAdminPage /> },
    ],
  },
  { path: '*', element: <NotFoundPage /> },
]);
