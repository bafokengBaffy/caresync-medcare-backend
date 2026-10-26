import { create } from 'zustand';
import { persist } from 'zustand/middleware';
import type { AuthUser } from '@/types/auth';
import { STORAGE_KEYS } from '@/lib/constants';

interface AuthState {
  user: AuthUser | null;
  setUser: (u: AuthUser | null) => void;
  clear: () => void;
}

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      user: null,
      setUser: (u) => set({ user: u }),
      clear: () => set({ user: null }),
    }),
    { name: STORAGE_KEYS.auth },
  ),
);
