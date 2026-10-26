import api from '@/lib/api-client';
import type { Patient, PatientCreatePayload, PatientUpdatePayload, PatientFilters } from '@/types/patient';
import type { PageResponse } from '@/types/common';

export const patientsApi = {
  list: async (filters?: PatientFilters) => (await api.get<PageResponse<Patient>>('/api/v1/patients', { params: filters })).data,
  get: async (id: string) => (await api.get<Patient>(`/api/v1/patients/${id}`)).data,
  create: async (payload: PatientCreatePayload) => (await api.post<Patient>('/api/v1/patients', payload)).data,
  update: async (id: string, payload: PatientUpdatePayload) => (await api.put<Patient>(`/api/v1/patients/${id}`, payload)).data,
  remove: async (id: string) => (await api.delete(`/api/v1/patients/${id}`)).data,
};
