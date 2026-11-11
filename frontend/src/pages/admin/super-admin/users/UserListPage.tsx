import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import {
  Users,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Ban,
  CheckCircle2,
  XCircle,
  Mail,
  Building2,
  Loader2,
  AlertCircle,
  Filter,
  RefreshCw,
  Download,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  MoreVertical,
  Eye,
  Edit2,
  KeyRound,
  Trash2,
  UserPlus,
  Clock,
  UserX,
  Power,
  Send,
  Fingerprint,
  X,
} from 'lucide-react';
import { toast } from 'sonner';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
type Role =
  | 'SUPER_ADMIN'
  | 'TENANT_ADMIN'
  | 'ADMIN'
  | 'MANAGER'
  | 'PROVIDER'
  | 'CLINICIAN'
  | 'RECEPTION'
  | 'RECEPTIONIST'
  | 'STAFF'
  | 'FINANCE'
  | 'CONSENT_MANAGER'
  | 'PRIVACY_OFFICER'
  | 'PATIENT';

type UserStatus = 'ACTIVE' | 'SUSPENDED' | 'PENDING' | 'LOCKED' | 'DEACTIVATED';

interface AdminUser {
  id: string;
  email: string;
  fullName: string;
  firebaseUid: string;
  role: Role;
  status: UserStatus;
  tenantId?: string;
  tenantName?: string;
  providerId?: string;
  providerName?: string;
  emailVerified: boolean;
  mfaEnabled: boolean;
  lastLogin?: string;
  createdAt: string;
  hasRoleClaim: boolean;
  hasUserRecord: boolean;
  hasTenant: boolean;
  hasProviderLink: boolean;
  permissions?: string[];
}

interface ListResponse {
  content: AdminUser[];
  totalElements: number;
  totalPages: number;
}

const PAGE_SIZE = 15;

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const ROLE_META: Record<
  Role,
  { label: string; badge: string; icon: typeof Shield; scope: 'PLATFORM' | 'TENANT' | 'PATIENT' }
> = {
  SUPER_ADMIN: { label: 'Super Admin', badge: 'bg-purple-100 text-purple-700', icon: ShieldAlert, scope: 'PLATFORM' },
  TENANT_ADMIN: { label: 'Tenant Admin', badge: 'bg-blue-100 text-blue-700', icon: ShieldCheck, scope: 'TENANT' },
  ADMIN: { label: 'Admin', badge: 'bg-indigo-100 text-indigo-700', icon: Shield, scope: 'TENANT' },
  MANAGER: { label: 'Manager', badge: 'bg-sky-100 text-sky-700', icon: Shield, scope: 'TENANT' },
  PROVIDER: { label: 'Provider', badge: 'bg-emerald-100 text-emerald-700', icon: Shield, scope: 'TENANT' },
  CLINICIAN: { label: 'Clinician', badge: 'bg-teal-100 text-teal-700', icon: Shield, scope: 'TENANT' },
  RECEPTION: { label: 'Reception', badge: 'bg-cyan-100 text-cyan-700', icon: Shield, scope: 'TENANT' },
  RECEPTIONIST: { label: 'Receptionist', badge: 'bg-cyan-100 text-cyan-700', icon: Shield, scope: 'TENANT' },
  STAFF: { label: 'Staff', badge: 'bg-gray-100 text-gray-700', icon: Shield, scope: 'TENANT' },
  FINANCE: { label: 'Finance', badge: 'bg-amber-100 text-amber-700', icon: Shield, scope: 'TENANT' },
  CONSENT_MANAGER: { label: 'Consent Manager', badge: 'bg-rose-100 text-rose-700', icon: Shield, scope: 'TENANT' },
  PRIVACY_OFFICER: { label: 'Privacy Officer', badge: 'bg-pink-100 text-pink-700', icon: Shield, scope: 'TENANT' },
  PATIENT: { label: 'Patient', badge: 'bg-slate-100 text-slate-700', icon: Users, scope: 'PATIENT' },
};

const STATUS_META: Record<UserStatus, { label: string; cls: string; icon: typeof CheckCircle2 }> = {
  ACTIVE: { label: 'Active', cls: 'bg-emerald-50 text-emerald-700 border-emerald-200', icon: CheckCircle2 },
  SUSPENDED: { label: 'Suspended', cls: 'bg-red-50 text-red-700 border-red-200', icon: Ban },
  PENDING: { label: 'Pending', cls: 'bg-amber-50 text-amber-700 border-amber-200', icon: Clock },
  LOCKED: { label: 'Locked', cls: 'bg-orange-50 text-orange-700 border-orange-200', icon: AlertCircle },
  DEACTIVATED: { label: 'Deactivated', cls: 'bg-gray-50 text-gray-700 border-gray-200', icon: UserX },
};

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('firebaseToken') ?? ''}`,
});

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export default function UserListPage() {
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState<'ALL' | Role>('ALL');
  const [statusFilter, setStatusFilter] = useState<'ALL' | UserStatus>('ALL');
  const [tenantFilter, setTenantFilter] = useState<string>(searchParams.get('tenant') ?? 'ALL');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Data
  const [users, setUsers] = useState<AdminUser[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [tenants, setTenants] = useState<{ id: string; name: string }[]>([]);

  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Row menu
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Modals
  const [statusTarget, setStatusTarget] = useState<AdminUser | null>(null);
  const [nextStatus, setNextStatus] = useState<UserStatus>('ACTIVE');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  const [roleTarget, setRoleTarget] = useState<AdminUser | null>(null);
  const [newRole, setNewRole] = useState<Role>('STAFF');
  const [isUpdatingRole, setIsUpdatingRole] = useState(false);

  const [deleteTarget, setDeleteTarget] = useState<AdminUser | null>(null);
  const [isDeleting, setIsDeleting] = useState(false);

  // ───────────────────────────────────────────────
  // Debounce
  // ───────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(0);
    }, 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // Sync tenant filter to URL
  useEffect(() => {
    const next = new URLSearchParams(searchParams);
    if (tenantFilter !== 'ALL') next.set('tenant', tenantFilter);
    else next.delete('tenant');
    setSearchParams(next, { replace: true });
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [tenantFilter]);

  // ───────────────────────────────────────────────
  // Load tenants for filter
  // ───────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      try {
        const res = await fetch('/api/v1/admin/tenants?size=100', {
          headers: authHeaders(),
        });
        if (res.ok) {
          const result = await res.json();
          const data = result.data ?? result;
          setTenants(data.content ?? []);
        }
      } catch {
        // ignore
      }
    };
    load();
  }, []);

  // ───────────────────────────────────────────────
  // Load users
  // ───────────────────────────────────────────────
  const load = useCallback(
    async (opts?: { silent?: boolean }) => {
      if (opts?.silent) setIsRefreshing(true);
      else setIsLoading(true);
      setError(null);
      try {
        const params = new URLSearchParams({
          page: String(page),
          size: String(PAGE_SIZE),
        });
        if (debouncedSearch) params.set('search', debouncedSearch);
        if (roleFilter !== 'ALL') params.set('role', roleFilter);
        if (statusFilter !== 'ALL') params.set('status', statusFilter);
        if (tenantFilter !== 'ALL') params.set('tenantId', tenantFilter);
        const res = await fetch(`/api/v1/admin/users?${params.toString()}`, {
          headers: authHeaders(),
        });
        if (!res.ok) throw new Error('Failed to load users');
        const result = await res.json();
        const data: ListResponse & { total?: number; size?: number } = result.data ?? result;
        setUsers((data.content ?? []).map((user) => ({
          ...user,
          id: user.firebaseUid,
          hasRoleClaim: true,
          hasUserRecord: true,
          hasTenant: Boolean(user.tenantId),
          hasProviderLink: Boolean(user.providerId),
        })));
        setTotalPages(data.totalPages ?? Math.ceil((data.total ?? 0) / (data.size || PAGE_SIZE)));
        setTotalElements(data.totalElements ?? data.total ?? 0);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [page, debouncedSearch, roleFilter, statusFilter, tenantFilter]
  );

  useEffect(() => {
    load();
  }, [load]);

  // Close menu on outside click
  useEffect(() => {
    if (!openMenuId) return;
    const close = () => setOpenMenuId(null);
    window.addEventListener('click', close);
    return () => window.removeEventListener('click', close);
  }, [openMenuId]);

  // ───────────────────────────────────────────────
  // Actions
  // ───────────────────────────────────────────────
  const changeStatus = async () => {
    if (!statusTarget) return;
    setIsUpdatingStatus(true);
    try {
      const tenantQuery = statusTarget.tenantId
        ? `?tenantId=${encodeURIComponent(statusTarget.tenantId)}`
        : '';
      const res = await fetch(
        `/api/v1/admin/users/${encodeURIComponent(statusTarget.firebaseUid)}/status${tenantQuery}`,
        {
        method: 'PATCH',
        headers: authHeaders(),
        body: JSON.stringify({ status: nextStatus }),
        }
      );
      if (!res.ok) throw new Error('Status update failed');
      toast.success(`${statusTarget.fullName} is now ${nextStatus}`);
      setStatusTarget(null);
      load({ silent: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Status update failed');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const changeRole = async () => {
    if (!roleTarget) return;
    setIsUpdatingRole(true);
    try {
      const tenantId = roleTarget.tenantId;
      const tenantQuery = tenantId ? `?tenantId=${encodeURIComponent(tenantId)}` : '';
      const detailRes = await fetch(
        `/api/v1/admin/users/${encodeURIComponent(roleTarget.firebaseUid)}${tenantQuery}`,
        { headers: authHeaders() }
      );
      if (!detailRes.ok) throw new Error('Could not load user role details');
      const detailEnvelope = await detailRes.json();
      const details = detailEnvelope.data ?? detailEnvelope;
      const res = await fetch(
        `/api/v1/admin/users/${encodeURIComponent(roleTarget.firebaseUid)}/role`,
        {
          method: 'PATCH',
          headers: authHeaders(),
          body: JSON.stringify({ role: newRole, tenantId, permissions: details.permissions ?? [] }),
        }
      );
      if (!res.ok) throw new Error('Role change failed');
      toast.success(`${roleTarget.fullName} is now ${newRole.replace(/_/g, ' ')}`);
      setRoleTarget(null);
      load({ silent: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Role change failed');
    } finally {
      setIsUpdatingRole(false);
    }
  };

  const deleteUser = async () => {
    if (!deleteTarget) return;
    setIsDeleting(true);
    try {
      const tenantQuery = deleteTarget.tenantId
        ? `?tenantId=${encodeURIComponent(deleteTarget.tenantId)}`
        : '';
      const res = await fetch(
        `/api/v1/admin/users/${encodeURIComponent(deleteTarget.firebaseUid)}${tenantQuery}`,
        { method: 'DELETE', headers: authHeaders() }
      );
      if (!res.ok) throw new Error('Delete failed');
      toast.success(`${deleteTarget.fullName} deleted`);
      setDeleteTarget(null);
      load({ silent: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Delete failed');
    } finally {
      setIsDeleting(false);
    }
  };

  const sendPasswordReset = async (user: AdminUser) => {
    try {
      const res = await fetch(
        `/api/v1/admin/firebase/users/${user.firebaseUid}/send-password-reset`,
        { method: 'POST', headers: authHeaders() }
      );
      if (!res.ok) throw new Error('Failed');
      toast.success(`Password reset email sent to ${user.email}`);
    } catch {
      toast.error('Failed to send reset email');
    }
  };

  const sendVerification = async (user: AdminUser) => {
    try {
      const res = await fetch(
        `/api/v1/admin/firebase/users/${user.firebaseUid}/send-verification`,
        { method: 'POST', headers: authHeaders() }
      );
      if (!res.ok) throw new Error('Failed');
      toast.success(`Verification email sent to ${user.email}`);
    } catch {
      toast.error('Failed to send verification email');
    }
  };

  const exportCsv = () => {
    if (users.length === 0) return;
    const headers = [
      'ID',
      'Email',
      'Name',
      'Role',
      'Status',
      'Tenant',
      'Provider',
      'Verified',
      'MFA',
      'Last login',
      'Created',
    ];
    const rows = users.map((u) => [
      u.id,
      u.email,
      u.fullName,
      u.role,
      u.status,
      u.tenantName ?? '',
      u.providerName ?? '',
      u.emailVerified ? 'yes' : 'no',
      u.mfaEnabled ? 'yes' : 'no',
      u.lastLogin ?? 'never',
      u.createdAt,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${c}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `users-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ───────────────────────────────────────────────
  // Derived
  // ───────────────────────────────────────────────
  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (roleFilter !== 'ALL') n++;
    if (statusFilter !== 'ALL') n++;
    if (tenantFilter !== 'ALL') n++;
    return n;
  }, [roleFilter, statusFilter, tenantFilter]);

  // ───────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-indigo-600" />
              All Users
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage every user across all tenants. Role assignment and provisioning is
              audited.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => load({ silent: true })}
              disabled={isRefreshing}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={exportCsv}
              disabled={users.length === 0}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
            <button
              onClick={() => navigate('/admin/super/users/create')}
              className="inline-flex items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Provision User
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="max-w-7xl mx-auto w-full px-6 py-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by email, name, or Firebase UID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100"
              aria-label="Clear"
            >
              <X className="w-4 h-4 text-gray-400" />
            </button>
          )}
        </div>
        <button
          onClick={() => setIsFilterOpen((v) => !v)}
          className={`inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium transition-colors ${
            isFilterOpen || activeFilterCount > 0
              ? 'bg-indigo-50 border-indigo-200 text-indigo-700'
              : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
          }`}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
          {activeFilterCount > 0 && (
            <span className="ml-2 inline-flex items-center justify-center w-5 h-5 text-xs font-bold rounded-full bg-indigo-600 text-white">
              {activeFilterCount}
            </span>
          )}
          <ChevronDown className={`w-4 h-4 ml-2 transition-transform ${isFilterOpen ? 'rotate-180' : ''}`} />
        </button>
      </div>

      {/* Filters */}
      {isFilterOpen && (
        <div className="max-w-7xl mx-auto w-full px-6 pb-4">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Role</label>
              <select
                value={roleFilter}
                onChange={(e) => {
                  setRoleFilter(e.target.value as 'ALL' | Role);
                  setPage(0);
                }}
                className="w-full rounded-md border-gray-300 text-sm py-2 px-3 border"
              >
                <option value="ALL">All roles</option>
                {Object.entries(ROLE_META)
                  .filter(([key]) => !['SUPER_ADMIN', 'PROVIDER', 'CLINICIAN', 'PATIENT'].includes(key))
                  .map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                  ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as 'ALL' | UserStatus);
                  setPage(0);
                }}
                className="w-full rounded-md border-gray-300 text-sm py-2 px-3 border"
              >
                <option value="ALL">All statuses</option>
                {Object.entries(STATUS_META).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v.label}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Tenant</label>
              <select
                value={tenantFilter}
                onChange={(e) => {
                  setTenantFilter(e.target.value);
                  setPage(0);
                }}
                className="w-full rounded-md border-gray-300 text-sm py-2 px-3 border"
              >
                <option value="ALL">All tenants</option>
                {tenants.map((t) => (
                  <option key={t.id} value={t.id}>
                    {t.name}
                  </option>
                ))}
              </select>
            </div>
            <div className="sm:col-span-2 lg:col-span-4 flex items-center justify-between pt-2 border-t border-gray-200">
              <span className="text-xs text-gray-500">Filter by role, status, and tenant.</span>
              <button
                onClick={() => {
                  setRoleFilter('ALL');
                  setStatusFilter('ALL');
                  setTenantFilter('ALL');
                  setPage(0);
                }}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Reset filters
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="max-w-7xl mx-auto w-full px-6 pb-12 flex-1">
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div className="p-16 flex flex-col items-center text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
              <p className="text-sm">Loading users...</p>
            </div>
          ) : error ? (
            <div className="p-16 text-center">
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
              <p className="text-sm text-gray-700">{error}</p>
              <button
                onClick={() => load()}
                className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" /> Retry
              </button>
            </div>
          ) : users.length === 0 ? (
            <div className="p-16 text-center">
              <Users className="w-12 h-12 text-gray-300 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-900">No users found</h3>
              <p className="mt-1 text-sm text-gray-500">
                {debouncedSearch || activeFilterCount > 0
                  ? 'Try adjusting your filters.'
                  : 'Provision the first user to get started.'}
              </p>
              <button
                onClick={() => navigate('/admin/super/users/create')}
                className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                <UserPlus className="w-4 h-4 mr-2" /> Provision User
              </button>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      User
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Role
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Tenant
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Health
                    </th>
                    <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                      Last login
                    </th>
                    <th className="relative px-5 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((u) => {
                    const roleMeta = ROLE_META[u.role] ?? ROLE_META.STAFF;
                    const RoleIcon = roleMeta.icon;
                    const statusMeta = STATUS_META[u.status] ?? STATUS_META.ACTIVE;
                    const StatusIcon = statusMeta.icon;
                    const incomplete =
                      !u.hasRoleClaim ||
                      !u.hasUserRecord ||
                      (!u.tenantId && roleMeta.scope === 'TENANT') ||
                      (!u.providerId &&
                        (u.role === 'PROVIDER' || u.role === 'CLINICIAN'));

                    return (
                      <tr key={u.id} className="hover:bg-gray-50 transition-colors">
                        <td className="px-5 py-3">
                          <div className="flex items-center gap-3">
                            <div
                              className={`h-9 w-9 rounded-full flex items-center justify-center text-sm font-bold flex-shrink-0 ${
                                u.emailVerified
                                  ? 'bg-indigo-100 text-indigo-700'
                                  : 'bg-amber-100 text-amber-700'
                              }`}
                            >
                              {u.fullName.charAt(0).toUpperCase()}
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-medium text-gray-900 truncate flex items-center gap-1.5">
                                {u.fullName}
                                {!u.emailVerified && (
                                  <span
                                    className="inline-flex items-center gap-1 text-[10px] uppercase bg-amber-100 text-amber-700 px-1.5 py-0.5 rounded font-bold"
                                    title="Email not verified"
                                  >
                                    <Mail className="w-2.5 h-2.5" />
                                    unverified
                                  </span>
                                )}
                              </p>
                              <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                                <Mail className="w-3 h-3" />
                                {u.email}
                              </p>
                            </div>
                          </div>
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex items-center gap-1 text-xs font-semibold px-2 py-0.5 rounded ${roleMeta.badge}`}
                          >
                            <RoleIcon className="w-3 h-3" />
                            {roleMeta.label}
                          </span>
                          {u.providerName && (
                            <p className="text-[11px] text-gray-500 mt-1 truncate max-w-[150px]">
                              ↳ {u.providerName}
                            </p>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          {u.tenantName ? (
                            <span className="text-xs text-gray-700 flex items-center gap-1">
                              <Building2 className="w-3 h-3 text-gray-400" />
                              {u.tenantName}
                            </span>
                          ) : roleMeta.scope === 'PLATFORM' ? (
                            <span className="text-xs text-purple-700 bg-purple-50 px-2 py-0.5 rounded">
                              Platform
                            </span>
                          ) : (
                            <span className="text-xs text-red-600 flex items-center gap-1">
                              <XCircle className="w-3 h-3" /> None
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3">
                          <span
                            className={`inline-flex items-center gap-1 text-[11px] font-semibold px-2 py-0.5 rounded-full border ${statusMeta.cls}`}
                          >
                            <StatusIcon className="w-3 h-3" />
                            {statusMeta.label}
                          </span>
                        </td>
                        <td className="px-5 py-3">
                          {incomplete ? (
                            <button
                              onClick={() =>
                                navigate(
                                  `/admin/super/registration/provision?email=${encodeURIComponent(
                                    u.email
                                  )}&firebaseUid=${u.firebaseUid}`
                                )
                              }
                              className="inline-flex items-center gap-1 text-xs font-semibold text-amber-700 bg-amber-50 hover:bg-amber-100 px-2 py-0.5 rounded"
                            >
                              <AlertCircle className="w-3 h-3" />
                              Incomplete
                            </button>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                              <CheckCircle2 className="w-3 h-3" />
                              OK
                            </span>
                          )}
                        </td>
                        <td className="px-5 py-3 text-xs text-gray-500 whitespace-nowrap">
                          {u.lastLogin ? new Date(u.lastLogin).toLocaleDateString() : 'Never'}
                        </td>
                        <td className="px-5 py-3 text-right">
                          <div className="relative inline-block">
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                setOpenMenuId(openMenuId === u.id ? null : u.id);
                              }}
                              className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500"
                            >
                              <MoreVertical className="w-4 h-4" />
                            </button>
                            {openMenuId === u.id && (
                              <div
                                className="absolute right-0 mt-1 w-56 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-20"
                                onClick={(e) => e.stopPropagation()}
                              >
                                <MenuItem
                                  icon={Eye}
                                  label="View details"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    navigate(`/admin/super/users/${u.id}`);
                                  }}
                                />
                                <MenuItem
                                  icon={Edit2}
                                  label="Edit profile"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    navigate(`/admin/super/users/${u.id}?edit=1`);
                                  }}
                                />
                                <MenuItem
                                  icon={Shield}
                                  label="Change role"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    setRoleTarget(u);
                                    setNewRole(u.role);
                                  }}
                                />
                                <MenuItem
                                  icon={u.status === 'ACTIVE' ? Ban : Power}
                                  label={u.status === 'ACTIVE' ? 'Suspend account' : 'Activate account'}
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    setStatusTarget(u);
                                    setNextStatus(u.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE');
                                  }}
                                />
                                <div className="my-1 border-t border-gray-100" />
                                {!u.emailVerified && (
                                  <MenuItem
                                    icon={Send}
                                    label="Resend verification"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      sendVerification(u);
                                    }}
                                  />
                                )}
                                <MenuItem
                                  icon={KeyRound}
                                  label="Send password reset"
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    sendPasswordReset(u);
                                  }}
                                />
                                {incomplete && (
                                  <MenuItem
                                    icon={Fingerprint}
                                    label="Open provisioning"
                                    onClick={() => {
                                      setOpenMenuId(null);
                                      navigate(
                                        `/admin/super/registration/provision?email=${encodeURIComponent(
                                          u.email
                                        )}&firebaseUid=${u.firebaseUid}`
                                      );
                                    }}
                                  />
                                )}
                                <div className="my-1 border-t border-gray-100" />
                                <button
                                  onClick={() => {
                                    setOpenMenuId(null);
                                    setDeleteTarget(u);
                                  }}
                                  className="w-full flex items-center gap-2 px-3 py-2 text-sm text-red-600 hover:bg-red-50"
                                >
                                  <Trash2 className="w-4 h-4" />
                                  Delete user
                                </button>
                              </div>
                            )}
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {!isLoading && !error && users.length > 0 && (
          <div className="mt-4 bg-white px-4 py-3 flex items-center justify-between rounded-lg shadow-sm border border-gray-200">
            <p className="text-sm text-gray-700">
              Page <span className="font-semibold">{page + 1}</span> of{' '}
              <span className="font-semibold">{totalPages || 1}</span>
              <span className="ml-2 text-gray-500">({totalElements} total)</span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Role change modal ── */}
      {roleTarget && (
        <Modal onClose={() => !isUpdatingRole && setRoleTarget(null)}>
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-full bg-indigo-100 flex items-center justify-center flex-shrink-0">
              <Shield className="w-6 h-6 text-indigo-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">Change user role</h3>
              <p className="mt-1 text-sm text-gray-600">
                Updating role for <strong>{roleTarget.fullName}</strong>. This immediately
                changes their Firebase role claim and permissions.
              </p>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New role
                </label>
                <select
                  value={newRole}
                  onChange={(e) => setNewRole(e.target.value as Role)}
                  className="w-full rounded-md border-gray-300 text-sm py-2 px-3 border focus:ring-indigo-500 focus:border-indigo-500"
                >
                  {Object.entries(ROLE_META).map(([k, v]) => (
                    <option key={k} value={k}>
                      {v.label}
                    </option>
                  ))}
                </select>
                {newRole !== roleTarget.role && (
                  <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 flex items-start gap-1.5">
                    <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    Changing roles requires the user to log out and back in to refresh their
                    claims. Consider notifying them.
                  </div>
                )}
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={() => setRoleTarget(null)}
              disabled={isUpdatingRole}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={changeRole}
              disabled={isUpdatingRole || newRole === roleTarget.role}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {isUpdatingRole && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Save changes
            </button>
          </div>
        </Modal>
      )}

      {/* ── Status modal ── */}
      {statusTarget && (
        <Modal onClose={() => !isUpdatingStatus && setStatusTarget(null)}>
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-full bg-amber-100 flex items-center justify-center flex-shrink-0">
              <Power className="w-6 h-6 text-amber-600" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900">Change account status</h3>
              <p className="mt-1 text-sm text-gray-600">
                Updating status for <strong>{statusTarget.fullName}</strong>.
              </p>
              <div className="mt-4">
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  New status
                </label>
                <select
                  value={nextStatus}
                  onChange={(e) => setNextStatus(e.target.value as UserStatus)}
                  className="w-full rounded-md border-gray-300 text-sm py-2 px-3 border focus:ring-indigo-500 focus:border-indigo-500"
                >
                  <option value="ACTIVE">ACTIVE — full access</option>
                  <option value="SUSPENDED">SUSPENDED — login blocked</option>
                </select>
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={() => setStatusTarget(null)}
              disabled={isUpdatingStatus}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={changeStatus}
              disabled={isUpdatingStatus || nextStatus === statusTarget.status}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {isUpdatingStatus && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Confirm
            </button>
          </div>
        </Modal>
      )}

      {/* ── Delete modal ── */}
      {deleteTarget && (
        <Modal onClose={() => !isDeleting && setDeleteTarget(null)}>
          <div className="flex items-start gap-4">
            <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
              <Trash2 className="w-6 h-6 text-red-600" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-900">Delete user account</h3>
              <p className="mt-1 text-sm text-gray-600">
                Permanently delete <strong>{deleteTarget.fullName}</strong> ({deleteTarget.email})?
                This removes their Firebase account, CareSync user record, provider link and all
                sessions. Audit history is preserved.
              </p>
              <div className="mt-3 p-2 bg-red-50 border border-red-200 rounded text-xs text-red-800 flex items-start gap-1.5">
                <AlertCircle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                Consider <strong>SUSPENDING</strong> instead — reversible and preserves data.
              </div>
            </div>
          </div>
          <div className="mt-6 flex justify-end gap-2">
            <button
              onClick={() => setDeleteTarget(null)}
              disabled={isDeleting}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Cancel
            </button>
            <button
              onClick={deleteUser}
              disabled={isDeleting}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
            >
              {isDeleting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              Delete permanently
            </button>
          </div>
        </Modal>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Small components
// ─────────────────────────────────────────────────────────────
function MenuItem({
  icon: Icon,
  label,
  onClick,
}: {
  icon: typeof Eye;
  label: string;
  onClick: () => void;
}) {
  return (
    <button
      onClick={onClick}
      className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50"
    >
      <Icon className="w-4 h-4" />
      {label}
    </button>
  );
}

function Modal({
  onClose,
  children,
}: {
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      <div className="absolute inset-0 bg-gray-900/60" onClick={onClose} />
      <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6">
        {children}
      </div>
    </div>
  );
}