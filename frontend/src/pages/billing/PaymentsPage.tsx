import { PageHeader } from '@/components/common/PageHeader';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/common/StatusBadge';
import { usePayments } from '@/hooks/use-payments';
import { formatMoney, formatDate } from '@/lib/utils';
import type { ColumnDef } from '@tanstack/react-table';
import type { Payment } from '@/types/payment';

const columns: ColumnDef<Payment, unknown>[] = [
  { accessorKey: 'amountCents', header: 'Amount', cell: ({ row }) => formatMoney(row.original.amountCents) },
  { accessorKey: 'method', header: 'Method' },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  { accessorKey: 'createdAt', header: 'Date', cell: ({ row }) => formatDate(row.original.createdAt) },
];

export function PaymentsPage() {
  const { data, isLoading } = usePayments();
  return (
    <div className="space-y-4">
      <PageHeader title="Payments" />
      <DataTable columns={columns} data={data?.content ?? []} isLoading={isLoading} emptyTitle="No payments" />
    </div>
  );
}
