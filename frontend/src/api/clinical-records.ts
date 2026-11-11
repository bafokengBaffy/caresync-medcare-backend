import api from '@/lib/api-client';
import type {
  DentalChart,
  DentalChartPayload,
  EyeExam,
  EyeExamPayload,
  LabResult,
  LabResultPayload,
} from '@/types/clinical-records';

export const dentalChartsApi = {
  list: async (patientId?: string) =>
    (await api.get<DentalChart[]>('/api/v1/dental-charts', { params: patientId ? { patientId } : {} })).data,
  create: async (payload: DentalChartPayload) =>
    (await api.post<DentalChart>('/api/v1/dental-charts', payload)).data,
  update: async (id: string, payload: DentalChartPayload) =>
    (await api.put<DentalChart>(`/api/v1/dental-charts/${id}`, payload)).data,
  archive: async (id: string) => api.delete(`/api/v1/dental-charts/${id}`),
};

export const eyeExamsApi = {
  list: async (patientId?: string) =>
    (await api.get<EyeExam[]>('/api/v1/eye-exams', { params: patientId ? { patientId } : {} })).data,
  create: async (payload: EyeExamPayload) =>
    (await api.post<EyeExam>('/api/v1/eye-exams', payload)).data,
  update: async (id: string, payload: EyeExamPayload) =>
    (await api.put<EyeExam>(`/api/v1/eye-exams/${id}`, payload)).data,
  archive: async (id: string) => api.delete(`/api/v1/eye-exams/${id}`),
};

export const labResultsApi = {
  list: async (patientId?: string) =>
    (await api.get<LabResult[]>('/api/v1/lab-results', { params: patientId ? { patientId } : {} })).data,
  create: async (payload: LabResultPayload) =>
    (await api.post<LabResult>('/api/v1/lab-results', payload)).data,
  update: async (id: string, payload: LabResultPayload) =>
    (await api.put<LabResult>(`/api/v1/lab-results/${id}`, payload)).data,
  archive: async (id: string) => api.delete(`/api/v1/lab-results/${id}`),
};
