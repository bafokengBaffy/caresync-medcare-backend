import { useParams, Link } from 'react-router-dom';
import { Pencil } from 'lucide-react';
import { PageHeader } from '@/components/common/PageHeader';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { usePatient } from '@/hooks/use-patients';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { formatDate } from '@/lib/utils';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';

export function PatientDetailPage() {
  const { id = '' } = useParams();
  const { data, isLoading } = usePatient(id);
  if (isLoading || !data) return <LoadingScreen />;
  return (
    <div className="space-y-4">
      <PageHeader title={`${data.firstName} ${data.lastName}`} description={`DOB ${formatDate(data.dateOfBirth)}`}
        actions={<Button asChild><Link to={`/patients/${data.id}/edit`}><Pencil className="h-4 w-4" />Edit</Link></Button>} />
      <Tabs defaultValue="overview">
        <TabsList><TabsTrigger value="overview">Overview</TabsTrigger><TabsTrigger value="appointments">Appointments</TabsTrigger><TabsTrigger value="notes">Notes</TabsTrigger><TabsTrigger value="invoices">Invoices</TabsTrigger></TabsList>
        <TabsContent value="overview">
          <Card><CardHeader><CardTitle>Demographics</CardTitle></CardHeader>
            <CardContent className="grid gap-4 sm:grid-cols-2">
              <div><div className="text-xs text-muted-foreground">Email</div><div>{data.email ?? '—'}</div></div>
              <div><div className="text-xs text-muted-foreground">Phone</div><div>{data.phone ?? '—'}</div></div>
              <div><div className="text-xs text-muted-foreground">Gender</div><div>{data.gender ?? '—'}</div></div>
              <div><div className="text-xs text-muted-foreground">Address</div><div>{data.address ?? '—'}</div></div>
              <div><div className="text-xs text-muted-foreground">Emergency</div><div>{data.emergencyContactName ?? '—'} {data.emergencyContactPhone ? `· ${data.emergencyContactPhone}` : ''}</div></div>
            </CardContent>
          </Card>
        </TabsContent>
        <TabsContent value="appointments"><Card><CardContent className="pt-6 text-muted-foreground">Appointments list</CardContent></Card></TabsContent>
        <TabsContent value="notes"><Card><CardContent className="pt-6 text-muted-foreground">Notes list</CardContent></Card></TabsContent>
        <TabsContent value="invoices"><Card><CardContent className="pt-6 text-muted-foreground">Invoices list</CardContent></Card></TabsContent>
      </Tabs>
    </div>
  );
}
