import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate, useSearchParams } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Mail,
  Shield,
  Building2,
  Activity,
  Key,
  Smartphone,
  Monitor,
  AlertTriangle,
  Loader2,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Edit2,
  Save,
  X,
  Ban,
  Power,
  Trash2,
  Send,
  RefreshCw,
  Link2,
  Fingerprint,
  ShieldCheck,
  FileText,
  CreditCard,
  Eye,
  Lock,
  Info,
  UserX,
  Award,
  BadgeCheck,
  MailWarning,
  Globe,
} from 'lucide-react';
import { toast } from 'sonner';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
type Role =
  | 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'ADMIN' | 'MANAGER' | 'PROVIDER'
  | 'CLINICIAN' | 'RECEPTION' | 'RECEPTIONIST' | 'STAFF' | 'FINANCE'
  | 'CONSENT_MANAGER' | 'PRIVACY_OFFICER' | 'PATIENT';

type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING' | 'LOCKED' | 'DEACTIVATED';

interface ActiveSession {
  id: string;
  device: string;
  ip: string;
  location?: string;
  lastActive: string;
  isCurrent: boolean;
}

interface ActivityEntry {
  id: string;
  action: string;
  timestamp: string;
  ip?: string;
  details?: string;
}

interface UserDetail {
  id: string;
  email: string;
  fullName: string;
  phone?: string;
  firebaseUid: string;
  role: Role;
  status: UserStatus;
  tenantId?: string;
  tenantName?: string;
  tenantSubdomain?: string;
  providerId?: string;
  providerName?: string;
  providerSpecialisation?: string;
  emailVerified: boolean;
  mfaEnabled: boolean;
  permissions: string[];
  lastLogin?: string;
  createdAt: string;
  updatedAt?: string;
  createdBy?: string;
  notes?: string;
  hasRoleClaim: boolean;
  hasUserRecord: boolean;
  hasTenant: boolean;
  hasProviderLink: boolean;
  activeSessions: ActiveSession[];
  recentActivity: ActivityEntry[];
}

const ROLE_LABELS: Record<Role, string> = {
  SUPER_ADMIN: 'Super Admin',
  TENANT_ADMIN: 'Tenant Admin',
  ADMIN: 'Admin',
  MANAGER: 'Manager',
  PROVIDER: 'Provider',
  CLINICIAN: 'Clinician',
  RECEPTION: 'Reception',
  RECEPTIONIST: 'Receptionist',
  STAFF: 'Staff',
  FINANCE: 'Finance',
  CONSENT_MANAGER: 'Consent Manager',
  PRIVACY_OFFICER: 'Privacy Officer',
  PATIENT: 'Patient',
};

const ROLE_REQUIRES_PROVIDER: Role[] = ['PROVIDER', 'CLINICIAN'];
const PLATFORM_ROLES: Role[] = ['SUPER_ADMIN'];

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('firebaseToken') ?? ''}`,
});

type Tab = 'profile' | 'security' | 'activity' | 'permissions';

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export default function UserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const [user, setUser] = useState<UserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('profile');

  // Inline editing
  const [isEditing, setIsEditing] = useState(searchParams.get('edit') === '1');
  const [editForm, setEditForm] = useState<{
    fullName: string;
    phone: string;
    notes: string;
  }>({ fullName: '', phone: '', notes: '' });
  const [isSavingProfile, setIsSavingProfile] = useState(false);

  // Actions
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);
  const [showDelete, setShowDelete] = useState(false);
  const [deleteConfirm, setDeleteConfirm] = useState('');
  const [isDeleting, setIsDeleting] = useState(false);

  // ───────────────────────────────────────────────
  // Load
  // ───────────────────────────────────────────────
  const load = useCallback(async () => {
    if (!userId) return;
    setIsLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/v1/admin/users/${userId}`, {
        headers: authHeaders(),
      });
      if (!res.ok) {
        if (res.status === 404) throw new Error('User not found');
        throw new Error('Failed to load user');
      }
      const data: UserDetail = await res.json();
      setUser(data);
      setEditForm({
        fullName: data.fullName,
        phone: data.phone ?? '',
        notes: data.notes ?? '',
      });
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Unknown error');
    } finally {
      setIsLoading(false);
    }
  }, [userId]);

  useEffect(() => {
    load();
  }, [load]);

  // ───────────────────────────────────────────────
  // Actions
  // ───────────────────────────────────────────────
  const saveProfile = async () => {
    if (!user) return;
    setIsSavingProfile(true);
    try {
      const res = await fetch(`/api/v1/admin/users/${user.id}`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify(editForm),
      });
      if (!res.ok) throw new Error('Save failed');
      const updated: UserDetail = await res.json();
      setUser(updated);
      setIsEditing(false);
      toast.success('Profile updated');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Save failed');
    } finally {
      setIsSavingProfile(false);
    }
  };

  const toggleStatus = async () => {
    if (!user) return;
    const nextStatus: UserStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    if (!window.confirm(`Change status to ${nextStatus}?`)) return;
    setIsUpdatingStatus(true);
    try {
      const res = await fetch(`/api/v1/admin/users/${user.id}/status`, {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status: nextStatus }),
      });
      if (!res.ok) throw new Error('Failed');
      setUser({ ...user, status: nextStatus });
      toast.success(`User is now ${nextStatus}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const revokeSession = async (sessionId: string) => {
    if (!user) return;
    if (!window.confirm('Revoke this session? The user will be logged out immediately.')) return;
    try {
      const res = await fetch(
        `/api/v1/admin/users/${user.id}/sessions/${sessionId}`,
        { method: 'DELETE', headers: authHeaders() }
      );
      if (!res.ok) throw new Error('Failed');
      setUser({
        ...user,
        activeSessions: user.activeSessions.filter((s) => s.id !== sessionId),
      });
      toast.success('Session revoked');
    } catch {
      toast.error('Failed to revoke session');
    }
  };

  const sendPasswordReset = async () => {
    if (!user) return;
    try {
      const res = await fetch(
        `/api/v1/admin/firebase/users/${user.firebaseUid}/send-password-reset`,
        { method: 'POST', headers: authHeaders() }
      );
      if (!res.ok) throw new Error('Failed');
      toast.success(`Password reset email sent to ${user.email}`);
    } catch {
      toast.error('Failed to send reset');
    }
  };

  const sendVerification = async () => {
    if (!user) return;
    try {
      const res = await fetch(
        `/api/v1/admin/firebase/users/${user.firebaseUid}/send-verification`,
        { method: 'POST', headers: authHeaders() }
      );
      if (!res.ok) throw new Error('Failed');
      toast.success(`Verification email sent to ${user.email}`);
    } catch {
      toast.error('Failed to send verification');
    }
  };

  const deleteUser = async () => {
    if (!user || deleteConfirm !== user.email) return;
    setIsDeleting(true);
    try {
      const res = await fetch(`/api/v1/admin/users/${user.id}`, {
        method: 'DELETE',
        headers: authHeaders(),
      });
      if (!res.ok) throw new Error('Delete failed');
      toast.success('User deleted');
      navigate('/admin/super/users');
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed');
      setIsDeleting(false);
    }
  };

  // ───────────────────────────────────────────────
  // Loading
  // ───────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  if (error || !user) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow p-8 max-w-md w-full text-center border border-gray-200">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900">Unable to load user</h2>
          <p className="mt-1 text-sm text-gray-500">{error ?? 'User not found'}</p>
          <button
            onClick={() => navigate('/admin/super/users')}
            className="mt-4 px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
          >
            Back to users
          </button>
        </div>
      </div>
    );
  }

  const incomplete =
    !user.hasRoleClaim ||
    !user.hasUserRecord ||
    (!user.hasTenant && !PLATFORM_ROLES.includes(user.role)) ||
    (ROLE_REQUIRES_PROVIDER.includes(user.role) && !user.hasProviderLink);

  // ───────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-start gap-4">
            <button
              onClick={() => navigate('/admin/super/users')}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-500 flex-shrink-0"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="h-11 w-11 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold flex-shrink-0">
                  {user.fullName.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2 flex-wrap">
                    <span className="truncate">{user.fullName}</span>
                    <StatusBadge status={user.status} />
                    {!user.emailVerified && (
                      <span className="inline-flex items-center gap-1 text-[11px] font-semibold bg-amber-100 text-amber-700 px-2 py-0.5 rounded">
                        <MailWarning className="w-3 h-3" /> Unverified
                      </span>
                    )}
                  </h1>
                  <p className="text-sm text-gray-500 flex items-center gap-1">
                    <Mail className="w-3.5 h-3.5" />
                    {user.email}
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              {isEditing ? (
                <>
                  <button
                    onClick={() => {
                      setIsEditing(false);
                      setEditForm({
                        fullName: user.fullName,
                        phone: user.phone ?? '',
                        notes: user.notes ?? '',
                      });
                    }}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    <X className="w-4 h-4 mr-1" /> Cancel
                  </button>
                  <button
                    onClick={saveProfile}
                    disabled={isSavingProfile}
                    className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isSavingProfile ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : (
                      <Save className="w-4 h-4 mr-1" />
                    )}
                    Save
                  </button>
                </>
              ) : (
                <>
                  <button
                    onClick={() => setIsEditing(true)}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
                  >
                    <Edit2 className="w-4 h-4 mr-1" /> Edit
                  </button>
                  <button
                    onClick={toggleStatus}
                    disabled={isUpdatingStatus}
                    className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md border ${
                      user.status === 'ACTIVE'
                        ? 'text-red-700 bg-white border-red-300 hover:bg-red-50'
                        : 'text-emerald-700 bg-white border-emerald-300 hover:bg-emerald-50'
                    } disabled:opacity-50`}
                  >
                    {isUpdatingStatus ? (
                      <Loader2 className="w-4 h-4 mr-1 animate-spin" />
                    ) : user.status === 'ACTIVE' ? (
                      <Ban className="w-4 h-4 mr-1" />
                    ) : (
                      <Power className="w-4 h-4 mr-1" />
                    )}
                    {user.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
                  </button>
                  <button
                    onClick={() => setShowDelete(true)}
                    className="inline-flex items-center px-3 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </>
              )}
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex gap-1 -mb-px overflow-x-auto">
            {[
              { id: 'profile', label: 'Profile', icon: User },
              { id: 'security', label: 'Security & Sessions', icon: Lock },
              { id: 'permissions', label: 'Permissions', icon: Shield },
              { id: 'activity', label: 'Activity', icon: Activity },
            ].map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id as Tab)}
                  className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap ${
                    active
                      ? 'border-indigo-600 text-indigo-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {t.label}
                </button>
              );
            })}
          </nav>
        </div>
      </div>

      {/* Body */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* Provisioning banner */}
        {incomplete && (
          <div className="mb-6 bg-amber-50 border border-amber-200 rounded-lg p-4 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <div className="flex-1">
              <p className="text-sm font-semibold text-amber-900">
                This user is not fully provisioned
              </p>
              <p className="text-xs text-amber-800 mt-1">
                Missing pieces block privileged login. Fix them via the provisioning flow.
              </p>
              <div className="mt-2 flex flex-wrap gap-2 text-xs">
                {!user.hasRoleClaim && <MissingTag label="No role claim" />}
                {!user.hasUserRecord && <MissingTag label="No user record" />}
                {!user.hasTenant && !PLATFORM_ROLES.includes(user.role) && (
                  <MissingTag label="No tenant" />
                )}
                {ROLE_REQUIRES_PROVIDER.includes(user.role) && !user.hasProviderLink && (
                  <MissingTag label="No provider link" />
                )}
              </div>
            </div>
            <button
              onClick={() =>
                navigate(
                  `/admin/super/registration/provision?email=${encodeURIComponent(
                    user.email
                  )}&firebaseUid=${user.firebaseUid}`
                )
              }
              className="inline-flex items-center px-3 py-1.5 text-xs font-medium text-white bg-amber-600 rounded-md hover:bg-amber-700 flex-shrink-0"
            >
              Fix now
            </button>
          </div>
        )}

        {/* Profile tab */}
        {tab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in fade-in">
            <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-500" />
                  Profile Information
                </h2>
              </div>
              <div className="p-6 space-y-4">
                <EditField
                  label="Full name"
                  value={editForm.fullName}
                  onChange={(v) => setEditForm({ ...editForm, fullName: v })}
                  editing={isEditing}
                  readOnlyValue={user.fullName}
                />
                <ReadField label="Email" value={user.email} icon={Mail} />
                <EditField
                  label="Phone"
                  value={editForm.phone}
                  onChange={(v) => setEditForm({ ...editForm, phone: v })}
                  editing={isEditing}
                  readOnlyValue={user.phone ?? '—'}
                />
                <ReadField label="Role" value={ROLE_LABELS[user.role]} icon={Shield} />
                <ReadField
                  label="Tenant"
                  value={
                    PLATFORM_ROLES.includes(user.role)
                      ? 'Platform (all tenants)'
                      : user.tenantName ?? '—'
                  }
                  icon={Building2}
                />
                {ROLE_REQUIRES_PROVIDER.includes(user.role) && (
                  <ReadField
                    label="Provider record"
                    value={user.providerName ?? 'Not linked'}
                    icon={Activity}
                  />
                )}
                <ReadField
                  label="Firebase UID"
                  value={user.firebaseUid}
                  icon={Fingerprint}
                  mono
                />
                <ReadField
                  label="Created"
                  value={new Date(user.createdAt).toLocaleString()}
                  icon={Calendar}
                />
                {user.lastLogin && (
                  <ReadField
                    label="Last login"
                    value={new Date(user.lastLogin).toLocaleString()}
                    icon={Clock}
                  />
                )}
                <div>
                  <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                    Admin notes
                  </p>
                  {isEditing ? (
                    <textarea
                      rows={3}
                      value={editForm.notes}
                      onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                      placeholder="Internal notes about this user"
                    />
                  ) : (
                    <p className="text-sm text-gray-700 bg-gray-50 rounded p-3">
                      {user.notes || '—'}
                    </p>
                  )}
                </div>
              </div>
            </div>

            {/* Right rail */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <BadgeCheck className="w-5 h-5 text-indigo-500" />
                    Provisioning
                  </h2>
                </div>
                <div className="p-4 space-y-2">
                  <CheckRow label="Firebase account" done={true} />
                  <CheckRow label="Role claim" done={user.hasRoleClaim} />
                  <CheckRow label="User record" done={user.hasUserRecord} />
                  <CheckRow
                    label="Tenant"
                    done={user.hasTenant || PLATFORM_ROLES.includes(user.role)}
                  />
                  {ROLE_REQUIRES_PROVIDER.includes(user.role) && (
                    <CheckRow label="Provider link" done={user.hasProviderLink} />
                  )}
                  <CheckRow label="Email verified" done={user.emailVerified} />
                  <CheckRow label="MFA enabled" done={user.mfaEnabled} />
                </div>
              </div>

              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <Key className="w-5 h-5 text-indigo-500" />
                    Quick Actions
                  </h2>
                </div>
                <div className="p-3 space-y-1.5">
                  <ActionButton
                    icon={Send}
                    label="Send password reset"
                    onClick={sendPasswordReset}
                  />
                  {!user.emailVerified && (
                    <ActionButton
                      icon={Mail}
                      label="Resend verification"
                      onClick={sendVerification}
                    />
                  )}
                  <ActionButton
                    icon={RefreshCw}
                    label="Open provisioning"
                    onClick={() =>
                      navigate(
                        `/admin/super/registration/provision?email=${encodeURIComponent(
                          user.email
                        )}&firebaseUid=${user.firebaseUid}`
                      )
                    }
                  />
                  {user.tenantId && (
                    <ActionButton
                      icon={Building2}
                      label="View tenant"
                      onClick={() => navigate(`/admin/super/tenants/${user.tenantId}`)}
                    />
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Security tab */}
        {tab === 'security' && (
          <div className="space-y-6 animate-in fade-in">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
              <InfoCard
                label="MFA"
                value={user.mfaEnabled ? 'Enabled' : 'Disabled'}
                icon={ShieldCheck}
                tone={user.mfaEnabled ? 'ok' : 'warn'}
              />
              <InfoCard
                label="Email verified"
                value={user.emailVerified ? 'Yes' : 'No'}
                icon={user.emailVerified ? CheckCircle2 : MailWarning}
                tone={user.emailVerified ? 'ok' : 'warn'}
              />
              <InfoCard
                label="Active sessions"
                value={String(user.activeSessions.length)}
                icon={Smartphone}
                tone={user.activeSessions.length > 0 ? 'info' : 'muted'}
              />
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Monitor className="w-5 h-5 text-indigo-500" />
                  Active Sessions ({user.activeSessions.length})
                </h2>
              </div>
              {user.activeSessions.length === 0 ? (
                <div className="p-8 text-center text-sm text-gray-500">
                  No active sessions.
                </div>
              ) : (
                <ul className="divide-y divide-gray-200">
                  {user.activeSessions.map((s) => (
                    <li
                      key={s.id}
                      className="px-6 py-4 flex items-center justify-between hover:bg-gray-50"
                    >
                      <div className="flex items-center gap-3">
                        <div className="p-2 bg-gray-100 rounded-lg">
                          {s.device.toLowerCase().includes('mobile') ? (
                            <Smartphone className="w-5 h-5 text-gray-600" />
                          ) : (
                            <Monitor className="w-5 h-5 text-gray-600" />
                          )}
                        </div>
                        <div>
                          <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            {s.device}
                            {s.isCurrent && (
                              <span className="text-[10px] uppercase bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold">
                                Current
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500">
                            {s.ip} {s.location ? `• ${s.location}` : ''} •{' '}
                            {new Date(s.lastActive).toLocaleString()}
                          </p>
                        </div>
                      </div>
                      {!s.isCurrent && (
                        <button
                          onClick={() => revokeSession(s.id)}
                          className="text-xs font-medium text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2.5 py-1 rounded"
                        >
                          Revoke
                        </button>
                      )}
                    </li>
                  ))}
                </ul>
              )}
            </div>
          </div>
        )}

        {/* Permissions tab */}
        {tab === 'permissions' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm animate-in fade-in">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Shield className="w-5 h-5 text-indigo-500" />
                  Effective Permissions
                </h2>
                <p className="text-xs text-gray-500 mt-0.5">
                  Derived from the {ROLE_LABELS[user.role]} role claim and any overrides
                </p>
              </div>
              <button
                onClick={() =>
                  navigate(`/admin/super/roles?user=${user.id}`)
                }
                className="text-sm text-indigo-600 hover:underline"
              >
                Manage roles →
              </button>
            </div>
            <div className="p-6">
              {user.permissions.length === 0 ? (
                <div className="text-center py-8">
                  <Lock className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                  <p className="text-sm text-gray-500">No explicit permissions granted.</p>
                  <p className="text-xs text-gray-400 mt-1">
                    Permissions are derived from role claim defaults.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2">
                  {user.permissions.map((p) => (
                    <div
                      key={p}
                      className="flex items-center gap-2 text-sm text-gray-700 bg-gray-50 rounded-lg p-2.5"
                    >
                      <CheckCircle2 className="w-4 h-4 text-emerald-500 flex-shrink-0" />
                      <span className="font-mono text-xs">{p}</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* Activity tab */}
        {tab === 'activity' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm animate-in fade-in">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-500" />
                Recent Activity
              </h2>
              <button
                onClick={() =>
                  navigate(`/admin/super/audit?userId=${user.id}`)
                }
                className="text-sm text-indigo-600 hover:underline"
              >
                View full audit →
              </button>
            </div>
            {user.recentActivity.length === 0 ? (
              <div className="p-12 text-center">
                <Activity className="w-8 h-8 text-gray-300 mx-auto mb-2" />
                <p className="text-sm text-gray-500">No activity recorded yet.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {user.recentActivity.map((a) => (
                  <li key={a.id} className="px-6 py-3 flex items-start gap-3 hover:bg-gray-50">
                    <div className="mt-0.5 h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                      <Activity className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">{a.action}</p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(a.timestamp).toLocaleString()}
                        {a.ip && ` • ${a.ip}`}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}
      </div>

      {/* Delete modal */}
      {showDelete && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60" onClick={() => !isDeleting && setShowDelete(false)} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <AlertTriangle className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">Delete user</h3>
                <p className="mt-1 text-sm text-gray-600">
                  Permanently delete <strong>{user.fullName}</strong>? All sessions, claims
                  and provider links will be removed. Audit history is preserved.
                </p>
                <label className="block mt-3 text-sm text-gray-700">
                  Type the email to confirm:
                </label>
                <input
                  type="email"
                  value={deleteConfirm}
                  onChange={(e) => setDeleteConfirm(e.target.value)}
                  placeholder={user.email}
                  className="mt-1 w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-red-500 focus:border-red-500"
                  autoFocus
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={() => {
                  setShowDelete(false);
                  setDeleteConfirm('');
                }}
                disabled={isDeleting}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                onClick={deleteUser}
                disabled={isDeleting || deleteConfirm !== user.email}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Delete forever
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Small components
// ─────────────────────────────────────────────────────────────
function StatusBadge({ status }: { status: UserStatus }) {
  const styles: Record<UserStatus, string> = {
    ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
    SUSPENDED: 'bg-red-50 text-red-700 border-red-200',
    PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
    LOCKED: 'bg-orange-50 text-orange-700 border-orange-200',
    DEACTIVATED: 'bg-gray-50 text-gray-700 border-gray-200',
  };
  return (
    <span
      className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${styles[status]}`}
    >
      {status}
    </span>
  );
}

function ReadField({
  label,
  value,
  icon: Icon,
  mono,
}: {
  label: string;
  value: string;
  icon?: typeof Mail;
  mono?: boolean;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </p>
      <div className="flex items-center gap-2 text-sm text-gray-900">
        {Icon && <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />}
        <span className={`break-all ${mono ? 'font-mono text-xs' : ''}`}>{value}</span>
      </div>
    </div>
  );
}

function EditField({
  label,
  value,
  onChange,
  editing,
  readOnlyValue,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  editing: boolean;
  readOnlyValue: string;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </p>
      {editing ? (
        <input
          type="text"
          value={value}
          onChange={(e) => onChange(e.target.value)}
          className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
        />
      ) : (
        <p className="text-sm text-gray-900">{readOnlyValue}</p>
      )}
    </div>
  );
}

function CheckRow({ label, done }: { label: string; done: boolean }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-gray-700">{label}</span>
      {done ? (
        <CheckCircle2 className="w-4 h-4 text-emerald-500" />
      ) : (
        <XCircle className="w-4 h-4 text-red-500" />
      )}
    </div>
  );
}

function InfoCard({
  label,
  value,
  icon: Icon,
  tone,
}: {
  label: string;
  value: string;
  icon: typeof ShieldCheck;
  tone: 'ok' | 'warn' | 'info' | 'muted';
}) {
  const toneCls =
    tone === 'ok'
      ? 'text-emerald-600 bg-emerald-50'
      : tone === 'warn'
      ? 'text-amber-600 bg-amber-50'
      : tone === 'info'
      ? 'text-blue-600 bg-blue-50'
      : 'text-gray-500 bg-gray-50';
  return (
    <div className="bg-white rounded-xl border border-gray-200 shadow-sm p-5">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
            {label}
          </p>
          <p className="mt-1 text-lg font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-2 rounded-lg ${toneCls}`}>
          <Icon className="w-5 h-5" />
        </div>
      </div>
    </div>
  );
}

function ActionButton({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Send;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-200 text-left"
    >
      <Icon className="w-4 h-4 text-indigo-600" />
      {label}
    </button>
  );
}

function MissingTag({ label }: { label: string }) {
  return (
    <span className="inline-flex items-center gap-1 bg-red-100 text-red-800 px-2 py-0.5 rounded font-medium">
      <XCircle className="w-3 h-3" />
      {label}
    </span>
  );
}