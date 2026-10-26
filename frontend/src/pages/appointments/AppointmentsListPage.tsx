import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useAppointments } from '@/hooks/use-appointments';
import { formatDateTime } from '@/lib/utils';
import type { ColumnDef } from '@tanstack/react-table';
import type { Appointment } from '@/types/appointment';

const columns: ColumnDef<Appointment, unknown>[] = [
  { accessorKey: 'scheduledStart', header: 'When', cell: ({ row }) => formatDateTime(row.original.scheduledStart) },
  { accessorKey: 'patientId', header: 'Patient', cell: ({ row }) => <span className="font-mono text-xs">{row.original.patientId.slice(0, 8)}</span> },
  { accessorKey: 'providerId', header: 'Provider', cell: ({ row }) => <span className="font-mono text-xs">{row.original.providerId.slice(0, 8)}</span> },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  { id: 'actions', header: '', cell: ({ row }) => <Link to={`/appointments/${row.original.id}`} className="text-primary text-sm hover:underline">View</Link> },
];

export function AppointmentsListPage() {
  const { data, isLoading } = useAppointments();
  return (
    <div className="space-y-4">
      <PageHeader title="Appointments" description="Schedule and manage encounters" actions={
        <div className="flex gap-2">
          <Button asChild variant="outline"><Link to="/appointments/calendar">Calendar</Link></Button>
          <Button asChild><Link to="/appointments/new"><Plus className="h-4 w-4" />New</Link></Button>
        </div>
      } />
      <DataTable columns={columns} data={data?.content ?? []} isLoading={isLoading} emptyTitle="No appointments" />
    </div>
  );
}
