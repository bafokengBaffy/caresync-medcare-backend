import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/ui/data-table';
import { useAuditLogs } from '@/hooks/use-audit';
import { formatDateTime } from '@/lib/utils';
import type { ColumnDef } from '@tanstack/react-table';
import type { AuditLog } from '@/types/audit';

const columns: ColumnDef<AuditLog, unknown>[] = [
  { accessorKey: 'createdAt', header: 'When', cell: ({ row }) => formatDateTime(row.original.createdAt) },
  { accessorKey: 'action', header: 'Action' },
  { accessorKey: 'resourceType', header: 'Resource' },
  { accessorKey: 'actorUserId', header: 'Actor', cell: ({ row }) => <span className="font-mono text-xs">{row.original.actorUserId?.slice(0, 8) ?? '—'}</span> },
];

export function AuditLogPage() {
  const { data, isLoading } = useAuditLogs();
  return (
    <div className="space-y-4">
      <PageHeader title="Audit Log" description="HIPAA access trail" />
      <DataTable columns={columns} data={data?.content ?? []} isLoading={isLoading} emptyTitle="No audit entries" />
    </div>
  );
}
