import { useState } from 'react';
import { format, isValid, parseISO } from 'date-fns';
import { Download, FileText, Loader2 } from 'lucide-react';
import { toast } from 'sonner';
import { patientPortalApi } from '@/api/patient-portal';
import { Button } from '@/components/ui/button';
import { PortalSection } from './PortalSection';
import { usePatientPortal } from '@/hooks/use-patient-portal';

export default function MyRecordsPage() {
  const { records } = usePatientPortal();
  const [downloading, setDownloading] = useState<string | null>(null);

  const download = async (id: string, fileName: string, path: string) => {
    setDownloading(id);
    try {
      const blob = await patientPortalApi.downloadRecord(path);
      const url = URL.createObjectURL(blob);
      const anchor = document.createElement('a');
      anchor.href = url;
      anchor.download = fileName;
      document.body.append(anchor);
      anchor.click();
      anchor.remove();
      URL.revokeObjectURL(url);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'The record could not be downloaded.');
    } finally {
      setDownloading(null);
    }
  };

  return (
    <PortalSection
      title="My records"
      description="Documents linked to your patient record. Only your own records are shown."
      pending={records.isPending}
      error={records.error}
      retry={() => void records.refetch()}
    >
      <div className="divide-y divide-border overflow-hidden rounded-lg border bg-card">
        {(records.data ?? []).map((record) => {
          const date = parseISO(record.uploadedAt);
          return (
            <article key={record.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex min-w-0 items-center gap-3">
                <FileText className="h-5 w-5 shrink-0 text-primary" />
                <div className="min-w-0">
                  <h2 className="truncate font-medium">{record.fileName}</h2>
                  <p className="text-xs text-muted-foreground">
                    {record.contentType} · {(record.sizeBytes / 1024).toFixed(0)} KB
                    {isValid(date) ? ` · ${format(date, 'PP')}` : ''}
                  </p>
                </div>
              </div>
              <Button
                type="button"
                variant="outline"
                size="sm"
                disabled={downloading !== null}
                onClick={() => void download(record.id, record.fileName, record.contentPath)}
              >
                {downloading === record.id
                  ? <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  : <Download className="mr-2 h-4 w-4" />}
                Download
              </Button>
            </article>
          );
        })}
        {(records.data?.length ?? 0) === 0 && (
          <p className="p-8 text-center text-sm text-muted-foreground">No documents are available for your account.</p>
        )}
      </div>
    </PortalSection>
  );
}
