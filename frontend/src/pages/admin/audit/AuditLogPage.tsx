import { useState, useEffect, useCallback } from 'react';
import {
  ShieldCheck,
  Search,
  Filter,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Loader2,
  AlertCircle,
  Clock,
  User,
  Activity,
  FileJson,
  Download,
} from 'lucide-react';
import { format } from 'date-fns'; // Assumes date-fns is installed

// Types
interface AuditEvent {
  id: string;
  timestamp: string;
  action: 'CREATE' | 'UPDATE' | 'DELETE' | 'LOGIN' | 'EXPORT' | 'ACCESS';
  entityType: string;
  entityId: string;
  userId: string;
  userEmail: string;
  ipAddress: string;
  status: 'SUCCESS' | 'FAILURE';
  payload?: Record<string, any>;
  diff?: Record<string, { old: any; new: any }>;
}

const AuditLogPage = () => {
  // State
  const [logs, setLogs] = useState<AuditEvent[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  
  // Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);

  // Filters
  const [searchQuery, setSearchQuery] = useState('');
  const [actionFilter, setActionFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);

  // Drawer State
  const [selectedLog, setSelectedLog] = useState<AuditEvent | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Fetch Data
  const fetchLogs = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: '20',
        ...(searchQuery && { search: searchQuery }),
        ...(actionFilter !== 'ALL' && { action: actionFilter }),
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
        ...(startDate && { startDate }),
        ...(endDate && { endDate }),
      });

      const response = await fetch(`/api/v1/admin/audit?${params.toString()}`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to fetch audit logs');
      
      const data = await response.json();
      setLogs(data.content || []);
      setTotalPages(data.totalPages || 0);
    } catch (err: any) {
      setError(err.message || 'An error occurred while fetching audit logs.');
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery, actionFilter, statusFilter, startDate, endDate]);

  useEffect(() => {
    const timer = setTimeout(() => fetchLogs(), 300);
    return () => clearTimeout(timer);
  }, [fetchLogs]);

  // Handlers
  const handleViewDetails = (log: AuditEvent) => {
    setSelectedLog(log);
    setIsDrawerOpen(true);
  };

  const exportCSV = () => {
    if (logs.length === 0) return;
    const headers = ['ID', 'Timestamp', 'Action', 'Entity', 'User', 'Status', 'IP Address'];
    const csvData = logs.map((log) => [
      log.id,
      log.timestamp,
      log.action,
      `${log.entityType}:${log.entityId}`,
      log.userEmail,
      log.status,
      log.ipAddress,
    ]);

    const csvContent = [headers.join(','), ...csvData.map((row) => row.join(','))].join('\n');
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.setAttribute('download', `audit-logs-${format(new Date(), 'yyyy-MM-dd')}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  // UI Helpers
  const getActionColor = (action: string) => {
    switch (action) {
      case 'CREATE': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'UPDATE': return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'DELETE': return 'bg-red-100 text-red-800 border-red-200';
      case 'LOGIN': return 'bg-purple-100 text-purple-800 border-purple-200';
      case 'EXPORT': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-gray-100 text-gray-800 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col relative overflow-hidden">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6 flex-shrink-0">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <ShieldCheck className="w-6 h-6 text-indigo-600" />
              System Audit Logs
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Immutable record of all critical system and user activities (OWASP Compliance).
            </p>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-3">
            <button
              onClick={exportCSV}
              disabled={logs.length === 0}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
            >
              <Download className="w-4 h-4 mr-2 text-gray-500" />
              Export CSV
            </button>
            <button
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium transition-colors ${
                isFilterOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4 mr-2" />
              Filters
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-6 py-6 flex-1 flex flex-col gap-4">
        {/* Advanced Filters */}
        {isFilterOpen && (
          <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 animate-in fade-in slide-in-from-top-2">
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Action Type</label>
              <select
                value={actionFilter}
                onChange={(e) => { setActionFilter(e.target.value); setPage(0); }}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border"
              >
                <option value="ALL">All Actions</option>
                <option value="CREATE">Create</option>
                <option value="UPDATE">Update</option>
                <option value="DELETE">Delete</option>
                <option value="LOGIN">Login</option>
                <option value="EXPORT">Export</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Status</label>
              <select
                value={statusFilter}
                onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border"
              >
                <option value="ALL">All Statuses</option>
                <option value="SUCCESS">Success</option>
                <option value="FAILURE">Failure</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">Start Date</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => { setStartDate(e.target.value); setPage(0); }}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-700 mb-1">End Date</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => { setEndDate(e.target.value); setPage(0); }}
                className="w-full rounded-md border-gray-300 shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm py-2 px-3 border"
              />
            </div>
          </div>
        )}

        {/* Search Bar */}
        <div className="relative">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search by user email, IP address, or entity ID..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm shadow-sm"
          />
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200 flex-1">
          {isLoading ? (
            <div className="p-16 flex justify-center items-center text-gray-500">
              <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
            </div>
          ) : error ? (
            <div className="p-16 text-center">
              <AlertCircle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">Error loading logs</h3>
              <p className="mt-1 text-sm text-gray-500">{error}</p>
              <button onClick={fetchLogs} className="mt-4 px-4 py-2 bg-indigo-600 text-white rounded-md text-sm">Retry</button>
            </div>
          ) : logs.length === 0 ? (
            <div className="p-16 text-center">
              <ShieldCheck className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No audit logs found</h3>
              <p className="mt-1 text-sm text-gray-500">Adjust your filters or search query.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Timestamp</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Action</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Entity</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IP Address</th>
                    <th className="relative px-6 py-3"><span className="sr-only">View</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {logs.map((log) => (
                    <tr key={log.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <Clock className="w-4 h-4 text-gray-400" />
                          {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm:ss')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`px-2.5 py-0.5 rounded-full text-xs font-medium border ${getActionColor(log.action)}`}>
                          {log.action}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                        <span className="font-medium">{log.entityType}</span>
                        <span className="text-gray-400 ml-1 text-xs">({log.entityId.substring(0, 8)}...)</span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        <div className="flex items-center gap-1.5">
                          <User className="w-4 h-4 text-gray-400" />
                          {log.userEmail}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-xs font-medium ${
                          log.status === 'SUCCESS' ? 'text-emerald-700 bg-emerald-50' : 'text-red-700 bg-red-50'
                        }`}>
                          <Activity className="w-3 h-3" />
                          {log.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500 font-mono">
                        {log.ipAddress}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <button
                          onClick={() => handleViewDetails(log)}
                          className="text-gray-400 hover:text-indigo-600 transition-colors"
                          title="View Details"
                        >
                          <Eye className="w-5 h-5" />
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {!isLoading && !error && logs.length > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow-sm border">
            <p className="text-sm text-gray-700">
              Page <span className="font-medium">{page + 1}</span> of <span className="font-medium">{totalPages || 1}</span>
            </p>
            <div className="flex gap-2">
              <button
                onClick={() => setPage((p) => Math.max(0, p - 1))}
                disabled={page === 0}
                className="relative inline-flex items-center px-2 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronLeft className="h-5 w-5" />
              </button>
              <button
                onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                disabled={page >= totalPages - 1}
                className="relative inline-flex items-center px-2 py-2 rounded-md border border-gray-300 bg-white text-sm font-medium text-gray-500 hover:bg-gray-50 disabled:opacity-50"
              >
                <ChevronRight className="h-5 w-5" />
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Side Drawer for JSON Details */}
      {isDrawerOpen && selectedLog && (
        <div className="fixed inset-0 overflow-hidden z-50">
          <div className="absolute inset-0 overflow-hidden">
            <div className="absolute inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={() => setIsDrawerOpen(false)} />
            <section className="absolute inset-y-0 right-0 pl-10 max-w-full flex">
              <div className="w-screen max-w-md animate-in slide-in-from-right duration-300">
                <div className="h-full flex flex-col bg-white shadow-xl overflow-y-scroll">
                  {/* Drawer Header */}
                  <div className="px-4 py-6 bg-indigo-700 sm:px-6">
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <FileJson className="w-6 h-6 text-indigo-200" />
                        <h2 className="text-lg font-medium text-white" id="slide-over-title">Audit Event Details</h2>
                      </div>
                      <button
                        onClick={() => setIsDrawerOpen(false)}
                        className="ml-3 h-7 w-7 flex items-center justify-center rounded-full text-indigo-200 hover:text-white focus:outline-none focus:ring-2 focus:ring-white"
                      >
                        <X className="h-6 w-6" />
                      </button>
                    </div>
                    <div className="mt-1">
                      <p className="text-sm text-indigo-300">Event ID: {selectedLog.id}</p>
                    </div>
                  </div>
                  
                  {/* Drawer Content */}
                  <div className="flex-1 p-6 space-y-6">
                    <div>
                      <h3 className="text-sm font-medium text-gray-900">Metadata</h3>
                      <dl className="mt-2 grid grid-cols-1 gap-x-4 gap-y-4 sm:grid-cols-2">
                        <div>
                          <dt className="text-xs text-gray-500">Timestamp</dt>
                          <dd className="mt-1 text-sm text-gray-900">{format(new Date(selectedLog.timestamp), 'PPpp')}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-gray-500">User</dt>
                          <dd className="mt-1 text-sm text-gray-900">{selectedLog.userEmail}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-gray-500">Action</dt>
                          <dd className="mt-1 text-sm text-gray-900">{selectedLog.action}</dd>
                        </div>
                        <div>
                          <dt className="text-xs text-gray-500">Status</dt>
                          <dd className="mt-1 text-sm text-gray-900">{selectedLog.status}</dd>
                        </div>
                      </dl>
                    </div>

                    {selectedLog.diff && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                          <Activity className="w-4 h-4 text-indigo-500" />
                          Changes
                        </h3>
                        <div className="mt-2 bg-gray-50 rounded-md border border-gray-200 p-4 overflow-x-auto">
                          <pre className="text-xs text-gray-800 font-mono">
                            {JSON.stringify(selectedLog.diff, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}

                    {selectedLog.payload && (
                      <div>
                        <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2">
                          <FileJson className="w-4 h-4 text-indigo-500" />
                          Full Payload
                        </h3>
                        <div className="mt-2 bg-gray-900 rounded-md p-4 overflow-x-auto">
                          <pre className="text-xs text-emerald-400 font-mono">
                            {JSON.stringify(selectedLog.payload, null, 2)}
                          </pre>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            </section>
          </div>
        </div>
      )}
    </div>
  );
};

export default AuditLogPage;