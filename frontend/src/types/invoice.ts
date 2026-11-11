import type { InvoiceStatus } from '@/lib/constants';

export interface InvoiceLineItem {
  id?: string;
  cptCode: string;
  description: string;
  quantity: number;
  unitPriceCents: number;
  totalCents?: number;
}

export interface Invoice {
  id: string;
  patientId: string;
  patientName?: string;
  appointmentId?: string;
  invoiceNumber: string;
  amountCents: number;
  totalAmount?: number;
  currency: string;
  status: InvoiceStatus;
  issuedAt?: string;
  dueAt?: string;
  dueDate?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt?: string;
  lineItems?: InvoiceLineItem[];
  items?: InvoiceLineItem[];
  taxAmount?: number;
  notes?: string;
  taxRate?: number;
}

export interface InvoiceCreatePayload {
  patientId: string;
  appointmentId?: string;
  items: Omit<InvoiceLineItem, 'id' | 'totalCents'>[];
}

export type InvoiceUpdatePayload = Partial<InvoiceCreatePayload> & {
  status?: InvoiceStatus;
  notes?: string;
  dueAt?: string;
};
