export interface Payment {
  id: string;
  invoiceId: string;
  amountCents: number;
  currency: string;
  method: 'CARD' | 'BANK_TRANSFER' | 'CASH' | 'MOBILE_MONEY' | 'OTHER';
  status: 'RECORDED' | 'REFUNDED';
  externalRef?: string;
  paidAt?: string;
}

export interface PaymentCreatePayload {
  invoiceId: string;
  amountCents: number;
  method: Payment['method'];
  externalReference?: string;
}
