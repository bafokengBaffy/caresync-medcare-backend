import apiClient from '@/lib/api-client';
import type { Appointment, AppointmentCreatePayload, AvailabilitySlot, AvailabilityQuery } from '@/types/appointment';

interface AppointmentListParams {
  page?: number;
  size?: number;
  search?: string;
  status?: string;
}

interface AppointmentPage {
  content: Appointment[];
  total: number;
  totalPages: number;
}

export const appointmentsApi = {
  getAppointments: async (params: AppointmentListParams = {}): Promise<AppointmentPage> => {
    const { data } = await apiClient.get<Appointment[]>('/api/v1/appointments');
    const search = params.search?.trim().toLowerCase();
    const filtered = data.filter((appointment) => {
      const matchesStatus = !params.status || params.status === 'ALL' || appointment.status === params.status;
      const matchesSearch = !search || [
        appointment.patientName,
        appointment.patientId,
        appointment.providerName,
        appointment.providerId,
      ].some((value) => value?.toLowerCase().includes(search));
      return matchesStatus && matchesSearch;
    });
    const size = Math.max(1, params.size ?? 20);
    const page = Math.max(0, params.page ?? 0);
    return {
      content: filtered.slice(page * size, (page + 1) * size),
      total: filtered.length,
      totalPages: Math.ceil(filtered.length / size),
    };
  },
  
  getAppointment: async (id: string) => {
    return (await apiClient.get<Appointment>(`/api/v1/appointments/${id}`)).data;
  },
  
  createAppointment: async (data: AppointmentCreatePayload) => {
    return (await apiClient.post<Appointment>('/api/v1/appointments', data)).data;
  },
  
  updateAppointmentStatus: async (id: string, status: string) => {
    return (await apiClient.put<Appointment>(`/api/v1/appointments/${id}/status`, { status })).data;
  },
  
  getProviderAvailability: async (query: AvailabilityQuery) => {
    return (await apiClient.get<AvailabilitySlot[]>(`/api/v1/appointments/availability`, { params: query })).data;
  }
};