import type { Specialty } from '@/lib/constants';

export interface Provider {
  id: string;
  userId?: string;
  firstName: string;
  lastName: string;
  specialty?: Specialty;
  email?: string;
  phoneNumber?: string;
  licenseNumber?: string;
  npi?: string;
  yearsOfExperience?: number | string;
  bio?: string;
  isActive?: boolean;
  active?: boolean;
  createdAt: string;
}

export interface ProviderSummary {
  id: string;
  firstName: string;
  lastName: string;
  specialty?: Specialty;
  email?: string;
  phoneNumber?: string;
  npi?: string;
  active: boolean;
}
export interface ProviderCreatePayload {
  userId: string;
  firstName: string;
  lastName: string;
  specialty: Specialty;
  email?: string;
  phoneNumber?: string;
  licenseNumber?: string;
  npi?: string;
  yearsOfExperience?: number | string;
  bio?: string;
}
export type ProviderUpdatePayload = Partial<ProviderCreatePayload>;
