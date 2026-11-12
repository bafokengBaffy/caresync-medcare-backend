import { useState, useEffect, useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { toast } from 'sonner';
import {
  FileText,
  Search,
  Filter,
  RefreshCw,
  Loader2,
  AlertCircle,
  ChevronLeft,
  ChevronRight,
  Download,
  Calendar,
  Clock,
  User,
  Shield,
  Activity,
  Info,
  Fingerprint,
  Database,
  Eye,
  CheckCircle2,
  XCircle,
  ChevronDown,
  CalendarRange,
  Trash2,
  Lock,
  ExternalLink,
} from 'lucide-react';

import api from '@/lib/api-client';
import { adminTenantsApi } from '@/api/admin-tenants';
import { normalizePage } from '@/lib/pagination';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from '@/components/ui/popover';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
const PAGE_SIZE = 25;

interface AuditLog {
  id: string;
  actorUserId: string;
  actorRole: string;
  action: string;
  resourceType: string;
  resourceId: string | null;
  tenantId: string | null;
  ipAddress: string | null;
  userAgent: string | null;
  requestId: string | null;
  delta: string | null;
  createdAt: string;
}

interface PaginatedResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
}

const ACTION_COLORS: Record<string, string> = {
  CREATE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  UPDATE: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200',
  DELETE: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  LOGIN: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200',
  LOGOUT: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  APPROVE: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200',
  REJECT: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
  SUSPEND: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
};

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
export default function AuditLogViewer({ title = 'Audit Logs' }: { title?: string }) {
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [actionFilter, setActionFilter] = useState('');
  const [resourceFilter, setResourceFilter] = useState('');
  const [tenantFilter, setTenantFilter] = useState('');
  const [selectedLog, setSelectedLog] = useState<AuditLog | null>(null);
  const [isDrawerOpen, setIsDrawerOpen] = useState(false);

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch Audit Logs
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['audit-logs', page, debouncedSearch, actionFilter, resourceFilter, tenantFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        size: PAGE_SIZE.toString(),
      });
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (actionFilter) params.append('action', actionFilter);
      if (resourceFilter) params.append('resourceType', resourceFilter);
      if (tenantFilter) params.append('tenantId', tenantFilter);

      const response = await api.get(`/api/v1/admin/audit?${params.toString()}`);
      const body = response.data as { data?: PaginatedResponse<AuditLog> } & PaginatedResponse<AuditLog>;
      return normalizePage(body.data ?? body);
    },
  });

  // Fetch Tenants for filter
  const { data: tenantsData } = useQuery({
    queryKey: ['admin-tenants-options'],
    queryFn: async () => {
      return adminTenantsApi.listForSelection();
    },
    staleTime: 1000 * 60 * 10,
  });

  const logs = data?.content || [];
  const totalLogs = data?.total || 0;
  const totalPages = data?.totalPages || 1;

  // Export to CSV
  const handleExportCsv = () => {
    if (logs.length === 0) return;
  const headers = ['Timestamp', 'Actor ID', 'Role', 'Action', 'Resource Type', 'Resource ID', 'Tenant ID', 'IP Address', 'Request ID'];
    const rows = logs.map((log) => [
      log.createdAt,
      log.actorUserId,
      log.actorRole,
      log.action,
      log.resourceType,
      log.resourceId || '',
      log.tenantId || 'Platform',
      log.ipAddress || '',
      log.requestId || '',
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `audit-logs-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  };

  // Summary Metrics
  const summary = useMemo(() => {
    return {
      total: totalLogs,
      creates: logs.filter((l) => l.action === 'CREATE').length,
      updates: logs.filter((l) => l.action === 'UPDATE').length,
      deletes: logs.filter((l) => l.action === 'DELETE').length,
    };
  }, [logs, totalLogs]);

  const ActionBadge = ({ action }: { action: string }) => {
    const color = ACTION_COLORS[action] || ACTION_COLORS.UPDATE;
    return <Badge variant="outline" className={`${color} border-none`}>{action}</Badge>;
  };

  if (isError) {
    return (
      <Alert variant="destructive" className="m-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Audit Logs</AlertTitle>
        <AlertDescription>{error?.message || 'Could not retrieve audit logs.'}</AlertDescription>
        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Retry
        </Button>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto max-w-7xl py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <FileText className="h-8 w-8 text-primary" />
            {title}
          </h1>
          <p className="text-muted-foreground mt-1">
            Immutable record of every action taken across the platform.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={handleExportCsv} disabled={logs.length === 0}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
          </Button>
        </div>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Total Logs</p>
              <p className="text-2xl font-bold mt-1">{summary.total.toLocaleString()}</p>
            </div>
            <FileText className="h-6 w-6 text-muted-foreground/50" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Creates (Page)</p>
              <p className="text-2xl font-bold mt-1">{summary.creates}</p>
            </div>
            <CheckCircle2 className="h-6 w-6 text-emerald-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Updates (Page)</p>
              <p className="text-2xl font-bold mt-1">{summary.updates}</p>
            </div>
            <Activity className="h-6 w-6 text-blue-500" />
          </CardContent>
        </Card>
        <Card>
          <CardContent className="p-5 flex items-center justify-between">
            <div>
              <p className="text-xs font-medium text-muted-foreground uppercase">Deletes (Page)</p>
              <p className="text-2xl font-bold mt-1">{summary.deletes}</p>
            </div>
            <XCircle className="h-6 w-6 text-red-500" />
          </CardContent>
        </Card>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search actor, resource, IP..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={actionFilter} onValueChange={(v) => { setActionFilter(v === 'ALL' ? '' : v); setPage(0); }}>
            <SelectTrigger><SelectValue placeholder="All Actions" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Actions</SelectItem>
              <SelectItem value="CREATE">Create</SelectItem>
              <SelectItem value="UPDATE">Update</SelectItem>
              <SelectItem value="DELETE">Delete</SelectItem>
              <SelectItem value="LOGIN">Login</SelectItem>
              <SelectItem value="APPROVE">Approve</SelectItem>
              <SelectItem value="REJECT">Reject</SelectItem>
              <SelectItem value="SUSPEND">Suspend</SelectItem>
            </SelectContent>
          </Select>
          <Select value={resourceFilter} onValueChange={(v) => { setResourceFilter(v === 'ALL' ? '' : v); setPage(0); }}>
            <SelectTrigger><SelectValue placeholder="All Resources" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Resources</SelectItem>
              <SelectItem value="USER">User</SelectItem>
              <SelectItem value="TENANT">Tenant</SelectItem>
              <SelectItem value="PATIENT">Patient</SelectItem>
              <SelectItem value="APPOINTMENT">Appointment</SelectItem>
              <SelectItem value="INVOICE">Invoice</SelectItem>
              <SelectItem value="CLINICAL_NOTE">Clinical Note</SelectItem>
              <SelectItem value="SETTINGS">Settings</SelectItem>
            </SelectContent>
          </Select>
          <Select value={tenantFilter} onValueChange={(v) => { setTenantFilter(v === 'ALL' ? '' : v); setPage(0); }}>
            <SelectTrigger><SelectValue placeholder="All Tenants" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Tenants</SelectItem>
              {tenantsData?.content.map((t) => (
                <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>
              ))}
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Logs Table */}
      <Card>
        <CardContent className="p-0">
          {isLoading ? (
            <div className="p-6 space-y-3">
              {[...Array(8)].map((_, i) => <Skeleton key={i} className="h-14 w-full" />)}
            </div>
          ) : logs.length === 0 ? (
            <div className="text-center py-16">
              <FileText className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No audit events found</h3>
              <p className="text-sm text-muted-foreground">Adjust filters to see results.</p>
            </div>
          ) : (
            <Table>
              <TableHeader className="bg-muted/50">
                <TableRow>
                  <TableHead>Timestamp</TableHead>
                  <TableHead>Actor</TableHead>
                  <TableHead>Action</TableHead>
                  <TableHead>Resource</TableHead>
                  <TableHead>Tenant</TableHead>
                  <TableHead>IP</TableHead>
                  <TableHead className="text-right">Details</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {logs.map((log) => (
                  <TableRow key={log.id} className="hover:bg-muted/30 cursor-pointer" onClick={() => { setSelectedLog(log); setIsDrawerOpen(true); }}>
                    <TableCell className="text-xs whitespace-nowrap">
                      <div className="flex items-center gap-1">
                        <Clock className="h-3 w-3 text-muted-foreground" />
                        {new Date(log.createdAt).toLocaleString()}
                      </div>
                    </TableCell>
                    <TableCell>
                      <div className="min-w-0">
                        <p className="text-sm font-medium truncate">{log.actorUserId || 'System'}</p>
                        <p className="text-xs text-muted-foreground flex items-center gap-1">
                          <Shield className="h-3 w-3" /> {log.actorRole}
                        </p>
                      </div>
                    </TableCell>
                    <TableCell><ActionBadge action={log.action} /></TableCell>
                    <TableCell>
                      <div className="text-xs">
                        <p className="font-medium">{log.resourceType}</p>
                        {log.resourceId && <p className="text-muted-foreground font-mono truncate max-w-[100px]">{log.resourceId.slice(0, 8)}...</p>}
                      </div>
                    </TableCell>
                    <TableCell className="text-xs">
                      {log.tenantId || <span className="text-muted-foreground italic">Platform</span>}
                    </TableCell>
                    <TableCell className="text-xs font-mono text-muted-foreground">
                      {log.ipAddress || '—'}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon">
                        <Eye className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          )}

          {/* Pagination */}
          {!isLoading && logs.length > 0 && (
            <div className="flex items-center justify-between px-6 py-4 border-t">
              <p className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages} • {totalLogs.toLocaleString()} total events
              </p>
              <div className="flex gap-2">
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.max(0, p - 1))} disabled={page === 0 || isFetching}>
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <Button variant="outline" size="sm" onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1 || isFetching}>
                  Next <ChevronRight className="h-4 w-4 ml-1" />
                </Button>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* ── Log Detail Drawer ── */}
      <Sheet open={isDrawerOpen} onOpenChange={setIsDrawerOpen}>
        <SheetContent className="w-full sm:max-w-lg overflow-y-auto">
          {selectedLog && (
            <>
              <SheetHeader>
                <SheetTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-primary" /> Audit Event Details
                </SheetTitle>
                <SheetDescription>
                  Event ID: <span className="font-mono text-xs">{selectedLog.id}</span>
                </SheetDescription>
              </SheetHeader>
              <div className="space-y-6 mt-6">
                <div className="flex items-center justify-between p-3 rounded-lg bg-muted">
                  <span className="text-sm font-medium">Action</span>
                  <ActionBadge action={selectedLog.action} />
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Actor</h3>
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
                    <DetailRow icon={User} label="Actor ID" value={selectedLog.actorUserId || 'System'} mono />
                    <DetailRow icon={Shield} label="Role" value={selectedLog.actorRole} />
                    <DetailRow icon={Fingerprint} label="User ID" value={selectedLog.actorUserId} mono />
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Target Resource</h3>
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
                    <DetailRow icon={Database} label="Type" value={selectedLog.resourceType} />
                    {selectedLog.resourceId && <DetailRow icon={Info} label="Resource ID" value={selectedLog.resourceId} mono />}
                    {selectedLog.tenantId && <DetailRow icon={Lock} label="Tenant ID" value={selectedLog.tenantId} mono />}
                  </div>
                </div>

                <div>
                  <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Request Context</h3>
                  <div className="bg-muted/50 rounded-lg p-3 space-y-2 text-sm">
                    <DetailRow icon={Clock} label="Timestamp" value={new Date(selectedLog.createdAt).toLocaleString()} />
                    {selectedLog.ipAddress && <DetailRow icon={Info} label="IP Address" value={selectedLog.ipAddress} mono />}
                    {selectedLog.requestId && <DetailRow icon={Info} label="Request ID" value={selectedLog.requestId} mono />}
                    {selectedLog.userAgent && <DetailRow icon={Info} label="User Agent" value={selectedLog.userAgent} />}
                  </div>
                </div>

                {selectedLog.delta && (
                  <div>
                    <h3 className="text-xs font-semibold text-muted-foreground uppercase mb-2">Change Delta</h3>
                    <pre className="text-xs bg-muted p-3 rounded-lg overflow-x-auto">
                      {(() => { try { return JSON.stringify(JSON.parse(selectedLog.delta!), null, 2); } catch { return selectedLog.delta; } })()}
                    </pre>
                  </div>
                )}
              </div>
            </>
          )}
        </SheetContent>
      </Sheet>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────
function DetailRow({ icon: Icon, label, value, mono = false }: { icon: React.ElementType; label: string; value: string; mono?: boolean }) {
  return (
    <div className="flex items-start gap-2">
      <Icon className="h-3.5 w-3.5 text-muted-foreground mt-0.5 flex-shrink-0" />
      <div className="flex-1 min-w-0">
        <p className="text-[11px] text-muted-foreground uppercase tracking-wide">{label}</p>
        <p className={`text-sm break-all ${mono ? 'font-mono text-xs' : ''}`}>{value}</p>
      </div>
    </div>
  );
}
