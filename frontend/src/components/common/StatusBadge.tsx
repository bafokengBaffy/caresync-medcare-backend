import { Badge } from '@/components/ui/badge';

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, { variant: 'default' | 'secondary' | 'destructive' | 'success' | 'warning' | 'outline'; label: string }> = {
    SCHEDULED: { variant: 'outline', label: 'Scheduled' },
    CONFIRMED: { variant: 'secondary', label: 'Confirmed' },
    CHECKED_IN: { variant: 'warning', label: 'Checked In' },
    IN_PROGRESS: { variant: 'warning', label: 'In Progress' },
    COMPLETED: { variant: 'success', label: 'Completed' },
    CANCELLED: { variant: 'destructive', label: 'Cancelled' },
    NO_SHOW: { variant: 'destructive', label: 'No Show' },
    DRAFT: { variant: 'outline', label: 'Draft' },
    SIGNED: { variant: 'success', label: 'Signed' },
    AMENDED: { variant: 'warning', label: 'Amended' },
    LOCKED: { variant: 'secondary', label: 'Locked' },
    ISSUED: { variant: 'secondary', label: 'Issued' },
    PAID: { variant: 'success', label: 'Paid' },
    PARTIALLY_PAID: { variant: 'warning', label: 'Partially Paid' },
    OVERDUE: { variant: 'destructive', label: 'Overdue' },
    VOID: { variant: 'outline', label: 'Void' },
    PENDING: { variant: 'warning', label: 'Pending' },
    FAILED: { variant: 'destructive', label: 'Failed' },
    REFUNDED: { variant: 'secondary', label: 'Refunded' },
  };
  const config = map[status] ?? { variant: 'outline' as const, label: status };
  return <Badge variant={config.variant}>{config.label}</Badge>;
}
