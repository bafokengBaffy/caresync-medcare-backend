import { useEffect, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { formatDistanceToNow } from 'date-fns';
import { CheckCircle2, Clock3, LogOut, RefreshCw, ShieldCheck, XCircle } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { getPendingStatus, syncCurrentUser } from '@/api/auth-sync';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { auth } from '@/lib/firebase';
import { readAuthClaims } from '@/lib/auth-claims';
import { forceRefreshClaims } from '@/api/auth-sync';
import { useAuthStore } from '@/stores/auth-store';

export default function PendingApprovalPage() {
  const navigate = useNavigate();
  const setUser = useAuthStore((state) => state.setUser);
  const clear = useAuthStore((state) => state.clear);
  const [approvalError, setApprovalError] = useState<string | null>(null);
  const user = auth.currentUser;

  const statusQuery = useQuery({
    queryKey: ['registration', 'pending-status', user?.uid],
    queryFn: getPendingStatus,
    enabled: Boolean(user),
    refetchInterval: (query) => query.state.data?.status === 'PENDING' ? 10_000 : false,
    refetchOnWindowFocus: true,
  });

  useEffect(() => {
    const status = statusQuery.data?.status;
    if (status !== 'APPROVED' || !user) return;

    let active = true;
    setApprovalError(null);
    void forceRefreshClaims().then((claims) => {
      if (!active) return;
      const validatedClaims = readAuthClaims(claims ?? {});
      if (!validatedClaims) {
        setApprovalError('Your approval is recorded. Access is still being activated; this page will keep checking.');
        return;
      }
      setUser({
        uid: user.uid,
        email: user.email,
        displayName: user.displayName,
        ...validatedClaims,
      });
      navigate('/dashboard', { replace: true });
    }).catch(() => {
      if (active) setApprovalError('We could not refresh your approved access. Please retry in a moment.');
    });

    return () => {
      active = false;
    };
  }, [navigate, setUser, statusQuery.data?.status, user]);

  const handleSignOut = async () => {
    await auth.signOut();
    clear();
    navigate('/auth/login', { replace: true });
  };

  if (!user) {
    return (
      <main className="mx-auto flex min-h-[70vh] max-w-xl items-center px-4 py-12">
        <Card className="w-full">
          <CardHeader>
            <CardTitle className="text-xl text-foreground dark:text-white">Sign in to check your application</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <p className="text-sm text-muted-foreground dark:text-slate-300">
              Registration status is available only to the account that submitted the request.
            </p>
            <Button onClick={() => navigate('/auth/login')}>Go to sign in</Button>
          </CardContent>
        </Card>
      </main>
    );
  }

  const status = statusQuery.data?.status;
  const rejected = status === 'REJECTED';
  const title = rejected
    ? 'Application update'
    : status === 'NOT_SUBMITTED'
      ? 'No application found'
      : 'Your account is awaiting approval';

  return (
    <main className="mx-auto flex min-h-[70vh] max-w-2xl items-center px-4 py-12">
      <Card className="w-full border-slate-200 bg-white shadow-xl dark:border-slate-700 dark:bg-slate-900">
        <CardHeader className="items-center text-center">
          <div className={`mb-3 flex h-14 w-14 items-center justify-center rounded-full ${
            rejected
              ? 'bg-red-100 text-red-700 dark:bg-red-950 dark:text-red-300'
              : status === 'APPROVED'
                ? 'bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-300'
                : 'bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-300'
          }`}>
            {rejected
              ? <XCircle aria-hidden="true" className="h-7 w-7" />
              : status === 'APPROVED'
                ? <CheckCircle2 aria-hidden="true" className="h-7 w-7" />
                : <Clock3 aria-hidden="true" className="h-7 w-7" />}
          </div>
          <CardTitle className="text-2xl text-foreground dark:text-white">{title}</CardTitle>
        </CardHeader>
        <CardContent className="space-y-5 text-center">
          {statusQuery.isPending && (
            <p className="text-sm text-muted-foreground dark:text-slate-300">Checking your registration status…</p>
          )}
          {statusQuery.isError && (
            <div role="alert" className="rounded-lg border border-red-200 bg-red-50 p-3 text-sm text-red-800 dark:border-red-900 dark:bg-red-950/40 dark:text-red-200">
              {statusQuery.error instanceof Error ? statusQuery.error.message : 'Registration status is temporarily unavailable.'}
            </div>
          )}
          {status === 'PENDING' && (
            <>
              <p className="text-sm leading-6 text-muted-foreground dark:text-slate-300">
                Your email is associated with a pending CareSync request. An authorised administrator must review and provision access before you can enter the workspace.
              </p>
              <div className="rounded-xl border border-slate-200 bg-slate-50 p-4 text-left dark:border-slate-700 dark:bg-slate-800">
                <p className="text-xs font-medium uppercase tracking-wide text-slate-500 dark:text-slate-400">Account</p>
                <p className="mt-1 break-all text-sm font-medium text-slate-900 dark:text-slate-100">{user.email}</p>
                {statusQuery.data?.submittedAt && (
                  <p className="mt-2 text-xs text-slate-600 dark:text-slate-400">
                    Submitted {formatDistanceToNow(new Date(statusQuery.data.submittedAt), { addSuffix: true })}
                  </p>
                )}
              </div>
            </>
          )}
          {rejected && (
            <>
              <p className="text-sm leading-6 text-muted-foreground dark:text-slate-300">
                An administrator reviewed your request and did not approve it.
              </p>
              {statusQuery.data?.rejectionReason && (
                <div className="rounded-lg border border-slate-200 bg-slate-50 p-4 text-left text-sm text-slate-700 dark:border-slate-700 dark:bg-slate-800 dark:text-slate-200">
                  {statusQuery.data.rejectionReason}
                </div>
              )}
            </>
          )}
          {status === 'NOT_SUBMITTED' && (
            <p className="text-sm leading-6 text-muted-foreground dark:text-slate-300">
              No approval request is linked to this account yet. Try signing in again to submit your basic account for review.
            </p>
          )}
          {approvalError && (
            <div role="status" className="rounded-lg border border-amber-200 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-900 dark:bg-amber-950/40 dark:text-amber-200">
              {approvalError}
            </div>
          )}
          {status === 'PENDING' && (
            <p className="flex items-center justify-center gap-2 text-xs text-slate-500 dark:text-slate-400">
              <RefreshCw aria-hidden="true" className="h-3.5 w-3.5" />
              This page checks for updates automatically.
            </p>
          )}
          <div className="flex flex-wrap justify-center gap-3">
            {statusQuery.isError && (
              <Button variant="outline" onClick={() => void statusQuery.refetch()}>
                <RefreshCw aria-hidden="true" className="mr-2 h-4 w-4" />
                Retry
              </Button>
            )}
            {status === 'NOT_SUBMITTED' && (
              <Button onClick={async () => {
                await user.getIdToken(true);
                await syncCurrentUser();
                await statusQuery.refetch();
              }}>
                <ShieldCheck aria-hidden="true" className="mr-2 h-4 w-4" />
                Check again
              </Button>
            )}
            <Button variant="outline" onClick={() => void handleSignOut()}>
              <LogOut aria-hidden="true" className="mr-2 h-4 w-4" />
              Sign out
            </Button>
          </div>
        </CardContent>
      </Card>
    </main>
  );
}
