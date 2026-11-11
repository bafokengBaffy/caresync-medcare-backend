import api from '@/lib/api-client';
import type { ApiResponse } from '@/types/common';
import type { AdminUser, AdminUserPage, ProvisionTenantAdminPayload } from '@/types/admin-user';

export const adminUsersApi = {
  listTenantAdmins: async (tenantId: string) => {
    const response = await api.get<ApiResponse<AdminUserPage>>('/api/v1/admin/users', {
      params: { tenantId, role: 'TENANT_ADMIN', page: 0, size: 100, sort: 'createdAt', direction: 'desc' },
    });
    return response.data.data;
  },
  provisionTenantAdmin: async (payload: ProvisionTenantAdminPayload) =>
    (await api.post<ApiResponse<AdminUser>>('/api/v1/admin/users/provision', payload)).data.data,
  getTenantUser: async (tenantId: string, firebaseUid: string) =>
    (await api.get<ApiResponse<AdminUser>>(`/api/v1/admin/users/${encodeURIComponent(firebaseUid)}`, {
      params: { tenantId },
    })).data.data,
  updateTenantAdminStatus: async (tenantId: string, firebaseUid: string, status: AdminUser['status']) =>
    (await api.patch<ApiResponse<AdminUser>>(
      `/api/v1/admin/users/${encodeURIComponent(firebaseUid)}/status`,
      { status },
      { params: { tenantId } },
    )).data.data,
  updateTenantAdminRole: async (tenantId: string, firebaseUid: string, role: string) => {
    const user = await adminUsersApi.getTenantUser(tenantId, firebaseUid);
    return (await api.patch<ApiResponse<AdminUser>>(
      `/api/v1/admin/users/${encodeURIComponent(firebaseUid)}/role`,
      { role, tenantId, permissions: user.permissions },
    )).data.data;
  },
  removeTenantAdmin: async (tenantId: string, firebaseUid: string) =>
    api.delete(`/api/v1/admin/users/${encodeURIComponent(firebaseUid)}`, { params: { tenantId } }),
};
