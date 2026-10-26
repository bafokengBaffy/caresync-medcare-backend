import api from '@/lib/api-client';
import type { Payment, PaymentCreatePayload } from '@/types/payment';
import type { PageResponse } from '@/types/common';

export const paymentsApi = {
  list: async (params?: Record<string, unknown>) => (await api.get<PageResponse<Payment>>('/api/v1/payments', { params })).data,
  create: async (payload: PaymentCreatePayload) => (await api.post<Payment>('/api/v1/payments', payload)).data,
};
