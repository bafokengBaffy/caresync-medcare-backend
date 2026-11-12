// frontend/src/pages/admin/super-admin/billing/SubscriptionStatsCards.tsx
import { Activity, AlertTriangle, CircleDollarSign, CreditCard, TrendingDown, Users } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import { formatCurrency } from '@/api/subscriptions';
import type { SubscriptionStats } from '@/types/subscription';

export interface SubscriptionStatsCardsProps {
  readonly stats: SubscriptionStats | undefined;
  readonly loading: boolean;
}

interface StatCard {
  readonly key: keyof SubscriptionStats | 'mrr' | 'arr';
  readonly label: string;
  readonly value: string;
  readonly hint?: string;
  readonly Icon: typeof Users;
  readonly accent: string;
}

function buildCards(stats: SubscriptionStats): StatCard[] {
  return [
    {
      key: 'totalSubscriptions',
      label: 'Total Subscriptions',
      value: stats.totalSubscriptions.toLocaleString(),
      hint: 'Across all tenants',
      Icon: CreditCard,
      accent: 'text-indigo-600 dark:text-indigo-400',
    },
    {
      key: 'active',
      label: 'Active',
      value: stats.active.toLocaleString(),
      hint: 'Currently billed',
      Icon: Activity,
      accent: 'text-emerald-600 dark:text-emerald-400',
    },
    {
      key: 'trialing',
      label: 'Trialing',
      value: stats.trialing.toLocaleString(),
      hint: 'In trial period',
      Icon: Users,
      accent: 'text-sky-600 dark:text-sky-400',
    },
    {
      key: 'pastDue',
      label: 'Past Due',
      value: stats.pastDue.toLocaleString(),
      hint: 'Dunning in progress',
      Icon: AlertTriangle,
      accent: 'text-amber-600 dark:text-amber-400',
    },
    {
      key: 'mrr',
      label: 'MRR',
      value: formatCurrency(stats.mrrMinor, stats.currency),
      hint: 'Monthly recurring',
      Icon: CircleDollarSign,
      accent: 'text-blue-600 dark:text-blue-400',
    },
    {
      key: 'arr',
      label: 'ARR',
      value: formatCurrency(stats.arrMinor, stats.currency),
      hint: 'Annual recurring',
      Icon: TrendingDown,
      accent: 'text-fuchsia-600 dark:text-fuchsia-400',
    },
  ];
}

export function SubscriptionStatsCards({ stats, loading }: SubscriptionStatsCardsProps) {
  if (loading || !stats) {
    return (
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
        {Array.from({ length: 6 }).map((_, i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <Skeleton className="h-4 w-24" />
            </CardHeader>
            <CardContent>
              <Skeleton className="mb-1 h-7 w-20" />
              <Skeleton className="h-3 w-16" />
            </CardContent>
          </Card>
        ))}
      </div>
    );
  }

  const cards = buildCards(stats);
  return (
    <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3 2xl:grid-cols-6">
      {cards.map(({ key, label, value, hint, Icon, accent }) => (
        <Card key={key} className="overflow-hidden">
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-xs font-medium uppercase tracking-wide text-muted-foreground">
              {label}
            </CardTitle>
            <Icon className={cn('h-4 w-4', accent)} aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-semibold tracking-tight">{value}</div>
            {hint ? (
              <p className="mt-1 text-xs text-muted-foreground">{hint}</p>
            ) : null}
          </CardContent>
        </Card>
      ))}
    </div>
  );
}