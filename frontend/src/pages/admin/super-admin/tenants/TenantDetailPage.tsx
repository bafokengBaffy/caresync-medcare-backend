import { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Users,
  Activity,
  CreditCard,
  Shield,
  Loader2,
  AlertTriangle,
  FileText,
  Settings,
  Mail,
  Calendar,
  Zap,
  CheckCircle2,
  XCircle,
  Globe,
  HardDrive,
  Clock,
  RefreshCw,
  Power,
  UserPlus,
  ExternalLink,
  TrendingUp,
  Database,
  Lock,
  Info,
} from 'lucide-react';
import { toast } from 'sonner';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
type TenantStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';
type TenantPlan = 'FREE' | 'PRO' | 'ENTERPRISE';

interface TenantStats {
  totalUsers: number;
  totalPatients: number;
  monthlyAppointments: number;
  storageUsedMB: number | null;
  invoicesThisMonth: number;
  activeProviders: number;
}

interface TenantLimits {
  maxUsers: number;
  maxPatients: number;
  storageLimitMB: number | null;
  maxProviders: number;
  features: string[];
}

interface TenantUser {
  id: string;
  name: string;
  email: string;
  role: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  lastLogin?: string;
}

interface AuditEntry {
  id: string;
  action: string;
  actor: string;
  entityType: string;
  timestamp: string;
}

interface TenantDetail {
  id: string;
  name: string;
  subdomain: string;
  description?: string;
  status: TenantStatus;
  plan: TenantPlan;
  timezone: string;
  country?: string;
  city?: string;
  address?: string;
  createdAt: string;
  updatedAt?: string;
  ownerEmail: string;
  ownerName: string;
  ownerPhone?: string;
  stats: TenantStats;
  limits: TenantLimits;
  recentUsers?: TenantUser[];
  recentAudit?: AuditEntry[];
}

type Tab = 'overview' | 'users' | 'audit' | 'limits';

// ─────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────
const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('firebaseToken') ?? ''}`,
});

async function fetchTenantDetail(id: string): Promise<TenantDetail> {
  const res = await fetch(`/api/v1/admin/tenants/${id}`, { headers: authHeaders() });
  if (!res.ok) {
    if (res.status === 404) throw new Error('Tenant not found');
    throw new Error('Failed to load tenant');
  }
  const result = await res.json();
  return result.data ?? result;
}

async function updateTenantStatus(id: string, status: TenantStatus) {
  const res = await fetch(`/api/v1/admin/tenants/${id}/status`, {
    method: 'PATCH',
    headers: authHeaders(),
    body: JSON.stringify({ status }),
  });
  if (!res.ok) throw new Error('Failed to update status');
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────
const STATUS_STYLES: Record<TenantStatus, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  INACTIVE: 'bg-gray-50 text-gray-700 border-gray-200',
  SUSPENDED: 'bg-red-50 text-red-700 border-red-200',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
};

const PLAN_STYLES: Record<TenantPlan, string> = {
  FREE: 'bg-gray-100 text-gray-700',
  PRO: 'bg-blue-100 text-blue-700',
  ENTERPRISE: 'bg-purple-100 text-purple-700',
};

function UsageBar({
  label,
  value,
  max,
  unit = '',
  icon: Icon,
}: {
  label: string;
  value: number | null;
  max: number | null;
  unit?: string;
  icon: typeof Users;
}) {
  const pct = value !== null && max !== null && max > 0
    ? Math.min(100, (value / max) * 100)
    : 0;
  const color =
    pct >= 90 ? 'bg-red-500' : pct >= 70 ? 'bg-amber-500' : 'bg-emerald-500';
  return (
    <div>
      <div className="flex items-center justify-between mb-1.5">
        <span className="text-sm font-medium text-gray-700 flex items-center gap-1.5">
          <Icon className="w-4 h-4 text-gray-400" />
          {label}
        </span>
        <span className="text-xs text-gray-500">
          {value === null
            ? 'Not tracked'
            : `${value}${unit} / ${max === null ? 'Unlimited' : `${max}${unit}`}`}
        </span>
      </div>
      <div className="w-full bg-gray-200 rounded-full h-2 overflow-hidden">
        <div
          className={`${color} h-2 rounded-full transition-all`}
          style={{ width: `${value === null ? 0 : max === null ? 100 : pct}%` }}
        />
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export default function TenantDetailPage() {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();

  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [tab, setTab] = useState<Tab>('overview');

  // Actions
  const [isTogglingStatus, setIsTogglingStatus] = useState(false);
  const load = useCallback(async () => {
    if (!tenantId) return;
    setIsLoading(true);
    setError(null);
    try {
      const data = await fetchTenantDetail(tenantId);
      setTenant(data);
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Failed to load');
    } finally {
      setIsLoading(false);
    }
  }, [tenantId]);

  useEffect(() => {
    load();
  }, [load]);

  // ───────────────────────────────────────────────
  // Actions
  // ───────────────────────────────────────────────
  const toggleStatus = async () => {
    if (!tenant) return;
    const next: TenantStatus = tenant.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    if (!window.confirm(`Change status of "${tenant.name}" to ${next}?`)) return;

    setIsTogglingStatus(true);
    try {
      await updateTenantStatus(tenant.id, next);
      setTenant({ ...tenant, status: next });
      toast.success(`Tenant is now ${next}`);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Failed to update');
    } finally {
      setIsTogglingStatus(false);
    }
  };

  // ───────────────────────────────────────────────
  // Loading / Error
  // ───────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mx-auto" />
          <p className="mt-3 text-sm text-gray-500">Loading tenant...</p>
        </div>
      </div>
    );
  }

  if (error || !tenant) {
    return (
      <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-6">
        <div className="bg-white rounded-xl shadow p-8 max-w-md w-full text-center border border-gray-200">
          <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
          <h2 className="text-lg font-semibold text-gray-900">Unable to load tenant</h2>
          <p className="mt-1 text-sm text-gray-500">{error ?? 'Tenant not found'}</p>
          <div className="mt-6 flex gap-3 justify-center">
            <button
              onClick={() => navigate('/admin/super/tenants')}
              className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
            >
              Back to list
            </button>
            <button
              onClick={load}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Retry
            </button>
          </div>
        </div>
      </div>
    );
  }

  // ───────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200 sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-6 py-5">
          <div className="flex items-start gap-4">
            <button
              onClick={() => navigate('/admin/super/tenants')}
              className="p-2 hover:bg-gray-100 rounded-full text-gray-500 flex-shrink-0"
              aria-label="Back"
            >
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex-1 min-w-0">
              <div className="flex items-center gap-3 flex-wrap">
                <div className="h-11 w-11 bg-indigo-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <Building2 className="w-6 h-6 text-indigo-600" />
                </div>
                <div className="min-w-0">
                  <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2 flex-wrap">
                    <span className="truncate">{tenant.name}</span>
                    <span
                      className={`text-[11px] px-2 py-0.5 rounded-full font-semibold border ${STATUS_STYLES[tenant.status]}`}
                    >
                      {tenant.status}
                    </span>
                  </h1>
                  <p className="text-sm text-gray-500 flex items-center gap-1 mt-0.5">
                    <Globe className="w-3.5 h-3.5" />
                    {tenant.subdomain}.caresync.com
                  </p>
                </div>
              </div>
            </div>
            <div className="flex gap-2 flex-shrink-0">
              <button
                onClick={toggleStatus}
                disabled={isTogglingStatus}
                className={`inline-flex items-center px-3 py-2 text-sm font-medium rounded-md border transition-colors ${
                  tenant.status === 'ACTIVE'
                    ? 'border-red-300 text-red-700 bg-white hover:bg-red-50'
                    : 'border-emerald-300 text-emerald-700 bg-white hover:bg-emerald-50'
                } disabled:opacity-50`}
              >
                {isTogglingStatus ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Power className="w-4 h-4 mr-2" />
                )}
                {tenant.status === 'ACTIVE' ? 'Suspend' : 'Activate'}
              </button>
              <button
                onClick={() => navigate(`/admin/super/tenants/${tenant.id}/edit`)}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <Settings className="w-4 h-4 mr-2" />
                Settings
              </button>
            </div>
          </div>
        </div>

        {/* ── Tabs ── */}
        <div className="max-w-7xl mx-auto px-6">
          <nav className="flex gap-1 -mb-px overflow-x-auto">
            {(
              [
                { id: 'overview', label: 'Overview', icon: Activity },
                { id: 'users', label: 'Users', icon: Users },
                { id: 'audit', label: 'Audit Log', icon: FileText },
                { id: 'limits', label: 'Limits & Features', icon: Shield },
              ] as { id: Tab; label: string; icon: typeof Activity }[]
            ).map((t) => {
              const Icon = t.icon;
              const active = tab === t.id;
              return (
                <button
                  key={t.id}
                  onClick={() => setTab(t.id)}
                  className={`inline-flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 whitespace-nowrap transition-colors ${
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

      {/* ── Body ── */}
      <div className="max-w-7xl mx-auto px-6 py-6">
        {/* OVERVIEW */}
        {tab === 'overview' && (
          <div className="space-y-6 animate-in fade-in">
            {/* Stat cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              {[
                {
                  label: 'Total Users',
                  value: tenant.stats.totalUsers,
                  max: tenant.limits.maxUsers,
                  icon: Users,
                  color: 'text-blue-600 bg-blue-50',
                },
                {
                  label: 'Total Patients',
                  value: tenant.stats.totalPatients,
                  max: tenant.limits.maxPatients,
                  icon: Activity,
                  color: 'text-emerald-600 bg-emerald-50',
                },
                {
                  label: 'Monthly Appointments',
                  value: tenant.stats.monthlyAppointments,
                  icon: Calendar,
                  color: 'text-purple-600 bg-purple-50',
                },
                {
                  label: 'Storage Used',
                  value: tenant.stats.storageUsedMB,
                  max: tenant.limits.storageLimitMB,
                  unit: ' MB',
                  icon: HardDrive,
                  color: 'text-amber-600 bg-amber-50',
                },
              ].map((s) => {
                const Icon = s.icon;
                return (
                  <div
                    key={s.label}
                    className="bg-white rounded-xl border border-gray-200 p-5 shadow-sm"
                  >
                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
                          {s.label}
                        </p>
                        <p className="mt-2 text-2xl font-bold text-gray-900">
                          {s.value === null ? 'Not tracked' : s.value}
                          {s.max !== undefined && s.max !== null && s.value !== null && (
                            <span className="text-sm font-normal text-gray-400 ml-1">
                              / {s.max}
                            </span>
                          )}
                        </p>
                      </div>
                      <div className={`p-2.5 rounded-lg ${s.color}`}>
                        <Icon className="w-5 h-5" />
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
              {/* Info */}
              <div className="lg:col-span-2 bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <Info className="w-5 h-5 text-indigo-500" />
                    Tenant Information
                  </h2>
                </div>
                <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-x-8 gap-y-5">
                  <Detail label="Owner name" value={tenant.ownerName} icon={Shield} />
                  <Detail label="Owner email" value={tenant.ownerEmail} icon={Mail} />
                  <Detail label="Owner phone" value={tenant.ownerPhone || '—'} icon={Users} />
                  <Detail
                    label="Current plan"
                    value={
                      <span className={`px-2 py-0.5 rounded text-xs font-semibold ${PLAN_STYLES[tenant.plan]}`}>
                        {tenant.plan}
                      </span>
                    }
                  />
                  <Detail
                    label="Created"
                    value={new Date(tenant.createdAt).toLocaleDateString(undefined, {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric',
                    })}
                    icon={Calendar}
                  />
                  <Detail label="Timezone" value={tenant.timezone} icon={Clock} />
                  <Detail
                    label="Location"
                    value={
                      [tenant.city, tenant.country].filter(Boolean).join(', ') || '—'
                    }
                    icon={Globe}
                  />
                  <Detail
                    label="Address"
                    value={tenant.address || '—'}
                    icon={Building2}
                  />
                  {tenant.description && (
                    <div className="sm:col-span-2">
                      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
                        Description
                      </p>
                      <p className="text-sm text-gray-800">{tenant.description}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Quick actions */}
              <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                    <Zap className="w-5 h-5 text-indigo-500" />
                    Quick Actions
                  </h2>
                </div>
                <div className="p-4 space-y-2">
                  <button
                    onClick={() =>
                      navigate(`/admin/super/users/create?tenantId=${tenant.id}`)
                    }
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-200 text-left"
                  >
                    <UserPlus className="w-4 h-4 text-indigo-600" />
                    Provision new user
                  </button>
                  <button
                    onClick={() => navigate(`/admin/super/users?tenant=${tenant.id}`)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-200 text-left"
                  >
                    <Users className="w-4 h-4 text-blue-600" />
                    View all users
                  </button>
                  <button
                    onClick={() => navigate(`/admin/super/tenants/${tenant.id}/admins`)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-200 text-left"
                  >
                    <Shield className="w-4 h-4 text-violet-600" />
                    Manage tenant administrators
                  </button>
                  <button
                    onClick={() => navigate(`/admin/super/tenants/${tenant.id}/billing`)}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-200 text-left"
                  >
                    <CreditCard className="w-4 h-4 text-purple-600" />
                    Billing & subscription
                  </button>
                  <a
                    href={`https://${tenant.subdomain}.caresync.com`}
                    target="_blank"
                    rel="noreferrer"
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-200 text-left"
                  >
                    <ExternalLink className="w-4 h-4 text-emerald-600" />
                    Open tenant portal
                  </a>
                  <button
                    onClick={() => setTab('audit')}
                    className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 border border-gray-200 text-left"
                  >
                    <FileText className="w-4 h-4 text-amber-600" />
                    View audit log
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* USERS */}
        {tab === 'users' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm animate-in fade-in">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <Users className="w-5 h-5 text-indigo-500" />
                Tenant Users ({tenant.stats.totalUsers})
              </h2>
              <button
                onClick={() => navigate(`/admin/super/tenants/${tenant.id}/admins`)}
                className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                <Shield className="w-4 h-4 mr-1.5" />
                Manage admins
              </button>
            </div>
            {!tenant.recentUsers || tenant.recentUsers.length === 0 ? (
              <div className="p-12 text-center">
                <Users className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No users provisioned yet.</p>
                <button
                  onClick={() => navigate(`/admin/super/users/create?tenantId=${tenant.id}`)}
                  className="mt-3 text-sm text-indigo-600 hover:underline"
                >
                  Provision the first user →
                </button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      {['User', 'Role', 'Status', 'Last Login'].map((h) => (
                        <th
                          key={h}
                          className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                        >
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {tenant.recentUsers.map((u) => (
                      <tr
                        key={u.id}
                        className="hover:bg-gray-50 cursor-pointer"
                        onClick={() => navigate(`/admin/super/users/${u.id}`)}
                      >
                        <td className="px-6 py-3">
                          <div>
                            <p className="text-sm font-medium text-gray-900">{u.name}</p>
                            <p className="text-xs text-gray-500">{u.email}</p>
                          </div>
                        </td>
                        <td className="px-6 py-3 text-sm text-gray-700">
                          {u.role.replace(/_/g, ' ')}
                        </td>
                        <td className="px-6 py-3">
                          <span
                            className={`text-xs px-2 py-0.5 rounded-full font-medium ${
                              u.status === 'ACTIVE'
                                ? 'bg-emerald-50 text-emerald-700'
                                : u.status === 'SUSPENDED'
                                ? 'bg-red-50 text-red-700'
                                : 'bg-amber-50 text-amber-700'
                            }`}
                          >
                            {u.status}
                          </span>
                        </td>
                        <td className="px-6 py-3 text-xs text-gray-500">
                          {u.lastLogin
                            ? new Date(u.lastLogin).toLocaleString()
                            : 'Never'}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {/* AUDIT */}
        {tab === 'audit' && (
          <div className="bg-white rounded-xl border border-gray-200 shadow-sm animate-in fade-in">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" />
                Recent Audit Activity
              </h2>
              <button
                onClick={() =>
                  navigate(`/admin/super/audit?tenantId=${tenant.id}`)
                }
                className="text-sm text-indigo-600 hover:underline"
              >
                View full log →
              </button>
            </div>
            {!tenant.recentAudit || tenant.recentAudit.length === 0 ? (
              <div className="p-12 text-center">
                <FileText className="w-10 h-10 text-gray-300 mx-auto mb-3" />
                <p className="text-sm text-gray-500">No audit events recorded.</p>
              </div>
            ) : (
              <ul className="divide-y divide-gray-100">
                {tenant.recentAudit.map((a) => (
                  <li key={a.id} className="px-6 py-3 flex items-start gap-3 hover:bg-gray-50">
                    <div className="mt-0.5 h-8 w-8 rounded-full bg-indigo-50 flex items-center justify-center flex-shrink-0">
                      <Activity className="w-4 h-4 text-indigo-600" />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className="text-sm text-gray-900">
                        <span className="font-medium">{a.actor}</span> performed{' '}
                        <span className="font-medium">{a.action}</span> on{' '}
                        <span className="font-medium">{a.entityType}</span>
                      </p>
                      <p className="text-xs text-gray-500 mt-0.5">
                        {new Date(a.timestamp).toLocaleString()}
                      </p>
                    </div>
                  </li>
                ))}
              </ul>
            )}
          </div>
        )}

        {/* LIMITS */}
        {tab === 'limits' && (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 animate-in fade-in">
            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Database className="w-5 h-5 text-indigo-500" />
                  Usage & Limits
                </h2>
              </div>
              <div className="p-6 space-y-5">
                <UsageBar
                  label="Users"
                  value={tenant.stats.totalUsers}
                  max={tenant.limits.maxUsers}
                  icon={Users}
                />
                <UsageBar
                  label="Patients"
                  value={tenant.stats.totalPatients}
                  max={tenant.limits.maxPatients}
                  icon={Activity}
                />
                <UsageBar
                  label="Active providers"
                  value={tenant.stats.activeProviders}
                  max={tenant.limits.maxProviders}
                  icon={Shield}
                />
                <UsageBar
                  label="Storage"
                  value={tenant.stats.storageUsedMB}
                  max={tenant.limits.storageLimitMB}
                  unit=" MB"
                  icon={HardDrive}
                />
              </div>
            </div>

            <div className="bg-white rounded-xl border border-gray-200 shadow-sm">
              <div className="px-6 py-4 border-b border-gray-200">
                <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
                  <Lock className="w-5 h-5 text-indigo-500" />
                  Plan Features
                </h2>
              </div>
              <div className="p-6">
                <ul className="space-y-3">
                  {[
                    'Billing & Invoicing',
                    'Custom Subdomain',
                    'Advanced Analytics',
                    'Multi-location Support',
                    'API Access',
                    'Priority Support',
                    'Custom Integrations',
                  ].map((feature) => {
                    const included = tenant.limits.features.includes(feature);
                    return (
                      <li key={feature} className="flex items-center justify-between">
                        <span
                          className={`text-sm ${
                            included ? 'text-gray-800' : 'text-gray-400 line-through'
                          }`}
                        >
                          {feature}
                        </span>
                        {included ? (
                          <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                        ) : (
                          <XCircle className="w-5 h-5 text-gray-300" />
                        )}
                      </li>
                    );
                  })}
                </ul>
              </div>
            </div>
          </div>
        )}
      </div>

    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Small helper
// ─────────────────────────────────────────────────────────────
function Detail({
  label,
  value,
  icon: Icon,
}: {
  label: string;
  value: React.ReactNode;
  icon?: typeof Mail;
}) {
  return (
    <div>
      <p className="text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">
        {label}
      </p>
      <div className="flex items-center gap-1.5 text-sm text-gray-900 font-medium">
        {Icon && <Icon className="w-4 h-4 text-gray-400 flex-shrink-0" />}
        <span className="break-all">{value}</span>
      </div>
    </div>
  );
}