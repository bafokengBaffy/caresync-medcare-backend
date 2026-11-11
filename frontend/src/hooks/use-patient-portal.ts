import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { patientPortalApi } from '@/api/patient-portal';

export function usePatientPortal() {
  const uid = useAuthStore((state) => state.user?.uid);
  const enabled = Boolean(uid);
  const key = ['patient-portal', uid] as const;
  return {
    profile: useQuery({ queryKey: [...key, 'profile'], queryFn: patientPortalApi.profile, enabled }),
    appointments: useQuery({
      queryKey: [...key, 'appointments'],
      queryFn: patientPortalApi.appointments,
      enabled,
    }),
    invoices: useQuery({ queryKey: [...key, 'invoices'], queryFn: patientPortalApi.invoices, enabled }),
    records: useQuery({ queryKey: [...key, 'records'], queryFn: patientPortalApi.records, enabled }),
  };
}
