// frontend/src/pages/admin/super-admin/system/IntegrationCard.tsx
import {
  BookOpen,
  Cable,
  ChevronRight,
  Clock,
  ExternalLink,
  KeyRound,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';
import {
  CATEGORY_LABELS,
  formatLatency,
  formatRelative,
} from '@/api/integrations';
import { IntegrationStatusBadge } from './IntegrationStatusBadge';
import type {
  IntegrationServiceDescriptor,
  IntegrationStatusReport,
} from '@/types/integration';

export interface IntegrationCardProps {
  readonly service: IntegrationServiceDescriptor;
  readonly status: IntegrationStatusReport | undefined;
  readonly onOpen: (service: IntegrationServiceDescriptor) => void;
  readonly onProbe: (service: IntegrationServiceDescriptor) => void;
  readonly probing: boolean;
}

export function IntegrationCard({ service, status, onOpen, onProbe, probing }: IntegrationCardProps) {
  const missingRequired = service.credentialFields.filter(
    (f) => f.required && f.presence === 'missing',
  );
  const requiredFields = service.credentialFields.filter((f) => f.required);
  const missingCount = missingRequired.length;

  return (
    <Card className="flex flex-col">
      <CardHeader className="pb-2">
        <div className="flex items-start justify-between gap-2">
          <div className="min-w-0">
            <CardTitle className="flex items-center gap-2 text-base">
              <Cable className="h-4 w-4 shrink-0 text-muted-foreground" aria-hidden="true" />
              <span className="truncate">{service.name}</span>
            </CardTitle>
            <CardDescription className="mt-1 line-clamp-2">{service.description}</CardDescription>
          </div>
          <IntegrationStatusBadge status={status?.status ?? 'unknown'} />
        </div>
        <div className="mt-2 flex flex-wrap items-center gap-1.5 text-xs text-muted-foreground">
          <Badge variant="secondary" className="font-normal">
            {CATEGORY_LABELS[service.category]}
          </Badge>
          {service.environments.map((env) => (
            <Badge key={env} variant="outline" className="font-normal capitalize">
              {env}
            </Badge>
          ))}
        </div>
      </CardHeader>

      <CardContent className="flex-1 space-y-3 text-sm">
        <div>
          <p className="text-xs uppercase tracking-wide text-muted-foreground">Required keys</p>
          {requiredFields.length === 0 ? (
            <p className="mt-1 text-xs text-muted-foreground">No required keys.</p>
          ) : (
            <div className="mt-1 flex flex-wrap gap-1.5">
              {requiredFields.map((f) => (
                <span
                  key={f.key}
                  className={cn(
                    'inline-flex items-center gap-1 rounded border px-1.5 py-0.5 font-mono text-[11px]',
                    f.presence === 'present'
                      ? 'border-emerald-500/30 bg-emerald-500/5 text-emerald-800 dark:text-emerald-200'
                      : 'border-rose-500/30 bg-rose-500/5 text-rose-800 dark:text-rose-200',
                  )}
                >
                  <KeyRound className="h-3 w-3" aria-hidden="true" />
                  {f.key}
                </span>
              ))}
            </div>
          )}
          {missingCount > 0 ? (
            <p className="mt-1 text-xs text-rose-700 dark:text-rose-300">
              {missingCount} required key{missingCount === 1 ? '' : 's'} missing — configure in the
              server environment.
            </p>
          ) : null}
        </div>

        {status && status.probes.length > 0 ? (
          <>
            <Separator />
            <div>
              <p className="text-xs uppercase tracking-wide text-muted-foreground">Probes</p>
              <ul className="mt-1 space-y-1">
                {status.probes.slice(0, 2).map((p) => {
                  const check = service.healthChecks.find((c) => c.id === p.checkId);
                  return (
                    <li
                      key={p.checkId}
                      className="flex items-center justify-between gap-2 text-xs"
                    >
                      <span className="truncate">
                        <span className="text-muted-foreground">
                          {check?.name ?? p.checkId}
                        </span>
                      </span>
                      <span
                        className={cn(
                          'shrink-0 font-mono tabular-nums',
                          p.ok ? 'text-emerald-700 dark:text-emerald-300' : 'text-rose-700 dark:text-rose-300',
                        )}
                      >
                        {p.ok ? 'OK' : 'FAIL'} · {formatLatency(p.latencyMs)}
                      </span>
                    </li>
                  );
                })}
                {status.probes.length > 2 ? (
                  <li className="text-xs text-muted-foreground">
                    +{status.probes.length - 2} more
                  </li>
                ) : null}
              </ul>
            </div>
          </>
        ) : null}

        <div className="flex items-center gap-1 text-xs text-muted-foreground">
          <Clock className="h-3 w-3" aria-hidden="true" />
          Last checked {formatRelative(status?.lastCheckedAt)}
        </div>
      </CardContent>

      <CardFooter className="flex items-center justify-between gap-2 border-t bg-muted/20 px-6 py-3">
        <div className="flex items-center gap-1.5">
          {service.docsUrl ? (
            <Button
              asChild
              variant="ghost"
              size="sm"
              title="Open documentation"
            >
              <a href={service.docsUrl} target="_blank" rel="noopener noreferrer">
                <BookOpen className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                Docs
              </a>
            </Button>
          ) : null}
          {service.dashboardUrl ? (
            <Button asChild variant="ghost" size="sm" title="Open provider dashboard">
              <a href={service.dashboardUrl} target="_blank" rel="noopener noreferrer">
                <ExternalLink className="mr-1.5 h-3.5 w-3.5" aria-hidden="true" />
                Provider
              </a>
            </Button>
          ) : null}
        </div>
        <div className="flex items-center gap-1.5">
          <Button
            variant="outline"
            size="sm"
            onClick={() => onProbe(service)}
            disabled={probing}
          >
            <RefreshCw className={cn('mr-1.5 h-3.5 w-3.5', probing && 'animate-spin')} aria-hidden="true" />
            Probe
          </Button>
          <Button size="sm" onClick={() => onOpen(service)}>
            Details
            <ChevronRight className="ml-1 h-3.5 w-3.5" aria-hidden="true" />
          </Button>
        </div>
      </CardFooter>
    </Card>
  );
}