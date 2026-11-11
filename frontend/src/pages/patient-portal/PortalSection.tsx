import type { ReactNode } from 'react';
import { AlertCircle, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export function PortalSection({
  title,
  description,
  pending,
  error,
  retry,
  children,
}: {
  title: string;
  description: string;
  pending?: boolean;
  error?: Error | null;
  retry?: () => void;
  children: ReactNode;
}) {
  return (
    <section className="space-y-5 p-4 text-foreground md:p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">{description}</p>
      </header>
      {pending ? (
        <div className="flex min-h-48 items-center justify-center rounded-lg border bg-card" aria-busy="true">
          <Loader2 className="h-8 w-8 animate-spin text-primary" aria-label="Loading" />
        </div>
      ) : error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-6" role="alert">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div className="space-y-3">
              <p className="font-medium">We could not load this information.</p>
              <p className="text-sm text-muted-foreground">{error.message}</p>
              {retry && <Button variant="outline" onClick={retry}>Try again</Button>}
            </div>
          </div>
        </div>
      ) : children}
    </section>
  );
}
