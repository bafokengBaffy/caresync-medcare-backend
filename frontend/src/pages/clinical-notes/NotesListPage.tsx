import { useState } from 'react';
import { Link } from 'react-router-dom';
import { AlertTriangle, Clock, Eye, FileSignature, FileText, Loader2, Plus, Search } from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';
import type { ClinicalNoteSummary } from '@/types/clinical-note';
import { useNotes } from '@/hooks/use-notes';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/common/StatusBadge';

const PAGE_SIZE = 10;

export default function NotesListPage() {
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const { data, isLoading, isError, error } = useNotes({ page, size: PAGE_SIZE, search: searchQuery });
  const totalPages = Math.max(1, Math.ceil((data?.total ?? 0) / PAGE_SIZE));

  return (
    <div className="page-container space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
            <FileSignature className="h-6 w-6 text-primary" /> Clinical notes
          </h1>
          <p className="mt-1 text-sm text-muted-foreground">SOAP notes and clinical documentation.</p>
        </div>
        <Button asChild><Link to="/notes/new"><Plus className="mr-2 h-4 w-4" /> New note</Link></Button>
      </div>

      <div className="relative max-w-lg">
        <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground" />
        <input
          type="search"
          placeholder="Search by patient, provider, or note ID..."
          value={searchQuery}
          onChange={(event) => {
            setSearchQuery(event.target.value);
            setPage(0);
          }}
          className="w-full rounded-md border border-input bg-background py-2 pl-9 pr-3 text-sm"
          aria-label="Search clinical notes"
        />
      </div>

      <div className="overflow-hidden rounded-lg border bg-card">
        {isLoading ? (
          <div className="flex justify-center p-12"><Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading notes" /></div>
        ) : isError ? (
          <div className="p-12 text-center">
            <AlertTriangle className="mx-auto mb-4 h-10 w-10 text-destructive" />
            <h2 className="font-semibold">Unable to load clinical notes</h2>
            <p className="mt-1 text-sm text-muted-foreground">{(error as Error)?.message}</p>
          </div>
        ) : !data?.content.length ? (
          <div className="p-12 text-center">
            <FileText className="mx-auto mb-4 h-10 w-10 text-muted-foreground" />
            <h2 className="font-semibold">No clinical notes found</h2>
            <p className="mt-1 text-sm text-muted-foreground">
              {searchQuery ? 'Try a different search.' : 'Create a note for a completed appointment to get started.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-border">
                <thead className="bg-muted/50">
                  <tr>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Patient / note</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Provider</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Created</th>
                    <th scope="col" className="px-6 py-3 text-left text-xs font-medium uppercase text-muted-foreground">Status</th>
                    <th scope="col" className="px-6 py-3 text-right text-xs font-medium uppercase text-muted-foreground">Action</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border">
                  {data.content.map((note) => <NoteRow key={note.id} note={note} />)}
                </tbody>
              </table>
            </div>
            <div className="flex items-center justify-between border-t px-4 py-3">
              <p className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages} ({data.total} notes)
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((current) => Math.max(0, current - 1))} disabled={page === 0}>
                  Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage((current) => Math.min(totalPages - 1, current + 1))} disabled={page >= totalPages - 1}>
                  Next
                </Button>
              </div>
            </div>
          </>
        )}
      </div>
    </div>
  );
}

function NoteRow({ note }: { note: ClinicalNoteSummary }) {
  const createdAt = parseISO(note.createdAt);
  const createdLabel = isValid(createdAt) ? format(createdAt, 'MMM d, yyyy') : 'Unknown date';

  return (
    <tr className="hover:bg-muted/30">
      <td className="px-6 py-4">
        <div className="flex items-center gap-3">
          <FileText className="h-5 w-5 shrink-0 text-primary" />
          <div className="min-w-0">
            <div className="text-sm font-medium">{(note.noteType ?? 'SOAP_NOTE').replaceAll('_', ' ')}</div>
            <div className="mt-0.5 break-all text-xs text-muted-foreground">Patient {note.patientId}</div>
          </div>
        </div>
      </td>
      <td className="px-6 py-4 text-sm">
        <span className="break-all">{note.providerId}</span>
      </td>
      <td className="whitespace-nowrap px-6 py-4 text-sm text-muted-foreground">
        <span className="inline-flex items-center gap-1.5"><Clock className="h-4 w-4" />{createdLabel}</span>
      </td>
      <td className="px-6 py-4"><StatusBadge status={note.status} /></td>
      <td className="px-6 py-4 text-right">
        <Button asChild variant="ghost" size="sm">
          <Link to={`/notes/${encodeURIComponent(note.id)}`} aria-label={`View note ${note.id}`}>
            <Eye className="mr-2 h-4 w-4" /> View
          </Link>
        </Button>
      </td>
    </tr>
  );
}
