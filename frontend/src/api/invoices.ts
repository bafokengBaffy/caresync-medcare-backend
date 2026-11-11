import api from '@/lib/api-client';
import type { Invoice, InvoiceCreatePayload, InvoiceUpdatePayload } from '@/types/invoice';
import type { PageResponse } from '@/types/common';

export const invoicesApi = {
  list: async (params?: Record<string, unknown>) => (await api.get<PageResponse<Invoice>>('/api/v1/invoices', { params })).data,
  get: async (id: string) => (await api.get<Invoice>(`/api/v1/invoices/${id}`)).data,
  create: async (payload: InvoiceCreatePayload) => (await api.post<Invoice>('/api/v1/invoices', payload)).data,
  update: async (id: string, payload: InvoiceUpdatePayload) => (await api.put<Invoice>(`/api/v1/invoices/${id}`, payload)).data,
  remove: async (id: string) => (await api.delete<Invoice>(`/api/v1/invoices/${id}`)).data,
  changeStatus: async (id: string, status: string) => (await api.patch<Invoice>(`/api/v1/invoices/${id}/status`, { status })).data,
  recordPayment: async (id: string, payload: Record<string, unknown>) => (await api.post<Invoice>(`/api/v1/invoices/${id}/payments`, payload)).data,
};
