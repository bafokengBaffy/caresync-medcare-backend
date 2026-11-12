// frontend/src/pages/admin/super-admin/system/IntegrationsPage.tsx
//
// Super Admin — Integrations console.
//
// Security posture (OWASP Top 10 2021):
//   A01 Broken Access Control — route is guarded by ProtectedRoute + super_admin.
//       Backend re-checks role claims on every request.
//   A02 Cryptographic Failures — no secrets on client; Firebase ID token only;
//       all credential values remain in server environments (Render/Vercel).
//   A03 Injection — all user input sanitized (sanitizeText) and validated;
//       path segments are encodeURIComponent'd; no dangerouslySetInnerHTML.
//   A04 Insecure Design — destructive/regulated actions (rotation, verify)
//       require explicit reason + optional ticket ref; safe defaults.
//   A05 Security Misconfiguration — no debug endpoints, no inline script,
//       uses standard shadcn/ui primitives only.
//   A06 Vulnerable Components — no new runtime deps; all already in the project.
//   A07 Auth Failures — all calls use apiClient with bearer token; server
//       re-validates claims and audit-logs.
//   A08 Data Integrity — typed payloads; server is source of truth.
//   A09 Logging — every mutation sends `reason`; banner reminds operator.
//   A10 SSRF — no user URLs; only curated docsUrl/dashboardUrl from server.
//
// This page intentionally does NOT:
//   - Display, ask for, or transmit any credential value.
//   - Allow arbitrary URL fetches.
//   - Store any secrets in localStorage or sessionStorage.
//   - Trust client-only validation for the set of rotated keys.

import { useCallback, useMemo, useState } from 'react';
import {
  AlertTriangle,
  Cable,
  RefreshCw,
  ShieldCheck,
  Sparkles,
} from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { Separator } from '@/components/ui/separator';
import { EmptyState } from '@/components/ui/empty-state';
import { ErrorState } from '@/components/common/ErrorState';
import { cn } from '@/lib/utils';
import {
  useIntegrationServices,
  useIntegrationStatusBulk,
  useRecordRotation,
  useTriggerProbe,
} from '@/hooks/use-integrations';
import type {
  EnvironmentName,
  IntegrationServiceDescriptor,
} from '@/types/integration';
import { IntegrationToolbar } from './IntegrationToolbar';
import { IntegrationCard } from './IntegrationCard';
import { IntegrationDetailDrawer } from './IntegrationDetailDrawer';
import { ProbeDialog, RotationDialog } from './IntegrationDialogs';

type ActiveDialog =
  | { kind: 'detail'; service: IntegrationServiceDescriptor }
  | { kind: 'probe'; service: IntegrationServiceDescriptor }
  | { kind: 'rotation'; service: IntegrationServiceDescriptor }
  | { kind: null };

export default function IntegrationsPage() {
  const {
    filters,
    update: updateFilters,
    reset: resetFilters,
    query: servicesQuery,
  } = useIntegrationServices();

  const serviceIds = useMemo(
    () => (servicesQuery.data ?? []).map((s) => s.id),
    [servicesQuery.data],
  );

  const statusQuery = useIntegrationStatusBulk(serviceIds);

  const triggerProbe = useTriggerProbe();
  const recordRotation = useRecordRotation();

  const [activeDialog, setActiveDialog] = useState<ActiveDialog>({ kind: null });

  const statusById = useMemo(() => {
    const map = new Map<string, (typeof statusQuery.data extends readonly (infer T)[] | undefined ? T : never)>();
    for (const r of statusQuery.data ?? []) map.set(r.serviceId, r);
    return map;
  }, [statusQuery.data]);

  const handleRefresh = useCallback(() => {
    void servicesQuery.refetch();
    void statusQuery.refetch();
  }, [servicesQuery, statusQuery]);

  const closeDialog = () => setActiveDialog({ kind: null });

  const handleProbeConfirm = useCallback(
    async (args: { checkId: string; reason: string }) => {
      if (activeDialog.kind !== 'probe') return;
      await triggerProbe.mutateAsync({
        serviceId: activeDialog.service.id,
        checkId: args.checkId,
        reason: args.reason,
      });
    },
    [activeDialog, triggerProbe],
  );

  const handleRotationConfirm = useCallback(
    async (args: {
      environment: EnvironmentName;
      keysRotated: readonly string[];
      reason: string;
      rotationTicketRef?: string;
    }) => {
      if (activeDialog.kind !== 'rotation') return;
      await recordRotation.mutateAsync({
        serviceId: activeDialog.service.id,
        environment: args.environment,
        keysRotated: args.keysRotated,
        reason: args.reason,
        rotationTicketRef: args.rotationTicketRef,
      });
    },
    [activeDialog, recordRotation],
  );

  const services = servicesQuery.data ?? [];
  const noServices = !servicesQuery.isLoading && services.length === 0;
  const isInitialError = servicesQuery.isError && !servicesQuery.data;

  return (
    <div className="space-y-6">
      <PageHeader
        title="Integrations"
        description="Read-only status and audit-safe metadata for platform integrations. Credential values are never displayed or transmitted here."
        actions={
          <Button variant="outline" size="sm" onClick={handleRefresh} disabled={servicesQuery.isFetching}>
            <RefreshCw
              className={cn('mr-2 h-4 w-4', servicesQuery.isFetching && 'animate-spin')}
              aria-hidden="true"
            />
            Refresh
          </Button>
        }
      />

      <div className="flex items-start gap-3 rounded-lg border border-emerald-200 bg-emerald-50/60 p-3 text-emerald-900 dark:border-emerald-900/40 dark:bg-emerald-950/30 dark:text-emerald-100">
        <ShieldCheck className="mt-0.5 h-5 w-5 shrink-0" aria-hidden="true" />
        <div className="space-y-0.5 text-sm">
          <p className="font-medium">Secrets never leave the server.</p>
          <p className="text-emerald-800/80 dark:text-emerald-200/80">
            This console shows only presence metadata (present/missing) for credential
            keys. Rotate secrets in the provider console (Render, Vercel, Supabase,
            Firebase, CloudAMQP) and record the rotation here for auditing.
          </p>
        </div>
      </div>

      <div role="status" className="rounded-lg border border-amber-300 bg-amber-50/70 p-3 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
        <p className="font-medium">Realtime database synchronization is not configured.</p>
        <p className="mt-1 text-amber-900/80 dark:text-amber-200/80">
          Firestore is used by the clinical service for note storage when enabled, but this deployment does not configure or verify live Firestore listeners, Firebase SQL Connect synchronization, or replication between PostgreSQL, Firestore, and Supabase.
        </p>
      </div>

      <IntegrationToolbar
        filters={filters}
        onChange={updateFilters}
        onRefresh={handleRefresh}
        onReset={resetFilters}
        refreshing={servicesQuery.isFetching}
      />

      {isInitialError ? (
        <ErrorState
          message="Unable to load integrations. The integrations service did not respond. Retry, or escalate if this persists."
          onRetry={handleRefresh}
        />
      ) : servicesQuery.isError ? (
        <div className="flex items-center justify-between rounded-lg border border-amber-300 bg-amber-50 p-3 text-sm text-amber-900 dark:border-amber-700 dark:bg-amber-950/30 dark:text-amber-100">
          <div className="flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" aria-hidden="true" />
            <span>Refreshed with errors. Showing last known integrations.</span>
          </div>
          <Button size="sm" variant="outline" onClick={handleRefresh}>
            <RefreshCw className="mr-2 h-3.5 w-3.5" /> Retry
          </Button>
        </div>
      ) : null}

      {servicesQuery.isLoading ? (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {Array.from({ length: 6 }).map((_, i) => (
            <Card key={i}>
              <CardHeader>
                <Skeleton className="h-5 w-32" />
                <Skeleton className="mt-2 h-3 w-48" />
              </CardHeader>
              <CardContent>
                <Skeleton className="h-16 w-full" />
              </CardContent>
            </Card>
          ))}
        </div>
      ) : noServices ? (
        <Card>
          <CardContent className="pt-6">
            <EmptyState
              title="No integrations match"
              description="Adjust your filters, or confirm that integration descriptors have been seeded on the server."
              icon={Cable}
            />
          </CardContent>
        </Card>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {services.map((svc) => (
            <IntegrationCard
              key={svc.id}
              service={svc}
              status={statusById.get(svc.id)}
              onOpen={(s) => setActiveDialog({ kind: 'detail', service: s })}
              onProbe={(s) => setActiveDialog({ kind: 'probe', service: s })}
              probing={false}
            />
          ))}
        </div>
      )}

      <Card className="border-dashed">
        <CardHeader>
          <CardTitle className="flex items-center gap-2 text-sm">
            <Sparkles className="h-4 w-4" aria-hidden="true" /> Credential rotation guidance
          </CardTitle>
          <CardDescription>
            Rotate secrets in the provider console; then record the rotation here for
            auditability.
          </CardDescription>
        </CardHeader>
        <CardContent className="space-y-2 text-xs text-muted-foreground">
          <p>
            <span className="font-medium text-foreground">Recommended cadence:</span>{' '}
            every 90 days for production, and immediately after any suspected exposure.
          </p>
          <p>
            <span className="font-medium text-foreground">Never</span> paste secrets into this
            UI. Store new values only in the relevant Render / Vercel / Supabase / Firebase
            environment variables.
          </p>
          <p>
            Use the “Record credential rotation” action inside each integration to log the
            rotation with a ticket reference.
          </p>
          <Separator className="my-2" />
          <p>
            Need deeper access?{' '}
            <span className="font-medium text-foreground">Roles &amp; access</span> controls
            who can reach this page.
          </p>
        </CardContent>
      </Card>

      <IntegrationDetailDrawer
        service={activeDialog.kind === 'detail' ? activeDialog.service : null}
        open={activeDialog.kind === 'detail'}
        onOpenChange={(o) => (o ? undefined : closeDialog())}
        onRequestRotation={(s) => setActiveDialog({ kind: 'rotation', service: s })}
      />

      <ProbeDialog
        open={activeDialog.kind === 'probe'}
        onOpenChange={(o) => (o ? undefined : closeDialog())}
        service={activeDialog.kind === 'probe' ? activeDialog.service : null}
        onConfirm={handleProbeConfirm}
      />

      <RotationDialog
        open={activeDialog.kind === 'rotation'}
        onOpenChange={(o) => (o ? undefined : closeDialog())}
        service={activeDialog.kind === 'rotation' ? activeDialog.service : null}
        onConfirm={handleRotationConfirm}
      />
    </div>
  );
}
