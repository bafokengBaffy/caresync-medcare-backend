import { PageHeader } from '@/components/common/PageHeader';
import { PatientForm } from '@/components/forms/PatientForm';
import { Card, CardContent } from '@/components/ui/card';
export function PatientCreatePage() {
  return (
    <div className="space-y-4">
      <PageHeader title="New Patient" description="Enter demographics" />
      <Card><CardContent className="pt-6"><PatientForm /></CardContent></Card>
    </div>
  );
}
