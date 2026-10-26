import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/ui/data-table';
import { useProviders } from '@/hooks/use-providers';
import { Badge } from '@/components/ui/badge';
import type { ColumnDef } from '@tanstack/react-table';
import type { Provider } from '@/types/provider';

const columns: ColumnDef<Provider, unknown>[] = [
  { accessorKey: 'firstName', header: 'First' },
  { accessorKey: 'lastName', header: 'Last' },
  { accessorKey: 'specialty', header: 'Specialty', cell: ({ row }) => <Badge variant="secondary">{row.original.specialty}</Badge> },
  { accessorKey: 'isActive', header: 'Active', cell: ({ row }) => row.original.isActive ? 'Yes' : 'No' },
  { id: 'actions', header: '', cell: ({ row }) => <Link to={`/providers/${row.original.id}`} className="text-primary text-sm hover:underline">View</Link> },
];

export function ProvidersListPage() {
  const { data, isLoading } = useProviders();
  return (
    <div className="space-y-4">
      <PageHeader title="Providers" description="Clinical staff" />
      <DataTable columns={columns} data={data?.content ?? []} isLoading={isLoading} emptyTitle="No providers" />
    </div>
  );
}
