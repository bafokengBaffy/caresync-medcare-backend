import { Navigate } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import RegistrationReviewPage from './RegistrationReviewPage';

export default function TenantAdminRegistrationReviewPage({ title }: { title: string }) {
  const user = useAuthStore((state) => state.user);

  if (user?.role !== 'TENANT_ADMIN') {
    return <Navigate to="/not-found" replace />;
  }

  return <RegistrationReviewPage title={title} tenantId={user.tenantId} />;
}
