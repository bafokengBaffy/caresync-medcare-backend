export const SPECIALTIES = ['DENTAL', 'MENTAL_HEALTH', 'OPTOMETRY', 'NURSING', 'WELLNESS', 'COMMUNITY'] as const;
export type Specialty = typeof SPECIALTIES[number];

export const NOTE_TYPES = ['SOAP_NOTE', 'PROGRESS_NOTE', 'ASSESSMENT', 'DISCHARGE_SUMMARY'] as const;
export type NoteType = typeof NOTE_TYPES[number];

export const APPOINTMENT_STATUSES = ['SCHEDULED', 'CONFIRMED', 'CHECKED_IN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED', 'NO_SHOW'] as const;
export type AppointmentStatus = typeof APPOINTMENT_STATUSES[number];

export const INVOICE_STATUSES = ['DRAFT', 'ISSUED', 'PAID', 'PARTIALLY_PAID', 'OVERDUE', 'VOID'] as const;
export type InvoiceStatus = typeof INVOICE_STATUSES[number];

export const PAYMENT_METHODS = ['CARD', 'BANK_TRANSFER', 'CASH', 'INSURANCE', 'OTHER'] as const;

export const ROLES = ['ADMIN', 'PROVIDER', 'STAFF'] as const;
export type Role = typeof ROLES[number];

export const STORAGE_KEYS = { auth: 'caresync.auth', tenantId: 'caresync.tenant_id' } as const;
