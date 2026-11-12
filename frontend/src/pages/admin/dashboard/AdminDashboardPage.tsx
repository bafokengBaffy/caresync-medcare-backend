import { useQuery } from '@tanstack/react-query';
import { Activity, CircleAlert, CreditCard, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import api from '@/lib/api-client';
import type { PatientSummary } from '@/types/patient';
import type { Provider } from '@/types/provider';
import type { PageResponse } from '@/types/common';

interface BillingSummary {
  totalOutstandingCents: number;
  totalPaidCents: number;
}

function MetricCard({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: string;
  icon: typeof Users;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium">{label}</CardTitle>
        <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
      </CardHeader>
      <CardContent>
        <p className="text-2xl font-bold">{value}</p>
      </CardContent>
    </Card>
  );
}

function metricValue<T>(
  query: { isLoading: boolean; isError: boolean; data: T | undefined },
  value: (data: T) => string,
) {
  if (query.isLoading) return 'Loading';
  if (query.isError || query.data === undefined) return 'Unavailable';
  return value(query.data);
}

export default function AdminDashboardPage({ platformMode = false }: { platformMode?: boolean }) {
  const patients = useQuery({
    queryKey: ['health-dashboard', 'patients'],
    queryFn: async () => (await api.get<PageResponse<PatientSummary>>(
      '/api/v1/patients',
      { params: { page: 0, size: 1 } },
    )).data,
  });
  const providers = useQuery({
    queryKey: ['health-dashboard', 'providers'],
    queryFn: async () => (await api.get<PageResponse<Provider>>(
      '/api/v1/providers',
      { params: { page: 0, size: 1, status: 'ACTIVE' } },
    )).data,
  });
  const billing = useQuery({
    queryKey: ['health-dashboard', 'billing-summary'],
    queryFn: async () => (await api.get<BillingSummary>('/api/v1/invoices/summary')).data,
  });

  const failed = patients.isError || providers.isError || billing.isError;

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold tracking-tight">{platformMode ? 'Selected tenant health' : 'Health management'}</h1>
          <p className="mt-1 text-sm text-muted-foreground">
            {platformMode
              ? 'Health metrics for the tenant selected in the top bar; this is not a cross-platform aggregate.'
              : 'Tenant-scoped operational metrics and administration tools.'}
          </p>
        </div>
        {failed && (
          <Button
            type="button"
            variant="outline"
            onClick={() => {
              void patients.refetch();
              void providers.refetch();
              void billing.refetch();
            }}
          >
            Retry loading
          </Button>
        )}
      </div>

      {failed && (
        <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/30 bg-destructive/5 p-3 text-sm text-destructive">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>One or more dashboard metrics could not be loaded. Unavailable data is not shown as zero.</span>
        </div>
      )}

      <section aria-label="Health management metrics" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
        <MetricCard
          label="Patients"
          value={metricValue(patients, (data) => String(data.total))}
          icon={Users}
        />
        <MetricCard
          label="Active providers"
          value={metricValue(providers, (data) => String(data.total))}
          icon={Activity}
        />
        <MetricCard
          label="Outstanding invoice balance"
          value={metricValue(billing, (data) =>
            new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 })
              .format(data.totalOutstandingCents / 100),
          )}
          icon={CreditCard}
        />
      </section>
      <p className="text-xs text-muted-foreground">Billing values are shown in minor units converted to major units; the billing API does not provide a currency code.</p>

      <Card>
        <CardHeader>
          <CardTitle>Quick actions</CardTitle>
          <p className="text-sm text-muted-foreground">Open the most-used administration workflows.</p>
        </CardHeader>
        <CardContent className="flex flex-wrap gap-3">
          {platformMode ? (
            <>
              <Button asChild><Link to="/admin/super/tenants">Manage tenants</Link></Button>
              <Button asChild variant="outline"><Link to="/admin/super/audit">Platform audit</Link></Button>
              <Button asChild variant="outline"><Link to="/admin/super">Platform dashboard</Link></Button>
            </>
          ) : (
            <>
              <Button asChild><Link to="/admin/audit">Review tenant audit</Link></Button>
              <Button asChild variant="outline"><Link to="/admin/roles">Review role access</Link></Button>
              <Button asChild variant="outline"><Link to="/shared/profile">Edit profile</Link></Button>
              <Button asChild variant="outline"><Link to="/shared/compliance">Compliance</Link></Button>
            </>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
