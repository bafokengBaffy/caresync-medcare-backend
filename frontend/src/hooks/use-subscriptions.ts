// frontend/src/hooks/use-subscriptions.ts
// React Query hooks. React Query handles caching, retries, and invalidation.
// All mutations call the typed API client (auth is enforced server-side).

import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { subscriptionsApi } from '@/api/subscriptions';
import type {
  ApplyCouponPayload,
  CancelSubscriptionPayload,
  ChangePlanPayload,
  ExtendTrialPayload,
  ReactivatePayload,
  SubscriptionListFilters,
  SubscriptionStatus,
  UpdateSeatsPayload,
} from '@/types/subscription';

const QK = {
  stats: ['admin', 'subscriptions', 'stats'] as const,
  plans: ['admin', 'subscriptions', 'plans'] as const,
  list: (filters: SubscriptionListFilters) =>
    ['admin', 'subscriptions', 'list', filters] as const,
  detail: (id: string) => ['admin', 'subscriptions', 'detail', id] as const,
  invoices: (id: string, page: number, pageSize: number) =>
    ['admin', 'subscriptions', 'invoices', id, page, pageSize] as const,
  events: (id: string) => ['admin', 'subscriptions', 'events', id] as const,
};

export function useSubscriptionStats() {
  return useQuery({
    queryKey: QK.stats,
    queryFn: () => subscriptionsApi.getStats(),
    staleTime: 60_000,
    retry: 1,
  });
}

export function useSubscriptionPlans() {
  return useQuery({
    queryKey: QK.plans,
    queryFn: () => subscriptionsApi.listPlans(),
    staleTime: 5 * 60_000,
    retry: 1,
  });
}

export interface UseSubscriptionListOptions {
  readonly initialFilters?: Partial<SubscriptionListFilters>;
}

export function useSubscriptionList({ initialFilters }: UseSubscriptionListOptions = {}) {
  const [filters, setFilters] = useState<SubscriptionListFilters>({
    search: '',
    status: 'all',
    tier: 'all',
    interval: 'all',
    page: 1,
    pageSize: 10,
    sortBy: 'createdAt',
    sortDir: 'desc',
    ...initialFilters,
  });

  const query = useQuery({
    queryKey: QK.list(filters),
    queryFn: () => subscriptionsApi.list(filters),
    staleTime: 30_000,
    retry: 1,
  });

  const update = useCallback(
    (patch: Partial<SubscriptionListFilters>) => {
      setFilters((prev) => ({ ...prev, ...patch, page: patch.page ?? 1 }));
    },
    [],
  );

  const setPage = useCallback(
    (page: number) => setFilters((prev) => ({ ...prev, page })),
    [],
  );

  const reset = useCallback(
    () =>
      setFilters({
        search: '',
        status: 'all',
        tier: 'all',
        interval: 'all',
        page: 1,
        pageSize: 10,
        sortBy: 'createdAt',
        sortDir: 'desc',
      }),
    [],
  );

  return { filters, update, setPage, reset, query };
}

export function useSubscription(id: string | null | undefined) {
  return useQuery({
    queryKey: id ? QK.detail(id) : ['admin', 'subscriptions', 'detail', 'none'],
    queryFn: () => subscriptionsApi.getById(id as string),
    enabled: Boolean(id),
    staleTime: 15_000,
    retry: 1,
  });
}

export function useSubscriptionInvoices(id: string | null, page = 1, pageSize = 20) {
  return useQuery({
    queryKey: id
      ? QK.invoices(id, page, pageSize)
      : ['admin', 'subscriptions', 'invoices', 'none'],
    queryFn: () => subscriptionsApi.listInvoices(id as string, page, pageSize),
    enabled: Boolean(id),
    staleTime: 30_000,
    retry: 1,
  });
}

export function useSubscriptionEvents(id: string | null) {
  return useQuery({
    queryKey: id ? QK.events(id) : ['admin', 'subscriptions', 'events', 'none'],
    queryFn: () => subscriptionsApi.listEvents(id as string),
    enabled: Boolean(id),
    staleTime: 30_000,
    retry: 1,
  });
}

function useInvalidateSubscription() {
  const qc = useQueryClient();
  return useCallback(
    (id?: string) => {
      qc.invalidateQueries({ queryKey: ['admin', 'subscriptions'] });
      if (id) qc.invalidateQueries({ queryKey: QK.detail(id) });
    },
    [qc],
  );
}

export function useChangePlan() {
  const invalidate = useInvalidateSubscription();
  return useMutation({
    mutationFn: (payload: ChangePlanPayload) => subscriptionsApi.changePlan(payload),
    onSuccess: (_, vars) => invalidate(vars.subscriptionId),
  });
}

export function useUpdateSeats() {
  const invalidate = useInvalidateSubscription();
  return useMutation({
    mutationFn: (payload: UpdateSeatsPayload) => subscriptionsApi.updateSeats(payload),
    onSuccess: (_, vars) => invalidate(vars.subscriptionId),
  });
}

export function useCancelSubscription() {
  const invalidate = useInvalidateSubscription();
  return useMutation({
    mutationFn: (payload: CancelSubscriptionPayload) => subscriptionsApi.cancel(payload),
    onSuccess: (_, vars) => invalidate(vars.subscriptionId),
  });
}

export function useReactivateSubscription() {
  const invalidate = useInvalidateSubscription();
  return useMutation({
    mutationFn: (payload: ReactivatePayload) => subscriptionsApi.reactivate(payload),
    onSuccess: (_, vars) => invalidate(vars.subscriptionId),
  });
}

export function useExtendTrial() {
  const invalidate = useInvalidateSubscription();
  return useMutation({
    mutationFn: (payload: ExtendTrialPayload) => subscriptionsApi.extendTrial(payload),
    onSuccess: (_, vars) => invalidate(vars.subscriptionId),
  });
}

export function useApplyCoupon() {
  const invalidate = useInvalidateSubscription();
  return useMutation({
    mutationFn: (payload: ApplyCouponPayload) => subscriptionsApi.applyCoupon(payload),
    onSuccess: (_, vars) => invalidate(vars.subscriptionId),
  });
}

export function useStatusFacetCounts(subscriptions: readonly { status: SubscriptionStatus }[]) {
  return useMemo(() => {
    const map: Record<SubscriptionStatus | 'all', number> = {
      all: subscriptions.length,
      trialing: 0,
      active: 0,
      past_due: 0,
      paused: 0,
      canceled: 0,
      expired: 0,
      suspended: 0,
    };
    for (const s of subscriptions) map[s.status] += 1;
    return map;
  }, [subscriptions]);
}