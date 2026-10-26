import api from '@/lib/api-client';
import type { AuditLog } from '@/types/audit';
import type { PageResponse } from '@/types/common';

export const auditApi = {
  list: async (params?: Record<string, unknown>) => (await api.get<PageResponse<AuditLog>>('/api/v1/audit', { params })).data,
};
