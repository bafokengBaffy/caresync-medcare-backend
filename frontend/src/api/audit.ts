import api from '@/lib/api-client';
import type { AuditLog } from '@/types/audit';
import type { PageResponse } from '@/types/common';
import { normalizePage } from '@/lib/pagination';

export const auditApi = {
  list: async (params?: Record<string, unknown>) => normalizePage(
    (await api.get<PageResponse<AuditLog>>('/api/v1/audit', { params })).data,
  ),
};
