export interface Patient {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  mrn?: string;
  gender?: string;
  email?: string;
  phone?: string;
  phoneNumber?: string;
  address?: string;
  addressLine1?: string;
  city?: string;
  postalCode?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface PatientSummary {
  id: string;
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  email?: string;
  phone?: string;
}
export interface PatientCreatePayload {
  firstName: string;
  lastName: string;
  dateOfBirth: string;
  gender?: string;
  email?: string;
  phone?: string;
  phoneNumber?: string;
  address?: string;
  addressLine1?: string;
  city?: string;
  postalCode?: string;
  emergencyContactName?: string;
  emergencyContactPhone?: string;
  emergencyContactRelation?: string;
}
export type PatientUpdatePayload = Partial<PatientCreatePayload>;
export interface PatientFilters { q?: string; search?: string; page?: number; size?: number; }
