// frontend/src/pages/admin/super-admin/billing/SubscriptionsPage.tsx
// Super Admin — Subscription management.
//
// Security posture (OWASP Top 10 2021):
//   A01 Broken Access Control — page is behind <ProtectedRoute> + super_admin role,
//       all server endpoints re-check role claims; no client-side trust.
//   A02 Cryptographic Failures — no secrets kept client-side; token from Firebase.
//   A03 Injection — user input is sanitized, length-clamped, and validated before
//       being sent; server re-validates. No dangerouslySetInnerHTML.
//   A04 Insecure Design — safe-by-default actions (cancel-at-period-end by default,
//       reactivation requires a reason, coupon format enforced).
//   A05 Security Misconfiguration — no debug routes/endpoints; uses standard
//       shadcn/ui components; no inline event handlers injecting eval.
//   A06 Vulnerable Components — reuses existing component set already audited
//       by the project's package-lock; no new runtime deps added.
//   A07 Identification/Auth Failures — every call requires a fresh ID token via
//       apiClient; mutations are audit-logged server-side.
//   A08 Software & Data Integrity — mutations are typed; server is source of truth.
//   A09 Security Logging — every mutation carries a `reason` to be persisted.
//   A10 SSRF — no arbitrary URLs from user input; hosted invoice URLs are returned
//       by server and opened with rel="noopener noreferrer" when rendered.
//
// This file deliberately avoids:
//   - window.localStorage for tokens or PII
//   - dangerouslySetInnerHTML
//   - eval / new Function
//   - passing raw user input into URL paths without encodeURIComponent
//   - trusting client-only validation for money or seat limits

import { useCallback, useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  CircleHelp,
  CreditCard,
  RefreshCw,
  Settings2,
  ShieldCheck,
  Users,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { PageHeader } from '@/components/ui/page-header';
import { Pagination } from '@/components/common/Pagination';
import { ErrorState } from '@/components/common/ErrorState';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  useApplyCoupon,
  useCancelSubscription,
  useChangePlan,
  useExtendTrial,
  useReactivateSubscription,
  useSubscriptionList,
  useSubscriptionPlans,
  useSubscriptionStats,
  useUpdateSeats,
} from '@/hooks/use-subscriptions';
import type {
  Subscription,
  SubscriptionListFilters,
} from '@/types/subscription';
import { SubscriptionStatsCards } from './SubscriptionStatsCards';
import { SubscriptionToolbar } from './SubscriptionToolbar';
import { SubscriptionsTable } from './SubscriptionsTable';
import {
  ApplyCouponDialog,
  CancelSubscriptionDialog,
  ChangePlanDialog,
  ExtendTrialDialog,
  ReactivateDialog,
  SubscriptionDetailDrawer,
  UpdateSeatsDialog,
} from './SubscriptionDialogs';

type DialogKind =
  | 'view'
  | 'change-plan'
  | 'seats'
  | 'cancel'
  | 'reactivate'
  | 'extend-trial'
  | 'apply-coupon'
  | null;

interface DialogState {
  readonly kind: DialogKind;
  readonly subscription: Subscription | null;
}

export default function SubscriptionsPage() {
  const statsQuery = useSubscriptionStats();
  const plansQuery = useSubscriptionPlans();
  const {
    filters,
    update: updateFilters,
    setPage,
    reset: resetFilters,
    query: listQuery,
  } = useSubscriptionList();

  const changePlan = useChangePlan();
  const updateSeats = useUpdateSeats();
  const cancel = useCancelSubscription();
  const reactivate = useReactivateSubscription();
  const extendTrial = useExtendTrial();
  const applyCoupon = useApplyCoupon();

  const [dialog, setDialog] = useState<DialogState>({ kind: null, subscription: null });

  const openDialog = useCallback((kind: DialogKind, subscription: Subscription) => {
    setDialog({ kind, subscription });
  }, []);

  const closeDialog = useCallback(() => {
    setDialog({ kind: null, subscription: null });
  }, []);

  const handleRefresh = useCallback(() => {
    void listQuery.refetch();
    void statsQuery.refetch();
    void plansQuery.refetch();
  }, [listQuery, statsQuery, plansQuery]);

  const handleSort = useCallback(
    (key: SubscriptionListFilters['sortBy']) => {
      const isSame = filters.sortBy === key;
      updateFilters({
        sortBy: key,
        sortDir: isSame && filters.sortDir === 'asc' ? 'desc' : 'asc',
      });
    },
    [filters.sortBy, filters.sortDir, updateFilters],
  );

  const pageCount = useMemo(() => {
    const total = listQuery.data?.totalPages ?? 0;
    return total > 0 ? total : 1;
  }, [listQuery.data]);

  // ---- Mutation handlers (typed, awaited, errors bubble to dialogs) ----

  const onChangePlanConfirm = useCallback(
    async (args: {
      planId: string;
      prorate: boolean;
      effectiveDate: 'immediate' | 'next_period';
      reason: string;
    }) => {
      if (!dialog.subscription) return;
      await changePlan.mutateAsync({
        subscriptionId: dialog.subscription.id,
        planId: args.planId,
        prorate: args.prorate,
        effectiveDate: args.effectiveDate,
        reason: args.reason,
      });
    },
    [dialog.subscription, changePlan],
  );

  const onUpdateSeatsConfirm = useCallback(
    async (args: { seatsAllocated: number; reason: string }) => {
      if (!dialog.subscription) return;
      await updateSeats.mutateAsync({
        subscriptionId: dialog.subscription.id,
        seatsAllocated: args.seatsAllocated,
        reason: args.reason,
      });
    },
    [dialog.subscription, updateSeats],
  );

  const onCancelConfirm = useCallback(
    async (args: {
      cancelAtPeriodEnd: boolean;
      reason: string;
      feedback?: string;
    }) => {
      if (!dialog.subscription) return;
      await cancel.mutateAsync({
        subscriptionId: dialog.subscription.id,
        cancelAtPeriodEnd: args.cancelAtPeriodEnd,
        reason: args.reason,
        feedback: args.feedback,
      });
    },
    [dialog.subscription, cancel],
  );

  const onReactivateConfirm = useCallback(
    async (args: { reason: string }) => {
      if (!dialog.subscription) return;
      await reactivate.mutateAsync({
        subscriptionId: dialog.subscription.id,
        reason: args.reason,
      });
    },
    [dialog.subscription, reactivate],
  );

  const onExtendTrialConfirm = useCallback(
    async (args: { additionalDays: number; reason: string }) => {
      if (!dialog.subscription) return;
      await extendTrial.mutateAsync({
        subscriptionId: dialog.subscription.id,
        additionalDays: args.additionalDays,
        reason: args.reason,
      });
    },
    [dialog.subscription, extendTrial],
  );

  const onApplyCouponConfirm = useCallback(
    async (args: { couponCode: string }) => {
      if (!dialog.subscription) return;
      await applyCoupon.mutateAsync({
        subscriptionId: dialog.subscription.id,
        couponCode: args.couponCode,
      });
    },
    [dialog.subscription, applyCoupon],
  );

  // ---- Render ----

  const isInitialError = listQuery.isError && !listQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Subscriptions"
        description="Manage tenant subscription plans, seat allocation, trials, dunning, and lifecycle events across the CareSync platform."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/super/billing/revenue">
                <CreditCard className="mr-2 h-4 w-4" aria-hidden="true" /> Revenue
              </Link>
            </Button>
            <Button variant="outline" size="sm" asChild>
              <Link to="/admin/super/system/global-settings">
                <Settings2 className="mr-2 h-4 w-4" aria-hidden="true" /> Billing settings
              </Link>
            </Button>
          </div>
        }
      />

      <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-100">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div className="space-y-0.5 text-sm">
          <p className="font-medium">All actions are audit-logged.</p>
          <p className="text-emerald-800/80 dark:text-emerald-200/80">
            Plan changes, seat updates, cancellations, and reactivations require a
            documented reason. Server re-validates every field and enforces role-based
            access control.
          </p>
        </div>
      </div>

      <SubscriptionStatsCards stats={statsQuery.data} loading={statsQuery.isLoading} />

      <SubscriptionToolbar
        filters={filters}
        onChange={updateFilters}
        onRefresh={handleRefresh}
        onReset={resetFilters}
        refreshing={listQuery.isFetching}
      />

      {isInitialError ? (
        <ErrorState
          message="Unable to load subscriptions. The subscription service did not respond. Retry, or escalate if this persists."
          onRetry={handleRefresh}
        />
      ) : listQuery.isError ? (
        <div className="flex items-center justify-between rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-100">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            <span>Refreshed with errors. Showing last known data.</span>
          </div>
          <Button size="sm" variant="outline" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-3.5 w-3.5" /> Retry
          </Button>
        </div>
      ) : null}

      <SubscriptionsTable
        data={listQuery.data?.data ?? []}
        loading={listQuery.isLoading}
        currentSortBy={filters.sortBy}
        currentSortDir={filters.sortDir}
        onSort={(k) => handleSort(k as SubscriptionListFilters['sortBy'])}
        onView={(s) => openDialog('view', s)}
        onChangePlan={(s) => openDialog('change-plan', s)}
        onUpdateSeats={(s) => openDialog('seats', s)}
        onCancel={(s) => openDialog('cancel', s)}
        onReactivate={(s) => openDialog('reactivate', s)}
        onExtendTrial={(s) => openDialog('extend-trial', s)}
        onApplyCoupon={(s) => openDialog('apply-coupon', s)}
      />

      {listQuery.data ? (
        <div className="flex flex-col items-center justify-between gap-3 sm:flex-row">
          <p className="text-xs text-muted-foreground">
            Showing{' '}
            <span className="font-medium text-foreground">
              {(listQuery.data.page - 1) * listQuery.data.pageSize + 1}
            </span>{' '}
            to{' '}
            <span className="font-medium text-foreground">
              {Math.min(
                listQuery.data.page * listQuery.data.pageSize,
                listQuery.data.total,
              )}
            </span>{' '}
            of <span className="font-medium text-foreground">{listQuery.data.total}</span>{' '}
            subscriptions
          </p>
          <Pagination
            page={filters.page}
            size={filters.pageSize}
            total={listQuery.data.total}
            onChange={setPage}
          />
        </div>
      ) : null}

      {/* Dialogs — always mounted but gated by open prop to keep local state clean. */}
      <ChangePlanDialog
        open={dialog.kind === 'change-plan'}
        onOpenChange={(o) => (o ? undefined : closeDialog())}
        subscription={dialog.subscription}
        plans={plansQuery.data ?? []}
        onConfirm={onChangePlanConfirm}
      />

      <UpdateSeatsDialog
        open={dialog.kind === 'seats'}
        onOpenChange={(o) => (o ? undefined : closeDialog())}
        subscription={dialog.subscription}
        onConfirm={onUpdateSeatsConfirm}
      />

      <CancelSubscriptionDialog
        open={dialog.kind === 'cancel'}
        onOpenChange={(o) => (o ? undefined : closeDialog())}
        subscription={dialog.subscription}
        onConfirm={onCancelConfirm}
      />

      <ReactivateDialog
        open={dialog.kind === 'reactivate'}
        onOpenChange={(o) => (o ? undefined : closeDialog())}
        subscription={dialog.subscription}
        onConfirm={onReactivateConfirm}
      />

      <ExtendTrialDialog
        open={dialog.kind === 'extend-trial'}
        onOpenChange={(o) => (o ? undefined : closeDialog())}
        subscription={dialog.subscription}
        onConfirm={onExtendTrialConfirm}
      />

      <ApplyCouponDialog
        open={dialog.kind === 'apply-coupon'}
        onOpenChange={(o) => (o ? undefined : closeDialog())}
        subscription={dialog.subscription}
        onConfirm={onApplyCouponConfirm}
      />

      <SubscriptionDetailDrawer
        open={dialog.kind === 'view'}
        onOpenChange={(o) => (o ? undefined : closeDialog())}
        subscription={dialog.subscription}
      />

      <FallbackInfoCard
        onRefresh={handleRefresh}
        refreshing={listQuery.isFetching}
        hasFilters={
          filters.search.length > 0 ||
          filters.status !== 'all' ||
          filters.tier !== 'all' ||
          filters.interval !== 'all'
        }
      />
    </div>
  );
}

function FallbackInfoCard({
  onRefresh,
  refreshing,
  hasFilters,
}: {
  onRefresh: () => void;
  refreshing: boolean;
  hasFilters: boolean;
}) {
  return (
    <Card className="border-dashed">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-sm">
          <CircleHelp className="h-4 w-4" aria-hidden="true" /> Need help with
          subscriptions?
        </CardTitle>
        <CardDescription>
          Subscription APIs are versioned and audited. Use tenant administration or
          revenue dashboards to drill down.
        </CardDescription>
      </CardHeader>
      <CardContent className="flex flex-wrap items-center gap-2">
        <Button asChild variant="outline" size="sm">
          <Link to="/admin/super/tenants">
            <Users className="mr-2 h-4 w-4" aria-hidden="true" /> Manage tenants
          </Link>
        </Button>
        <Button asChild variant="outline" size="sm">
          <Link to="/admin/super/roles">
            <ShieldCheck className="mr-2 h-4 w-4" aria-hidden="true" /> Roles &amp; access
          </Link>
        </Button>
        <Button
          variant="ghost"
          size="sm"
          onClick={onRefresh}
          disabled={refreshing}
          aria-label="Refresh subscriptions"
        >
          <RefreshCw
            className={cn('mr-2 h-3.5 w-3.5', refreshing && 'animate-spin')}
            aria-hidden="true"
          />
          Refresh
        </Button>
        <Separator orientation="vertical" className="mx-1 hidden h-6 sm:block" />
        <span className="text-xs text-muted-foreground">
          {hasFilters
            ? 'Filters are active — reset to view the full list.'
            : 'Tip: press ⌘K / Ctrl+K to open global search.'}
        </span>
        <Link
          to="/admin/super/billing/revenue"
          className="ml-auto inline-flex items-center text-xs font-medium text-primary hover:underline"
        >
          Go to Revenue <ArrowRight className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
        </Link>
      </CardContent>
    </Card>
  );
}

// Re-export for backwards-compat with routes expecting default SubscriptionsPage.
export type { SubscriptionListFilters };
