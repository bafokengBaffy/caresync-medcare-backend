import api from '@/lib/api-client';

export interface UserProfile {
  firebaseUid: string;
  fullName: string;
  phone: string | null;
  email: string;
  profileImageUrl: string | null;
  role: string;
  tenantId: string | null;
  tenantName: string | null;
  createdAt: string | null;
  updatedAt: string | null;
}

interface ApiResponse<T> {
  data: T;
}

export interface UpdateProfilePayload {
  fullName: string;
  phone: string;
}

export const profileApi = {
  get: async () => (await api.get<ApiResponse<UserProfile>>('/api/v1/profile')).data.data,
  update: async (payload: UpdateProfilePayload) =>
    (await api.put<ApiResponse<UserProfile>>('/api/v1/profile', payload)).data.data,
  uploadImage: async (file: File) => {
    const formData = new FormData();
    formData.append('file', file);
    return (
      await api.patch<ApiResponse<UserProfile>>('/api/v1/profile/image', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
    ).data.data;
  },
};
