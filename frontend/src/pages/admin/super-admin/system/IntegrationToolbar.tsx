// frontend/src/pages/admin/super-admin/system/IntegrationToolbar.tsx
import { Filter, RefreshCw, Search, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { NativeSelect as Select } from '@/components/ui/select';
import { cn } from '@/lib/utils';
import {
  CATEGORY_LABELS,
  ENV_LABELS,
  STATUS_LABELS,
  sanitizeText,
} from '@/api/integrations';
import type {
  EnvironmentName,
  IntegrationCategory,
  IntegrationListFilters,
  IntegrationStatus,
} from '@/types/integration';

export interface IntegrationToolbarProps {
  readonly filters: IntegrationListFilters;
  readonly onChange: (patch: Partial<IntegrationListFilters>) => void;
  readonly onRefresh: () => void;
  readonly onReset: () => void;
  readonly refreshing?: boolean;
}

const STATUS_OPTIONS: Array<{ value: IntegrationStatus | 'all'; label: string }> = [
  { value: 'all', label: 'All statuses' },
  ...(Object.keys(STATUS_LABELS) as IntegrationStatus[]).map((s) => ({
    value: s,
    label: STATUS_LABELS[s],
  })),
];

const CATEGORY_OPTIONS: Array<{ value: IntegrationCategory | 'all'; label: string }> = [
  { value: 'all', label: 'All categories' },
  ...(Object.keys(CATEGORY_LABELS) as IntegrationCategory[]).map((c) => ({
    value: c,
    label: CATEGORY_LABELS[c],
  })),
];

const ENV_OPTIONS: Array<{ value: EnvironmentName | 'all'; label: string }> = [
  { value: 'all', label: 'All environments' },
  ...(Object.keys(ENV_LABELS) as EnvironmentName[]).map((e) => ({
    value: e,
    label: ENV_LABELS[e],
  })),
];

export function IntegrationToolbar({
  filters,
  onChange,
  onRefresh,
  onReset,
  refreshing = false,
}: IntegrationToolbarProps) {
  const hasFilters =
    filters.search.length > 0 ||
    filters.category !== 'all' ||
    filters.status !== 'all' ||
    filters.environment !== 'all';

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
            onChange={(e) => onChange({ search: sanitizeText(e.target.value, 120) })}
            placeholder="Search integration by name or category…"
            className="pl-9"
            maxLength={120}
            autoComplete="off"
            aria-label="Search integrations"
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
            value={filters.category}
            onValueChange={(v) => onChange({ category: v as IntegrationCategory | 'all' })}
            aria-label="Filter by category"
          >
            {CATEGORY_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Select
            value={filters.status}
            onValueChange={(v) => onChange({ status: v as IntegrationStatus | 'all' })}
            aria-label="Filter by status"
          >
            {STATUS_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
          <Select
            value={filters.environment}
            onValueChange={(v) => onChange({ environment: v as EnvironmentName | 'all' })}
            aria-label="Filter by environment"
          >
            {ENV_OPTIONS.map((o) => (
              <option key={o.value} value={o.value}>
                {o.label}
              </option>
            ))}
          </Select>
        </div>
      </div>

      <div className="flex items-center gap-2">
        <Button
          type="button"
          variant="outline"
          size="icon"
          onClick={onRefresh}
          disabled={refreshing}
          aria-label="Refresh integrations"
          title="Refresh"
        >
          <RefreshCw className={cn('h-4 w-4', refreshing && 'animate-spin')} />
        </Button>
        {hasFilters ? (
          <Button type="button" variant="ghost" size="sm" onClick={onReset} className="text-muted-foreground">
            Reset
          </Button>
        ) : null}
      </div>
    </div>
  );
}
