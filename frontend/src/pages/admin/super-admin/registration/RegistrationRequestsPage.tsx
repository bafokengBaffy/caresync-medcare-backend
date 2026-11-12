import { useState, useEffect, useCallback } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Inbox,
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
  Calendar,
  Eye,
  Ban,
  UserPlus,
  ChevronLeft,
  ChevronRight,
  Download,
  AlertTriangle,
  Info,
  Fingerprint,
  BadgeCheck,
  MailCheck,
  MailWarning,
} from 'lucide-react';
import { toast } from 'sonner';
import { normalizePage } from '@/lib/pagination';
import api from '@/lib/api-client';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
type RequestStatus = 'PENDING' | 'APPROVED' | 'REJECTED';
type RequestSource = 'PUBLIC_SIGNUP' | 'INVITE' | 'API';

interface RegistrationRequest {
  id: string;
  email: string;
  displayName?: string;
  firebaseUid: string;
  emailVerified?: boolean;
  authProvider?: 'password' | 'google.com' | 'microsoft.com' | 'apple.com';
  requestedRole?: string;
  requestedTenantId?: string;
  requestedTenantName?: string;
  source?: RequestSource;
  status: RequestStatus;
  submittedAt: string;
  reviewedAt?: string;
  reviewedBy?: string;
  rejectionReason?: string;
  notes?: string;
  ipAddress?: string;
  userAgent?: string;
}

interface ListResponse {
  content: RegistrationRequest[];
  totalElements: number;
  totalPages: number;
}

interface ApiEnvelope<T> {
  data: T;
}

const PAGE_SIZE = 15;

const STATUS_STYLES: Record<RequestStatus, string> = {
  PENDING: 'bg-amber-50 text-amber-700 border-amber-200',
  APPROVED: 'bg-emerald-50 text-emerald-700 border-emerald-200',
  REJECTED: 'bg-red-50 text-red-700 border-red-200',
};

const SOURCE_LABELS: Record<RequestSource, string> = {
  PUBLIC_SIGNUP: 'Public sign-up',
  INVITE: 'Admin invite',
  API: 'API',
};

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export default function RegistrationRequestsPage() {
  const navigate = useNavigate();

  const [requests, setRequests] = useState<RegistrationRequest[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [totalElements, setTotalElements] = useState(0);

  const [searchQuery, setSearchQuery] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState<'ALL' | RequestStatus>('PENDING');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Drawer / modal state
  const [selected, setSelected] = useState<RegistrationRequest | null>(null);
  const [actionTarget, setActionTarget] = useState<RegistrationRequest | null>(null);
  const [actionKind, setActionKind] = useState<'APPROVE' | 'REJECT' | null>(null);
  const [rejectionReason, setRejectionReason] = useState('');
  const [approvalTenantId, setApprovalTenantId] = useState('');
  const [approvalPatientId, setApprovalPatientId] = useState('');
  const [isActing, setIsActing] = useState(false);

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
        if (statusFilter !== 'ALL') params.set('status', statusFilter);
        const result = (await api.get<ApiEnvelope<ListResponse> | ListResponse>(
          '/api/v1/admin/registration/requests',
          { params },
        )).data;
        const data = normalizePage<RegistrationRequest>(
          'data' in result ? result.data : result,
        );
        setRequests(data.content);
        setTotalPages(data.totalPages ?? 0);
        setTotalElements(data.total);
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Unknown error');
      } finally {
        setIsLoading(false);
        setIsRefreshing(false);
      }
    },
    [page, debouncedSearch, statusFilter]
  );

  useEffect(() => {
    load();
  }, [load]);

  // ───────────────────────────────────────────────
  // Actions
  // ───────────────────────────────────────────────
  const openApprove = (req: RegistrationRequest) => {
    setActionTarget(req);
    setActionKind('APPROVE');
    setApprovalTenantId(req.requestedTenantId ?? '');
    setApprovalPatientId('');
  };

  const openReject = (req: RegistrationRequest) => {
    setActionTarget(req);
    setRejectionReason('');
    setActionKind('REJECT');
  };

  const closeAction = () => {
    if (isActing) return;
    setActionTarget(null);
    setActionKind(null);
    setRejectionReason('');
  };

  const submitApprove = async () => {
    if (!actionTarget) return;
    if (!approvalTenantId || !approvalPatientId) {
      toast.error('Tenant ID and an existing patient record ID are required');
      return;
    }
    setIsActing(true);
    try {
      await api.post(
        `/api/v1/admin/registration/requests/${actionTarget.id}/approve`,
        { tenantId: approvalTenantId, patientId: approvalPatientId },
      );
      toast.success(`Approved ${actionTarget.email}`);
      closeAction();
      load({ silent: true });
      setSelected(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Approval failed');
    } finally {
      setIsActing(false);
    }
  };

  const submitReject = async () => {
    if (!actionTarget) return;
    if (rejectionReason.trim().length < 5) {
      toast.error('Please provide a rejection reason (min 5 chars)');
      return;
    }
    setIsActing(true);
    try {
      await api.post(
        `/api/v1/admin/registration/requests/${actionTarget.id}/reject`,
        { reason: rejectionReason.trim() },
      );
      toast.success(`Rejected ${actionTarget.email}`);
      closeAction();
      load({ silent: true });
      setSelected(null);
    } catch (e) {
      toast.error(e instanceof Error ? e.message : 'Rejection failed');
    } finally {
      setIsActing(false);
    }
  };

  const exportCsv = () => {
    if (requests.length === 0) return;
    const headers = [
      'ID',
      'Email',
      'Name',
      'Firebase UID',
      'Verified',
      'Provider',
      'Source',
      'Requested Role',
      'Requested Tenant',
      'Status',
      'Submitted',
    ];
    const rows = requests.map((r) => [
      r.id,
      r.email,
      r.displayName ?? '',
      r.firebaseUid,
      r.emailVerified == null ? 'not recorded' : r.emailVerified ? 'yes' : 'no',
      r.authProvider ?? '',
      r.source ? SOURCE_LABELS[r.source] : 'not recorded',
      r.requestedRole ?? '',
      r.requestedTenantName ?? '',
      r.status,
      r.submittedAt,
    ]);
    const csv = [headers, ...rows]
      .map((row) => row.map((c) => `"${c}"`).join(','))
      .join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `registration-requests-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    URL.revokeObjectURL(url);
  };

  // ───────────────────────────────────────────────
  // Render helpers
  // ───────────────────────────────────────────────
  const ProviderIcon = ({ provider }: { provider: RegistrationRequest['authProvider'] }) => {
    if (provider === 'google.com')
      return <span className="text-xs font-bold text-red-500">G</span>;
    if (provider === 'microsoft.com')
      return <span className="text-xs font-bold text-blue-600">M</span>;
    if (provider === 'apple.com')
      return <span className="text-xs font-bold text-gray-800 dark:text-slate-100"></span>;
    return <Mail className="w-3.5 h-3.5 text-gray-500 dark:text-slate-400" />;
  };

  // ───────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 flex flex-col dark:bg-slate-950">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6 dark:bg-slate-900 dark:border-slate-700">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2 dark:text-slate-50">
              <Inbox className="w-6 h-6 text-indigo-600" />
              Registration Requests
            </h1>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              Review self-registered Firebase accounts awaiting role and tenant assignment.
            </p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => load({ silent: true })}
              disabled={isRefreshing}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:bg-slate-900 dark:hover:bg-slate-950"
            >
              <RefreshCw className={`w-4 h-4 mr-2 ${isRefreshing ? 'animate-spin' : ''}`} />
              Refresh
            </button>
            <button
              onClick={exportCsv}
              disabled={requests.length === 0}
              className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:bg-slate-900 dark:hover:bg-slate-950"
            >
              <Download className="w-4 h-4 mr-2" />
              Export
            </button>
            <button
              onClick={() => navigate('/admin/super/registration/provision')}
              className="inline-flex items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <UserPlus className="w-4 h-4 mr-2" />
              Provision manually
            </button>
          </div>
        </div>
      </div>

      {/* Toolbar */}
      <div className="max-w-7xl mx-auto w-full px-6 py-4 flex flex-col sm:flex-row gap-3">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 dark:text-slate-300" />
          <input
            type="text"
            placeholder="Search by email, name, or Firebase UID..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pl-9 pr-9 py-2 border border-gray-300 rounded-md text-sm bg-white focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-slate-600 dark:bg-slate-900"
          />
        </div>
        <select
          value={statusFilter}
          onChange={(e) => {
            setStatusFilter(e.target.value as 'ALL' | RequestStatus);
            setPage(0);
          }}
          className="px-3 py-2 border border-gray-300 rounded-md text-sm bg-white focus:ring-indigo-500 focus:border-indigo-500 dark:border-slate-600 dark:bg-slate-900"
        >
          <option value="ALL">All statuses</option>
          <option value="PENDING">Pending</option>
          <option value="APPROVED">Approved</option>
          <option value="REJECTED">Rejected</option>
        </select>
        <button
          onClick={() => setIsFilterOpen((v) => !v)}
          className={`inline-flex items-center px-4 py-2 border rounded-md text-sm font-medium transition-colors ${ isFilterOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50 dark:bg-slate-950' } dark:border-slate-600 dark:text-slate-200 dark:hover:bg-slate-950`}
        >
          <Filter className="w-4 h-4 mr-2" />
          Filters
        </button>
      </div>

      {/* Advanced filters */}
      {isFilterOpen && (
        <div className="max-w-7xl mx-auto w-full px-6 pb-4">
          <div className="bg-white border border-gray-200 rounded-lg shadow-sm p-4 dark:bg-slate-900 dark:border-slate-700">
            <p className="text-sm text-gray-600 dark:text-slate-300">Search and status are supported by the registration API.</p>
            <div className="flex items-end">
              <button onClick={() => setIsFilterOpen(false)} className="text-sm text-indigo-600 hover:text-indigo-800 font-medium">
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="max-w-7xl mx-auto w-full px-6 pb-12 flex-1">
        <div className="bg-white rounded-lg shadow border border-gray-200 overflow-hidden dark:bg-slate-900 dark:border-slate-700">
          {isLoading ? (
            <div className="p-16 flex flex-col items-center text-gray-500 dark:text-slate-400">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600 mb-3" />
              <p className="text-sm">Loading requests...</p>
            </div>
          ) : error ? (
            <div className="p-16 text-center">
              <AlertCircle className="w-10 h-10 text-red-500 mx-auto mb-3" />
              <p className="text-sm text-gray-700 dark:text-slate-200">{error}</p>
              <button
                onClick={() => load()}
                className="mt-4 inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Retry
              </button>
            </div>
          ) : requests.length === 0 ? (
            <div className="p-16 text-center">
              <Inbox className="w-12 h-12 text-gray-300 mx-auto mb-3 dark:text-slate-300" />
              <h3 className="text-base font-semibold text-gray-900 dark:text-slate-50">No requests found</h3>
              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                {statusFilter === 'PENDING'
                  ? 'No pending registration requests right now.'
                  : 'Try adjusting your filters.'}
              </p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200 dark:divide-slate-700">
                <thead className="bg-gray-50 dark:bg-slate-950">
                  <tr>
                    {[
                      'Applicant',
                      'Firebase',
                      'Requested access',
                      'Source',
                      'Status',
                      'Submitted',
                      '',
                    ].map((h, i) => (
                      <th
                        key={i}
                        className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider dark:text-slate-400"
                      >
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200 dark:bg-slate-900 dark:divide-slate-700">
                  {requests.map((req) => (
                    <tr key={req.id} className="hover:bg-gray-50 transition-colors dark:hover:bg-slate-950">
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm flex-shrink-0">
                            {(req.displayName ?? req.email).charAt(0).toUpperCase()}
                          </div>
                          <div className="min-w-0">
                            <p className="text-sm font-medium text-gray-900 truncate dark:text-slate-50">
                              {req.displayName ?? 'Unknown name'}
                            </p>
                            <p className="text-xs text-gray-500 truncate flex items-center gap-1 dark:text-slate-400">
                              <Mail className="w-3 h-3" />
                              {req.email}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="flex items-center gap-2">
                          <span className="inline-flex items-center justify-center h-6 w-6 rounded-full bg-gray-100 dark:bg-slate-900">
                            <ProviderIcon provider={req.authProvider} />
                          </span>
                          {req.emailVerified === true ? (
                            <span className="inline-flex items-center gap-1 text-xs text-emerald-700">
                              <MailCheck className="w-3 h-3" /> Verified
                            </span>
                          ) : req.emailVerified === false ? (
                            <span className="inline-flex items-center gap-1 text-xs text-amber-700">
                              <MailWarning className="w-3 h-3" /> Unverified
                            </span>
                          ) : (
                            <span className="inline-flex items-center gap-1 text-xs text-gray-500 dark:text-slate-400">
                              <Info className="w-3 h-3" /> Not recorded
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3">
                        <div className="text-xs space-y-0.5">
                          {req.requestedRole ? (
                            <p className="flex items-center gap-1 text-gray-700 dark:text-slate-200">
                              <Shield className="w-3 h-3 text-gray-400 dark:text-slate-300" />
                              {req.requestedRole.replace(/_/g, ' ')}
                            </p>
                          ) : (
                            <p className="text-gray-400 italic dark:text-slate-300">No role requested</p>
                          )}
                          {(req.requestedTenantName || req.requestedTenantId) && (
                            <p className="flex items-center gap-1 text-gray-500 dark:text-slate-400">
                              <Building2 className="w-3 h-3 text-gray-400 dark:text-slate-300" />
                              {req.requestedTenantName ?? req.requestedTenantId}
                            </p>
                          )}
                        </div>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-600 dark:text-slate-300">
                        {req.source ? SOURCE_LABELS[req.source] : 'Not recorded'}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`inline-flex items-center gap-1 text-[11px] px-2 py-0.5 rounded-full font-semibold border ${STATUS_STYLES[req.status]}`}
                        >
                          {req.status === 'PENDING' && <Clock className="w-3 h-3" />}
                          {req.status === 'APPROVED' && <CheckCircle2 className="w-3 h-3" />}
                          {req.status === 'REJECTED' && <XCircle className="w-3 h-3" />}
                          {req.status}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-xs text-gray-500 whitespace-nowrap dark:text-slate-400">
                        {new Date(req.submittedAt).toLocaleDateString()}
                      </td>
                      <td className="px-4 py-3 text-right">
                        <div className="flex items-center justify-end gap-1">
                          <button
                            onClick={() => setSelected(req)}
                            className="p-1.5 rounded hover:bg-gray-100 text-gray-500 dark:hover:bg-slate-900 dark:text-slate-400"
                            title="View details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {req.status === 'PENDING' && (
                            <>
                              <button
                                onClick={() => openApprove(req)}
                                className="p-1.5 rounded hover:bg-emerald-50 text-emerald-600"
                                title="Approve"
                              >
                                <CheckCircle2 className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => openReject(req)}
                                className="p-1.5 rounded hover:bg-red-50 text-red-600"
                                title="Reject"
                              >
                                <Ban className="w-4 h-4" />
                              </button>
                            </>
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

        {/* Pagination */}
        {!isLoading && !error && requests.length > 0 && (
          <div className="mt-4 bg-white px-4 py-3 flex items-center justify-between rounded-lg shadow-sm border border-gray-200 dark:bg-slate-900 dark:border-slate-700">
            <p className="text-sm text-gray-700 dark:text-slate-200">
              Page <span className="font-semibold">{page + 1}</span> of{' '}
              <span className="font-semibold">{totalPages || 1}</span>
              <span className="ml-2 text-gray-500 dark:text-slate-400">({totalElements} total)</span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:bg-slate-900 dark:hover:bg-slate-950"
              >
                <ChevronLeft className="w-4 h-4 mr-1" />
                Previous
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:bg-slate-900 dark:hover:bg-slate-950"
              >
                Next
                <ChevronRight className="w-4 h-4 ml-1" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* ── Details drawer ── */}
      {selected && (
        <div className="fixed inset-0 z-40">
          <div className="absolute inset-0 bg-gray-900/50 dark:bg-slate-100/50" onClick={() => setSelected(null)} />
          <aside className="absolute right-0 top-0 bottom-0 w-full max-w-md bg-white shadow-xl overflow-y-auto animate-in slide-in-from-right dark:bg-slate-900">
            <div className="sticky top-0 bg-indigo-700 text-white px-5 py-4 flex items-center justify-between">
              <div>
                <h2 className="text-base font-semibold">Request Details</h2>
                <p className="text-xs text-indigo-200">ID {selected.id.slice(0, 8)}…</p>
              </div>
              <button
                onClick={() => setSelected(null)}
                className="p-1.5 rounded hover:bg-white dark:hover:bg-slate-900"
              >
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-5 space-y-5">
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 dark:text-slate-400">
                  Applicant
                </h3>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm dark:bg-slate-950">
                  <Row icon={User} label="Name" value={selected.displayName ?? '—'} />
                  <Row icon={Mail} label="Email" value={selected.email} />
                  <Row
                    icon={Fingerprint}
                    label="Firebase UID"
                    value={selected.firebaseUid}
                    mono
                  />
                  <Row
                    icon={BadgeCheck}
                    label="Provider"
                    value={selected.authProvider ?? 'Not recorded'}
                  />
                  <Row
                    icon={
                      selected.emailVerified === true
                        ? MailCheck
                        : selected.emailVerified === false
                          ? MailWarning
                          : Info
                    }
                    label="Email verified"
                    value={
                      selected.emailVerified == null
                        ? 'Not recorded'
                        : selected.emailVerified
                          ? 'Yes'
                          : 'No'
                    }
                    tone={
                      selected.emailVerified === true
                        ? 'ok'
                        : selected.emailVerified === false
                          ? 'warn'
                          : undefined
                    }
                  />
                </div>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 dark:text-slate-400">
                  Requested Access
                </h3>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm dark:bg-slate-950">
                  <Row
                    icon={Shield}
                    label="Role"
                    value={selected.requestedRole?.replace(/_/g, ' ') ?? 'Not specified'}
                  />
                  <Row
                    icon={Building2}
                    label="Tenant"
                    value={
                      selected.requestedTenantName
                      ?? selected.requestedTenantId
                      ?? 'Not specified'
                    }
                  />
                  <Row
                    icon={Clock}
                    label="Source"
                    value={selected.source ? SOURCE_LABELS[selected.source] : 'Not recorded'}
                  />
                </div>
              </div>
              <div>
                <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 dark:text-slate-400">
                  Submission
                </h3>
                <div className="bg-gray-50 rounded-lg p-3 space-y-2 text-sm dark:bg-slate-950">
                  <Row
                    icon={Calendar}
                    label="Submitted"
                    value={new Date(selected.submittedAt).toLocaleString()}
                  />
                  {selected.ipAddress && (
                    <Row icon={Info} label="IP address" value={selected.ipAddress} mono />
                  )}
                  {selected.reviewedBy && (
                    <Row
                      icon={ShieldCheck}
                      label="Reviewed by"
                      value={selected.reviewedBy}
                    />
                  )}
                  {selected.rejectionReason && (
                    <Row
                      icon={XCircle}
                      label="Rejection reason"
                      value={selected.rejectionReason}
                      tone="danger"
                    />
                  )}
                </div>
              </div>
              {selected.notes && (
                <div>
                  <h3 className="text-xs font-semibold text-gray-500 uppercase mb-2 dark:text-slate-400">
                    Notes
                  </h3>
                  <p className="text-sm text-gray-700 bg-gray-50 rounded-lg p-3 dark:text-slate-200 dark:bg-slate-950">
                    {selected.notes}
                  </p>
                </div>
              )}
            </div>
            {selected.status === 'PENDING' && (
              <div className="sticky bottom-0 bg-white border-t border-gray-200 p-4 flex gap-2 dark:bg-slate-900 dark:border-slate-700">
                <button
                  onClick={() => openReject(selected)}
                  className="flex-1 inline-flex items-center justify-center gap-1 px-4 py-2 text-sm font-medium text-red-700 bg-white border border-red-300 rounded-md hover:bg-red-50 dark:bg-slate-900"
                >
                  <Ban className="w-4 h-4" />
                  Reject
                </button>
                <button
                  onClick={() => openApprove(selected)}
                  className="flex-1 inline-flex items-center justify-center gap-1 px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700"
                >
                  <CheckCircle2 className="w-4 h-4" />
                  Approve
                </button>
              </div>
            )}
          </aside>
        </div>
      )}

      {/* ── Approve modal ── */}
      {actionKind === 'APPROVE' && actionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 dark:bg-slate-100/60" onClick={closeAction} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 dark:bg-slate-900">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-emerald-100 flex items-center justify-center flex-shrink-0">
                <CheckCircle2 className="w-6 h-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-50">Approve request?</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
                  The Firebase account <strong>{actionTarget.email}</strong> will be linked to
                  an existing patient record in the selected tenant.
                </p>
                {actionTarget.emailVerified === false && (
                  <div className="mt-3 p-2 bg-amber-50 border border-amber-200 rounded text-xs text-amber-800 flex items-start gap-1.5">
                    <AlertTriangle className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
                    Email is not yet verified. Consider requiring verification before first login.
                  </div>
                )}
              </div>
            </div>
            <div className="mt-5 space-y-3">
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">
                Tenant ID
                <input
                  required
                  value={approvalTenantId}
                  onChange={(event) => setApprovalTenantId(event.target.value)}
                  placeholder="Tenant UUID"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-slate-600"
                />
              </label>
              <label className="block text-sm font-medium text-gray-700 dark:text-slate-200">
                Existing patient ID
                <input
                  required
                  value={approvalPatientId}
                  onChange={(event) => setApprovalPatientId(event.target.value)}
                  placeholder="Patient UUID"
                  className="mt-1 w-full rounded-md border border-gray-300 px-3 py-2 text-sm dark:border-slate-600"
                />
              </label>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={closeAction}
                disabled={isActing}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 dark:text-slate-200 dark:bg-slate-900 dark:border-slate-600 dark:hover:bg-slate-950"
              >
                Cancel
              </button>
              <button
                onClick={submitApprove}
                disabled={isActing}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-emerald-600 rounded-md hover:bg-emerald-700 disabled:opacity-50"
              >
                {isActing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Approve & link patient
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ── Reject modal ── */}
      {actionKind === 'REJECT' && actionTarget && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
          <div className="absolute inset-0 bg-gray-900/60 dark:bg-slate-100/60" onClick={closeAction} />
          <div className="relative bg-white rounded-xl shadow-xl max-w-md w-full p-6 dark:bg-slate-900">
            <div className="flex items-start gap-4">
              <div className="h-12 w-12 rounded-full bg-red-100 flex items-center justify-center flex-shrink-0">
                <Ban className="w-6 h-6 text-red-600" />
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900 dark:text-slate-50">Reject request</h3>
                <p className="mt-1 text-sm text-gray-600 dark:text-slate-300">
                  Rejecting <strong>{actionTarget.email}</strong> prevents this account from
                  being provisioned. The reason will be stored and visible to admins.
                </p>
                <label className="block mt-4 text-sm font-medium text-gray-700 mb-1 dark:text-slate-200">
                  Reason for rejection <span className="text-red-500">*</span>
                </label>
                <textarea
                  rows={3}
                  value={rejectionReason}
                  onChange={(e) => setRejectionReason(e.target.value)}
                  placeholder="e.g. Could not verify employment with this organisation."
                  className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500 dark:border-slate-600"
                />
              </div>
            </div>
            <div className="mt-6 flex justify-end gap-2">
              <button
                onClick={closeAction}
                disabled={isActing}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 dark:text-slate-200 dark:bg-slate-900 dark:border-slate-600 dark:hover:bg-slate-950"
              >
                Cancel
              </button>
              <button
                onClick={submitReject}
                disabled={isActing || rejectionReason.trim().length < 5}
                className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-red-600 rounded-md hover:bg-red-700 disabled:opacity-50"
              >
                {isActing && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Reject request
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
function Row({
  icon: Icon,
  label,
  value,
  mono = false,
  tone,
}: {
  icon: typeof Mail;
  label: string;
  value: string;
  mono?: boolean;
  tone?: 'ok' | 'warn' | 'danger';
}) {
  const toneCls =
    tone === 'ok'
      ? 'text-emerald-700'
      : tone === 'warn'
      ? 'text-amber-700'
      : tone === 'danger'
      ? 'text-red-700'
      : 'text-gray-900 dark:text-slate-50';
  return (
    <div className="flex items-start gap-2">
      <Icon className="w-3.5 h-3.5 text-gray-400 mt-0.5 flex-shrink-0 dark:text-slate-300" />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-gray-500 uppercase tracking-wide dark:text-slate-400">{label}</p>
        <p
          className={`text-sm break-all ${toneCls} ${mono ? 'font-mono text-xs' : ''}`}
        >
          {value}
        </p>
      </div>
    </div>
  );
}