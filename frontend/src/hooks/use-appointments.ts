import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { appointmentsApi } from '@/api/appointments';
import type { AppointmentCreatePayload, AvailabilityQuery } from '@/types/appointment';
import { toast } from 'sonner';

export const apptKeys = { all: ['appointments'] as const, detail: (id: string) => ['appointments', 'detail', id] as const };

export function useAppointments(params?: Record<string, unknown>) { return useQuery({ queryKey: [...apptKeys.all, params], queryFn: () => appointmentsApi.list(params) }); }
export function useAppointment(id: string) { return useQuery({ queryKey: apptKeys.detail(id), queryFn: () => appointmentsApi.get(id), enabled: !!id }); }
export function useAvailability(q: AvailabilityQuery | null) { return useQuery({ queryKey: ['availability', q], queryFn: () => appointmentsApi.availability(q!), enabled: !!q }); }
export function useCreateAppointment() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (p: AppointmentCreatePayload) => appointmentsApi.create(p), onSuccess: () => { toast.success('Appointment scheduled'); qc.invalidateQueries({ queryKey: apptKeys.all }); } });
}
export function useUpdateAppointmentStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (status: string) => appointmentsApi.changeStatus(id, status), onSuccess: () => { toast.success('Status updated'); qc.invalidateQueries({ queryKey: apptKeys.all }); } });
}
