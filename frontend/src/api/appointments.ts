import api from '@/lib/api-client';
import type { Appointment, AppointmentCreatePayload, AvailabilitySlot, AvailabilityQuery } from '@/types/appointment';
import type { PageResponse } from '@/types/common';

export const appointmentsApi = {
  list: async (params?: Record<string, unknown>) => (await api.get<PageResponse<Appointment>>('/api/v1/appointments', { params })).data,
  get: async (id: string) => (await api.get<Appointment>(`/api/v1/appointments/${id}`)).data,
  create: async (payload: AppointmentCreatePayload) => (await api.post<Appointment>('/api/v1/appointments', payload)).data,
  changeStatus: async (id: string, status: string) => (await api.patch<Appointment>(`/api/v1/appointments/${id}/status`, { status })).data,
  availability: async (q: AvailabilityQuery) => (await api.get<AvailabilitySlot[]>('/api/v1/availability', { params: q })).data,
};
