import { auth } from '@/lib/firebase';

export interface SyncResponse {
  synced: boolean;
  status?: 'PROVISIONED' | 'PENDING_APPROVAL' | string;
  tenantId?: string;
  role?: string;
  specialty?: string;
  message?: string;
}

export interface PendingStatusResponse {
  status: 'PENDING' | 'APPROVED' | 'REJECTED' | 'NOT_SUBMITTED' | string;
  rejectionReason: string | null;
  submittedAt: string | null;
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
  } catch (error) {
    if (error instanceof Error) {
      return { synced: false, message: 'Network error during account provisioning' };
    }
    return { synced: false, message: 'Unexpected error during account provisioning' };
  }
}

export async function getPendingStatus(): Promise<PendingStatusResponse> {
  const user = auth.currentUser;
  if (!user) throw new Error('Sign in to check registration status.');

  const token = await user.getIdToken();
  const base = (import.meta.env.VITE_API_BASE_URL ?? '').replace(/\/$/, '');
  if (!base && !import.meta.env.DEV) throw new Error('The CareSync API is not configured.');

  const response = await fetch(`${base}/api/v1/auth/pending-status`, {
    headers: { Authorization: `Bearer ${token}` },
  });
  if (!response.ok) {
    throw new Error(`Could not check your registration status (HTTP ${response.status}).`);
  }

  const body: unknown = await response.json();
  if (
    typeof body !== 'object'
    || body === null
    || !('status' in body)
    || typeof body.status !== 'string'
  ) {
    throw new Error('The registration status response was invalid.');
  }

  const typedBody = body as Record<string, unknown>;
  return {
    status: body.status,
    rejectionReason: typeof typedBody.rejectionReason === 'string' ? typedBody.rejectionReason : null,
    submittedAt: typeof typedBody.submittedAt === 'string' ? typedBody.submittedAt : null,
  };
}

export async function forceRefreshClaims(): Promise<Record<string, unknown> | null> {
  const user = auth.currentUser;
  if (!user) return null;
  await user.getIdToken(true);
  const result = await user.getIdTokenResult(true);
  return result.claims;
}
