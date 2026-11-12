import { useQuery } from '@tanstack/react-query';
import { Activity, ArrowUpRight, Building2, CircleAlert, ShieldCheck, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { adminTenantsApi } from '@/api/admin-tenants';
import api from '@/lib/api-client';
import { normalizePage } from '@/lib/pagination';
import type { ApiResponse, PageResponse } from '@/types/common';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

interface RegistrationRequestSummary {
  id: string;
}

interface RegistrationPage extends PageResponse<RegistrationRequestSummary> {}

function MetricCard({
  label,
  value,
  icon: Icon,
  href,
}: {
  label: string;
  value: string;
  icon: typeof Building2;
  href: string;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
        <Link to={href} className="mt-2 inline-flex items-center gap-1 text-sm text-primary hover:underline">
          View details <ArrowUpRight className="h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </CardContent>
    </Card>
  );
}

export default function SuperAdminDashboardPage() {
  const tenants = useQuery({
    queryKey: ['platform-dashboard', 'tenants'],
    queryFn: adminTenantsApi.listForSelection,
  });
  const registrations = useQuery({
    queryKey: ['platform-dashboard', 'pending-registrations'],
    queryFn: async () => normalizePage((await api.get<ApiResponse<RegistrationPage>>(
      '/api/v1/admin/registration/requests',
      { params: { status: 'PENDING', page: 0, size: 1 } },
    )).data.data),
  });
  const failed = tenants.isError || registrations.isError;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">Platform administration</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            Manage tenants, registrations, users, security, and platform configuration.
          </p>
        </div>
        {failed && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void tenants.refetch();
              void registrations.refetch();
            }}
          >
            Retry loading
          </Button>
        )}
      </div>

      {failed && (
        <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>
            Some platform data could not be loaded. Check your connection and permissions, then retry.
          </span>
        </div>
      )}

      <section aria-label="Platform metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-4">
        <MetricCard
          label="Tenants"
          value={tenants.isLoading ? 'Loading' : tenants.isError ? 'Unavailable' : String(tenants.data?.total ?? 0)}
          icon={Building2}
          href="/admin/super/tenants"
        />
        <MetricCard
          label="Pending registrations"
          value={registrations.isLoading ? 'Loading' : registrations.isError ? 'Unavailable' : String(registrations.data?.total ?? 0)}
          icon={Users}
          href="/admin/super/registration/requests"
        />
        <MetricCard
          label="Tenant administrators"
          value="Manage"
          icon={ShieldCheck}
          href="/admin/super/users"
        />
        <MetricCard
          label="Platform activity"
          value="Review"
          icon={Activity}
          href="/admin/super/activity"
        />
      </section>

      <Card>
        <CardHeader>
          <CardTitle>Tenant workspaces</CardTitle>
          <p className="text-sm text-muted-foreground">
            Select a tenant workspace in the top bar before viewing patient, clinical, appointment, or billing records.
          </p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          <Button asChild>
            <Link to="/admin/super/tenants">Manage tenants</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/admin/super/users">Manage users</Link>
          </Button>
          <Button asChild variant="outline">
            <Link to="/admin/super/registration/requests">Review registrations</Link>
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}
