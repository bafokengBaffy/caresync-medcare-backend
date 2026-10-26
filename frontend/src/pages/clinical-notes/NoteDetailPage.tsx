import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { useNote, useSignNote } from '@/hooks/use-notes';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { formatDateTime } from '@/lib/utils';

export function NoteDetailPage() {
  const { id = '' } = useParams();
  const { data, isLoading } = useNote(id);
  const sign = useSignNote(id);
  if (isLoading || !data) return <LoadingScreen />;
  return (
    <div className="space-y-4">
      <PageHeader title="Clinical Note" description={formatDateTime(data.createdAt)} actions={<StatusBadge status={data.status} />} />
      <Card><CardHeader><CardTitle>SOAP Data</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          <div><div className="text-xs font-semibold uppercase text-muted-foreground">Subjective</div><p className="whitespace-pre-wrap">{data.soapData.subjective}</p></div>
          <div><div className="text-xs font-semibold uppercase text-muted-foreground">Objective</div><p className="whitespace-pre-wrap">{data.soapData.objective}</p></div>
          <div><div className="text-xs font-semibold uppercase text-muted-foreground">Assessment</div><p className="whitespace-pre-wrap">{data.soapData.assessment}</p></div>
          <div><div className="text-xs font-semibold uppercase text-muted-foreground">Plan</div><p className="whitespace-pre-wrap">{data.soapData.plan}</p></div>
          {data.status === 'DRAFT' && <Button onClick={() => sign.mutate('signed')}>Sign Note</Button>}
        </CardContent>
      </Card>
    </div>
  );
}
