import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { adminUsersApi } from '@/api/admin-users';
import type { AdminUser, ProvisionTenantAdminPayload } from '@/types/admin-user';
import { toast } from 'sonner';

export const tenantAdminKeys = {
  byTenant: (tenantId: string) => ['tenant-admins', tenantId] as const,
};

export function useTenantAdmins(tenantId: string) {
  return useQuery({
    queryKey: tenantAdminKeys.byTenant(tenantId),
    queryFn: () => adminUsersApi.listTenantAdmins(tenantId),
    enabled: Boolean(tenantId),
  });
}

export function useProvisionTenantAdmin(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (payload: Omit<ProvisionTenantAdminPayload, 'tenantId' | 'role'>) =>
      adminUsersApi.provisionTenantAdmin({ ...payload, tenantId, role: 'TENANT_ADMIN' }),
    onSuccess: () => {
      toast.success('Tenant administrator provisioned');
      queryClient.invalidateQueries({ queryKey: tenantAdminKeys.byTenant(tenantId) });
    },
  });
}

export function useUpdateTenantAdminStatus(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { firebaseUid: string; status: Exclude<AdminUser['status'], 'DELETED'> }) =>
      adminUsersApi.updateTenantAdminStatus(tenantId, input.firebaseUid, input.status),
    onSuccess: () => {
      toast.success('Administrator status updated');
      queryClient.invalidateQueries({ queryKey: tenantAdminKeys.byTenant(tenantId) });
    },
  });
}

export function useUpdateTenantAdminRole(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { firebaseUid: string; role: string }) =>
      adminUsersApi.updateTenantAdminRole(tenantId, input.firebaseUid, input.role),
    onSuccess: () => {
      toast.success('Administrator role updated');
      queryClient.invalidateQueries({ queryKey: tenantAdminKeys.byTenant(tenantId) });
    },
  });
}

export function useRemoveTenantAdmin(tenantId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (firebaseUid: string) => adminUsersApi.removeTenantAdmin(tenantId, firebaseUid),
    onSuccess: () => {
      toast.success('Administrator access removed');
      queryClient.invalidateQueries({ queryKey: tenantAdminKeys.byTenant(tenantId) });
    },
  });
}
