import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormField } from '@/components/forms';
import { useAuth } from '@/hooks/use-auth';
export function ProfilePage() {
  const { user } = useAuth();
  return (
    <div className="space-y-4">
      <PageHeader title="Profile" description="Your account settings" />
      <Card><CardHeader><CardTitle>Personal info</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <FormField label="Email"><Input defaultValue={user?.email ?? ''} disabled /></FormField>
          <FormField label="Display name"><Input defaultValue={user?.displayName ?? ''} /></FormField>
          <FormField label="Role"><Input defaultValue={user?.role ?? ''} disabled /></FormField>
          <Button disabled>Save changes</Button>
        </CardContent>
      </Card>
    </div>
  );
}
