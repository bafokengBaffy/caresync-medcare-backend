import { Link, useParams } from 'react-router-dom';
import { ArrowLeft, Clock, Loader2, Printer } from 'lucide-react';
import { format, isValid, parseISO } from 'date-fns';
import { useNote } from '@/hooks/use-notes';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { ErrorState } from '@/components/common/ErrorState';

export default function NoteDetailPage() {
  const { id } = useParams<{ id: string }>();
  const { data: note, isLoading, isError, refetch } = useNote(id ?? '');

  if (isLoading) {
    return (
      <div className="flex min-h-[50vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading clinical note" />
      </div>
    );
  }

  if (isError || !note) {
    return (
      <div className="page-container space-y-6">
        <ErrorState message="Unable to load clinical note." onRetry={() => refetch()} />
        <Button asChild variant="outline"><Link to="/notes">Back to notes</Link></Button>
      </div>
    );
  }

  const createdAt = parseISO(note.createdAt);
  const createdLabel = isValid(createdAt) ? format(createdAt, 'MMMM d, yyyy - h:mm a') : 'Unknown date';
  const specialtyLabel = (note.specialty ?? 'GENERAL').replaceAll('_', ' ');
  const noteTypeLabel = (note.noteType ?? 'SOAP_NOTE').replaceAll('_', ' ');

  return (
    <div className="page-container space-y-6">
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="space-y-2">
          <Button asChild variant="ghost" className="-ml-3">
            <Link to="/notes"><ArrowLeft className="mr-2 h-4 w-4" /> Back to notes</Link>
          </Button>
          <div>
            <h1 className="text-2xl font-bold tracking-tight">Clinical note</h1>
            <p className="mt-1 flex items-center gap-2 text-sm text-muted-foreground">
              <Clock className="h-4 w-4" /> Created {createdLabel}
            </p>
          </div>
        </div>
        <div className="flex items-center gap-2 print:hidden">
          <StatusBadge status={note.status} />
          <Button variant="outline" onClick={() => window.print()}>
            <Printer className="mr-2 h-4 w-4" /> Print
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Encounter details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <Detail label="Patient ID" value={note.patientId} />
          <Detail label="Provider ID" value={note.providerId} />
          <Detail label="Appointment ID" value={note.appointmentId ?? 'N/A'} />
          <Detail label="Specialty" value={specialtyLabel} />
          <Detail label="Note type" value={noteTypeLabel} />
          <Detail label="Note ID" value={note.id} />
        </CardContent>
      </Card>

      <div className="grid gap-4">
        <SoapSection title="Subjective" body={note.soapData.subjective} />
        <SoapSection title="Objective" body={note.soapData.objective} />
        <SoapSection title="Assessment" body={note.soapData.assessment} />
        <SoapSection title="Plan" body={note.soapData.plan} />
      </div>
    </div>
  );
}

function Detail({ label, value }: { label: string; value: string }) {
  return (
    <div className="min-w-0">
      <dt className="text-sm font-medium text-muted-foreground">{label}</dt>
      <dd className="mt-1 break-all text-sm">{value}</dd>
    </div>
  );
}

function SoapSection({ title, body }: { title: string; body: string }) {
  return (
    <Card>
      <CardHeader><CardTitle className="text-base">{title}</CardTitle></CardHeader>
      <CardContent>
        <p className="whitespace-pre-wrap break-words text-sm">{body}</p>
      </CardContent>
    </Card>
  );
}
