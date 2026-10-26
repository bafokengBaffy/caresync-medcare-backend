import api from '@/lib/api-client';
import type { Provider, ProviderCreatePayload, ProviderUpdatePayload } from '@/types/provider';
import type { PageResponse } from '@/types/common';

export const providersApi = {
  list: async (params?: Record<string, unknown>) => (await api.get<PageResponse<Provider>>('/api/v1/providers', { params })).data,
  get: async (id: string) => (await api.get<Provider>(`/api/v1/providers/${id}`)).data,
  create: async (payload: ProviderCreatePayload) => (await api.post<Provider>('/api/v1/providers', payload)).data,
  update: async (id: string, payload: ProviderUpdatePayload) => (await api.put<Provider>(`/api/v1/providers/${id}`, payload)).data,
};
