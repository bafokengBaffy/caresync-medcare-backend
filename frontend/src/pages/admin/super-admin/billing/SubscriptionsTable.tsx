// frontend/src/pages/admin/super-admin/billing/SubscriptionsTable.tsx
import { ArrowUpDown, ExternalLink, MoreHorizontal, Users } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader } from '@/components/ui/card';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { Skeleton } from '@/components/ui/skeleton';
import { EmptyState } from '@/components/ui/empty-state';
import { cn } from '@/lib/utils';
import {
  INTERVAL_LABELS,
  PLAN_TIER_LABELS,
  daysUntil,
  formatCurrency,
  formatDate,
} from '@/api/subscriptions';
import { SubscriptionStatusBadge } from './SubscriptionStatusBadge';
import type { Subscription } from '@/types/subscription';

export interface SubscriptionsTableProps {
  readonly data: readonly Subscription[];
  readonly loading: boolean;
  readonly onView: (subscription: Subscription) => void;
  readonly onChangePlan: (subscription: Subscription) => void;
  readonly onUpdateSeats: (subscription: Subscription) => void;
  readonly onCancel: (subscription: Subscription) => void;
  readonly onReactivate: (subscription: Subscription) => void;
  readonly onExtendTrial: (subscription: Subscription) => void;
  readonly onApplyCoupon: (subscription: Subscription) => void;
  readonly onSort: (key: 'tenant' | 'mrr' | 'currentPeriodEnd' | 'createdAt') => void;
  readonly currentSortBy: string;
  readonly currentSortDir: 'asc' | 'desc';
}

function SortHeader({
  label,
  active,
  dir,
  onClick,
  className,
}: {
  label: string;
  active: boolean;
  dir: 'asc' | 'desc';
  onClick: () => void;
  className?: string;
}) {
  return (
    <th scope="col" className={cn('px-4 py-3 text-left', className)}>
      <button
        type="button"
        onClick={onClick}
        className="inline-flex items-center gap-1 text-xs font-medium uppercase tracking-wide text-muted-foreground hover:text-foreground"
      >
        {label}
        <ArrowUpDown
          className={cn('h-3 w-3', active ? 'text-foreground' : 'text-muted-foreground/60')}
          aria-hidden="true"
          data-dir={dir}
        />
      </button>
    </th>
  );
}

export function SubscriptionsTable({
  data,
  loading,
  onView,
  onChangePlan,
  onUpdateSeats,
  onCancel,
  onReactivate,
  onExtendTrial,
  onApplyCoupon,
  onSort,
  currentSortBy,
  currentSortDir,
}: SubscriptionsTableProps) {
  if (loading) {
    return (
      <Card>
        <CardHeader>
          <Skeleton className="h-5 w-40" />
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            {Array.from({ length: 6 }).map((_, i) => (
              <Skeleton key={i} className="h-12 w-full" />
            ))}
          </div>
        </CardContent>
      </Card>
    );
  }

  if (data.length === 0) {
    return (
      <Card>
        <CardContent className="pt-6">
          <EmptyState
            title="No subscriptions found"
            description="Adjust your filters, or verify that tenants have been onboarded with a subscription plan."
            icon={Users}
          />
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="overflow-hidden">
      <div className="overflow-x-auto">
        <table className="w-full min-w-[900px] text-sm">
          <thead className="border-b bg-muted/40">
            <tr>
              <SortHeader
                label="Tenant"
                active={currentSortBy === 'tenant'}
                dir={currentSortDir}
                onClick={() => onSort('tenant')}
              />
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Plan
              </th>
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Status
              </th>
              <SortHeader
                label="MRR"
                active={currentSortBy === 'mrr'}
                dir={currentSortDir}
                onClick={() => onSort('mrr')}
                className="text-right"
              />
              <th scope="col" className="px-4 py-3 text-left text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Seats
              </th>
              <SortHeader
                label="Renews"
                active={currentSortBy === 'currentPeriodEnd'}
                dir={currentSortDir}
                onClick={() => onSort('currentPeriodEnd')}
              />
              <th scope="col" className="px-4 py-3 text-right text-xs font-medium uppercase tracking-wide text-muted-foreground">
                Actions
              </th>
            </tr>
          </thead>
          <tbody>
            {data.map((sub) => {
              const renewInDays = daysUntil(sub.currentPeriodEnd);
              const seatPct =
                sub.seats.seatLimit && sub.seats.seatLimit > 0
                  ? Math.min(100, Math.round((sub.seats.seatsUsed / sub.seats.seatLimit) * 100))
                  : null;
              const cancelScheduled =
                sub.cancelAtPeriodEnd && sub.status !== 'canceled';
              return (
                <tr
                  key={sub.id}
                  className="border-b transition-colors last:border-b-0 hover:bg-muted/30"
                >
                  <td className="px-4 py-3 align-middle">
                    <div className="flex flex-col">
                      <Link
                        to={`/admin/super/tenants/${sub.tenant.id}`}
                        className="inline-flex items-center gap-1 font-medium text-foreground hover:underline"
                      >
                        {sub.tenant.name}
                        <ExternalLink className="h-3 w-3 text-muted-foreground" aria-hidden="true" />
                      </Link>
                      <span className="text-xs text-muted-foreground">
                        {sub.tenant.slug}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <div className="flex flex-col">
                      <span className="font-medium">{sub.plan.name}</span>
                      <span className="text-xs text-muted-foreground">
                        {PLAN_TIER_LABELS[sub.plan.tier]} · {INTERVAL_LABELS[sub.plan.interval]}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <div className="flex flex-col gap-1">
                      <SubscriptionStatusBadge status={sub.status} />
                      {cancelScheduled ? (
                        <span className="text-[11px] text-rose-600 dark:text-rose-400">
                          Cancels at period end
                        </span>
                      ) : null}
                      {sub.status === 'past_due' && sub.dunningAttempts > 0 ? (
                        <span className="text-[11px] text-amber-600 dark:text-amber-400">
                          Dunning attempt {sub.dunningAttempts}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right align-middle">
                    <div className="flex flex-col items-end">
                      <span className="font-medium">
                        {formatCurrency(sub.mrrMinor, sub.currency)}
                      </span>
                      <span className="text-xs text-muted-foreground">
                        {sub.plan.amountMinor
                          ? `${formatCurrency(sub.plan.amountMinor, sub.plan.currency)} / ${sub.plan.interval}`
                          : '—'}
                      </span>
                    </div>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <div className="flex flex-col gap-1">
                      <span className="text-sm">
                        {sub.seats.seatsUsed} / {sub.seats.seatLimit ?? '∞'}
                      </span>
                      {seatPct !== null ? (
                        <div className="h-1.5 w-24 overflow-hidden rounded-full bg-muted">
                          <div
                            className={cn(
                              'h-full rounded-full',
                              seatPct >= 90
                                ? 'bg-rose-500'
                                : seatPct >= 70
                                  ? 'bg-amber-500'
                                  : 'bg-emerald-500',
                            )}
                            style={{ width: `${seatPct}%` }}
                          />
                        </div>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 align-middle">
                    <div className="flex flex-col">
                      <span>{formatDate(sub.currentPeriodEnd)}</span>
                      {renewInDays !== null ? (
                        <span
                          className={cn(
                            'text-xs',
                            renewInDays < 0
                              ? 'text-rose-600 dark:text-rose-400'
                              : renewInDays <= 7
                                ? 'text-amber-600 dark:text-amber-400'
                                : 'text-muted-foreground',
                          )}
                        >
                          {renewInDays < 0
                            ? `${Math.abs(renewInDays)}d overdue`
                            : `in ${renewInDays}d`}
                        </span>
                      ) : null}
                    </div>
                  </td>
                  <td className="px-4 py-3 text-right align-middle">
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button
                          variant="ghost"
                          size="icon"
                          aria-label={`Actions for ${sub.tenant.name}`}
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end" className="w-56">
                        <DropdownMenuLabel>Manage</DropdownMenuLabel>
                        <DropdownMenuItem onSelect={() => onView(sub)}>
                          View details
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onChangePlan(sub)}>
                          Change plan
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onUpdateSeats(sub)}>
                          Update seats
                        </DropdownMenuItem>
                        <DropdownMenuItem onSelect={() => onApplyCoupon(sub)}>
                          Apply coupon
                        </DropdownMenuItem>
                        {sub.status === 'trialing' ? (
                          <DropdownMenuItem onSelect={() => onExtendTrial(sub)}>
                            Extend trial
                          </DropdownMenuItem>
                        ) : null}
                        <DropdownMenuSeparator />
                        {sub.status === 'canceled' ? (
                          <DropdownMenuItem onSelect={() => onReactivate(sub)}>
                            Reactivate
                          </DropdownMenuItem>
                        ) : (
                          <DropdownMenuItem
                            onSelect={() => onCancel(sub)}
                            className="text-rose-600 focus:text-rose-600 dark:text-rose-400"
                          >
                            Cancel subscription
                          </DropdownMenuItem>
                        )}
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </Card>
  );
}