import api from '@/lib/api-client';
import { normalizePage } from '@/lib/pagination';
import type { ApiResponse, PageResponse } from '@/types/common';

export interface RegistrationRequest {
  id: string;
  email: string;
  firebaseUid: string;
  requestedRole: string;
  requestedTenantId: string | null;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  submittedAt: string;
  reviewedBy: string | null;
  reviewedAt: string | null;
  rejectionReason: string | null;
}

export const adminRegistrationApi = {
  list: async (params: { tenantId: string; status: string; search?: string; page: number; size: number }) => {
    const response = await api.get<ApiResponse<PageResponse<RegistrationRequest>>>('/api/v1/admin/registration/requests', {
      params,
    });
    return normalizePage(response.data.data);
  },
  approve: async (requestId: string, tenantId: string, patientId: string) => (
    await api.post<ApiResponse<RegistrationRequest>>(
      `/api/v1/admin/registration/requests/${encodeURIComponent(requestId)}/approve`,
      { tenantId, patientId },
    )
  ).data.data,
  reject: async (requestId: string, tenantId: string, reason: string) => (
    await api.post<ApiResponse<RegistrationRequest>>(
      `/api/v1/admin/registration/requests/${encodeURIComponent(requestId)}/reject`,
      { reason },
      { params: { tenantId } },
    )
  ).data.data,
};
