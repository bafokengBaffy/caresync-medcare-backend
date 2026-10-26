import type { AppointmentStatus } from '@/lib/constants';

export interface Appointment {
  id: string;
  patientId: string;
  providerId: string;
  scheduledStart: string;
  scheduledEnd: string;
  status: AppointmentStatus;
  appointmentType?: string;
  reason?: string;
  firestoreNoteId?: string;
  createdAt: string;
  updatedAt?: string;
}

export interface AppointmentCreatePayload {
  patientId: string;
  providerId: string;
  scheduledStart: string;
  scheduledEnd: string;
  appointmentType?: string;
  reason?: string;
}

export interface AvailabilitySlot { start: string; end: string; available: boolean; }
export interface AvailabilityQuery { providerId: string; from: string; to: string; }
