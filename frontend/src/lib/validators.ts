import { z } from 'zod';
import { SPECIALTIES, NOTE_TYPES } from './constants';

export const patientSchema = z.object({
  firstName: z.string().min(1).max(100),
  lastName: z.string().min(1).max(100),
  dateOfBirth: z.string().min(1),
  gender: z.enum(['MALE', 'FEMALE', 'OTHER', 'UNKNOWN']).optional(),
  email: z.string().email().optional().or(z.literal('')),
  phone: z.string().max(20).optional().or(z.literal('')),
  address: z.string().optional().or(z.literal('')),
  emergencyContactName: z.string().optional().or(z.literal('')),
  emergencyContactPhone: z.string().optional().or(z.literal('')),
});
export type PatientFormValues = z.infer<typeof patientSchema>;

export const providerSchema = z.object({
  userId: z.string().min(1),
  firstName: z.string().min(1),
  lastName: z.string().min(1),
  specialty: z.enum(SPECIALTIES),
  licenseNumber: z.string().optional().or(z.literal('')),
});
export type ProviderFormValues = z.infer<typeof providerSchema>;

export const appointmentSchema = z.object({
  patientId: z.string().uuid(),
  providerId: z.string().uuid(),
  scheduledStart: z.string(),
  scheduledEnd: z.string(),
  appointmentType: z.string().optional(),
  reason: z.string().optional(),
});
export type AppointmentFormValues = z.infer<typeof appointmentSchema>;

export const noteSchema = z.object({
  patientId: z.string().uuid(),
  providerId: z.string().uuid(),
  appointmentId: z.string().uuid(),
  specialty: z.enum(SPECIALTIES),
  noteType: z.enum(NOTE_TYPES),
  soapData: z.object({
    subjective: z.string().min(1),
    objective: z.string().min(1),
    assessment: z.string().min(1),
    plan: z.string().min(1),
  }),
});
export type NoteFormValues = z.infer<typeof noteSchema>;

export const invoiceSchema = z.object({
  patientId: z.string().uuid(),
  appointmentId: z.string().uuid().optional().or(z.literal('')),
  items: z.array(z.object({
    cptCode: z.string().min(1),
    description: z.string().min(1),
    quantity: z.coerce.number().int().positive(),
    unitPriceCents: z.coerce.number().int().nonnegative(),
  })).min(1),
});
export type InvoiceFormValues = z.infer<typeof invoiceSchema>;

export const loginSchema = z.object({
  email: z.string().email(),
  password: z.string().min(8),
});
export type LoginFormValues = z.infer<typeof loginSchema>;
