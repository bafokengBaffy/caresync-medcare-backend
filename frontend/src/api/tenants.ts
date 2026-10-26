import api from '@/lib/api-client';
import type { Tenant } from '@/types/tenant';
import type { PageResponse } from '@/types/common';

export const tenantsApi = {
  list: async () => (await api.get<PageResponse<Tenant>>('/api/v1/tenants')).data,
  get: async (id: string) => (await api.get<Tenant>(`/api/v1/tenants/${id}`)).data,
  create: async (payload: { name: string; subdomain: string }) => (await api.post<Tenant>('/api/v1/tenants', payload)).data,
};
