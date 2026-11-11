import { useQuery } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { CircleAlert, CreditCard, ReceiptText } from 'lucide-react';
import api from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { useTenantContextStore } from '@/stores/tenant-context-store';

interface BillingSummary {
  totalOutstandingCents: number;
  totalPaidCents: number;
}

function formatMinorUnits(cents: number) {
  return new Intl.NumberFormat(undefined, { maximumFractionDigits: 2 }).format(cents / 100);
}

export default function RevenuePage() {
  const tenantId = useTenantContextStore((state) => state.selectedTenantId);
  const revenue = useQuery({
    queryKey: ['selected-tenant-revenue', tenantId],
    queryFn: async () => (await api.get<BillingSummary>('/api/v1/invoices/summary')).data,
    enabled: Boolean(tenantId),
  });

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Selected tenant revenue</h1>
        <p className="mt-1 text-sm text-muted-foreground">Revenue totals are scoped to the tenant selected in the top bar.</p>
      </div>
      {!tenantId ? (
        <Card><CardContent className="py-8 text-sm text-muted-foreground">Select a tenant to view its billing summary.</CardContent></Card>
      ) : revenue.isError ? (
        <div role="alert" className="flex items-start gap-2 rounded-md border border-destructive/30 p-4 text-sm text-destructive">
          <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Could not load billing totals for the selected tenant.</span>
          <Button type="button" variant="outline" size="sm" onClick={() => void revenue.refetch()}>Retry</Button>
        </div>
      ) : (
        <>
          <section aria-label="Selected tenant billing totals" className="grid gap-4 sm:grid-cols-2">
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Payments recorded</CardTitle>
                <CreditCard className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </CardHeader>
              <CardContent><p className="text-2xl font-bold">{revenue.isLoading ? 'Loading' : formatMinorUnits(revenue.data?.totalPaidCents ?? 0)}</p><p className="text-xs text-muted-foreground">Currency is not supplied by the billing summary API.</p></CardContent>
            </Card>
            <Card>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">Outstanding invoices</CardTitle>
                <ReceiptText className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </CardHeader>
              <CardContent><p className="text-2xl font-bold">{revenue.isLoading ? 'Loading' : formatMinorUnits(revenue.data?.totalOutstandingCents ?? 0)}</p><p className="text-xs text-muted-foreground">Currency is not supplied by the billing summary API.</p></CardContent>
            </Card>
          </section>
          <Card>
            <CardHeader>
              <CardTitle>Tenant-scoped reporting</CardTitle>
              <CardDescription>The backend does not expose a cross-tenant revenue aggregate or subscription ledger.</CardDescription>
            </CardHeader>
            <CardContent className="flex flex-wrap gap-3">
              <Button asChild><Link to="/payments">Review payments</Link></Button>
              <Button asChild variant="outline"><Link to="/invoices">Review invoices</Link></Button>
            </CardContent>
          </Card>
        </>
      )}
    </div>
  );
}
