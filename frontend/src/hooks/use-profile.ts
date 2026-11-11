import { useQuery } from '@tanstack/react-query';
import { useAuthStore } from '@/stores/auth-store';
import { profileApi } from '@/api/profile';

export const profileQueryKey = (uid: string) => ['profile', uid] as const;

export function useProfile() {
  const uid = useAuthStore((state) => state.user?.uid);
  return useQuery({
    queryKey: profileQueryKey(uid ?? ''),
    queryFn: profileApi.get,
    enabled: Boolean(uid),
  });
}
