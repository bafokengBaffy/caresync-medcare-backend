export interface Payment {
  id: string;
  invoiceId: string;
  amountCents: number;
  currency: string;
  method: 'CARD' | 'BANK_TRANSFER' | 'CASH' | 'INSURANCE' | 'OTHER';
  status: 'PENDING' | 'COMPLETED' | 'FAILED' | 'REFUNDED';
  externalRef?: string;
  paidAt?: string;
  createdAt: string;
}

export interface PaymentCreatePayload {
  invoiceId: string;
  amountCents: number;
  method: Payment['method'];
}
