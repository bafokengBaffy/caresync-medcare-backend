import { useRouteError } from 'react-router-dom';
import { Button } from '@/components/ui/button';

export function ErrorPage() {
  const error = useRouteError() as { message?: string } | null;
  return (
    <div className="flex min-h-screen flex-col items-center justify-center gap-4 p-8 text-center">
      <div className="text-5xl">⚠️</div>
      <h1 className="text-2xl font-semibold">Something went wrong</h1>
      <p className="text-muted-foreground">{error?.message ?? 'Unexpected error'}</p>
      <Button onClick={() => location.reload()}>Reload</Button>
    </div>
  );
}

export default ErrorPage;
