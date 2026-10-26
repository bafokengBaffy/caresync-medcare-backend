import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useInvoices } from '@/hooks/use-invoices';
import { formatMoney, formatDate } from '@/lib/utils';
import type { ColumnDef } from '@tanstack/react-table';
import type { Invoice } from '@/types/invoice';

const columns: ColumnDef<Invoice, unknown>[] = [
  { accessorKey: 'invoiceNumber', header: 'Number' },
  { accessorKey: 'amountCents', header: 'Amount', cell: ({ row }) => formatMoney(row.original.amountCents) },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => formatDate(row.original.createdAt) },
  { id: 'actions', header: '', cell: ({ row }) => <Link to={`/invoices/${row.original.id}`} className="text-primary text-sm hover:underline">View</Link> },
];

export function InvoicesListPage() {
  const { data, isLoading } = useInvoices();
  return (
    <div className="space-y-4">
      <PageHeader title="Invoices" actions={<Button asChild><Link to="/invoices/new"><Plus className="h-4 w-4" />New Invoice</Link></Button>} />
      <DataTable columns={columns} data={data?.content ?? []} isLoading={isLoading} emptyTitle="No invoices" />
    </div>
  );
}
