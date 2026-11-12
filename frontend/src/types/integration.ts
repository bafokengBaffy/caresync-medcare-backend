export type IntegrationCategory = 'identity' | 'messaging' | 'storage' | 'payments' | 'database' | 'observability' | 'clinical' | 'notifications';
export type IntegrationStatus = 'healthy' | 'degraded' | 'unavailable' | 'unconfigured' | 'unknown';
export type EnvironmentName = 'development' | 'staging' | 'production';
export type CredentialPresence = 'present' | 'missing' | 'not_required';

export interface CredentialField {
  key: string;
  label: string;
  description?: string;
  required: boolean;
  presence: CredentialPresence;
}
export interface HealthCheckDescriptor {
  id: string;
  name: string;
  method: 'GET' | 'HEAD';
  endpoint: string;
  expectStatus: number;
}
export interface IntegrationServiceDescriptor {
  id: string;
  name: string;
  description: string;
  category: IntegrationCategory;
  environments: EnvironmentName[];
  credentialFields: CredentialField[];
  healthChecks: HealthCheckDescriptor[];
  notes?: string[];
  docsUrl?: string;
  dashboardUrl?: string;
}
export interface ProbeResult {
  checkId: string;
  ok: boolean;
  statusCode?: number | null;
  latencyMs: number;
  checkedAt: string;
  message?: string;
}
export interface IntegrationStatusReport {
  serviceId: string;
  status: IntegrationStatus;
  lastCheckedAt?: string | null;
  probes: ProbeResult[];
}
export interface EnvironmentReadiness {
  environment: EnvironmentName;
  ready: boolean;
  requiredTotal: number;
  requiredPresent: number;
  missingKeys: string[];
  updatedAt?: string | null;
}
export interface IntegrationAuditEvent {
  id: string;
  serviceId: string;
  action: string;
  description: string;
  actorId: string;
  actorName: string;
  occurredAt: string;
}
export interface IntegrationListFilters {
  search: string;
  category: IntegrationCategory | 'all';
  status: IntegrationStatus | 'all';
  environment: EnvironmentName | 'all';
}
export interface TriggerProbePayload { serviceId: string; checkId: string; reason: string; }
export interface RecordRotationPayload { serviceId: string; environment: EnvironmentName; keysRotated: readonly string[]; reason: string; rotationTicketRef?: string; }
export interface VerifyEnvironmentPayload { serviceId: string; environment: EnvironmentName; reason: string; }
