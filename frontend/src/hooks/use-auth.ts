import { useEffect, useState } from 'react';
import { onAuthStateChanged, signInWithEmailAndPassword, signOut, type User } from 'firebase/auth';
import { auth } from '@/lib/firebase';
import { useAuthStore } from '@/stores/auth-store';
import type { AuthUser } from '@/types/auth';
import { readAuthClaims } from '@/lib/auth-claims';
import { forceRefreshClaims, syncCurrentUser } from '@/api/auth-sync';

export function useAuth() {
  const { user, setUser, setPendingApproval, clear, pendingApproval } = useAuthStore();
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!auth) { setLoading(false); return; }
    const unsub = onAuthStateChanged(auth, async (fbUser: User | null) => {
      if (!fbUser) { clear(); setLoading(false); return; }
      try {
        const token = await fbUser.getIdTokenResult(true);
        let claims = readAuthClaims(token.claims);
        if (!claims) {
          const sync = await syncCurrentUser();
          if (sync.status === 'PENDING_APPROVAL') {
            setPendingApproval(true);
            setUser(null);
            return;
          }
          if (sync.synced) {
            const refreshed = await forceRefreshClaims();
            claims = readAuthClaims(refreshed ?? {});
          }
        }
        if (!claims) {
          clear();
          await signOut(auth);
          return;
        }
        const next: AuthUser = {
          uid: fbUser.uid,
          email: fbUser.email,
          displayName: fbUser.displayName,
          ...claims,
        };
        setPendingApproval(false);
        setUser(next);
      } catch {
        clear();
        await signOut(auth);
      } finally {
        setLoading(false);
      }
    });
    return () => unsub();
  }, [clear, setPendingApproval, setUser]);

  const login = async (email: string, password: string) => {
    if (!auth) throw new Error('Firebase not configured');
    await signInWithEmailAndPassword(auth, email, password);
  };
  const logout = async () => { if (auth) await signOut(auth); clear(); };

  return { user, loading, login, logout, pendingApproval, isAuthenticated: !!user };
}
