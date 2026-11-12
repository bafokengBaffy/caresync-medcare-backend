import api from '@/lib/api-client';
import { auth } from '@/lib/firebase';
import { normalizePage } from '@/lib/pagination';
import type { ApiResponse } from '@/types/common';
import type {
  AdminUser,
  AdminUserPage,
  FirebaseAccountLookup,
  ProvisionAdminUserPayload,
  ProvisionTenantAdminPayload,
} from '@/types/admin-user';

async function forceRefreshCurrentUserToken(firebaseUid: string) {
  const currentUser = auth?.currentUser;
  if (currentUser?.uid === firebaseUid) {
    await currentUser.getIdToken(true);
  }
}

export const adminUsersApi = {
  listUsers: async (params: {
    page: number;
    size: number;
    search?: string;
    role?: string;
    status?: string;
    tenantId?: string;
  }) => normalizePage((await api.get<ApiResponse<AdminUserPage>>('/api/v1/admin/users', { params })).data.data),
  listTenantUsers: async (tenantId: string, params: { page: number; size: number; search?: string }) => {
    const response = await api.get<ApiResponse<AdminUserPage>>('/api/v1/admin/users', {
      params: { tenantId, ...params, sort: 'createdAt', direction: 'desc' },
    });
    return normalizePage(response.data.data);
  },
  listTenantAdmins: async (tenantId: string) => {
    const response = await api.get<ApiResponse<AdminUserPage>>('/api/v1/admin/users', {
      params: { tenantId, role: 'TENANT_ADMIN', page: 0, size: 100, sort: 'createdAt', direction: 'desc' },
    });
    return normalizePage(response.data.data);
  },
  provisionTenantAdmin: async (payload: ProvisionTenantAdminPayload) =>
    (await api.post<ApiResponse<AdminUser>>('/api/v1/admin/users/provision', payload)).data.data,
  provisionTenantUser: async (payload: ProvisionAdminUserPayload) =>
    (await api.post<ApiResponse<AdminUser>>('/api/v1/admin/users/provision', payload)).data.data,
  lookupFirebaseAccount: async (email: string) => (
    await api.get<ApiResponse<FirebaseAccountLookup>>('/api/v1/admin/users/firebase-account', {
      params: { email },
    })
  ).data.data,
  getTenantUser: async (tenantId: string, firebaseUid: string) =>
    (await api.get<ApiResponse<AdminUser>>(`/api/v1/admin/users/${encodeURIComponent(firebaseUid)}`, {
      params: { tenantId },
    })).data.data,
  getUser: async (firebaseUid: string) =>
    (await api.get<ApiResponse<AdminUser>>(`/api/v1/admin/users/${encodeURIComponent(firebaseUid)}`)).data.data,
  updateTenantAdminStatus: async (
    tenantId: string,
    firebaseUid: string,
    status: Exclude<AdminUser['status'], 'DELETED'>,
  ) =>
    (await api.patch<ApiResponse<AdminUser>>(
      `/api/v1/admin/users/${encodeURIComponent(firebaseUid)}/status`,
      { status },
      { params: { tenantId } },
    )).data.data,
  updateTenantUserStatus: async (tenantId: string, firebaseUid: string, status: Exclude<AdminUser['status'], 'DELETED'>) =>
    (await api.patch<ApiResponse<AdminUser>>(
      `/api/v1/admin/users/${encodeURIComponent(firebaseUid)}/status`,
      { status },
      { params: { tenantId } },
    )).data.data,
  updateUserStatus: async (
    firebaseUid: string,
    status: Exclude<AdminUser['status'], 'DELETED'>,
    tenantId?: string | null,
  ) => (await api.patch<ApiResponse<AdminUser>>(
    `/api/v1/admin/users/${encodeURIComponent(firebaseUid)}/status`,
    { status },
    { params: tenantId ? { tenantId } : undefined },
  )).data.data,
  updateTenantUserRole: async (
    tenantId: string,
    firebaseUid: string,
    role: string,
    permissions: string[],
  ) => {
    const user = (await api.patch<ApiResponse<AdminUser>>(
      `/api/v1/admin/users/${encodeURIComponent(firebaseUid)}/role`,
      { role, tenantId, permissions },
    )).data.data;
    await forceRefreshCurrentUserToken(firebaseUid);
    return user;
  },
  updateUserRole: async (firebaseUid: string, role: string, tenantId: string | null, permissions: string[]) => {
    const user = (await api.patch<ApiResponse<AdminUser>>(
      `/api/v1/admin/users/${encodeURIComponent(firebaseUid)}/role`,
      { role, tenantId, permissions },
    )).data.data;
    await forceRefreshCurrentUserToken(firebaseUid);
    return user;
  },
  removeTenantUser: async (tenantId: string, firebaseUid: string) =>
    api.delete(`/api/v1/admin/users/${encodeURIComponent(firebaseUid)}`, { params: { tenantId } }),
  updateTenantAdminRole: async (tenantId: string, firebaseUid: string, role: string) => {
    const user = await adminUsersApi.getTenantUser(tenantId, firebaseUid);
    const updated = (await api.patch<ApiResponse<AdminUser>>(
      `/api/v1/admin/users/${encodeURIComponent(firebaseUid)}/role`,
      { role, tenantId, permissions: user.permissions },
    )).data.data;
    await forceRefreshCurrentUserToken(firebaseUid);
    return updated;
  },
  removeTenantAdmin: async (tenantId: string, firebaseUid: string) =>
    api.delete(`/api/v1/admin/users/${encodeURIComponent(firebaseUid)}`, { params: { tenantId } }),
};
