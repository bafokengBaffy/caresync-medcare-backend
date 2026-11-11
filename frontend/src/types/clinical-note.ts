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
  title?: string;
  patientId: string;
  providerId: string;
  appointmentId?: string;
  specialty?: Specialty;
  noteType?: NoteType;
  status: 'DRAFT' | 'SIGNED' | 'AMENDED' | 'LOCKED';
  soapData: SoapData;
  createdAt: string;
  updatedAt?: string;
}

export type ClinicalNoteSummary = Omit<ClinicalNote, 'soapData'>;

export interface ClinicalNoteCreatePayload {
  title?: string;
  patientId: string;
  providerId: string;
  appointmentId?: string;
  specialty?: Specialty;
  noteType?: NoteType;
  soapData: SoapData;
}

export interface ClinicalNoteUpdatePayload {
  title?: string;
  soapData?: SoapData;
  addendum?: string;
}
