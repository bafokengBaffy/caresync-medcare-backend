import api from '@/lib/api-client';
import type { ClinicalNote, ClinicalNoteCreatePayload, ClinicalNoteSummary, ClinicalNoteUpdatePayload } from '@/types/clinical-note';
import type { PageResponse } from '@/types/common';

export interface NoteListParams {
  page?: number;
  size?: number;
  search?: string;
}

export const notesApi = {
  list: async (params?: NoteListParams) => (await api.get<PageResponse<ClinicalNoteSummary>>('/api/v1/notes', { params })).data,
  get: async (id: string) => (await api.get<ClinicalNote>(`/api/v1/notes/${id}`)).data,
  create: async (payload: ClinicalNoteCreatePayload) => (await api.post<ClinicalNote>('/api/v1/notes', payload)).data,
  update: async (id: string, payload: ClinicalNoteUpdatePayload) => (await api.put<ClinicalNote>(`/api/v1/notes/${id}`, payload)).data,
  remove: async (id: string) => (await api.delete<ClinicalNote>(`/api/v1/notes/${id}`)).data,
};
