import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/stores/auth-store';
import type { AuthUser } from '@/types/auth';
import type { Role, Specialty } from '@/lib/constants';

export function useAuth() {
  const { user, setUser, clear } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) { setLoading(false); return; }
    const unsub = onAuthStateChanged(auth, async (fbUser: User | null) => {
      if (!fbUser) { clear(); setLoading(false); return; }
      const token = await fbUser.getIdTokenResult();
      const claims = token.claims as Record<string, string>;
      const next: AuthUser = {
        uid: fbUser.uid,
        email: fbUser.email,
        displayName: fbUser.displayName,
        role: (claims.role as Role) ?? 'STAFF',
        tenantId: claims.tenant_id ?? '',
        specialty: claims.specialty as Specialty | undefined,
      };
      setUser(next);
      setLoading(false);
    });
    return () => unsub();
  }, [clear, setUser]);

  const login = async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase not configured');
    await signInWithEmailAndPassword(auth, email, password);
  };
  const logout = async () => { if (auth) await signOut(auth); clear(); };

  return { user, loading, login, logout, isAuthenticated: !!user };
}
