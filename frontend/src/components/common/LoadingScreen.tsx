import { Spinner } from '@/components/ui/spinner';
export function LoadingScreen() {
  return <div className="flex min-h-[400px] items-center justify-center"><Spinner className="h-8 w-8" /></div>;
}
