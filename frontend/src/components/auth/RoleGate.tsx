import type { Role } from '@/lib/constants';
import { useAuthStore } from '@/stores/auth-store';

export function RoleGate({ allow, children, fallback = null }: { allow: Role[]; children: React.ReactNode; fallback?: React.ReactNode }) {
  const role = useAuthStore((s) => s.user?.role);
  if (!role || !allow.includes(role)) return <>{fallback}</>;
  return <>{children}</>;
}
