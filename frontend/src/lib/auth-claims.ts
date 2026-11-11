import { ROLES, SPECIALTIES, type Role, type Specialty } from '@/lib/constants';

const TENANT_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;

export interface AuthClaims {
  role: Role;
  tenantId?: string;
  specialty?: Specialty;
}

export function readAuthClaims(claims: Record<string, unknown>): AuthClaims | null {
  const role = claims.role;
  const tenantId = claims.tenant_id;
  if (typeof role !== 'string' || !ROLES.includes(role as Role)) return null;

  const isSuperAdmin = role === 'SUPER_ADMIN';
  if (!isSuperAdmin && (typeof tenantId !== 'string' || !TENANT_ID_PATTERN.test(tenantId))) return null;
  if (typeof tenantId === 'string' && !TENANT_ID_PATTERN.test(tenantId)) return null;

  const specialty = claims.specialty;
  return {
    role: role as Role,
    tenantId: typeof tenantId === 'string' ? tenantId : undefined,
    specialty: typeof specialty === 'string' && SPECIALTIES.includes(specialty as Specialty)
      ? specialty as Specialty
      : undefined,
  };
}
