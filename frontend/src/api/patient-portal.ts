import api from '@/lib/api-client';

export interface PatientPortalProfile {
  patientId: string;
  firstName: string;
  lastName: string;
  email: string | null;
  phone: string | null;
  dateOfBirth: string;
  tenantName: string;
}

export interface PatientAppointment {
  id: string;
  scheduledStart: string;
  scheduledEnd: string;
  status: string;
  appointmentType: string | null;
  providerName: string;
  specialty: string | null;
}

export interface PatientInvoice {
  id: string;
  invoiceNumber: string;
  amountCents: number;
  currency: string;
  status: string;
  issuedAt: string | null;
  dueAt: string | null;
  paidAt: string | null;
}

export interface PatientRecord {
  id: string;
  fileName: string;
  contentType: string;
  sizeBytes: number;
  contentPath: string;
  uploadedAt: string;
}

export const patientPortalApi = {
  profile: async () => (await api.get<PatientPortalProfile>('/api/v1/patient/me')).data,
  appointments: async () =>
    (await api.get<PatientAppointment[]>('/api/v1/patient/me/appointments')).data,
  invoices: async () => (await api.get<PatientInvoice[]>('/api/v1/patient/me/invoices')).data,
  records: async () => (await api.get<PatientRecord[]>('/api/v1/patient/me/records')).data,
  downloadRecord: async (contentPath: string) =>
    (await api.get<Blob>(contentPath, { responseType: 'blob' })).data,
};
