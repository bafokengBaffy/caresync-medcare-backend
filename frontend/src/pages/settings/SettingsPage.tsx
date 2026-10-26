import { Link } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
export function SettingsPage() {
  return (
    <div className="space-y-4">
      <PageHeader title="Settings" />
      <div className="grid gap-4 sm:grid-cols-2">
        <Card><CardHeader><CardTitle>Profile</CardTitle><CardDescription>Update your account details</CardDescription></CardHeader>
          <CardContent><Link to="/settings/profile" className="text-primary hover:underline">Manage profile →</Link></CardContent></Card>
        <Card><CardHeader><CardTitle>Notifications</CardTitle><CardDescription>Email and in-app preferences</CardDescription></CardHeader>
          <CardContent><span className="text-muted-foreground text-sm">Coming soon</span></CardContent></Card>
      </div>
    </div>
  );
}
