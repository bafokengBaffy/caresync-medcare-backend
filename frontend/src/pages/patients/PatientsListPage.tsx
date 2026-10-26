import { Link } from 'react-router-dom';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { PageHeader } from '@/components/common/PageHeader';
import { SearchInput } from '@/components/common/SearchInput';
import { DataTable } from '@/components/ui/data-table';
import { Pagination } from '@/components/common/Pagination';
import { usePatients } from '@/hooks/use-patients';
import { useState } from 'react';
import { formatDate } from '@/lib/utils';
import { useDebounce } from '@/hooks/use-debounce';
import type { ColumnDef } from '@tanstack/react-table';
import type { Patient } from '@/types/patient';

const columns: ColumnDef<Patient, unknown>[] = [
  { accessorKey: 'firstName', header: 'First Name' },
  { accessorKey: 'lastName', header: 'Last Name' },
  { accessorKey: 'dateOfBirth', header: 'DOB', cell: ({ row }) => formatDate(row.original.dateOfBirth) },
  { accessorKey: 'email', header: 'Email' },
  { accessorKey: 'phone', header: 'Phone' },
  { id: 'actions', header: '', cell: ({ row }) => <Link to={`/patients/${row.original.id}`} className="text-primary text-sm hover:underline">View</Link> },
];

export function PatientsListPage() {
  const [q, setQ] = useState(''); const [page, setPage] = useState(1); const size = 20;
  const debounced = useDebounce(q);
  const { data, isLoading } = usePatients({ q: debounced, page, size });
  return (
    <div className="space-y-4">
      <PageHeader title="Patients" description={`${data?.total ?? 0} patients`} actions={<Button asChild><Link to="/patients/new"><Plus className="h-4 w-4" />New Patient</Link></Button>} />
      <div className="max-w-md"><SearchInput value={q} onChange={setQ} placeholder="Search by name or email…" /></div>
      <DataTable columns={columns} data={data?.content ?? []} isLoading={isLoading} emptyTitle="No patients yet" emptyDescription="Create your first patient." />
      <Pagination page={page} size={size} total={data?.total ?? 0} onChange={setPage} />
    </div>
  );
}
