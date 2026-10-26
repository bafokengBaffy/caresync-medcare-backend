import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useProvider } from '@/hooks/use-providers';
import { LoadingScreen } from '@/components/common/LoadingScreen';
export function ProviderDetailPage() {
  const { id = '' } = useParams();
  const { data, isLoading } = useProvider(id);
  if (isLoading || !data) return <LoadingScreen />;
  return (
    <div className="space-y-4">
      <PageHeader title={`${data.firstName} ${data.lastName}`} description={data.specialty} />
      <Card><CardHeader><CardTitle>Profile</CardTitle></CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div><div className="text-xs text-muted-foreground">Specialty</div><div><Badge variant="secondary">{data.specialty}</Badge></div></div>
          <div><div className="text-xs text-muted-foreground">License</div><div>{data.licenseNumber ?? '—'}</div></div>
          <div><div className="text-xs text-muted-foreground">User ID</div><div className="font-mono text-xs">{data.userId}</div></div>
          <div><div className="text-xs text-muted-foreground">Active</div><div>{data.isActive ? 'Yes' : 'No'}</div></div>
        </CardContent>
      </Card>
    </div>
  );
}
