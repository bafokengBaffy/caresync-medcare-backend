import { Navigate, useLocation } from 'react-router-dom';
import { useAuth } from '@/hooks/use-auth';
import { Spinner } from '@/components/ui/spinner';

export function ProtectedRoute({ children }: { children: React.ReactNode }) {
  const { isAuthenticated, loading, pendingApproval } = useAuth();
  const loc = useLocation();
  if (loading) return <div className="flex min-h-screen items-center justify-center"><Spinner /></div>;
  if (pendingApproval) return <Navigate to="/auth/pending-approval" replace />;
  if (!isAuthenticated) return <Navigate to="/auth/login" state={{ from: loc }} replace />;
  return <>{children}</>;
}
