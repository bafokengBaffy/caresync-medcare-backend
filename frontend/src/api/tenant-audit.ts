import api from '@/lib/api-client';
import { normalizePage } from '@/lib/pagination';
import type { ApiResponse, PageResponse } from '@/types/common';

export interface TenantAuditLog {
  id: string;
  tenantId: string;
  actorUserId: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId: string;
  requestId: string;
  createdAt: string;
}

export const tenantAuditApi = {
  list: async (tenantId: string, page: number, size: number) => normalizePage((
    await api.get<ApiResponse<PageResponse<TenantAuditLog>>>(
      `/api/v1/tenants/${encodeURIComponent(tenantId)}/audit-logs`,
      { params: { page, size } },
    )
  ).data.data),
};
