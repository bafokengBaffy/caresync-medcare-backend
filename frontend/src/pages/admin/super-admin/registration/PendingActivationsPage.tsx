import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  AlertTriangle,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  AlertCircle,
  CheckCircle2,
  XCircle,
  Clock,
  Mail,
  User,
  Shield,
  ShieldCheck,
  Building2,
  KeyRound,
  Link2,
  FileWarning,
  Fingerprint,
  ChevronLeft,
  ChevronRight,
  Download,
  Wrench,
  Zap,
  Info,
  BadgeCheck,
  MailWarning,
  UserX,
  Users,
  Activity,
  Lock,
  MoreVertical,
  Eye,
  Wand2,
} from 'lucide-react';
import { toast } from 'sonner';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
type MissingItem =
  | 'ROLE_CLAIM'
  | 'USER_RECORD'
  | 'TENANT_ASSIGNMENT'
  | 'PROVIDER_LINK'
  | 'EMAIL_VERIFICATION'
  | 'PERMISSIONS';

interface PendingActivation {
  id: string;
  email: string;
  displayName?: string;
  firebaseUid: string;
  emailVerified: boolean;
  authProvider: 'password' | 'google.com' | 'microsoft.com' | 'apple.com';

  // What is assigned vs missing
  hasRoleClaim: boolean;
  roleClaim?: string;
  hasUserRecord: boolean;
  hasTenant: boolean;
  tenantId?: string;
  tenantName?: string;
  needsProviderLink: boolean;
  hasProviderLink: boolean;
  providerId?: string;
  providerName?: string;
  hasPermissions: boolean;

  missing: MissingItem[];
  severity: 'CRITICAL' | 'HIGH' | 'MEDIUM' | 'LOW';
  firstSeenAt: string;
  lastCheckedAt: string;
}

interface ListResponse {
  content: PendingActivation[];
  totalElements: number;
  totalPages: number;
}

const PAGE_SIZE = 15;

const MISSING_META: Record<
  MissingItem,
  { label: string; icon: typeof Lock; fixLabel: string }
> = {
  ROLE_CLAIM: {
    label: 'No Firebase role claim',
    icon: KeyRound,
    fixLabel: 'Assign role claim',
  },
  USER_RECORD: {
    label: 'No CareSync user record',
    icon: UserX,
    fixLabel: 'Create user record',
  },
  TENANT_ASSIGNMENT: {
    label: 'No tenant assigned',
    icon: Building2,
    fixLabel: 'Assign tenant',
  },
  PROVIDER_LINK: {
    label: 'Missing provider link',
    icon: Link2,
    fixLabel: 'Link provider',
  },
  EMAIL_VERIFICATION: {
    label: 'Email not verified',
    icon: MailWarning,
    fixLabel: 'Resend verification',
  },
  PERMISSIONS: {
    label: 'No permissions granted',
    icon: Shield,
    fixLabel: 'Assign permissions',
  },
};

const SEVERITY_STYLES: Record<PendingActivation['severity'], string> = {
  CRITICAL: 'bg-red-50 text-red-700 border-red-200',
  HIGH: 'bg-orange-50 text-orange-700 border-orange-200',
  MEDIUM: 'bg-amber-50 text-amber-700 border-amber-200',
  LOW: 'bg-gray-50 text-gray-700 border-gray-200',
};

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('firebaseToken') ?? ''}`,
});

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export default function PendingActivationsPage() {
  const navigate = useNavigate();

  const [items, setItems] = useState<PendingActivation[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [severityFilter, setSeverityFilter] = useState<'ALL' | PendingActivation['severity']>(
    'ALL'
  );
  const [missingFilter, setMissingFilter] = useState<'ALL' | MissingItem>('ALL');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  const [selected, setSelected] = useState<PendingActivation | null>(null);
  const [isBulkFixing, setIsBulkFixing] = useState(false);

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

  // ───────────────────────────────────────────────
  // Load
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
        if (severityFilter !== 'ALL') params.set('severity', severityFilter);
        if (missingFilter !== 'ALL') params.set('missing', missingFilter);

        const res = await fetch(
          `/api/v1/admin/registration/pending-activations?${params.toString()}`,
          { headers: authHeaders() }
        );
        if (!res.ok) throw new Error('Failed to load pending activations');
        const data: ListResponse = await res.json();
        setItems(data.content ?? []);
        setTotalPages(data.totalPages ?? 0);
        setTotalElements(data.totalElements ?? 0);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [page, debouncedSearch, severityFilter, missingFilter]
  );

  useEffect(() => {
    load();
  }, [load]);

  // ───────────────────────────────────────────────
  // Actions
  // ───────────────────────────────────────────────
  const goFix = (item: PendingActivation) => {
    // Route to provisioning with prefill
    navigate(
      `/admin/super/registration/provision?email=${encodeURIComponent(
        item.email
      )}&firebaseUid=${item.firebaseUid}`
    );
  };

  const resendVerification = async (item: PendingActivation) => {
    try {
      const res = await fetch(
        `/api/v1/admin/firebase/users/${item.firebaseUid}/send-verification`,
        { method: 'POST', headers: authHeaders() }
      );
      if (!res.ok) throw new Error('Failed');
      toast.success(`Verification email sent to ${item.email}`);
      load({ silent: true });
    } catch {
      toast.error('Failed to send verification email');
    }
  };

  const bulkFix = async () => {
    if (items.length === 0) return;
    if (
      !window.confirm(
        `Run bulk auto-fix on ${items.length} users? This will attempt to assign defaults for missing pieces where safe.`
      )
    )
      return;
    setIsBulkFixing(true);
    try {
      const res = await fetch('/api/v1/admin/registration/pending-activations/bulk-fix', {
        method: 'POST',
        headers: authHeaders(),
        body: JSON.stringify({ ids: items.map((i) => i.id) }),
      });
      if (!res.ok) throw new Error('Bulk fix failed');
      const result = await res.json();
      toast.success(
        `Auto-fix complete: ${result.fixed ?? 0} fixed, ${result.skipped ?? 0} require manual review`
      );
      load({ silent: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Bulk fix failed');
    } finally {
      setIsBulkFixing(false);
    }
  };

  const exportCsv = () => {
    if (items.length === 0) return;
    const headers = [
      'ID',
      'Email',
      'Name',
      'Firebase UID',
      'Role Claim',
      'Tenant',
      'Provider',
      'Missing',
      'Severity',
      'First Seen',
    ];
    const rows = items.map((i) => [
      i.id,
      i.email,
      i.displayName ?? '',
      i.firebaseUid,
      i.roleClaim ?? '—',
      i.tenantName ?? '—',
      i.providerName ?? '—',
      i.missing.join('; '),
      i.severity,
      i.firstSeenAt,
    ]);
    const csv = [headers, ...rows]
      .map((r) => r.map((c) => `"${c}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `pending-activations-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (severityFilter !== 'ALL') n++;
    if (missingFilter !== 'ALL') n++;
    return n;
  }, [severityFilter, missingFilter]);

  // ───────────────────────────────────────────────
  // Stats summary
  // ───────────────────────────────────────────────
  const summary = useMemo(() => {
    const total = items.length;
    const critical = items.filter((i) => i.severity === 'CRITICAL').length;
    const missingRoles = items.filter((i) => i.missing.includes('ROLE_CLAIM')).length;
    const missingTenant = items.filter((i) => i.missing.includes('TENANT_ASSIGNMENT')).length;
    return { total, critical, missingRoles, missingTenant };
  }, [items]);

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
              <AlertTriangle className="w-6 h-6 text-amber-600" />
              Pending Activations
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Users with incomplete provisioning. Each item must be resolved before they can
              access protected data.
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
              disabled={items.length === 0}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
            <button
              onClick={bulkFix}
              disabled={isBulkFixing || items.length === 0}
              className="inline-flex items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-amber-600 hover:bg-amber-700 disabled:opacity-50"
            >
              {isBulkFixing ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Wand2 className="w-4 h-4 mr-2" />
              )}
              Auto-fix all
            </button>
          </div>
        </div>
      </div>

      {/* Info banner */}
      <div className="max-w-7xl mx-auto w-full px-6 pt-4">
        <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 flex items-start gap-2 text-sm text-blue-800">
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
          <p>
            A user needs <strong>all</strong> of these before privileged login works: Firebase
            account → role claim → CareSync user record → tenant → provider link (clinical only)
            → permissions. Missing any → they cannot access the system.
          </p>
        </div>
      </div>

      {/* Summary strip */}
      {!isLoading && !error && items.length > 0 && (
        <div className="max-w-7xl mx-auto w-full px-6 pt-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            <StatCard
              label="Pending activations"
              value={summary.total}
              icon={AlertTriangle}
              color="text-amber-600 bg-amber-50"
            />
            <StatCard
              label="Critical"
              value={summary.critical}
              icon={XCircle}
              color="text-red-600 bg-red-50"
            />
            <StatCard
              label="Missing role claim"
              value={summary.missingRoles}
              icon={KeyRound}
              color="text-purple-600 bg-purple-50"
            />
            <StatCard
              label="Missing tenant"
              value={summary.missingTenant}
              icon={Building2}
              color="text-blue-600 bg-blue-50"
            />
          </div>
        </div>
      )}

      {/* Toolbar */}
      <div className="max-w-7xl mx-auto w-full px-6 py-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search by email, name or Firebase UID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
          />
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
        </button>
      </div>

      {isFilterOpen && (
        <div className="max-w-7xl mx-auto w-full px-6 pb-4">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Severity</label>
              <select
                value={severityFilter}
                onChange={(e) => {
                  setSeverityFilter(e.target.value as any);
                  setPage(0);
                }}
                className="w-full rounded-md border-gray-300 text-sm py-2 px-3 border"
              >
                <option value="ALL">All severities</option>
                <option value="CRITICAL">Critical</option>
                <option value="HIGH">High</option>
                <option value="MEDIUM">Medium</option>
                <option value="LOW">Low</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Missing</label>
              <select
                value={missingFilter}
                onChange={(e) => {
                  setMissingFilter(e.target.value as any);
                  setPage(0);
                }}
                className="w-full rounded-md border-gray-300 text-sm py-2 px-3 border"
              >
                <option value="ALL">Any missing item</option>
                <option value="ROLE_CLAIM">Role claim</option>
                <option value="USER_RECORD">User record</option>
                <option value="TENANT_ASSIGNMENT">Tenant</option>
                <option value="PROVIDER_LINK">Provider link</option>
                <option value="EMAIL_VERIFICATION">Email verification</option>
                <option value="PERMISSIONS">Permissions</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setSeverityFilter('ALL');
                  setMissingFilter('ALL');
                  setPage(0);
                }}
                className="text-sm text-indigo-600 hover:text-indigo-800 font-medium"
              >
                Reset
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
              <p className="text-sm">Scanning pending activations...</p>
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
          ) : items.length === 0 ? (
            <div className="p-16 text-center">
              <CheckCircle2 className="w-12 h-12 text-emerald-400 mx-auto mb-3" />
              <h3 className="text-base font-semibold text-gray-900">
                All users are fully provisioned
              </h3>
              <p className="mt-1 text-sm text-gray-500">
                No pending activations found. Everyone has a role claim, tenant and record.
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    {[
                      'User',
                      'Firebase',
                      'Role claim',
                      'Tenant',
                      'Missing',
                      'Severity',
                      '',
                    ].map((h, i) => (
                      <th
                        key={i}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {items.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 font-bold text-sm flex-shrink-0">
                            {(item.displayName ?? item.email).charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate">
                              {item.displayName ?? 'Unknown'}
                            </p>
                            <p className="text-xs text-gray-500 truncate flex items-center gap-1">
                              <Mail className="w-3 h-3" />
                              {item.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs space-y-0.5">
                          <p className="font-mono text-gray-600">
                            {item.firebaseUid.slice(0, 10)}…
                          </p>
                          {item.emailVerified ? (
                            <span className="inline-flex items-center gap-1 text-emerald-700">
                              <BadgeCheck className="w-3 h-3" /> Verified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-amber-700">
                              <MailWarning className="w-3 h-3" /> Unverified
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        {item.hasRoleClaim ? (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded">
                            <ShieldCheck className="w-3 h-3" />
                            {item.roleClaim?.replace(/_/g, ' ')}
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-xs font-medium text-red-700 bg-red-50 px-2 py-0.5 rounded">
                            <KeyRound className="w-3 h-3" />
                            Missing
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        {item.hasTenant ? (
                          <span className="text-xs text-gray-700 flex items-center gap-1">
                            <Building2 className="w-3 h-3 text-gray-400" />
                            {item.tenantName ?? item.tenantId}
                          </span>
                        ) : (
                          <span className="text-xs text-red-600 flex items-center gap-1">
                            <XCircle className="w-3 h-3" />
                            None
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex flex-wrap gap-1 max-w-[220px]">
                          {item.missing.slice(0, 3).map((m) => {
                            const meta = MISSING_META[m];
                            const Icon = meta.icon;
                            return (
                              <span
                                key={m}
                                title={meta.label}
                                className="inline-flex items-center gap-1 text-[10px] font-medium bg-red-50 text-red-700 px-1.5 py-0.5 rounded"
                              >
                                <Icon className="w-2.5 h-2.5" />
                                {meta.label.split(' ').slice(-2).join(' ')}
                              </span>
                            );
                          })}
                          {item.missing.length > 3 && (
                            <span className="inline-flex items-center text-[10px] font-medium bg-gray-100 text-gray-600 px-1.5 py-0.5 rounded">
                              +{item.missing.length - 3} more
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-semibold border ${
                            SEVERITY_STYLES[item.severity]
                          }`}
                        >
                          {item.severity === 'CRITICAL' && <XCircle className="w-3 h-3" />}
                          {item.severity === 'HIGH' && <AlertTriangle className="w-3 h-3" />}
                          {item.severity === 'MEDIUM' && <Clock className="w-3 h-3" />}
                          {item.severity}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelected(item)}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-500"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {item.missing.includes('EMAIL_VERIFICATION') && (
                            <button
                              onClick={() => resendVerification(item)}
                              className="p-1.5 rounded hover:bg-blue-50 text-blue-600"
                              title="Resend verification"
                            >
                              <Mail className="w-4 h-4" />
                            </button>
                          )}
                          <button
                            onClick={() => goFix(item)}
                            className="inline-flex items-center gap-1 px-2 py-1 text-xs font-medium text-white bg-indigo-600 rounded hover:bg-indigo-700"
                          >
                            <Wrench className="w-3 h-3" />
                            Fix
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {!isLoading && !error && items.length > 0 && (
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

      {/* Detail drawer */}
      {selected && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-gray-900/50" onClick={() => setSelected(null)} />
          <aside className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl overflow-y-auto animate-in slide-in-from-right">
            <div className="sticky top-0 bg-amber-700 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">Activation Details</h2>
                <p className="text-xs text-amber-200">{selected.email}</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-1.5 rounded hover:bg-white/10"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>

            <div className="p-5 space-y-5">
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  Provisioning checklist
                </h3>
                <div className="space-y-2">
                  <ChecklistItem
                    label="Firebase account"
                    done={true}
                    detail={selected.firebaseUid.slice(0, 12) + '…'}
                  />
                  <ChecklistItem
                    label="Role claim"
                    done={selected.hasRoleClaim}
                    detail={selected.roleClaim?.replace(/_/g, ' ')}
                  />
                  <ChecklistItem
                    label="CareSync user record"
                    done={selected.hasUserRecord}
                  />
                  <ChecklistItem
                    label="Tenant assigned"
                    done={selected.hasTenant}
                    detail={selected.tenantName}
                  />
                  {selected.needsProviderLink && (
                    <ChecklistItem
                      label="Provider record linked"
                      done={selected.hasProviderLink}
                      detail={selected.providerName}
                    />
                  )}
                  <ChecklistItem
                    label="Permissions granted"
                    done={selected.hasPermissions}
                  />
                  <ChecklistItem
                    label="Email verified"
                    done={selected.emailVerified}
                  />
                </div>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  What needs fixing
                </h3>
                <ul className="space-y-1.5">
                  {selected.missing.map((m) => {
                    const meta = MISSING_META[m];
                    const Icon = meta.icon;
                    return (
                      <li
                        key={m}
                        className="flex items-start gap-2 text-sm text-gray-700 bg-red-50 border border-red-100 rounded-lg p-2"
                      >
                        <Icon className="w-4 h-4 text-red-600 flex-shrink-0 mt-0.5" />
                        <span>{meta.label}</span>
                      </li>
                    );
                  })}
                </ul>
              </div>

              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2">
                  Timeline
                </h3>
                <div className="text-xs text-gray-600 space-y-1">
                  <p>
                    <span className="text-gray-500">First seen: </span>
                    {new Date(selected.firstSeenAt).toLocaleString()}
                  </p>
                  <p>
                    <span className="text-gray-500">Last checked: </span>
                    {new Date(selected.lastCheckedAt).toLocaleString()}
                  </p>
                </div>
              </div>
            </div>

            <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex gap-2">
              {selected.missing.includes('EMAIL_VERIFICATION') && (
                <button
                  onClick={() => {
                    resendVerification(selected);
                  }}
                  className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-blue-700 bg-blue-50 border border-blue-200 rounded-md hover:bg-blue-100"
                >
                  <Mail className="w-4 h-4" />
                  Resend verification
                </button>
              )}
              <button
                onClick={() => goFix(selected)}
                className="flex-1 inline-flex items-center justify-center gap-1 px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                <Wrench className="w-4 h-4" />
                Open provisioning
              </button>
            </div>
          </aside>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Small components
// ─────────────────────────────────────────────────────────────
function StatCard({
  label,
  value,
  icon: Icon,
  color,
}: {
  label: string;
  value: number;
  icon: typeof AlertTriangle;
  color: string;
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 shadow-sm p-4">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-[11px] font-medium text-gray-500 uppercase tracking-wide">
            {label}
          </p>
          <p className="mt-1 text-xl font-bold text-gray-900">{value}</p>
        </div>
        <div className={`p-2 rounded-lg ${color}`}>
          <Icon className="w-4 h-4" />
        </div>
      </div>
    </div>
  );
}

function ChecklistItem({
  label,
  done,
  detail,
}: {
  label: string;
  done: boolean;
  detail?: string;
}) {
  return (
    <div className="flex items-center justify-between p-2 rounded-lg bg-gray-50 border border-gray-200">
      <div className="flex items-center gap-2">
        {done ? (
          <CheckCircle2 className="w-4 h-4 text-emerald-600" />
        ) : (
          <XCircle className="w-4 h-4 text-red-600" />
        )}
        <span
          className={`text-sm ${done ? 'text-gray-700' : 'text-red-700 font-medium'}`}
        >
          {label}
        </span>
      </div>
      {detail && <span className="text-xs text-gray-500">{detail}</span>}
    </div>
  );
}