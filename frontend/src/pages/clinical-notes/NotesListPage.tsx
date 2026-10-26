import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { DataTable } from '@/components/ui/data-table';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useNotes } from '@/hooks/use-notes';
import { formatDateTime } from '@/lib/utils';
import type { ColumnDef } from '@tanstack/react-table';
import type { ClinicalNote } from '@/types/clinical-note';

const columns: ColumnDef<ClinicalNote, unknown>[] = [
  { accessorKey: 'specialty', header: 'Specialty' },
  { accessorKey: 'noteType', header: 'Type' },
  { accessorKey: 'status', header: 'Status', cell: ({ row }) => <StatusBadge status={row.original.status} /> },
  { accessorKey: 'createdAt', header: 'Created', cell: ({ row }) => formatDateTime(row.original.createdAt) },
  { id: 'actions', header: '', cell: ({ row }) => <Link to={`/notes/${row.original.id}`} className="text-primary text-sm hover:underline">View</Link> },
];

export function NotesListPage() {
  const { data, isLoading } = useNotes();
  return (
    <div className="space-y-4">
      <PageHeader title="Clinical Notes" actions={<Button asChild><Link to="/notes/new"><Plus className="h-4 w-4" />New Note</Link></Button>} />
      <DataTable columns={columns} data={data?.content ?? []} isLoading={isLoading} emptyTitle="No notes" />
    </div>
  );
}
