export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender?: string;
  email?: string;
  phone?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PatientSummary { id: string; firstName: string; lastName: string; }
export interface PatientCreatePayload {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender?: string;
  email?: string;
  phone?: string;
  address?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
}
export type PatientUpdatePayload = Partial<PatientCreatePayload>;
export interface PatientFilters { q?: string; page?: number; size?: number; }
