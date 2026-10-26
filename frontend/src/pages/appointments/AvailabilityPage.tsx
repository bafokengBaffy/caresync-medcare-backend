import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent } from '@/components/ui/card';
export function AvailabilityPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Provider Availability" description="Weekly recurring schedules" />
      <Card><CardContent className="pt-6 text-muted-foreground">Availability management coming soon.</CardContent></Card>
    </div>
  );
}
