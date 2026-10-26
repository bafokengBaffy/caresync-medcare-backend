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
  appointmentId?: string;
  invoiceNumber: string;
  amountCents: number;
  currency: string;
  status: InvoiceStatus;
  issuedAt?: string;
  dueAt?: string;
  paidAt?: string;
  createdAt: string;
  updatedAt?: string;
  lineItems?: InvoiceLineItem[];
}

export interface InvoiceCreatePayload {
  patientId: string;
  appointmentId?: string;
  items: Omit<InvoiceLineItem, 'id' | 'totalCents'>[];
}
