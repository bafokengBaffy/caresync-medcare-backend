import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const tenantRoles = [
  'TENANT_ADMIN',
  'ADMIN',
  'MANAGER',
  'PROVIDER',
  'CLINICIAN',
  'STAFF',
  'RECEPTION',
  'RECEPTIONIST',
  'FINANCE',
  'CONSENT_MANAGER',
  'PRIVACY_OFFICER',
  'PATIENT',
];

export default function RoleAccessGuide({ platform = false }: { platform?: boolean }) {
  const roles = platform ? ['SUPER_ADMIN', ...tenantRoles] : tenantRoles.filter((role) => role !== 'TENANT_ADMIN');
  const manageUsersHref = platform ? '/admin/super/users' : '/admin/tenant/users';

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{platform ? 'Platform role access' : 'Tenant role access'}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Review the supported role boundaries. This screen does not edit authorization policy.
          </p>
        </div>
        <Link className="text-sm font-medium text-primary hover:underline" to={manageUsersHref}>Open user management</Link>
      </div>
      <Card>
        <CardHeader>
          <CardTitle>Supported role claims</CardTitle>
          <CardDescription>
            The server validates every role assignment and keeps tenant access inside the authenticated tenant.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Scope</TableHead>
                <TableHead>Assignment</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {roles.map((role) => (
                <TableRow key={role}>
                  <TableCell className="font-medium">{role.replaceAll('_', ' ')}</TableCell>
                  <TableCell>{role === 'SUPER_ADMIN' ? 'Platform' : 'Tenant'}</TableCell>
                  <TableCell>
                    <Link to={manageUsersHref} className="text-primary underline-offset-4 hover:underline">
                      Open user management
                    </Link>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
      <p className="text-sm text-muted-foreground">
        Role grants are controlled through authorized user workflows. Permission changes are not available on this page, and no local toggle here changes API authorization.
      </p>
    </div>
  );
}
