// frontend/src/pages/admin/super-admin/billing/SubscriptionToolbar.tsx
import { useCallback } from 'react';
import { ArrowDownWideNarrow, ArrowUpWideNarrow, Filter, RefreshCw, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect as Select } from '@/components/ui/select';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  INTERVAL_LABELS,
  PLAN_TIER_LABELS,
  STATUS_LABELS,
  sanitizeText,
} from '@/api/subscriptions';
import type {
  BillingInterval,
  PlanTier,
  SubscriptionListFilters,
  SubscriptionStatus,
} from '@/types/subscription';

export interface SubscriptionToolbarProps {
  readonly filters: SubscriptionListFilters;
  readonly onChange: (patch: Partial<SubscriptionListFilters>) => void;
  readonly onRefresh: () => void;
  readonly onReset: () => void;
  readonly refreshing?: boolean;
}

const STATUS_OPTIONS: Array<{ value: SubscriptionStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All statuses' },
  ...(Object.keys(STATUS_LABELS) as SubscriptionStatus[]).map((s) => ({
    value: s,
    label: STATUS_LABELS[s],
  })),
];

const TIER_OPTIONS: Array<{ value: PlanTier | 'all'; label: string }> = [
  { value: 'all', label: 'All tiers' },
  ...(Object.keys(PLAN_TIER_LABELS) as PlanTier[]).map((t) => ({
    value: t,
    label: PLAN_TIER_LABELS[t],
  })),
];

const INTERVAL_OPTIONS: Array<{ value: BillingInterval | 'all'; label: string }> = [
  { value: 'all', label: 'All intervals' },
  ...(Object.keys(INTERVAL_LABELS) as BillingInterval[]).map((i) => ({
    value: i,
    label: INTERVAL_LABELS[i],
  })),
];

export function SubscriptionToolbar({
  filters,
  onChange,
  onRefresh,
  onReset,
  refreshing = false,
}: SubscriptionToolbarProps) {
  const handleSearch = useCallback(
    (e: React.ChangeEvent<HTMLInputElement>) => {
      const cleaned = sanitizeText(e.target.value, 120);
      onChange({ search: cleaned });
    },
    [onChange],
  );

  const toggleSortDir = useCallback(() => {
    onChange({ sortDir: filters.sortDir === 'asc' ? 'desc' : 'asc' });
  }, [filters.sortDir, onChange]);

  const hasFilters =
    filters.search.length > 0 ||
    filters.status !== 'all' ||
    filters.tier !== 'all' ||
    filters.interval !== 'all';

  return (
    <div className="flex flex-col gap-3 rounded-lg border bg-card p-3 shadow-sm md:flex-row md:items-center md:justify-between">
      <div className="flex flex-1 flex-col gap-2 sm:flex-row sm:items-center">
        <div className="relative flex-1">
          <Search
            className="pointer-events-none absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
            aria-hidden="true"
          />
          <Input
            value={filters.search}
            onChange={handleSearch}
            placeholder="Search tenant, plan or subscription id…"
            className="pl-9"
            maxLength={120}
            autoComplete="off"
            aria-label="Search subscriptions"
          />
          {filters.search ? (
            <Button
              type="button"
              variant="ghost"
              size="icon"
              className="absolute right-1 top-1/2 h-7 w-7 -translate-y-1/2"
              onClick={() => onChange({ search: '' })}
              aria-label="Clear search"
            >
              <X className="h-3.5 w-3.5" />
            </Button>
          ) : null}
        </div>

        <div className="flex flex-wrap items-center gap-2">
          <div className="flex items-center gap-1.5 text-xs text-muted-foreground">
            <Filter className="h-3.5 w-3.5" aria-hidden="true" />
            <span className="hidden sm:inline">Filters</span>
          </div>
          <Select
            value={filters.status}
            onValueChange={(v) =>
              onChange({ status: v as SubscriptionStatus | 'all' })
            }
            aria-label="Filter by status"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Select
            value={filters.tier}
            onValueChange={(v) => onChange({ tier: v as PlanTier | 'all' })}
            aria-label="Filter by plan tier"
          >
            {TIER_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Select
            value={filters.interval}
            onValueChange={(v) =>
              onChange({ interval: v as BillingInterval | 'all' })
            }
            aria-label="Filter by billing interval"
          >
            {INTERVAL_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <Separator orientation="vertical" className="hidden h-8 md:block" />

      <div className="flex items-center gap-2">
        <Select
          value={filters.sortBy}
          onValueChange={(v) =>
            onChange({ sortBy: v as SubscriptionListFilters['sortBy'] })
          }
          aria-label="Sort by"
        >
          <option value="createdAt">Newest</option>
          <option value="tenant">Tenant name</option>
          <option value="status">Status</option>
          <option value="mrr">MRR</option>
          <option value="currentPeriodEnd">Renewal date</option>
        </Select>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={toggleSortDir}
          aria-label={`Sort ${filters.sortDir === 'asc' ? 'descending' : 'ascending'}`}
          title={`Sort ${filters.sortDir === 'asc' ? 'descending' : 'ascending'}`}
        >
          {filters.sortDir === 'asc' ? (
            <ArrowUpWideNarrow className="h-4 w-4" />
          ) : (
            <ArrowDownWideNarrow className="h-4 w-4" />
          )}
        </Button>
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={refreshing}
          aria-label="Refresh subscriptions"
          title="Refresh"
        >
          <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
        </Button>
        {hasFilters ? (
          <Button
            type="button"
            variant="ghost"
            size="sm"
            onClick={onReset}
            className="text-muted-foreground"
          >
            Reset
          </Button>
        ) : null}
      </div>
    </div>
  );
}
