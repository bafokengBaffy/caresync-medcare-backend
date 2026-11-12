import { useQuery, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import { adminTenantsApi } from '@/api/admin-tenants';
import { useAuthStore } from '@/stores/auth-store';
import { useTenantContextStore } from '@/stores/tenant-context-store';

export function TenantContextSelector() {
  const user = useAuthStore((state) => state.user);
  const selectedTenantId = useTenantContextStore((state) => state.selectedTenantId);
  const selectedForUid = useTenantContextStore((state) => state.selectedForUid);
  const selectTenant = useTenantContextStore((state) => state.selectTenant);
  const clearTenant = useTenantContextStore((state) => state.clearTenant);
  const queryClient = useQueryClient();
  const navigate = useNavigate();
  const { data: tenants, isLoading, isError } = useQuery({
    queryKey: ['admin-tenants', 'tenant-context-options'],
    queryFn: adminTenantsApi.listForSelection,
    enabled: user?.role === 'SUPER_ADMIN',
    staleTime: 60_000,
  });

  if (user?.role !== 'SUPER_ADMIN') return null;

  const activeTenantId = selectedForUid === user.uid ? selectedTenantId ?? '' : '';

  const changeTenant = (tenantId: string) => {
    if (!tenantId) {
      clearTenant();
      queryClient.clear();
      navigate('/admin/super/tenants');
      return;
    }

    const tenant = tenants?.content.find((option) => option.id === tenantId);
    if (!tenant) return;

    selectTenant(tenant.id, tenant.name, user.uid);
    queryClient.clear();
    navigate('/admin/super/health');
  };

  return (
    <div className="mr-auto flex items-center gap-2">
      <label htmlFor="tenant-context" className="text-sm font-medium text-muted-foreground">
        Tenant workspace
      </label>
      <select
        id="tenant-context"
        value={activeTenantId}
        onChange={(event) => changeTenant(event.target.value)}
        disabled={isLoading || isError}
        aria-describedby={isError ? 'tenant-context-error' : undefined}
        className="h-9 max-w-64 rounded-md border border-input bg-background px-2 text-sm text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
      >
        <option value="">
          {isLoading ? 'Loading tenants…' : isError ? 'Tenant list unavailable' : 'Select a tenant'}
        </option>
        {tenants?.content.map((tenant) => (
          <option key={tenant.id} value={tenant.id}>
            {tenant.name} ({tenant.subdomain}) — {tenant.status}
          </option>
        ))}
      </select>
      {isError && (
        <span id="tenant-context-error" role="alert" className="text-xs text-destructive">
          Could not load tenant workspaces.
        </span>
      )}
    </div>
  );
}
