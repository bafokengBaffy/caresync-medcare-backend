import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function StaffInvitePage() {
  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Add a staff account</h1>
        <p className="mt-1 text-sm text-muted-foreground">Provision a verified account into your tenant.</p>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Account invitations</CardTitle>
          <CardDescription>This deployment does not expose a tenant email-invitation endpoint.</CardDescription>
        </CardHeader>
        <CardContent className="space-y-4">
          <p className="text-sm text-muted-foreground">
            Create the user account through the configured identity provider first. Then add its Firebase user ID, matching email, and tenant role in user management.
          </p>
          <Button asChild><Link to="/admin/tenant/users/new">Provision existing account</Link></Button>
        </CardContent>
      </Card>
    </div>
  );
}
