import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '@/types/auth';
import { STORAGE_KEYS } from '@/lib/constants';

interface AuthState {
  user: AuthUser | null;
  pendingApproval: boolean;
  setUser: (u: AuthUser | null) => void;
  setPendingApproval: (pendingApproval: boolean) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      pendingApproval: false,
      setUser: (u) => set({ user: u }),
      setPendingApproval: (pendingApproval) => set({ pendingApproval }),
      clear: () => set({ user: null, pendingApproval: false }),
    }),
    { name: STORAGE_KEYS.auth },
  ),
);
