import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
import { useAppointments } from '@/hooks/use-appointments';
import { formatDateTime } from '@/lib/utils';
export function CalendarPage() {
  const { data } = useAppointments({ size: 100 });
  return (
    <div className="space-y-4">
      <PageHeader title="Calendar" description="Upcoming appointments" />
      <Card><CardContent className="space-y-2 pt-6">
        {(data?.content ?? []).map((a) => (
          <div key={a.id} className="flex items-center justify-between rounded border p-3">
            <div><div className="font-medium">{formatDateTime(a.scheduledStart)}</div><div className="text-xs text-muted-foreground">{a.status}</div></div>
            <span className="text-xs font-mono">{a.id.slice(0, 8)}</span>
          </div>
        ))}
      </CardContent></Card>
    </div>
  );
}
