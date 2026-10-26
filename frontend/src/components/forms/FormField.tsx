import { Label } from '@/components/ui/label';
import { cn } from '@/lib/utils';

export function FormField({ label, error, required, children, className, description }: { label: string; error?: string; required?: boolean; description?: string; children: React.ReactNode; className?: string }) {
  return (
    <div className={cn('space-y-1.5', className)}>
      <Label>{label}{required && <span className="text-destructive ml-1">*</span>}</Label>
      {children}
      {description && <p className="text-xs text-muted-foreground">{description}</p>}
      {error && <p className="text-xs text-destructive">{error}</p>}
    </div>
  );
}
