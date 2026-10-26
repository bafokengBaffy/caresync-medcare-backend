import api from '@/lib/api-client';
import type { Invoice, InvoiceCreatePayload } from '@/types/invoice';
import type { PageResponse } from '@/types/common';

export const invoicesApi = {
  list: async (params?: Record<string, unknown>) => (await api.get<PageResponse<Invoice>>('/api/v1/invoices', { params })).data,
  get: async (id: string) => (await api.get<Invoice>(`/api/v1/invoices/${id}`)).data,
  create: async (payload: InvoiceCreatePayload) => (await api.post<Invoice>('/api/v1/invoices', payload)).data,
  changeStatus: async (id: string, status: string) => (await api.patch<Invoice>(`/api/v1/invoices/${id}/status`, { status })).data,
};
