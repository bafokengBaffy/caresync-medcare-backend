import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { patientDocumentsApi } from '@/api/patient-documents';
import { toast } from 'sonner';

export const patientDocumentKeys = {
  all: ['patient-documents'] as const,
  byPatient: (patientId: string) => [...patientDocumentKeys.all, patientId] as const,
};

export function usePatientDocuments(patientId: string) {
  return useQuery({
    queryKey: patientDocumentKeys.byPatient(patientId),
    queryFn: () => patientDocumentsApi.list(patientId),
    enabled: Boolean(patientId),
  });
}

export function useUploadPatientDocument(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (file: File) => patientDocumentsApi.upload(patientId, file),
    onSuccess: () => {
      toast.success('Document uploaded');
      queryClient.invalidateQueries({ queryKey: patientDocumentKeys.byPatient(patientId) });
    },
  });
}

export function useDeletePatientDocument(patientId: string) {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: (documentId: string) => patientDocumentsApi.remove(patientId, documentId),
    onSuccess: () => {
      toast.success('Document deleted');
      queryClient.invalidateQueries({ queryKey: patientDocumentKeys.byPatient(patientId) });
    },
  });
}
