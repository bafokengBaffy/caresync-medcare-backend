// frontend/src/api/subscriptions.ts
// Typed API client. Uses the shared fetch-based apiClient (from @/lib/api-client)
// which attaches Firebase ID token, correlation ID, and enforces same-origin.
// OWASP A01/A02/A03/A07 mitigations: auth is server-verified; no secrets on client.

import { apiClient } from '@/lib/api-client';
import type {
  ApplyCouponPayload,
  CancelSubscriptionPayload,
  ChangePlanPayload,
  ExtendTrialPayload,
  PaginatedResult,
  PlanTier,
  ReactivatePayload,
  Subscription,
  SubscriptionEvent,
  SubscriptionInvoice,
  SubscriptionListFilters,
  SubscriptionPlan,
  SubscriptionStats,
  SubscriptionStatus,
  UpdateSeatsPayload,
  BillingInterval,
} from '@/types/subscription';

interface ServerError {
  message: string;
  code?: string;
}

function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === '') continue;
    search.set(key, String(value));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const subscriptionsApi = {
  async getStats(): Promise<SubscriptionStats> {
    return apiClient.get<SubscriptionStats>('/api/v1/admin/subscriptions/stats');
  },

  async listPlans(): Promise<readonly SubscriptionPlan[]> {
    return apiClient.get<readonly SubscriptionPlan[]>('/api/v1/admin/subscriptions/plans');
  },

  async list(
    filters: SubscriptionListFilters,
  ): Promise<PaginatedResult<Subscription>> {
    const qs = buildQuery({
      search: filters.search || undefined,
      status: filters.status === 'all' ? undefined : filters.status,
      tier: filters.tier === 'all' ? undefined : filters.tier,
      interval: filters.interval === 'all' ? undefined : filters.interval,
      page: filters.page,
      pageSize: filters.pageSize,
      sortBy: filters.sortBy,
      sortDir: filters.sortDir,
    });
    return apiClient.get<PaginatedResult<Subscription>>(
      `/api/v1/admin/subscriptions${qs}`,
    );
  },

  async getById(id: string): Promise<Subscription> {
    return apiClient.get<Subscription>(`/api/v1/admin/subscriptions/${encodeURIComponent(id)}`);
  },

  async listInvoices(
    subscriptionId: string,
    page = 1,
    pageSize = 20,
  ): Promise<PaginatedResult<SubscriptionInvoice>> {
    const qs = buildQuery({ page, pageSize });
    return apiClient.get<PaginatedResult<SubscriptionInvoice>>(
      `/api/v1/admin/subscriptions/${encodeURIComponent(subscriptionId)}/invoices${qs}`,
    );
  },

  async listEvents(subscriptionId: string): Promise<readonly SubscriptionEvent[]> {
    return apiClient.get<readonly SubscriptionEvent[]>(
      `/api/v1/admin/subscriptions/${encodeURIComponent(subscriptionId)}/events`,
    );
  },

  async changePlan(payload: ChangePlanPayload): Promise<Subscription> {
    return apiClient.post<Subscription>(
      `/api/v1/admin/subscriptions/${encodeURIComponent(payload.subscriptionId)}/change-plan`,
      { planId: payload.planId, prorate: payload.prorate, effectiveDate: payload.effectiveDate, reason: payload.reason },
    );
  },

  async updateSeats(payload: UpdateSeatsPayload): Promise<Subscription> {
    return apiClient.post<Subscription>(
      `/api/v1/admin/subscriptions/${encodeURIComponent(payload.subscriptionId)}/seats`,
      { seatsAllocated: payload.seatsAllocated, reason: payload.reason },
    );
  },

  async cancel(payload: CancelSubscriptionPayload): Promise<Subscription> {
    return apiClient.post<Subscription>(
      `/api/v1/admin/subscriptions/${encodeURIComponent(payload.subscriptionId)}/cancel`,
      {
        cancelAtPeriodEnd: payload.cancelAtPeriodEnd,
        reason: payload.reason,
        feedback: payload.feedback,
      },
    );
  },

  async reactivate(payload: ReactivatePayload): Promise<Subscription> {
    return apiClient.post<Subscription>(
      `/api/v1/admin/subscriptions/${encodeURIComponent(payload.subscriptionId)}/reactivate`,
      { reason: payload.reason },
    );
  },

  async extendTrial(payload: ExtendTrialPayload): Promise<Subscription> {
    return apiClient.post<Subscription>(
      `/api/v1/admin/subscriptions/${encodeURIComponent(payload.subscriptionId)}/extend-trial`,
      { additionalDays: payload.additionalDays, reason: payload.reason },
    );
  },

  async applyCoupon(payload: ApplyCouponPayload): Promise<Subscription> {
    return apiClient.post<Subscription>(
      `/api/v1/admin/subscriptions/${encodeURIComponent(payload.subscriptionId)}/coupons`,
      { couponCode: payload.couponCode },
    );
  },
};

// ---- Reusable validators (client-side, mirrored server-side) ----
// OWASP A03: never trust client validation; always validate again server-side.

export const SUBSCRIPTION_VALIDATORS = {
  coupon: /^[A-Z0-9_-]{3,40}$/,
  reason: { min: 3, max: 500 },
  seats: { min: 1, max: 100_000 },
  trialDays: { min: 1, max: 60 },
} as const;

export function sanitizeText(input: string, max = 500): string {
  // Strip control characters; trim; clamp length. Prevents log injection & weird payloads.
  return input
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, max);
}

export function isValidCoupon(code: string): boolean {
  return SUBSCRIPTION_VALIDATORS.coupon.test(code);
}

export function isValidReason(text: string): boolean {
  const t = sanitizeText(text);
  return (
    t.length >= SUBSCRIPTION_VALIDATORS.reason.min &&
    t.length <= SUBSCRIPTION_VALIDATORS.reason.max
  );
}

export function isValidSeatCount(n: number): boolean {
  return (
    Number.isInteger(n) &&
    n >= SUBSCRIPTION_VALIDATORS.seats.min &&
    n <= SUBSCRIPTION_VALIDATORS.seats.max
  );
}

export function isValidTrialExtension(n: number): boolean {
  return (
    Number.isInteger(n) &&
    n >= SUBSCRIPTION_VALIDATORS.trialDays.min &&
    n <= SUBSCRIPTION_VALIDATORS.trialDays.max
  );
}

// ---- Formatters ----

export function formatCurrency(amountMinor: number, currency: string): string {
  try {
    return new Intl.NumberFormat(undefined, {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
      maximumFractionDigits: 2,
    }).format(amountMinor / 100);
  } catch {
    return `${currency} ${(amountMinor / 100).toFixed(2)}`;
  }
}

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function daysUntil(iso: string | null | undefined): number | null {
  if (!iso) return null;
  const target = new Date(iso).getTime();
  if (Number.isNaN(target)) return null;
  const diff = target - Date.now();
  return Math.ceil(diff / (1000 * 60 * 60 * 24));
}

export const PLAN_TIER_LABELS: Record<PlanTier, string> = {
  starter: 'Starter',
  professional: 'Professional',
  enterprise: 'Enterprise',
  custom: 'Custom',
};

export const INTERVAL_LABELS: Record<BillingInterval, string> = {
  monthly: 'Monthly',
  quarterly: 'Quarterly',
  annual: 'Annual',
};

export const STATUS_LABELS: Record<SubscriptionStatus, string> = {
  trialing: 'Trialing',
  active: 'Active',
  past_due: 'Past Due',
  paused: 'Paused',
  canceled: 'Canceled',
  expired: 'Expired',
  suspended: 'Suspended',
};
