// frontend/src/types/subscription.ts
// Domain types for super-admin subscription management.
// Kept framework-agnostic and strictly typed for OWASP A03 (Injection) & A08 (Integrity).

export type BillingInterval = 'monthly' | 'quarterly' | 'annual';

export type SubscriptionStatus =
  | 'trialing'
  | 'active'
  | 'past_due'
  | 'paused'
  | 'canceled'
  | 'expired'
  | 'suspended';

export type PlanTier = 'starter' | 'professional' | 'enterprise' | 'custom';

export type CurrencyCode = 'ZAR' | 'USD' | 'EUR' | 'GBP';

export type PaymentMethodType = 'card' | 'eft' | 'debit_order' | 'manual' | 'invoice';

export type InvoiceStatus =
  | 'draft'
  | 'open'
  | 'paid'
  | 'void'
  | 'uncollectible'
  | 'refunded';

export interface PlanFeature {
  readonly key: string;
  readonly label: string;
  readonly included: boolean;
  readonly limit?: number | null;
}

export interface SubscriptionPlan {
  readonly id: string;
  readonly code: string;
  readonly name: string;
  readonly tier: PlanTier;
  readonly description: string;
  readonly currency: CurrencyCode;
  /** Amount in minor units (cents). Never trust client-side money floats. */
  readonly amountMinor: number;
  readonly interval: BillingInterval;
  readonly trialDays: number;
  readonly seatLimit: number | null;
  readonly features: readonly PlanFeature[];
  readonly isActive: boolean;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface TenantRef {
  readonly id: string;
  readonly name: string;
  readonly slug: string;
  readonly region?: string;
}

export interface SubscriptionSeatUsage {
  readonly seatsAllocated: number;
  readonly seatsUsed: number;
  readonly seatLimit: number | null;
}

export interface Subscription {
  readonly id: string;
  readonly tenant: TenantRef;
  readonly plan: Pick<
    SubscriptionPlan,
    'id' | 'code' | 'name' | 'tier' | 'currency' | 'amountMinor' | 'interval'
  >;
  readonly status: SubscriptionStatus;
  readonly currentPeriodStart: string;
  readonly currentPeriodEnd: string;
  readonly trialEndsAt: string | null;
  readonly cancelAtPeriodEnd: boolean;
  readonly canceledAt: string | null;
  readonly seats: SubscriptionSeatUsage;
  readonly mrrMinor: number;
  readonly currency: CurrencyCode;
  readonly paymentMethod: PaymentMethodType;
  readonly dunningAttempts: number;
  readonly lastPaymentAt: string | null;
  readonly nextInvoiceAt: string | null;
  readonly createdAt: string;
  readonly updatedAt: string;
}

export interface SubscriptionInvoice {
  readonly id: string;
  readonly subscriptionId: string;
  readonly tenantId: string;
  readonly number: string;
  readonly status: InvoiceStatus;
  readonly currency: CurrencyCode;
  readonly subtotalMinor: number;
  readonly taxMinor: number;
  readonly totalMinor: number;
  readonly amountPaidMinor: number;
  readonly amountDueMinor: number;
  readonly issuedAt: string;
  readonly dueAt: string;
  readonly paidAt: string | null;
  readonly hostedInvoiceUrl: string | null;
  readonly periodStart: string;
  readonly periodEnd: string;
}

export interface SubscriptionEvent {
  readonly id: string;
  readonly subscriptionId: string;
  readonly actorId: string;
  readonly actorName: string;
  readonly action:
    | 'created'
    | 'plan_changed'
    | 'status_changed'
    | 'seats_updated'
    | 'canceled'
    | 'reactivated'
    | 'invoice_paid'
    | 'invoice_failed'
    | 'trial_extended'
    | 'coupon_applied';
  readonly description: string;
  readonly metadata?: Record<string, string | number | boolean | null>;
  readonly occurredAt: string;
}

export interface SubscriptionStats {
  readonly totalSubscriptions: number;
  readonly active: number;
  readonly trialing: number;
  readonly pastDue: number;
  readonly canceled: number;
  readonly mrrMinor: number;
  readonly arrMinor: number;
  readonly churnRatePercent: number;
  readonly currency: CurrencyCode;
}

export interface SubscriptionListFilters {
  readonly search: string;
  readonly status: SubscriptionStatus | 'all';
  readonly tier: PlanTier | 'all';
  readonly interval: BillingInterval | 'all';
  readonly page: number;
  readonly pageSize: number;
  readonly sortBy:
    | 'tenant'
    | 'status'
    | 'mrr'
    | 'currentPeriodEnd'
    | 'createdAt';
  readonly sortDir: 'asc' | 'desc';
}

export interface PaginatedResult<T> {
  readonly data: readonly T[];
  readonly total: number;
  readonly page: number;
  readonly pageSize: number;
  readonly totalPages: number;
}

// ---- Action payloads (validated server-side) ----

export interface ChangePlanPayload {
  readonly subscriptionId: string;
  readonly planId: string;
  readonly prorate: boolean;
  readonly effectiveDate: 'immediate' | 'next_period';
  readonly reason: string;
}

export interface UpdateSeatsPayload {
  readonly subscriptionId: string;
  readonly seatsAllocated: number;
  readonly reason: string;
}

export interface CancelSubscriptionPayload {
  readonly subscriptionId: string;
  readonly cancelAtPeriodEnd: boolean;
  readonly reason: string;
  readonly feedback?: string;
}

export interface ExtendTrialPayload {
  readonly subscriptionId: string;
  readonly additionalDays: number;
  readonly reason: string;
}

export interface ReactivatePayload {
  readonly subscriptionId: string;
  readonly reason: string;
}

export interface ApplyCouponPayload {
  readonly subscriptionId: string;
  readonly couponCode: string;
}
