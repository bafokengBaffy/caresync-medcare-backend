// frontend/src/pages/admin/super-admin/system/IntegrationDetailDrawer.tsx
import { useState } from 'react';
import {
  CheckCircle2,
  Clock,
  ExternalLink,
  KeyRound,
  ListChecks,
  RefreshCw,
  ShieldCheck,
  ShieldX,
  Sparkles,
  XCircle,
} from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Tabs, TabsList, TabsTrigger, TabsContent } from '@/components/ui/tabs';
import { Skeleton } from '@/components/ui/skeleton';
import { cn } from '@/lib/utils';
import {
  CATEGORY_LABELS,
  ENV_LABELS,
  formatDateTime,
  formatLatency,
  formatRelative,
} from '@/api/integrations';
import { EnvironmentReadinessCard } from './nvironmentReadinessCard';
import { IntegrationStatusBadge } from './IntegrationStatusBadge';
import {
  useIntegrationEvents,
  useIntegrationReadiness,
  useIntegrationStatus,
  useRecordRotation,
  useVerifyEnvironment,
} from '@/hooks/use-integrations';
import type { IntegrationServiceDescriptor } from '@/types/integration';

export interface IntegrationDetailDrawerProps {
  readonly service: IntegrationServiceDescriptor | null;
  readonly open: boolean;
  readonly onOpenChange: (open: boolean) => void;
  readonly onRequestRotation: (service: IntegrationServiceDescriptor) => void;
}

export function IntegrationDetailDrawer({
  service,
  open,
  onOpenChange,
  onRequestRotation,
}: IntegrationDetailDrawerProps) {
  const statusQuery = useIntegrationStatus(open && service ? service.id : null);
  const readinessQuery = useIntegrationReadiness(open && service ? service.id : null);
  const eventsQuery = useIntegrationEvents(open && service ? service.id : null);
  const verifyEnv = useVerifyEnvironment();
  const [verifying, setVerifying] = useState<string | null>(null);

  if (!service) return null;

  const readyEnvs = readinessQuery.data ?? [];
  const probes = statusQuery.data?.probes ?? [];

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-3xl">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2">
            {service.name}
            <IntegrationStatusBadge status={statusQuery.data?.status ?? 'unknown'} />
          </DialogTitle>
          <DialogDescription>
            {service.description} · {CATEGORY_LABELS[service.category]}
          </DialogDescription>
        </DialogHeader>

        <Tabs defaultValue="overview">
          <TabsList>
            <TabsTrigger value="overview">Overview</TabsTrigger>
            <TabsTrigger value="probes">Probes</TabsTrigger>
            <TabsTrigger value="readiness">Readiness</TabsTrigger>
            <TabsTrigger value="activity">Activity</TabsTrigger>
          </TabsList>

          <TabsContent value="overview">
            <div className="space-y-4 pt-2">
              <div className="grid grid-cols-2 gap-3 text-sm md:grid-cols-4">
                <SummaryTile label="Category" value={CATEGORY_LABELS[service.category]} />
                <SummaryTile
                  label="Environments"
                  value={service.environments.map((e) => ENV_LABELS[e]).join(', ')}
                />
                <SummaryTile
                  label="Last checked"
                  value={formatRelative(statusQuery.data?.lastCheckedAt)}
                />
                <SummaryTile
                  label="Probes"
                  value={`${probes.filter((p) => p.ok).length}/${probes.length} ok`}
                />
              </div>

              <Separator />

              <div>
                <p className="mb-2 flex items-center gap-1.5 text-xs uppercase tracking-wide text-muted-foreground">
                  <KeyRound className="h-3.5 w-3.5" aria-hidden="true" /> Required credential keys
                  (presence only)
                </p>
                {service.credentialFields.length === 0 ? (
                  <p className="text-sm text-muted-foreground">This integration has no credential fields.</p>
                ) : (
                  <ul className="space-y-1.5">
                    {service.credentialFields.map((f) => (
                      <li
                        key={f.key}
                        className={cn(
                          'flex items-start justify-between gap-3 rounded border p-2 text-sm',
                          f.presence === 'present'
                            ? 'border-emerald-500/20 bg-emerald-500/5'
                            : f.presence === 'missing'
                              ? 'border-rose-500/20 bg-rose-500/5'
                              : 'border-muted bg-muted/40',
                        )}
                      >
                        <div className="min-w-0">
                          <p className="font-mono text-xs">{f.key}</p>
                          <p className="text-xs text-muted-foreground">{f.label}</p>
                          {f.description ? (
                            <p className="mt-0.5 text-xs text-muted-foreground">{f.description}</p>
                          ) : null}
                        </div>
                        <div className="flex shrink-0 items-center gap-2">
                          {f.presence === 'present' ? (
                            <Badge variant="outline" className="border-emerald-500/30 text-emerald-700 dark:text-emerald-300">
                              <CheckCircle2 className="mr-1 h-3 w-3" aria-hidden="true" /> Present
                            </Badge>
                          ) : f.presence === 'missing' ? (
                            <Badge variant="outline" className="border-rose-500/30 text-rose-700 dark:text-rose-300">
                              <XCircle className="mr-1 h-3 w-3" aria-hidden="true" /> Missing
                            </Badge>
                          ) : (
                            <Badge variant="outline">Not required</Badge>
                          )}
                        </div>
                      </li>
                    ))}
                  </ul>
                )}
              </div>

              {service.notes && service.notes.length > 0 ? (
                <>
                  <Separator />
                  <div>
                    <p className="mb-2 text-xs uppercase tracking-wide text-muted-foreground">
                      Operational notes
                    </p>
                    <ul className="list-disc space-y-1 pl-5 text-sm text-muted-foreground">
                      {service.notes.map((n, i) => (
                        <li key={i}>{n}</li>
                      ))}
                    </ul>
                  </div>
                </>
              ) : null}

              <Separator />

              <div className="flex flex-wrap items-center gap-2">
                <Button variant="outline" size="sm" onClick={() => onRequestRotation(service)}>
                  <RefreshCw className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                  Record credential rotation
                </Button>
                {service.docsUrl ? (
                  <Button asChild variant="outline" size="sm">
                    <a href={service.docsUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                      Documentation
                    </a>
                  </Button>
                ) : null}
                {service.dashboardUrl ? (
                  <Button asChild variant="outline" size="sm">
                    <a href={service.dashboardUrl} target="_blank" rel="noopener noreferrer">
                      <ExternalLink className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                      Provider dashboard
                    </a>
                  </Button>
                ) : null}
              </div>
            </div>
          </TabsContent>

          <TabsContent value="probes">
            <div className="pt-2">
              {statusQuery.isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 3 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : probes.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No probes have been run for this integration yet.
                </p>
              ) : (
                <ul className="space-y-2">
                  {probes.map((p) => {
                    const check = service.healthChecks.find((c) => c.id === p.checkId);
                    return (
                      <li key={p.checkId} className="rounded border p-3 text-sm">
                        <div className="flex items-start justify-between gap-3">
                          <div>
                            <p className="font-medium">{check?.name ?? p.checkId}</p>
                            <p className="font-mono text-xs text-muted-foreground">
                              {p.statusCode ?? '—'} · {formatLatency(p.latencyMs)} ·{' '}
                              {formatDateTime(p.checkedAt)}
                            </p>
                            {p.message ? (
                              <p className="mt-1 text-xs text-muted-foreground">{p.message}</p>
                            ) : null}
                          </div>
                          <Badge
                            variant="outline"
                            className={cn(
                              p.ok
                                ? 'border-emerald-500/30 text-emerald-700 dark:text-emerald-300'
                                : 'border-rose-500/30 text-rose-700 dark:text-rose-300',
                            )}
                          >
                            {p.ok ? 'OK' : 'FAIL'}
                          </Badge>
                        </div>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          </TabsContent>

          <TabsContent value="readiness">
            <div className="pt-2">
              {readinessQuery.isLoading ? (
                <Skeleton className="h-32 w-full" />
              ) : (
                <EnvironmentReadinessCard
                  readiness={readyEnvs}
                  verifyingEnv={verifying as any}
                  onVerify={async (env) => {
                    setVerifying(env);
                    try {
                      await verifyEnv.mutateAsync({
                        serviceId: service.id,
                        environment: env,
                        reason: 'Manual verify from integration detail drawer',
                      });
                    } finally {
                      setVerifying(null);
                    }
                  }}
                />
              )}
            </div>
          </TabsContent>

          <TabsContent value="activity">
            <div className="pt-2">
              {eventsQuery.isLoading ? (
                <div className="space-y-2">
                  {Array.from({ length: 4 }).map((_, i) => (
                    <Skeleton key={i} className="h-10 w-full" />
                  ))}
                </div>
              ) : !eventsQuery.data || eventsQuery.data.length === 0 ? (
                <p className="text-sm text-muted-foreground">
                  No recorded activity for this integration yet.
                </p>
              ) : (
                <ol className="relative space-y-3 border-l pl-4">
                  {eventsQuery.data.map((e) => (
                    <li key={e.id} className="relative">
                      <span className="absolute -left-[7px] top-1.5 h-3 w-3 rounded-full border-2 border-background bg-muted-foreground" />
                      <p className="text-sm font-medium">{e.description}</p>
                      <p className="text-xs text-muted-foreground">
                        {e.actorName} · {e.action.replace(/_/g, ' ')} · {formatDateTime(e.occurredAt)}
                      </p>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}

function SummaryTile({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-md border p-3">
      <p className="text-xs uppercase text-muted-foreground">{label}</p>
      <p className="mt-0.5 truncate text-sm font-medium">{value || '—'}</p>
    </div>
  );
}
