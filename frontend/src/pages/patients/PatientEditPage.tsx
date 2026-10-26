import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { PatientForm } from '@/components/forms/PatientForm';
import { Card, CardContent } from '@/components/ui/card';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { usePatient } from '@/hooks/use-patients';
export function PatientEditPage() {
  const { id = '' } = useParams();
  const { data, isLoading } = usePatient(id);
  if (isLoading || !data) return <LoadingScreen />;
  return (
    <div className="space-y-4">
      <PageHeader title="Edit Patient" description={`${data.firstName} ${data.lastName}`} />
      <Card><CardContent className="pt-6"><PatientForm initial={data} /></CardContent></Card>
    </div>
  );
}
