import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/ui/data-table';
import type { ColumnDef } from '@tanstack/react-table';
import type { Tenant } from '@/types/tenant';
import { useQuery } from '@tanstack/react-query';
import { tenantsApi } from '@/api/tenants';

const columns: ColumnDef<Tenant, unknown>[] = [
  { accessorKey: 'name', header: 'Name' },
  { accessorKey: 'subdomain', header: 'Subdomain' },
  { accessorKey: 'isActive', header: 'Active', cell: ({ row }) => row.original.isActive ? 'Yes' : 'No' },
];

export function TenantAdminPage() {
  const { data, isLoading } = useQuery({ queryKey: ['tenants'], queryFn: () => tenantsApi.list() });
  return (
    <div className="space-y-4">
      <PageHeader title="Tenants" description="Multi-tenant administration" />
      <DataTable columns={columns} data={data?.content ?? []} isLoading={isLoading} emptyTitle="No tenants" />
    </div>
  );
}
