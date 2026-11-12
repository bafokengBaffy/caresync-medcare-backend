// frontend/src/hooks/use-integrations.ts
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { useCallback, useMemo, useState } from 'react';
import { integrationsApi } from '@/api/integrations';
import type {
  IntegrationListFilters,
  IntegrationServiceDescriptor,
  RecordRotationPayload,
  TriggerProbePayload,
  VerifyEnvironmentPayload,
} from '@/types/integration';

const QK = {
  services: (filters: IntegrationListFilters) =>
    ['admin', 'integrations', 'services', filters] as const,
  status: (id: string) => ['admin', 'integrations', 'status', id] as const,
  statusBulk: (ids: readonly string[]) =>
    ['admin', 'integrations', 'status-bulk', [...ids].sort().join(',')] as const,
  readiness: (id: string) => ['admin', 'integrations', 'readiness', id] as const,
  events: (id: string) => ['admin', 'integrations', 'events', id] as const,
};

export function useIntegrationServices(initial?: Partial<IntegrationListFilters>) {
  const [filters, setFilters] = useState<IntegrationListFilters>({
    search: '',
    category: 'all',
    status: 'all',
    environment: 'all',
    ...initial,
  });

  const update = useCallback((patch: Partial<IntegrationListFilters>) => {
    setFilters((prev) => ({ ...prev, ...patch }));
  }, []);

  const reset = useCallback(() => {
    setFilters({ search: '', category: 'all', status: 'all', environment: 'all' });
  }, []);

  const query = useQuery({
    queryKey: QK.services(filters),
    queryFn: () => integrationsApi.listServices(filters),
    staleTime: 60_000,
    retry: 1,
  });

  return { filters, update, reset, query };
}

export function useIntegrationStatus(serviceId: string | null) {
  return useQuery({
    queryKey: serviceId ? QK.status(serviceId) : ['admin', 'integrations', 'status', 'none'],
    queryFn: () => integrationsApi.getStatus(serviceId as string),
    enabled: Boolean(serviceId),
    staleTime: 30_000,
    retry: 1,
    refetchInterval: 60_000, // gentle polling — health probe
  });
}

export function useIntegrationStatusBulk(serviceIds: readonly string[]) {
  return useQuery({
    queryKey: QK.statusBulk(serviceIds),
    queryFn: () => integrationsApi.getStatusBulk(serviceIds),
    enabled: serviceIds.length > 0,
    staleTime: 30_000,
    retry: 1,
    refetchInterval: 60_000,
  });
}

export function useIntegrationReadiness(serviceId: string | null) {
  return useQuery({
    queryKey: serviceId ? QK.readiness(serviceId) : ['admin', 'integrations', 'readiness', 'none'],
    queryFn: () => integrationsApi.getReadiness(serviceId as string),
    enabled: Boolean(serviceId),
    staleTime: 60_000,
    retry: 1,
  });
}

export function useIntegrationEvents(serviceId: string | null) {
  return useQuery({
    queryKey: serviceId ? QK.events(serviceId) : ['admin', 'integrations', 'events', 'none'],
    queryFn: () => integrationsApi.listEvents(serviceId as string),
    enabled: Boolean(serviceId),
    staleTime: 30_000,
    retry: 1,
  });
}

function useInvalidate(serviceId?: string) {
  const qc = useQueryClient();
  return useCallback(() => {
    qc.invalidateQueries({ queryKey: ['admin', 'integrations'] });
    if (serviceId) qc.invalidateQueries({ queryKey: QK.status(serviceId) });
  }, [qc, serviceId]);
}

export function useTriggerProbe() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (p: TriggerProbePayload) => integrationsApi.triggerProbe(p),
    onSuccess: () => invalidate(),
  });
}

export function useRecordRotation() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (p: RecordRotationPayload) => integrationsApi.recordRotation(p),
    onSuccess: () => invalidate(),
  });
}

export function useVerifyEnvironment() {
  const invalidate = useInvalidate();
  return useMutation({
    mutationFn: (p: VerifyEnvironmentPayload) => integrationsApi.verifyEnvironment(p),
    onSuccess: () => invalidate(),
  });
}

export function useIntegrationFacetCounts(services: readonly IntegrationServiceDescriptor[]) {
  return useMemo(() => {
    const byCategory: Record<IntegrationListFilters['category'], number> = {
      all: services.length,
      identity: 0,
      messaging: 0,
      storage: 0,
      payments: 0,
      database: 0,
      observability: 0,
      clinical: 0,
      notifications: 0,
    };
    for (const s of services) byCategory[s.category] += 1;
    return byCategory;
  }, [services]);
}
