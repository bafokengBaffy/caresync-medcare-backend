import { FileQuestion } from 'lucide-react';
import { cn } from '@/lib/utils';
export function EmptyState({ title, description, icon: Icon = FileQuestion, action, className }: { title: string; description?: string; icon?: React.ComponentType<{ className?: string }>; action?: React.ReactNode; className?: string }) {
  return (
    <div className={cn('flex flex-col items-center justify-center rounded-lg border border-dashed p-12 text-center', className)}>
      <Icon className="h-10 w-10 text-muted-foreground" />
      <h3 className="mt-4 text-lg font-semibold">{title}</h3>
      {description && <p className="mt-1 text-sm text-muted-foreground">{description}</p>}
      {action && <div className="mt-4">{action}</div>}
    </div>
  );
}
