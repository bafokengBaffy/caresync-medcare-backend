import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { useAppointment, useUpdateAppointmentStatus } from '@/hooks/use-appointments';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { Button } from '@/components/ui/button';
import { formatDateTime } from '@/lib/utils';

export function AppointmentDetailPage() {
  const { id = '' } = useParams();
  const { data, isLoading } = useAppointment(id);
  const update = useUpdateAppointmentStatus(id);
  if (isLoading || !data) return <LoadingScreen />;
  return (
    <div className="space-y-4">
      <PageHeader title="Appointment" description={formatDateTime(data.scheduledStart)}
        actions={<StatusBadge status={data.status} />} />
      <Card><CardHeader><CardTitle>Details</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><div className="text-xs text-muted-foreground">Patient</div><div className="font-mono text-xs">{data.patientId}</div></div>
            <div><div className="text-xs text-muted-foreground">Provider</div><div className="font-mono text-xs">{data.providerId}</div></div>
            <div><div className="text-xs text-muted-foreground">Start</div><div>{formatDateTime(data.scheduledStart)}</div></div>
            <div><div className="text-xs text-muted-foreground">End</div><div>{formatDateTime(data.scheduledEnd)}</div></div>
            <div><div className="text-xs text-muted-foreground">Type</div><div>{data.appointmentType ?? '—'}</div></div>
            <div><div className="text-xs text-muted-foreground">Reason</div><div>{data.reason ?? '—'}</div></div>
          </div>
          <div className="flex flex-wrap gap-2 border-t pt-3">
            <Button size="sm" onClick={() => update.mutate('CONFIRMED')}>Confirm</Button>
            <Button size="sm" variant="outline" onClick={() => update.mutate('COMPLETED')}>Complete</Button>
            <Button size="sm" variant="destructive" onClick={() => update.mutate('CANCELLED')}>Cancel</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
