import { PageHeader } from '@/components/common/PageHeader';
import { AppointmentForm } from '@/components/forms';
import { Card, CardContent } from '@/components/ui/card';
export function AppointmentCreatePage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Schedule Appointment" />
      <Card><CardContent className="pt-6"><AppointmentForm /></CardContent></Card>
    </div>
  );
}
