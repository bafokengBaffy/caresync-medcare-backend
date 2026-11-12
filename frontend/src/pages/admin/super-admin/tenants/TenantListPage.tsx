import { useState, useEffect, useCallback, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Search,
  Plus,
  Edit2,
  Eye,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ShieldAlert,
  Loader2,
  RefreshCw,
  Filter,
  Download,
  X,
  Users,
  Activity,
  CreditCard,
  Globe,
  CheckCircle2,
  XCircle,
  Clock,
  MoreVertical,
  UserPlus,
  Power,
} from 'lucide-react';
import { toast } from 'sonner';
import { normalizePage } from '@/lib/pagination';
import api from '@/lib/api-client';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
export type TenantStatus = 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING';
export type TenantPlan = 'FREE' | 'PRO' | 'ENTERPRISE';

export interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  status: TenantStatus;
  plan: TenantPlan;
  ownerEmail: string;
  usersCount: number;
  patientsCount: number;
  storageUsedMB: number;
  createdAt: string;
  updatedAt?: string;
}

interface TenantListResponse {
  content: Tenant[];
  total: number;
  totalPages?: number;
  page: number;
  size: number;
  last?: boolean;
}

interface ApiEnvelope<T> {
  data: T;
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const PAGE_SIZE = 10;

const STATUS_STYLES: Record<TenantStatus, string> = {
  ACTIVE: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  INACTIVE: 'bg-gray-50 text-gray-700 border-gray-200 dark:bg-slate-950 dark:text-slate-200 dark:border-slate-700',
  SUSPENDED: 'bg-red-50 text-red-700 border-red-200',
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
};

const PLAN_STYLES: Record<TenantPlan, string> = {
  FREE: 'bg-gray-50 text-gray-600 border-gray-200 dark:bg-slate-950 dark:text-slate-300 dark:border-slate-700',
  PRO: 'bg-blue-50 text-blue-600 border-blue-200',
  ENTERPRISE: 'bg-purple-50 text-purple-600 border-purple-200',
};

const PLAN_ICONS: Record<TenantPlan, typeof CreditCard> = {
  FREE: Users,
  PRO: Activity,
  ENTERPRISE: CreditCard,
};

// ─────────────────────────────────────────────────────────────
// API helpers
// ─────────────────────────────────────────────────────────────
async function fetchTenants(params: URLSearchParams): Promise<TenantListResponse> {
  const result = (await api.get<ApiEnvelope<TenantListResponse> | TenantListResponse>(
    '/api/v1/admin/tenants',
    { params },
  )).data;
  return normalizePage('data' in result ? result.data : result);
}

async function updateTenantStatus(id: string, status: TenantStatus): Promise<void> {
  await api.patch(`/api/v1/admin/tenants/${id}/status`, { status });
}

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export default function TenantListPage() {
  const navigate = useNavigate();

  // Data state
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | TenantStatus>('ALL');
  const [planFilter, setPlanFilter] = useState<'ALL' | TenantPlan>('ALL');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Row action menu
  const [openMenuId, setOpenMenuId] = useState<string | null>(null);

  // Status change modal
  const [statusTarget, setStatusTarget] = useState<Tenant | null>(null);
  const [nextStatus, setNextStatus] = useState<TenantStatus>('ACTIVE');
  const [isUpdatingStatus, setIsUpdatingStatus] = useState(false);

  // ───────────────────────────────────────────────
  // Debounce search
  // ───────────────────────────────────────────────
  useEffect(() => {
    const t = setTimeout(() => {
      setDebouncedSearch(searchQuery);
      setPage(0);
    }, 350);
    return () => clearTimeout(t);
  }, [searchQuery]);

  // ───────────────────────────────────────────────
  // Load tenants
  // ───────────────────────────────────────────────
  const loadTenants = useCallback(
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
        if (statusFilter !== 'ALL') params.set('status', statusFilter);
        if (planFilter !== 'ALL') params.set('plan', planFilter);

        const data = await fetchTenants(params);
        setTenants(data.content ?? []);
        setTotalPages(data.totalPages ?? 0);
        setTotalElements(data.total ?? 0);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unable to load tenants');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [page, debouncedSearch, statusFilter, planFilter]
  );

  useEffect(() => {
    loadTenants();
  }, [loadTenants]);

  // Close row menu on outside click
  useEffect(() => {
    if (!openMenuId) return;
    const onClick = () => setOpenMenuId(null);
    window.addEventListener('click', onClick);
    return () => window.removeEventListener('click', onClick);
  }, [openMenuId]);

  // ───────────────────────────────────────────────
  // Handlers
  // ───────────────────────────────────────────────
  const handleStatusChange = async () => {
    if (!statusTarget) return;
    setIsUpdatingStatus(true);
    try {
      await updateTenantStatus(statusTarget.id, nextStatus);
      toast.success(`Status changed to ${nextStatus}`);
      setStatusTarget(null);
      loadTenants({ silent: true });
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Status update failed');
    } finally {
      setIsUpdatingStatus(false);
    }
  };

  const exportCsv = () => {
    if (tenants.length === 0) return;
    const headers = ['ID', 'Name', 'Subdomain', 'Status', 'Plan', 'Users', 'Patients', 'Created'];
    const rows = tenants.map((t) => [
      t.id,
      t.name,
      t.subdomain,
      t.status,
      t.plan,
      t.usersCount,
      t.patientsCount,
      new Date(t.createdAt).toISOString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `tenants-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  const activeFilterCount = useMemo(() => {
    let n = 0;
    if (statusFilter !== 'ALL') n++;
    if (planFilter !== 'ALL') n++;
    return n;
  }, [statusFilter, planFilter]);

  // ───────────────────────────────────────────────
  // Render helpers
  // ───────────────────────────────────────────────
  const StatusBadge = ({ status }: { status: TenantStatus }) => (
    <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium border ${STATUS_STYLES[status]}`}>
      {status === 'ACTIVE' && <CheckCircle2 className="w-3 h-3" />}
      {status === 'SUSPENDED' && <XCircle className="w-3 h-3" />}
      {status === 'PENDING' && <Clock className="w-3 h-3" />}
      {status}
    </span>
  );

  const PlanBadge = ({ plan }: { plan: TenantPlan }) => {
    const Icon = PLAN_ICONS[plan];
    return (
      <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-md text-xs font-semibold border ${PLAN_STYLES[plan]}`}>
        <Icon className="w-3 h-3" />
        {plan}
      </span>
    );
  };

  // ───────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col dark:bg-slate-950">
      {/* ── Header ── */}
      <div className="bg-white border-b border-gray-200 px-6 py-6 dark:bg-slate-900 dark:border-slate-700">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 dark:text-slate-50">
              <Building2 className="w-6 h-6 text-indigo-600" />
              Tenant Management
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              Manage all healthcare organizations registered on the CareSync platform.
            </p>
          </div>
          <div className="flex gap-3">
            <button
              onClick={() => loadTenants({ silent: true })}
              disabled={isRefreshing}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:bg-slate-900 dark:hover:bg-slate-950"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={exportCsv}
              disabled={tenants.length === 0}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:bg-slate-900 dark:hover:bg-slate-950"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
            <button
              onClick={() => navigate('/admin/super/tenants/create')}
              className="inline-flex items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Create Tenant
            </button>
          </div>
        </div>
      </div>

      {/* ── Toolbar ── */}
      <div className="max-w-7xl mx-auto w-full px-6 py-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-300" />
          <input
            type="text"
            placeholder="Search by name, subdomain, or owner email..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-slate-600 dark:bg-slate-900"
          />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 rounded hover:bg-gray-100 dark:hover:bg-slate-900"
              aria-label="Clear search"
            >
              <X className="w-4 h-4 text-gray-400 dark:text-slate-300" />
            </button>
          )}
        </div>

        <button
          onClick={() => setIsFilterOpen((v) => !v)}
          className={`inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium transition-colors ${ isFilterOpen || activeFilterCount > 0 ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-slate-950' } dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-950`}
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

      {/* ── Filters panel ── */}
      {isFilterOpen && (
        <div className="max-w-7xl mx-auto w-full px-6 pb-4">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 animate-in fade-in slide-in-from-top-1 dark:bg-slate-900 dark:border-slate-700">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1 dark:text-slate-200">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value as 'ALL' | 'ACTIVE' | 'INACTIVE' | 'SUSPENDED' | 'PENDING');
                  setPage(0);
                }}
                className="w-full rounded-md border-gray-300 text-sm py-2 px-3 border focus:ring-indigo-500 focus:border-indigo-500 dark:border-slate-600"
              >
                <option value="ALL">All Statuses</option>
                <option value="ACTIVE">Active</option>
                <option value="INACTIVE">Inactive</option>
                <option value="SUSPENDED">Suspended</option>
                <option value="PENDING">Pending</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1 dark:text-slate-200">Plan</label>
              <select
                value={planFilter}
                onChange={(e) => {
                  setPlanFilter(e.target.value as 'ALL' | 'FREE' | 'PRO' | 'ENTERPRISE');
                  setPage(0);
                }}
                className="w-full rounded-md border-gray-300 text-sm py-2 px-3 border focus:ring-indigo-500 focus:border-indigo-500 dark:border-slate-600"
              >
                <option value="ALL">All Plans</option>
                <option value="FREE">Free</option>
                <option value="PRO">Pro</option>
                <option value="ENTERPRISE">Enterprise</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={() => {
                  setStatusFilter('ALL');
                  setPlanFilter('ALL');
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

      {/* ── Table ── */}
      <div className="max-w-7xl mx-auto w-full px-6 pb-12 flex-1">
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden dark:bg-slate-900 dark:border-slate-700">
          {isLoading ? (
            <div className="p-16 flex flex-col items-center justify-center text-gray-500 dark:text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
              <p className="text-sm font-medium">Loading tenants...</p>
            </div>
          ) : error ? (
            <div className="p-16 text-center">
              <ShieldAlert className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-50">Failed to load tenants</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">{error}</p>
              <button
                onClick={() => loadTenants()}
                className="mt-4 inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Try again
              </button>
            </div>
          ) : tenants.length === 0 ? (
            <div className="p-16 text-center">
              <Building2 className="w-12 h-12 text-gray-400 mx-auto mb-4 dark:text-slate-300" />
              <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-50">No tenants found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                {debouncedSearch || activeFilterCount > 0
                  ? 'Try adjusting your filters or search.'
                  : 'Get started by creating the first tenant.'}
              </p>
              {!debouncedSearch && activeFilterCount === 0 && (
                <button
                  onClick={() => navigate('/admin/super/tenants/create')}
                  className="mt-4 inline-flex items-center px-4 py-2 rounded-md text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Create Tenant
                </button>
              )}
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                <thead className="bg-gray-50 dark:bg-slate-950">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-400">
                      Organization
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-400">
                      Status
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-400">
                      Plan
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-400">
                      Usage
                    </th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-400">
                      Created
                    </th>
                    <th className="relative px-6 py-3">
                      <span className="sr-only">Actions</span>
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-slate-900 dark:divide-slate-700">
                  {tenants.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-gray-50 transition-colors dark:hover:bg-slate-950">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-shrink-0 h-10 w-10 bg-indigo-100 rounded-lg flex items-center justify-center">
                            <Building2 className="h-5 w-5 text-indigo-600" />
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-semibold text-gray-900 truncate dark:text-slate-50">{tenant.name}</p>
                            <p className="text-xs text-gray-500 flex items-center gap-1 truncate dark:text-slate-400">
                              <Globe className="w-3 h-3" />
                              {tenant.subdomain}.caresync.com
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <StatusBadge status={tenant.status} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <PlanBadge plan={tenant.plan} />
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="text-xs text-gray-700 space-y-0.5 dark:text-slate-200">
                          <p className="flex items-center gap-1">
                            <Users className="w-3 h-3 text-gray-400 dark:text-slate-300" />
                            {tenant.usersCount} users
                          </p>
                          <p className="flex items-center gap-1">
                            <Activity className="w-3 h-3 text-gray-400 dark:text-slate-300" />
                            {tenant.patientsCount} patients
                          </p>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 dark:text-slate-400">
                        {new Date(tenant.createdAt).toLocaleDateString()}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right">
                        <div className="relative inline-block">
                          <button
                            onClick={(e) => {
                              e.stopPropagation();
                              setOpenMenuId(openMenuId === tenant.id ? null : tenant.id);
                            }}
                            className="p-1.5 rounded-md hover:bg-gray-100 text-gray-500 dark:hover:bg-slate-900 dark:text-slate-400"
                            aria-label="Open actions"
                          >
                            <MoreVertical className="w-5 h-5" />
                          </button>

                          {openMenuId === tenant.id && (
                            <div
                              className="absolute right-0 mt-1 w-52 bg-white rounded-md shadow-lg border border-gray-200 py-1 z-20 dark:bg-slate-900 dark:border-slate-700"
                              onClick={(e) => e.stopPropagation()}
                            >
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  navigate(`/admin/super/tenants/${tenant.id}`);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-slate-950"
                              >
                                <Eye className="w-4 h-4" />
                                View details
                              </button>
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  navigate(`/admin/super/tenants/${tenant.id}/edit`);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-slate-950"
                              >
                                <Edit2 className="w-4 h-4" />
                                Edit tenant
                              </button>
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  navigate(`/admin/super/users?tenant=${tenant.id}`);
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-slate-950"
                              >
                                <UserPlus className="w-4 h-4" />
                                Manage users
                              </button>
                              <button
                                onClick={() => {
                                  setOpenMenuId(null);
                                  setStatusTarget(tenant);
                                  setNextStatus(tenant.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE');
                                }}
                                className="w-full flex items-center gap-2 px-3 py-2 text-sm text-gray-700 hover:bg-gray-50 dark:text-slate-200 dark:hover:bg-slate-950"
                              >
                                <Power className="w-4 h-4" />
                                {tenant.status === 'ACTIVE' ? 'Suspend tenant' : 'Activate tenant'}
                              </button>
                            </div>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* ── Pagination ── */}
        {!isLoading && !error && tenants.length > 0 && (
          <div className="mt-4 bg-white px-4 py-3 flex items-center justify-between rounded-lg shadow-sm border border-gray-200 dark:bg-slate-900 dark:border-slate-700">
            <p className="text-sm text-gray-700 dark:text-slate-200">
              Page <span className="font-semibold">{page + 1}</span> of{' '}
              <span className="font-semibold">{totalPages || 1}</span>
              <span className="ml-2 text-gray-500 dark:text-slate-400">
                ({totalElements} total)
              </span>
            </p>
            <div className="flex items-center gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-950"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 disabled:opacity-50 disabled:cursor-not-allowed dark:border-slate-600 dark:bg-slate-900 dark:text-slate-200 dark:hover:bg-slate-950"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Status Modal ── */}
      {statusTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div
            className="absolute inset-0 bg-gray-900/60 dark:bg-slate-100/60"
            onClick={() => !isUpdatingStatus && setStatusTarget(null)}
          />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 dark:bg-slate-900">
            <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-50">Change Tenant Status</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              Update status for <strong className="text-gray-900 dark:text-slate-50">{statusTarget.name}</strong>.
            </p>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1 dark:text-slate-200">New status</label>
              <select
                value={nextStatus}
                onChange={(e) => setNextStatus(e.target.value as TenantStatus)}
                className="w-full rounded-md border-gray-300 text-sm py-2 px-3 border focus:ring-indigo-500 focus:border-indigo-500 dark:border-slate-600"
              >
                <option value="ACTIVE">ACTIVE — full access</option>
                <option value="INACTIVE">INACTIVE — read-only, no new data</option>
                <option value="SUSPENDED">SUSPENDED — all access blocked</option>
                <option value="PENDING">PENDING — awaiting onboarding</option>
              </select>
            </div>
            <div className="mt-6 flex justify-end gap-3">
              <button
                onClick={() => setStatusTarget(null)}
                disabled={isUpdatingStatus}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 dark:text-slate-200 dark:bg-slate-900 dark:border-slate-600 dark:hover:bg-slate-950"
              >
                Cancel
              </button>
              <button
                onClick={handleStatusChange}
                disabled={isUpdatingStatus}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {isUpdatingStatus && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Confirm
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}