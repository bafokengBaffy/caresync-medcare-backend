import { Navigate, useLocation } from 'react-router-dom';
import type { Role } from '@/lib/constants';
import { useAuthStore } from '@/stores/auth-store';
import { useTenantContextStore } from '@/stores/tenant-context-store';

export function RoleGate({
  allow,
  children,
  fallback,
  requiresTenant = false,
}: {
  allow: Role[];
  children: React.ReactNode;
  fallback?: React.ReactNode;
  requiresTenant?: boolean;
}) {
  const user = useAuthStore((s) => s.user);
  const role = user?.role;
  const location = useLocation();
  const selectedTenantId = useTenantContextStore((s) => s.selectedTenantId);
  const selectedForUid = useTenantContextStore((s) => s.selectedForUid);
  const tenantScopedPath = [
    '/dashboard',
    '/patients',
    '/providers',
    '/appointments',
    '/notes',
    '/clinical',
    '/invoices',
    '/billing',
    '/payments',
    '/admin/health',
    '/admin/super/health',
    '/admin/super/audit',
    '/admin/super/activity',
    '/admin/super/revenue',
  ].some((path) => location.pathname === path || location.pathname.startsWith(`${path}/`));
  if (!role || !allow.includes(role)) {
    return <>{fallback ?? <Navigate to="/not-found" replace />}</>;
  }
  if (
    (requiresTenant || tenantScopedPath)
    && role === 'SUPER_ADMIN'
    && (!selectedTenantId || selectedForUid !== user.uid)
  ) {
    return <Navigate to="/admin/super/tenants" replace />;
  }
  return <>{children}</>;
}
