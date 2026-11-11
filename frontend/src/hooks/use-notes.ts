import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notesApi, type NoteListParams } from '@/api/notes';
import type { ClinicalNoteCreatePayload, ClinicalNoteUpdatePayload } from '@/types/clinical-note';
import { toast } from 'sonner';

export const noteKeys = { all: ['notes'] as const, detail: (id: string) => ['notes', 'detail', id] as const };

export function useNotes(params?: NoteListParams) {
  return useQuery({
    queryKey: [...noteKeys.all, params],
    queryFn: () => notesApi.list(params),
    placeholderData: (previous) => previous,
  });
}

export function useNote(id: string) {
  return useQuery({
    queryKey: noteKeys.detail(id),
    queryFn: () => notesApi.get(id),
    enabled: !!id,
  });
}

export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: ClinicalNoteCreatePayload) => notesApi.create(payload),
    onSuccess: async () => {
      toast.success('Note created');
      await qc.invalidateQueries({ queryKey: noteKeys.all });
    },
  });
}

export function useUpdateNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, data }: { id: string; data: ClinicalNoteUpdatePayload }) => notesApi.update(id, data),
    onSuccess: async () => {
      toast.success('Note updated');
      await qc.invalidateQueries({ queryKey: noteKeys.all });
    },
  });
}

export function useDeleteNote() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => notesApi.remove(id),
    onSuccess: async () => {
      toast.success('Note deleted');
      await qc.invalidateQueries({ queryKey: noteKeys.all });
    },
  });
}
