// frontend/src/pages/admin/super-admin/system/EnvironmentReadinessCard.tsx
import { AlertCircle, CheckCircle2, Clock, KeyRound, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { cn } from '@/lib/utils';
import { ENV_LABELS, formatDateTime } from '@/api/integrations';
import type { EnvironmentReadiness } from '@/types/integration';

export interface EnvironmentReadinessCardProps {
  readonly readiness: readonly EnvironmentReadiness[];
  readonly onVerify: (env: EnvironmentReadiness['environment']) => void;
  readonly verifyingEnv: EnvironmentReadiness['environment'] | null;
}

export function EnvironmentReadinessCard({
  readiness,
  onVerify,
  verifyingEnv,
}: EnvironmentReadinessCardProps) {
  return (
    <Card>
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ShieldCheck className="h-4 w-4" aria-hidden="true" />
          Environment readiness
        </CardTitle>
        <CardDescription>
          Presence-only status of required credential keys per environment. Values are
          never sent to the browser.
        </CardDescription>
      </CardHeader>
      <CardContent>
        {readiness.length === 0 ? (
          <p className="text-sm text-muted-foreground">
            No environment readiness data yet for this integration. Trigger a verify
            once the environment has been configured.
          </p>
        ) : (
          <ul className="space-y-3">
            {readiness.map((r) => {
              const pct =
                r.requiredTotal > 0
                  ? Math.round((r.requiredPresent / r.requiredTotal) * 100)
                  : 100;
              return (
                <li key={r.environment} className="rounded-md border p-3">
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium">{ENV_LABELS[r.environment]}</span>
                        {r.ready ? (
                          <Badge
                            variant="outline"
                            className="border-emerald-500/30 bg-emerald-500/10 text-emerald-700 dark:text-emerald-300"
                          >
                            <CheckCircle2 className="mr-1 h-3 w-3" aria-hidden="true" />
                            Ready
                          </Badge>
                        ) : (
                          <Badge
                            variant="outline"
                            className="border-amber-500/30 bg-amber-500/10 text-amber-700 dark:text-amber-300"
                          >
                            <AlertCircle className="mr-1 h-3 w-3" aria-hidden="true" />
                            Missing {r.requiredTotal - r.requiredPresent} key(s)
                          </Badge>
                        )}
                      </div>
                      <div className="mt-2 h-1.5 w-full overflow-hidden rounded-full bg-muted">
                        <div
                          className={cn(
                            'h-full rounded-full',
                            r.ready ? 'bg-emerald-500' : 'bg-amber-500',
                          )}
                          style={{ width: `${pct}%` }}
                        />
                      </div>
                      <p className="mt-1 text-xs text-muted-foreground">
                        {r.requiredPresent}/{r.requiredTotal} required keys present ·{' '}
                        <Clock className="inline h-3 w-3 -mt-0.5" aria-hidden="true" />{' '}
                        {formatDateTime(r.updatedAt)}
                      </p>
                      {r.missingKeys.length > 0 ? (
                        <div className="mt-2 flex flex-wrap gap-1.5">
                          {r.missingKeys.map((k) => (
                            <span
                              key={k}
                              className="inline-flex items-center gap-1 rounded border border-amber-500/30 bg-amber-500/5 px-1.5 py-0.5 font-mono text-[11px] text-amber-800 dark:text-amber-200"
                            >
                              <KeyRound className="h-3 w-3" aria-hidden="true" />
                              {k}
                            </span>
                          ))}
                        </div>
                      ) : null}
                    </div>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => onVerify(r.environment)}
                      disabled={verifyingEnv === r.environment}
                    >
                      {verifyingEnv === r.environment ? 'Verifying…' : 'Verify'}
                    </Button>
                  </div>
                </li>
              );
            })}
          </ul>
        )}
      </CardContent>
    </Card>
  );
}