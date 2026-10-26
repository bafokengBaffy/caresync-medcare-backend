import type { Role, Specialty } from '@/lib/constants';

export interface AuthUser {
  uid: string;
  email: string | null;
  displayName: string | null;
  role: Role;
  tenantId: string;
  specialty?: Specialty;
}

export interface LoginCredentials { email: string; password: string; }
export interface RegisterData extends LoginCredentials { displayName: string; }
