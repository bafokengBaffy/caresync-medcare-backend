import { CircleAlert, CreditCard, ReceiptText, RefreshCw, Users } from 'lucide-react';
import { useSubscriptionStats } from '@/hooks/use-subscriptions';
import { formatCurrency } from '@/api/subscriptions';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

export default function RevenuePage() {
  const stats = useSubscriptionStats();
  const currency = stats.data?.currency ?? 'ZAR';
  const metrics = [
    { label: 'Monthly recurring revenue', value: stats.data ? formatCurrency(stats.data.mrrMinor, currency) : null, icon: CreditCard },
    { label: 'Annual recurring revenue', value: stats.data ? formatCurrency(stats.data.arrMinor, currency) : null, icon: ReceiptText },
    { label: 'Active subscriptions', value: stats.data ? stats.data.active.toLocaleString() : null, icon: Users },
  ];

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Platform subscription revenue</h1>
        <p className="mt-1 text-sm text-muted-foreground">Recurring totals are calculated from subscription records. Patient invoice revenue is tenant scoped and is not included.</p>
      </div>
      {stats.isError ? (
        <div role="alert" className="flex items-center gap-3 rounded-md border border-destructive/30 p-4 text-sm text-destructive">
          <CircleAlert className="h-4 w-4 shrink-0" aria-hidden="true" />
          <span>Unable to load platform subscription totals.</span>
          <Button type="button" variant="outline" size="sm" onClick={() => void stats.refetch()}><RefreshCw className="mr-2 h-4 w-4" />Retry</Button>
        </div>
      ) : (
        <section aria-label="Platform subscription revenue" className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
          {metrics.map(({ label, value, icon: Icon }) => (
            <Card key={label}>
              <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
                <CardTitle className="text-sm font-medium">{label}</CardTitle>
                <Icon className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
              </CardHeader>
              <CardContent><p className="text-2xl font-bold">{stats.isLoading ? 'Loading' : value}</p></CardContent>
            </Card>
          ))}
        </section>
      )}
    </div>
  );
}
