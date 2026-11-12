// frontend/src/pages/admin/super-admin/billing/SubscriptionStatusBadge.tsx
import { AlertCircle, CheckCircle2, Clock, PauseCircle, ShieldOff, Timer, XCircle } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { SubscriptionStatus } from '@/types/subscription';

const STATUS_STYLES: Record<
  SubscriptionStatus,
  { label: string; className: string; Icon: typeof CheckCircle2 }
> = {
  trialing: {
    label: 'Trialing',
    className:
      'bg-sky-500/10 text-sky-700 border-sky-500/30 dark:text-sky-300 dark:border-sky-500/30',
    Icon: Timer,
  },
  active: {
    label: 'Active',
    className:
      'bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-300 dark:border-emerald-500/30',
    Icon: CheckCircle2,
  },
  past_due: {
    label: 'Past Due',
    className:
      'bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-300 dark:border-amber-500/30',
    Icon: Clock,
  },
  paused: {
    label: 'Paused',
    className:
      'bg-slate-500/10 text-slate-700 border-slate-500/30 dark:text-slate-300 dark:border-slate-500/30',
    Icon: PauseCircle,
  },
  canceled: {
    label: 'Canceled',
    className:
      'bg-rose-500/10 text-rose-700 border-rose-500/30 dark:text-rose-300 dark:border-rose-500/30',
    Icon: XCircle,
  },
  expired: {
    label: 'Expired',
    className:
      'bg-zinc-500/10 text-zinc-700 border-zinc-500/30 dark:text-zinc-300 dark:border-zinc-500/30',
    Icon: AlertCircle,
  },
  suspended: {
    label: 'Suspended',
    className:
      'bg-fuchsia-500/10 text-fuchsia-700 border-fuchsia-500/30 dark:text-fuchsia-300 dark:border-fuchsia-500/30',
    Icon: ShieldOff,
  },
};

export interface SubscriptionStatusBadgeProps {
  readonly status: SubscriptionStatus;
  readonly className?: string;
}

export function SubscriptionStatusBadge({ status, className }: SubscriptionStatusBadgeProps) {
  const config = STATUS_STYLES[status];
  const Icon = config.Icon;
  return (
    <Badge variant="outline" className={cn('gap-1 font-medium', config.className, className)}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {config.label}
    </Badge>
  );
}