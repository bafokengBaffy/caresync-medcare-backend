import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { dentalChartsApi, eyeExamsApi, labResultsApi } from '@/api/clinical-records';
import type { DentalChartPayload, EyeExamPayload, LabResultPayload } from '@/types/clinical-records';
import { toast } from 'sonner';

export const clinicalRecordKeys = {
  dental: ['clinical-records', 'dental'] as const,
  eye: ['clinical-records', 'eye'] as const,
  lab: ['clinical-records', 'lab'] as const,
};

export function useDentalCharts(patientId?: string) {
  return useQuery({
    queryKey: [...clinicalRecordKeys.dental, patientId],
    queryFn: () => dentalChartsApi.list(patientId),
  });
}

export function useSaveDentalChart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id?: string; payload: DentalChartPayload }) =>
      input.id ? dentalChartsApi.update(input.id, input.payload) : dentalChartsApi.create(input.payload),
    onSuccess: (_record, input) => {
      toast.success(input.id ? 'Dental chart updated' : 'Dental chart created');
      queryClient.invalidateQueries({ queryKey: clinicalRecordKeys.dental });
    },
  });
}

export function useArchiveDentalChart() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => dentalChartsApi.archive(id),
    onSuccess: () => {
      toast.success('Dental chart archived');
      queryClient.invalidateQueries({ queryKey: clinicalRecordKeys.dental });
    },
  });
}

export function useEyeExams(patientId?: string) {
  return useQuery({
    queryKey: [...clinicalRecordKeys.eye, patientId],
    queryFn: () => eyeExamsApi.list(patientId),
  });
}

export function useSaveEyeExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id?: string; payload: EyeExamPayload }) =>
      input.id ? eyeExamsApi.update(input.id, input.payload) : eyeExamsApi.create(input.payload),
    onSuccess: (_record, input) => {
      toast.success(input.id ? 'Eye exam updated' : 'Eye exam created');
      queryClient.invalidateQueries({ queryKey: clinicalRecordKeys.eye });
    },
  });
}

export function useArchiveEyeExam() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => eyeExamsApi.archive(id),
    onSuccess: () => {
      toast.success('Eye exam archived');
      queryClient.invalidateQueries({ queryKey: clinicalRecordKeys.eye });
    },
  });
}

export function useLabResults(patientId?: string) {
  return useQuery({
    queryKey: [...clinicalRecordKeys.lab, patientId],
    queryFn: () => labResultsApi.list(patientId),
  });
}

export function useSaveLabResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (input: { id?: string; payload: LabResultPayload }) =>
      input.id ? labResultsApi.update(input.id, input.payload) : labResultsApi.create(input.payload),
    onSuccess: (_record, input) => {
      toast.success(input.id ? 'Lab result updated' : 'Lab result created');
      queryClient.invalidateQueries({ queryKey: clinicalRecordKeys.lab });
    },
  });
}

export function useArchiveLabResult() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => labResultsApi.archive(id),
    onSuccess: () => {
      toast.success('Lab result archived');
      queryClient.invalidateQueries({ queryKey: clinicalRecordKeys.lab });
    },
  });
}
