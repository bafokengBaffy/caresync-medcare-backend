import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { providersApi } from '@/api/providers';
import type { ProviderCreatePayload, ProviderUpdatePayload } from '@/types/provider';
import { toast } from 'sonner';

export const providerKeys = { all: ['providers'] as const, detail: (id: string) => ['providers', 'detail', id] as const };

export function useProviders(params?: Record<string, unknown>) { return useQuery({ queryKey: [...providerKeys.all, params], queryFn: () => providersApi.list(params) }); }
export function useProvider(id: string) { return useQuery({ queryKey: providerKeys.detail(id), queryFn: () => providersApi.get(id), enabled: !!id }); }
export function useCreateProvider() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (p: ProviderCreatePayload) => providersApi.create(p), onSuccess: () => { toast.success('Provider created'); qc.invalidateQueries({ queryKey: providerKeys.all }); } });
}
export function useUpdateProvider(id: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (p: ProviderUpdatePayload) => providersApi.update(id, p), onSuccess: () => { toast.success('Provider updated'); qc.invalidateQueries({ queryKey: providerKeys.all }); } });
}
