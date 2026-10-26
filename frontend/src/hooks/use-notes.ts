import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { notesApi } from '@/api/notes';
import type { ClinicalNoteCreatePayload } from '@/types/clinical-note';
import { toast } from 'sonner';

export const noteKeys = { all: ['notes'] as const, detail: (id: string) => ['notes', 'detail', id] as const };

export function useNotes(params?: Record<string, unknown>) { return useQuery({ queryKey: [...noteKeys.all, params], queryFn: () => notesApi.list(params) }); }
export function useNote(id: string) { return useQuery({ queryKey: noteKeys.detail(id), queryFn: () => notesApi.get(id), enabled: !!id }); }
export function useCreateNote() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (p: ClinicalNoteCreatePayload) => notesApi.create(p), onSuccess: () => { toast.success('Note created'); qc.invalidateQueries({ queryKey: noteKeys.all }); } });
}
export function useSignNote(id: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (sig: string) => notesApi.sign(id, sig), onSuccess: () => { toast.success('Note signed'); qc.invalidateQueries({ queryKey: noteKeys.all }); } });
}
