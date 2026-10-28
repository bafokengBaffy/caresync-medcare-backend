import { auth } from '@/lib/firebase';

export interface SyncResponse {
  synced: boolean;
  tenantId?: string;
  role?: string;
  specialty?: string;
  message?: string;
}

export async function syncCurrentUser(): Promise<SyncResponse> {
  const user = auth.currentUser;
  if (!user) return { synced: false, message: 'No authenticated Firebase user' };

  try {
    const token = await user.getIdToken(true);
    const base = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
    const response = await fetch(`${base}/api/v1/auth/sync`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    const body = await response.json().catch(() => null);
    if (!response.ok) {
      return { synced: false, message: body?.message ?? `Sync failed with status ${response.status}` };
    }
    return body as SyncResponse;
  } catch {
    return { synced: false, message: 'Network error during account provisioning' };
  }
}

export async function forceRefreshClaims(): Promise<Record<string, unknown> | null> {
  const user = auth.currentUser;
  if (!user) return null;
  await user.getIdToken(true);
  const result = await user.getIdTokenResult(true);
  return result.claims;
}
