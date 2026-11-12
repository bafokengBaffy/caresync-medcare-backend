import api from '@/lib/api-client';
import { normalizePage } from '@/lib/pagination';
import type { ApiResponse } from '@/types/common';

export interface AdminTenantOption {
  id: string;
  name: string;
  subdomain: string;
  status: string;
}

interface AdminTenantPage {
  content: AdminTenantOption[];
  page?: number;
  number?: number;
  size?: number;
  total?: number;
  totalElements?: number;
  totalPages?: number;
}

export const adminTenantsApi = {
  listForSelection: async () => {
    const data = (await api.get<ApiResponse<AdminTenantPage>>('/api/v1/admin/tenants', {
      params: { page: 0, size: 100 },
    })).data.data;
    return normalizePage(data);
  },
};
