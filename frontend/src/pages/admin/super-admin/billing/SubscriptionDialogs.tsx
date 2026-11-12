// frontend/src/pages/admin/super-admin/billing/SubscriptionDialogs.tsx
import { useCallback, useEffect, useMemo, useState } from 'react';
import { AlertTriangle, CheckCircle2, CreditCard, Loader2, RefreshCw, Tag } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { NativeSelect as Select } from '@/components/ui/select';
import { Textarea } from '@/components/ui/textarea';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Separator } from '@/components/ui/separator';
import { cn } from '@/lib/utils';
import {
  formatCurrency,
  formatDate,
  isValidCoupon,
  isValidReason,
  isValidSeatCount,
  isValidTrialExtension,
  sanitizeText,
} from '@/api/subscriptions';
import type {
  Subscription,
  SubscriptionPlan,
} from '@/types/subscription';

type AsyncState = 'idle' | 'submitting' | 'success' | 'error';

interface BaseDialogProps {
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly subscription: Subscription | null;
}

// ---------- Change Plan ----------
export interface ChangePlanDialogProps extends BaseDialogProps {
  readonly plans: readonly SubscriptionPlan[];
  readonly onConfirm: (args: {
    planId: string;
    prorate: boolean;
    effectiveDate: 'immediate' | 'next_period';
    reason: string;
  }) => Promise<void>;
}

export function ChangePlanDialog({
  open,
  onOpenChange,
  subscription,
  plans,
  onConfirm,
}: ChangePlanDialogProps) {
  const [planId, setPlanId] = useState<string>('');
  const [prorate, setProrate] = useState(true);
  const [effectiveDate, setEffectiveDate] = useState<'immediate' | 'next_period'>('immediate');
  const [reason, setReason] = useState('');
  const [state, setState] = useState<AsyncState>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && subscription) {
      setPlanId(subscription.plan.id);
      setProrate(true);
      setEffectiveDate('immediate');
      setReason('');
      setState('idle');
      setError(null);
    }
  }, [open, subscription]);

  const selectedPlan = useMemo(
    () => plans.find((p) => p.id === planId),
    [plans, planId],
  );

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!subscription || !selectedPlan) return;
      if (!isValidReason(reason)) {
        setError('Please provide a reason (minimum 3 characters).');
        return;
      }
      if (selectedPlan.id === subscription.plan.id && effectiveDate === 'next_period') {
        setError('Select a different plan, or choose immediate effective date.');
        return;
      }
      setState('submitting');
      setError(null);
      try {
        await onConfirm({
          planId: selectedPlan.id,
          prorate,
          effectiveDate,
          reason: sanitizeText(reason),
        });
        setState('success');
        setTimeout(() => onOpenChange(false), 600);
      } catch (err) {
        setState('error');
        setError(err instanceof Error ? err.message : 'Failed to change plan.');
      }
    },
    [subscription, selectedPlan, effectiveDate, prorate, reason, onConfirm, onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" aria-hidden="true" /> Change Subscription Plan
          </DialogTitle>
          <DialogDescription>
            Apply a new plan to{' '}
            <span className="font-medium text-foreground">{subscription?.tenant.name}</span>.
            Changes are recorded in the audit log.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Unable to change plan</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="space-y-2">
            <Label htmlFor="change-plan">New plan</Label>
            <Select
              id="change-plan"
              value={planId}
              onValueChange={setPlanId}
              disabled={state === 'submitting'}
            >
              {plans
                .filter((p) => p.isActive)
                .map((p) => (
                  <option key={p.id} value={p.id}>
                    {p.name} — {formatCurrency(p.amountMinor, p.currency)} / {p.interval}
                  </option>
                ))}
            </Select>
            {selectedPlan ? (
              <p className="text-xs text-muted-foreground">{selectedPlan.description}</p>
            ) : null}
          </div>

          <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="effective-date">Effective</Label>
              <Select
                id="effective-date"
                value={effectiveDate}
                onValueChange={(v) => setEffectiveDate(v as 'immediate' | 'next_period')}
                disabled={state === 'submitting'}
              >
                <option value="immediate">Immediately</option>
                <option value="next_period">Next billing period</option>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="prorate">Proration</Label>
              <Select
                id="prorate"
                value={prorate ? 'yes' : 'no'}
                onValueChange={(v) => setProrate(v === 'yes')}
                disabled={state === 'submitting'}
              >
                <option value="yes">Prorate</option>
                <option value="no">No proration</option>
              </Select>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="change-plan-reason">Reason for change</Label>
            <Textarea
              id="change-plan-reason"
              value={reason}
              onChange={(e) => setReason(sanitizeText(e.target.value))}
              placeholder="Explain why this plan change is being applied…"
              maxLength={500}
              rows={3}
              disabled={state === 'submitting'}
            />
            <p className="text-right text-xs text-muted-foreground">{reason.length}/500</p>
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={state === 'submitting'}>
              Cancel
            </Button>
            <Button type="submit" disabled={state === 'submitting'}>
              {state === 'submitting' ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Applying…</>
              ) : state === 'success' ? (
                <><CheckCircle2 className="mr-2 h-4 w-4" />Applied</>
              ) : (
                'Apply change'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Update Seats ----------
export interface UpdateSeatsDialogProps extends BaseDialogProps {
  readonly onConfirm: (args: { seatsAllocated: number; reason: string }) => Promise<void>;
}

export function UpdateSeatsDialog({
  open,
  onOpenChange,
  subscription,
  onConfirm,
}: UpdateSeatsDialogProps) {
  const [seats, setSeats] = useState<number>(0);
  const [reason, setReason] = useState('');
  const [state, setState] = useState<AsyncState>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open && subscription) {
      setSeats(subscription.seats.seatsAllocated);
      setReason('');
      setState('idle');
      setError(null);
    }
  }, [open, subscription]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!subscription) return;
      if (!isValidSeatCount(seats)) {
        setError('Seat count must be between 1 and 100,000.');
        return;
      }
      if (!isValidReason(reason)) {
        setError('Please provide a reason (minimum 3 characters).');
        return;
      }
      setState('submitting');
      setError(null);
      try {
        await onConfirm({ seatsAllocated: seats, reason: sanitizeText(reason) });
        setState('success');
        setTimeout(() => onOpenChange(false), 600);
      } catch (err) {
        setState('error');
        setError(err instanceof Error ? err.message : 'Failed to update seats.');
      }
    },
    [subscription, seats, reason, onConfirm, onOpenChange],
  );

  const seatDelta = subscription ? seats - subscription.seats.seatsAllocated : 0;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <CreditCard className="h-5 w-5" aria-hidden="true" /> Update Seat Allocation
          </DialogTitle>
          <DialogDescription>
            Adjust licensed seats for{' '}
            <span className="font-medium text-foreground">{subscription?.tenant.name}</span>.
            Billing proration applies on the next invoice.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Unable to update seats</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <div className="grid grid-cols-2 gap-3 text-sm">
            <div className="rounded-md border p-3">
              <p className="text-xs uppercase text-muted-foreground">Allocated</p>
              <p className="text-lg font-semibold">{subscription?.seats.seatsAllocated ?? 0}</p>
            </div>
            <div className="rounded-md border p-3">
              <p className="text-xs uppercase text-muted-foreground">In Use</p>
              <p className="text-lg font-semibold">{subscription?.seats.seatsUsed ?? 0}</p>
            </div>
          </div>

          <div className="space-y-2">
            <Label htmlFor="seat-count">New seat allocation</Label>
            <Input
              id="seat-count"
              type="number"
              inputMode="numeric"
              min={1}
              max={100000}
              step={1}
              value={seats}
              onChange={(e) => {
                const n = Number(e.target.value);
                setSeats(Number.isFinite(n) ? n : 0);
              }}
              disabled={state === 'submitting'}
            />
            {seatDelta !== 0 ? (
              <p
                className={cn(
                  'text-xs',
                  seatDelta > 0
                    ? 'text-emerald-600 dark:text-emerald-400'
                    : 'text-rose-600 dark:text-rose-400',
                )}
              >
                {seatDelta > 0 ? `+${seatDelta}` : seatDelta} seats
              </p>
            ) : null}
          </div>

          <div className="space-y-2">
            <Label htmlFor="seat-reason">Reason</Label>
            <Textarea
              id="seat-reason"
              value={reason}
              onChange={(e) => setReason(sanitizeText(e.target.value))}
              placeholder="e.g. Tenant expanded clinic, or reduced onboarding…"
              rows={3}
              maxLength={500}
              disabled={state === 'submitting'}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={state === 'submitting'}>
              Cancel
            </Button>
            <Button type="submit" disabled={state === 'submitting'}>
              {state === 'submitting' ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Saving…</>
              ) : (
                'Update seats'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Cancel ----------
export interface CancelSubscriptionDialogProps extends BaseDialogProps {
  readonly onConfirm: (args: {
    cancelAtPeriodEnd: boolean;
    reason: string;
    feedback?: string;
  }) => Promise<void>;
}

export function CancelSubscriptionDialog({
  open,
  onOpenChange,
  subscription,
  onConfirm,
}: CancelSubscriptionDialogProps) {
  const [cancelAtPeriodEnd, setCancelAtPeriodEnd] = useState(true);
  const [reason, setReason] = useState('');
  const [feedback, setFeedback] = useState('');
  const [state, setState] = useState<AsyncState>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setCancelAtPeriodEnd(true);
      setReason('');
      setFeedback('');
      setState('idle');
      setError(null);
    }
  }, [open]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!subscription) return;
      if (!isValidReason(reason)) {
        setError('Please provide a reason (minimum 3 characters).');
        return;
      }
      setState('submitting');
      setError(null);
      try {
        await onConfirm({
          cancelAtPeriodEnd,
          reason: sanitizeText(reason),
          feedback: feedback ? sanitizeText(feedback, 1000) : undefined,
        });
        setState('success');
        setTimeout(() => onOpenChange(false), 600);
      } catch (err) {
        setState('error');
        setError(err instanceof Error ? err.message : 'Failed to cancel subscription.');
      }
    },
    [subscription, cancelAtPeriodEnd, reason, feedback, onConfirm, onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 text-rose-600 dark:text-rose-400">
            <AlertTriangle className="h-5 w-5" aria-hidden="true" /> Cancel Subscription
          </DialogTitle>
          <DialogDescription>
            You are about to cancel the subscription for{' '}
            <span className="font-medium text-foreground">{subscription?.tenant.name}</span>.
            This action is recorded and may trigger a customer email.
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Unable to cancel</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}

          <Alert>
            <AlertTitle>Choose cancellation timing</AlertTitle>
            <AlertDescription className="mt-2 space-y-2">
              <label className="flex cursor-pointer items-start gap-2">
                <input
                  type="radio"
                  className="mt-1"
                  name="cancel-timing"
                  checked={cancelAtPeriodEnd}
                  onChange={() => setCancelAtPeriodEnd(true)}
                />
                <span>
                  <span className="font-medium">Cancel at period end</span>
                  <span className="block text-xs text-muted-foreground">
                    Keeps service until the end of the current billing period.
                  </span>
                </span>
              </label>
              <label className="flex cursor-pointer items-start gap-2">
                <input
                  type="radio"
                  className="mt-1"
                  name="cancel-timing"
                  checked={!cancelAtPeriodEnd}
                  onChange={() => setCancelAtPeriodEnd(false)}
                />
                <span>
                  <span className="font-medium">Cancel immediately</span>
                  <span className="block text-xs text-muted-foreground">
                    Revokes access now. Does not auto-refund by default.
                  </span>
                </span>
              </label>
            </AlertDescription>
          </Alert>

          <div className="space-y-2">
            <Label htmlFor="cancel-reason">Reason</Label>
            <Textarea
              id="cancel-reason"
              value={reason}
              onChange={(e) => setReason(sanitizeText(e.target.value))}
              placeholder="e.g. Tenant requested downgrade, or account closure…"
              rows={3}
              maxLength={500}
              disabled={state === 'submitting'}
            />
          </div>

          <div className="space-y-2">
            <Label htmlFor="cancel-feedback">Internal notes (optional)</Label>
            <Textarea
              id="cancel-feedback"
              value={feedback}
              onChange={(e) => setFeedback(sanitizeText(e.target.value, 1000))}
              placeholder="Additional context for the account team…"
              rows={2}
              maxLength={1000}
              disabled={state === 'submitting'}
            />
          </div>

          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={state === 'submitting'}>
              Keep subscription
            </Button>
            <Button
              type="submit"
              variant="destructive"
              disabled={state === 'submitting'}
            >
              {state === 'submitting' ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Canceling…</>
              ) : state === 'success' ? (
                <><CheckCircle2 className="mr-2 h-4 w-4" />Canceled</>
              ) : (
                'Confirm cancellation'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Reactivate ----------
export interface ReactivateDialogProps extends BaseDialogProps {
  readonly onConfirm: (args: { reason: string }) => Promise<void>;
}

export function ReactivateDialog({
  open,
  onOpenChange,
  subscription,
  onConfirm,
}: ReactivateDialogProps) {
  const [reason, setReason] = useState('');
  const [state, setState] = useState<AsyncState>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setReason('');
      setState('idle');
      setError(null);
    }
  }, [open]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!subscription) return;
      if (!isValidReason(reason)) {
        setError('Please provide a reason (minimum 3 characters).');
        return;
      }
      setState('submitting');
      setError(null);
      try {
        await onConfirm({ reason: sanitizeText(reason) });
        setState('success');
        setTimeout(() => onOpenChange(false), 600);
      } catch (err) {
        setState('error');
        setError(err instanceof Error ? err.message : 'Failed to reactivate.');
      }
    },
    [subscription, reason, onConfirm, onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-lg">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" aria-hidden="true" /> Reactivate Subscription
          </DialogTitle>
          <DialogDescription>
            Reactivate{' '}
            <span className="font-medium text-foreground">{subscription?.tenant.name}</span>'s
            subscription and resume billing from today.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Unable to reactivate</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="reactivate-reason">Reason</Label>
            <Textarea
              id="reactivate-reason"
              value={reason}
              onChange={(e) => setReason(sanitizeText(e.target.value))}
              rows={3}
              maxLength={500}
              disabled={state === 'submitting'}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={state === 'submitting'}>
              Cancel
            </Button>
            <Button type="submit" disabled={state === 'submitting'}>
              {state === 'submitting' ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Reactivating…</>
              ) : (
                'Reactivate'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Extend Trial ----------
export interface ExtendTrialDialogProps extends BaseDialogProps {
  readonly onConfirm: (args: { additionalDays: number; reason: string }) => Promise<void>;
}

export function ExtendTrialDialog({
  open,
  onOpenChange,
  subscription,
  onConfirm,
}: ExtendTrialDialogProps) {
  const [days, setDays] = useState(14);
  const [reason, setReason] = useState('');
  const [state, setState] = useState<AsyncState>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setDays(14);
      setReason('');
      setState('idle');
      setError(null);
    }
  }, [open]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!subscription) return;
      if (!isValidTrialExtension(days)) {
        setError('Extension must be between 1 and 60 days.');
        return;
      }
      if (!isValidReason(reason)) {
        setError('Please provide a reason (minimum 3 characters).');
        return;
      }
      setState('submitting');
      setError(null);
      try {
        await onConfirm({ additionalDays: days, reason: sanitizeText(reason) });
        setState('success');
        setTimeout(() => onOpenChange(false), 600);
      } catch (err) {
        setState('error');
        setError(err instanceof Error ? err.message : 'Failed to extend trial.');
      }
    },
    [subscription, days, reason, onConfirm, onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <RefreshCw className="h-5 w-5" aria-hidden="true" /> Extend Trial
          </DialogTitle>
          <DialogDescription>
            Extend the trial period for{' '}
            <span className="font-medium text-foreground">{subscription?.tenant.name}</span>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Unable to extend</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="trial-days">Additional days</Label>
            <Input
              id="trial-days"
              type="number"
              min={1}
              max={60}
              value={days}
              onChange={(e) => setDays(Number(e.target.value) || 0)}
              disabled={state === 'submitting'}
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="trial-reason">Reason</Label>
            <Textarea
              id="trial-reason"
              value={reason}
              onChange={(e) => setReason(sanitizeText(e.target.value))}
              rows={2}
              maxLength={500}
              disabled={state === 'submitting'}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={state === 'submitting'}>
              Cancel
            </Button>
            <Button type="submit" disabled={state === 'submitting'}>
              {state === 'submitting' ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Extending…</>
              ) : (
                'Extend trial'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------- Apply Coupon ----------
export interface ApplyCouponDialogProps extends BaseDialogProps {
  readonly onConfirm: (args: { couponCode: string }) => Promise<void>;
}

export function ApplyCouponDialog({
  open,
  onOpenChange,
  subscription,
  onConfirm,
}: ApplyCouponDialogProps) {
  const [code, setCode] = useState('');
  const [state, setState] = useState<AsyncState>('idle');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (open) {
      setCode('');
      setState('idle');
      setError(null);
    }
  }, [open]);

  const handleSubmit = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!subscription) return;
      if (!isValidCoupon(code)) {
        setError('Coupon must be 3-40 characters, uppercase letters, digits, dash, or underscore.');
        return;
      }
      setState('submitting');
      setError(null);
      try {
        await onConfirm({ couponCode: code.trim().toUpperCase() });
        setState('success');
        setTimeout(() => onOpenChange(false), 600);
      } catch (err) {
        setState('error');
        setError(err instanceof Error ? err.message : 'Failed to apply coupon.');
      }
    },
    [subscription, code, onConfirm, onOpenChange],
  );

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            <Tag className="h-5 w-5" aria-hidden="true" /> Apply Coupon
          </DialogTitle>
          <DialogDescription>
            Apply a promotional discount to{' '}
            <span className="font-medium text-foreground">{subscription?.tenant.name}</span>.
          </DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="space-y-4">
          {error ? (
            <Alert variant="destructive">
              <AlertTriangle className="h-4 w-4" />
              <AlertTitle>Unable to apply coupon</AlertTitle>
              <AlertDescription>{error}</AlertDescription>
            </Alert>
          ) : null}
          <div className="space-y-2">
            <Label htmlFor="coupon-code">Coupon code</Label>
            <Input
              id="coupon-code"
              value={code}
              onChange={(e) => setCode(e.target.value.toUpperCase())}
              placeholder="e.g. CARESYNC10"
              autoComplete="off"
              spellCheck={false}
              maxLength={40}
              disabled={state === 'submitting'}
            />
          </div>
          <DialogFooter className="gap-2">
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)} disabled={state === 'submitting'}>
              Cancel
            </Button>
            <Button type="submit" disabled={state === 'submitting'}>
              {state === 'submitting' ? (
                <><Loader2 className="mr-2 h-4 w-4 animate-spin" />Applying…</>
              ) : (
                'Apply coupon'
              )}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}

// ---------- View Detail Drawer ----------
export interface SubscriptionDetailDrawerProps extends BaseDialogProps {
  readonly invoicesPage?: number;
}

export function SubscriptionDetailDrawer({
  open,
  onOpenChange,
  subscription,
  invoicesPage = 1,
}: SubscriptionDetailDrawerProps) {
  if (!subscription) return null;
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl">
        <DialogHeader>
          <DialogTitle>Subscription detail</DialogTitle>
          <DialogDescription>
            Review plan, seats, and lifecycle events. Invoice history requires a connected billing provider.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4">
          <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
            <StatBlock label="Plan" value={subscription.plan.name} />
            <StatBlock label="Status" value={subscription.status} />
            <StatBlock
              label="MRR"
              value={formatCurrency(subscription.mrrMinor, subscription.currency)}
            />
            <StatBlock
              label="Renews"
              value={formatDate(subscription.currentPeriodEnd)}
            />
          </div>

          <Separator />
          <p className="text-xs text-muted-foreground">
            Invoice history is not configured in this deployment. No invoice records are generated or synchronized here.
          </p>
        </div>
      </DialogContent>
    </Dialog>
  );
}

function StatBlock({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="font-medium">{value}</p>
    </div>
  );
}
