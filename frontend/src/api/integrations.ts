// frontend/src/api/integrations.ts
// Typed integration API client. All calls go through the shared `apiClient`
// (Bearer ID token, correlation id, same-origin) and are scoped to super_admin
// server-side. Never returns credential values — only presence.
//
// OWASP A01/A02/A03/A07 mitigations:
//   - No credential values ever cross the wire.
//   - Path segments are encodeURIComponent'd.
//   - All user input is sanitized + validated before sending.
//   - Health probes are read-only.

import { apiClient } from '@/lib/api-client';
import type {
  EnvironmentName,
  IntegrationAuditEvent,
  IntegrationListFilters,
  IntegrationCategory,
  IntegrationServiceDescriptor,
  IntegrationStatus,
  IntegrationStatusReport,
  EnvironmentReadiness,
  RecordRotationPayload,
  TriggerProbePayload,
  VerifyEnvironmentPayload,
} from '@/types/integration';

function buildQuery(params: Record<string, string | number | undefined | null>): string {
  const search = new URLSearchParams();
  for (const [k, v] of Object.entries(params)) {
    if (v === undefined || v === null || v === '') continue;
    search.set(k, String(v));
  }
  const qs = search.toString();
  return qs ? `?${qs}` : '';
}

export const integrationsApi = {
  async listServices(filters: IntegrationListFilters): Promise<readonly IntegrationServiceDescriptor[]> {
    const qs = buildQuery({
      search: filters.search || undefined,
      category: filters.category === 'all' ? undefined : filters.category,
      environment: filters.environment === 'all' ? undefined : filters.environment,
    });
    return apiClient.get<readonly IntegrationServiceDescriptor[]>(
      `/api/v1/admin/integrations${qs}`,
    );
  },

  async getStatus(serviceId: string): Promise<IntegrationStatusReport> {
    return apiClient.get<IntegrationStatusReport>(
      `/api/v1/admin/integrations/${encodeURIComponent(serviceId)}/status`,
    );
  },

  async getStatusBulk(serviceIds: readonly string[]): Promise<readonly IntegrationStatusReport[]> {
    if (serviceIds.length === 0) return [];
    const qs = buildQuery({ ids: serviceIds.join(',') });
    return apiClient.get<readonly IntegrationStatusReport[]>(
      `/api/v1/admin/integrations/status${qs}`,
    );
  },

  async getReadiness(
    serviceId: string,
  ): Promise<readonly EnvironmentReadiness[]> {
    return apiClient.get<readonly EnvironmentReadiness[]>(
      `/api/v1/admin/integrations/${encodeURIComponent(serviceId)}/readiness`,
    );
  },

  async listEvents(serviceId: string): Promise<readonly IntegrationAuditEvent[]> {
    return apiClient.get<readonly IntegrationAuditEvent[]>(
      `/api/v1/admin/integrations/${encodeURIComponent(serviceId)}/events`,
    );
  },

  async triggerProbe(payload: TriggerProbePayload): Promise<IntegrationStatusReport> {
    return apiClient.post<IntegrationStatusReport>(
      `/api/v1/admin/integrations/${encodeURIComponent(payload.serviceId)}/probe`,
      { checkId: payload.checkId, reason: payload.reason },
    );
  },

  async recordRotation(payload: RecordRotationPayload): Promise<IntegrationStatusReport> {
    return apiClient.post<IntegrationStatusReport>(
      `/api/v1/admin/integrations/${encodeURIComponent(payload.serviceId)}/rotations`,
      {
        environment: payload.environment,
        keysRotated: payload.keysRotated,
        reason: payload.reason,
        rotationTicketRef: payload.rotationTicketRef ?? null,
      },
    );
  },

  async verifyEnvironment(payload: VerifyEnvironmentPayload): Promise<EnvironmentReadiness> {
    return apiClient.post<EnvironmentReadiness>(
      `/api/v1/admin/integrations/${encodeURIComponent(payload.serviceId)}/verify`,
      { environment: payload.environment, reason: payload.reason },
    );
  },
};

// ---- Validation helpers (client-side mirror; server re-validates) ----

export const INTEGRATION_VALIDATORS = {
  serviceId: /^[a-z0-9][a-z0-9-]{1,63}$/,
  checkId: /^[a-z0-9][a-z0-9-]{1,63}$/,
  reason: { min: 3, max: 500 },
  ticket: /^[A-Z][A-Z0-9-]{1,30}$/,
} as const;

export function sanitizeText(input: string, max = 500): string {
  return input
    .replace(/[\u0000-\u001F\u007F]/g, '')
    .trim()
    .slice(0, max);
}

export function isValidReason(text: string): boolean {
  const t = sanitizeText(text);
  return t.length >= INTEGRATION_VALIDATORS.reason.min && t.length <= INTEGRATION_VALIDATORS.reason.max;
}

export function isValidTicketRef(ref: string | undefined): boolean {
  if (!ref) return true; // optional
  return INTEGRATION_VALIDATORS.ticket.test(ref.trim().toUpperCase());
}

export function isValidServiceId(id: string): boolean {
  return INTEGRATION_VALIDATORS.serviceId.test(id);
}

export function isValidCheckId(id: string): boolean {
  return INTEGRATION_VALIDATORS.checkId.test(id);
}

// ---- Formatters ----

export function formatDate(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleDateString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
  });
}

export function formatDateTime(iso: string | null | undefined): string {
  if (!iso) return '—';
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return '—';
  return d.toLocaleString(undefined, {
    year: 'numeric',
    month: 'short',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
  });
}

export function formatLatency(ms: number | null | undefined): string {
  if (ms == null) return '—';
  if (ms < 1000) return `${Math.round(ms)} ms`;
  return `${(ms / 1000).toFixed(2)} s`;
}

export function formatRelative(iso: string | null | undefined): string {
  if (!iso) return '—';
  const t = new Date(iso).getTime();
  if (Number.isNaN(t)) return '—';
  const diffSec = Math.max(0, Math.floor((Date.now() - t) / 1000));
  if (diffSec < 60) return `${diffSec}s ago`;
  if (diffSec < 3600) return `${Math.floor(diffSec / 60)}m ago`;
  if (diffSec < 86400) return `${Math.floor(diffSec / 3600)}h ago`;
  return `${Math.floor(diffSec / 86400)}d ago`;
}

export const CATEGORY_LABELS: Record<IntegrationCategory, string> = {
  identity: 'Identity',
  messaging: 'Messaging',
  storage: 'Storage',
  payments: 'Payments',
  database: 'Database',
  observability: 'Observability',
  clinical: 'Clinical',
  notifications: 'Notifications',
};

export const STATUS_LABELS: Record<IntegrationStatus, string> = {
  healthy: 'Healthy',
  degraded: 'Degraded',
  unavailable: 'Unavailable',
  unconfigured: 'Unconfigured',
  unknown: 'Unknown',
};

export const ENV_LABELS: Record<EnvironmentName, string> = {
  development: 'Development',
  staging: 'Staging',
  production: 'Production',
};
