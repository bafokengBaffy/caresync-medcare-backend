import type { Specialty } from '@/lib/constants';

export interface Provider {
  id: string;
  userId: string;
  firstName: string;
  lastName: string;
  specialty: Specialty;
  licenseNumber?: string;
  isActive: boolean;
  createdAt: string;
}

export interface ProviderSummary { id: string; firstName: string; lastName: string; specialty: Specialty; }
export interface ProviderCreatePayload {
  userId: string;
  firstName: string;
  lastName: string;
  specialty: Specialty;
  licenseNumber?: string;
}
export type ProviderUpdatePayload = Partial<ProviderCreatePayload>;
