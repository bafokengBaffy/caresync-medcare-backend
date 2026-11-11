import api from '@/lib/api-client';
import type { PatientDocument } from '@/types/patient-document';

const documentsPath = (patientId: string) => `/api/v1/patients/${patientId}/documents`;

export const patientDocumentsApi = {
  list: async (patientId: string) =>
    (await api.get<PatientDocument[]>(documentsPath(patientId))).data,

  upload: async (patientId: string, file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return (
      await api.post<{ document: PatientDocument }>(documentsPath(patientId), formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    ).data.document;
  },

  download: async (mediaUrl: string) =>
    (await api.get<Blob>(mediaUrl, { responseType: 'blob' })).data,

  remove: async (patientId: string, documentId: string) =>
    api.delete(`${documentsPath(patientId)}/${documentId}`),
};
