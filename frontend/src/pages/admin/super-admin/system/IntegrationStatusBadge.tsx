// frontend/src/pages/admin/super-admin/system/IntegrationStatusBadge.tsx
import { AlertCircle, CheckCircle2, HelpCircle, ShieldOff, TriangleAlert } from 'lucide-react';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import type { IntegrationStatus } from '@/types/integration';

const STATUS_STYLES: Record<
  IntegrationStatus,
  { label: string; className: string; Icon: typeof CheckCircle2 }
> = {
  healthy: {
    label: 'Healthy',
    className:
      'bg-emerald-500/10 text-emerald-700 border-emerald-500/30 dark:text-emerald-300 dark:border-emerald-500/30',
    Icon: CheckCircle2,
  },
  degraded: {
    label: 'Degraded',
    className:
      'bg-amber-500/10 text-amber-700 border-amber-500/30 dark:text-amber-300 dark:border-amber-500/30',
    Icon: TriangleAlert,
  },
  unavailable: {
    label: 'Unavailable',
    className:
      'bg-rose-500/10 text-rose-700 border-rose-500/30 dark:text-rose-300 dark:border-rose-500/30',
    Icon: AlertCircle,
  },
  unconfigured: {
    label: 'Unconfigured',
    className:
      'bg-slate-500/10 text-slate-700 border-slate-500/30 dark:text-slate-300 dark:border-slate-500/30',
    Icon: ShieldOff,
  },
  unknown: {
    label: 'Unknown',
    className:
      'bg-zinc-500/10 text-zinc-700 border-zinc-500/30 dark:text-zinc-300 dark:border-zinc-500/30',
    Icon: HelpCircle,
  },
};

export function IntegrationStatusBadge({
  status,
  className,
}: {
  status: IntegrationStatus;
  className?: string;
}) {
  const c = STATUS_STYLES[status];
  const Icon = c.Icon;
  return (
    <Badge variant="outline" className={cn('gap-1 font-medium', c.className, className)}>
      <Icon className="h-3.5 w-3.5" aria-hidden="true" />
      {c.label}
    </Badge>
  );
}