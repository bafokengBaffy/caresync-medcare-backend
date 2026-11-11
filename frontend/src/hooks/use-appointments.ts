import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi } from '@/api/appointments';
import type { AppointmentCreatePayload, AvailabilityQuery } from '@/types/appointment';
import { toast } from 'sonner';

export const apptKeys = { all: ['appointments'] as const, detail: (id: string) => ['appointments', 'detail', id] as const };

type AppointmentQuery = { page?: number; size?: number; search?: string; status?: string };

export function useAppointments(params: AppointmentQuery = {}) {
  return useQuery({
    queryKey: [...apptKeys.all, params],
    queryFn: () => appointmentsApi.getAppointments(params),
  });
}

export function useAppointment(id: string) {
  return useQuery({
    queryKey: apptKeys.detail(id),
    queryFn: () => appointmentsApi.getAppointment(id),
    enabled: !!id,
  });
}

export function useAvailability(q: AvailabilityQuery | null) {
  return useQuery({
    queryKey: ['availability', q],
    queryFn: () => appointmentsApi.getProviderAvailability(q!),
    enabled: !!q,
  });
}

export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: AppointmentCreatePayload) => appointmentsApi.createAppointment(p),
    onSuccess: () => { toast.success('Appointment scheduled'); qc.invalidateQueries({ queryKey: apptKeys.all }); },
  });
}

export function useUpdateAppointmentStatus() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, status }: { id: string; status: string }) =>
      appointmentsApi.updateAppointmentStatus(id, status),
    onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries({ queryKey: apptKeys.all }); },
  });
}
