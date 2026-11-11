import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { patientsApi } from '@/api/patients';
import type { PatientFilters, PatientCreatePayload, PatientUpdatePayload } from '@/types/patient';
import { toast } from 'sonner';

export const patientKeys = {
  all: ['patients'] as const,
  list: (f: PatientFilters) => [...patientKeys.all, 'list', f] as const,
  detail: (id: string) => [...patientKeys.all, 'detail', id] as const,
};

export function usePatients(filters: PatientFilters = {}) {
  return useQuery({
    queryKey: patientKeys.list(filters),
    queryFn: () => patientsApi.list(filters),
  });
}

export function usePatient(id: string) {
  return useQuery({
    queryKey: patientKeys.detail(id),
    queryFn: () => patientsApi.get(id),
    enabled: !!id,
  });
}

export function useCreatePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: PatientCreatePayload) => patientsApi.create(p),
    onSuccess: () => { toast.success('Patient created'); qc.invalidateQueries({ queryKey: patientKeys.all }); },
  });
}

export function useUpdatePatient(id?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (input: PatientUpdatePayload & { id?: string; data?: PatientUpdatePayload }) => {
      const targetId = input.id ?? id;
      if (!targetId) throw new Error('Patient id is required');
      const data = input.data ?? input;
      return patientsApi.update(targetId, data);
    },
    onSuccess: () => { toast.success('Patient updated'); qc.invalidateQueries({ queryKey: patientKeys.all }); },
  });
}

export function useDeletePatient() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => patientsApi.remove(id),
    onSuccess: () => { toast.success('Patient deleted'); qc.invalidateQueries({ queryKey: patientKeys.all }); },
  });
}
