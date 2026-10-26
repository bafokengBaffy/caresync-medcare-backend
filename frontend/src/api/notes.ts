import api from '@/lib/api-client';
import type { ClinicalNote, ClinicalNoteCreatePayload } from '@/types/clinical-note';
import type { PageResponse } from '@/types/common';

export const notesApi = {
  list: async (params?: Record<string, unknown>) => (await api.get<PageResponse<ClinicalNote>>('/api/v1/notes', { params })).data,
  get: async (id: string) => (await api.get<ClinicalNote>(`/api/v1/notes/${id}`)).data,
  create: async (payload: ClinicalNoteCreatePayload) => (await api.post<string>('/api/v1/notes', payload)).data,
  sign: async (id: string, signature: string) => (await api.post(`/api/v1/notes/${id}/sign`, { signature })).data,
};
