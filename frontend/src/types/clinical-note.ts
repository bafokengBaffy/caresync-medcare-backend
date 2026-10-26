import type { NoteType, Specialty } from '@/lib/constants';

export interface SoapData {
  subjective: string;
  objective: string;
  assessment: string;
  plan: string;
}

export interface Vitals {
  bloodPressure?: string;
  heartRate?: number;
  temperatureF?: number;
  weightKg?: number;
  heightCm?: number;
}

export interface Attachment {
  name: string;
  url: string;
  mimeType: string;
  sizeBytes: number;
}

export interface ClinicalNote {
  id: string;
  tenantId: string;
  patientId: string;
  providerId: string;
  appointmentId: string;
  specialty: Specialty;
  noteType: NoteType;
  status: 'DRAFT' | 'SIGNED' | 'AMENDED' | 'LOCKED';
  soapData: SoapData;
  vitals?: Vitals;
  attachments?: Attachment[];
  tags?: string[];
  version: number;
  createdAt: string;
  updatedAt?: string;
  signedAt?: string;
}

export interface ClinicalNoteCreatePayload {
  patientId: string;
  providerId: string;
  appointmentId: string;
  specialty: Specialty;
  noteType: NoteType;
  soapData: SoapData;
}
