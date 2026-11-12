import { Link } from 'react-router-dom';
import { ArrowRight, LockKeyhole, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

const roles = [
  { name: 'SUPER_ADMIN', scope: 'Platform-wide tenant, policy, and administrative operations.' },
  { name: 'TENANT_ADMIN', scope: 'Administration limited to the authenticated tenant.' },
];

export default function RoleManagementPage() {
  return (
    <main className="mx-auto w-full max-w-5xl space-y-6 p-4 sm:p-6">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight"><ShieldCheck className="h-6 w-6 text-primary" aria-hidden="true" />Role access</h1>
        <p className="mt-1 text-sm text-muted-foreground">Role grants are enforced by the backend. This page is an access guide; it does not edit authorization policy.</p>
      </header>
      <div className="grid gap-4 md:grid-cols-3">
        {roles.map((role) => <Card key={role.name}>
          <CardHeader><CardTitle className="flex items-center gap-2 text-base"><LockKeyhole className="h-4 w-4 text-muted-foreground" aria-hidden="true" />{role.name}</CardTitle></CardHeader>
          <CardContent><CardDescription>{role.scope}</CardDescription></CardContent>
        </Card>)}
      </div>
      <Card>
        <CardHeader><CardTitle className="text-base">Manage user access</CardTitle><CardDescription>Use the authorized user workflow to review role assignments. Every change must be checked by the server.</CardDescription></CardHeader>
        <CardContent><Link className="inline-flex items-center gap-2 text-sm font-medium text-primary hover:underline" to="/shared/compliance">Review compliance controls <ArrowRight className="h-4 w-4" aria-hidden="true" /></Link></CardContent>
      </Card>
    </main>
  );
}
