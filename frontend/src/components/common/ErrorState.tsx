import { AlertTriangle } from 'lucide-react';
import { Button } from '@/components/ui/button';
export function ErrorState({ message, onRetry }: { message?: string; onRetry?: () => void }) {
  return (
    <div className="flex flex-col items-center justify-center rounded-lg border border-destructive/40 bg-destructive/5 p-8 text-center">
      <AlertTriangle className="h-8 w-8 text-destructive" />
      <p className="mt-2 text-sm text-destructive">{message ?? 'Failed to load data'}</p>
      {onRetry && <Button variant="outline" size="sm" className="mt-3" onClick={onRetry}>Retry</Button>}
    </div>
  );
}
