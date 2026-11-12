import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { ChevronLeft, ChevronRight, Download, RefreshCw, Search } from 'lucide-react';
import { tenantAuditApi, type TenantAuditLog } from '@/api/tenant-audit';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';
import { useAuthStore } from '@/stores/auth-store';
import { useTenantContextStore } from '@/stores/tenant-context-store';

const PAGE_SIZE = 50;

function csvCell(value: string | null | undefined) {
  return `"${(value ?? '').replaceAll('"', '""')}"`;
}

function exportCurrentPage(logs: TenantAuditLog[]) {
  if (logs.length === 0) return;
  const rows = [
    ['Timestamp', 'Actor', 'Role', 'Action', 'Resource type', 'Resource ID', 'Request ID'],
    ...logs.map((log) => [
      log.createdAt,
      log.actorUserId,
      log.actorRole,
      log.action,
      log.resourceType,
      log.resourceId,
      log.requestId,
    ]),
  ];
  const csv = rows.map((row) => row.map(csvCell).join(',')).join('\r\n');
  const url = URL.createObjectURL(new Blob([csv], { type: 'text/csv;charset=utf-8' }));
  const link = document.createElement('a');
  link.href = url;
  link.download = `caresync-audit-page-${new Date().toISOString().slice(0, 10)}.csv`;
  link.click();
  window.setTimeout(() => URL.revokeObjectURL(url), 0);
}

export default function AuditLogViewer({ title }: { title: string }) {
  const user = useAuthStore((state) => state.user);
  const selectedTenantId = useTenantContextStore((state) => state.selectedTenantId);
  const selectedForUid = useTenantContextStore((state) => state.selectedForUid);
  const tenantId = user?.role === 'SUPER_ADMIN'
    ? selectedForUid === user.uid ? selectedTenantId : null
    : user?.tenantId ?? null;
  const [page, setPage] = useState(0);
  const [filter, setFilter] = useState('');
  const logsQuery = useQuery({
    queryKey: ['tenant-audit-logs', tenantId, page],
    queryFn: () => tenantAuditApi.list(tenantId!, page, PAGE_SIZE),
    enabled: Boolean(tenantId),
  });
  const logs = logsQuery.data?.content ?? [];
  const visibleLogs = logs.filter((log) => {
    const query = filter.trim().toLowerCase();
    return !query || [
      log.actorUserId,
      log.actorRole,
      log.action,
      log.resourceType,
      log.resourceId,
      log.requestId,
    ].some((value) => value?.toLowerCase().includes(query));
  });
  const totalPages = Math.max(1, Math.ceil((logsQuery.data?.total ?? 0) / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Review and export activity recorded for the current tenant.
        </p>
      </div>

      {!tenantId ? (
        <Card>
          <CardContent className="py-8 text-sm text-muted-foreground">
            Select a tenant from the top bar to review its audit trail.
          </CardContent>
        </Card>
      ) : (
        <Card>
          <CardHeader className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle>Audit trail</CardTitle>
              <CardDescription>
                {logsQuery.data ? `${logsQuery.data.total} recorded events` : 'Events are loaded securely for the selected tenant.'}
              </CardDescription>
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <input
                  aria-label="Filter this audit page"
                  className="h-9 w-56 rounded-md border bg-background pl-9 pr-3 text-sm"
                  onChange={(event) => setFilter(event.target.value)}
                  placeholder="Filter this page"
                  value={filter}
                />
              </label>
              <Button type="button" variant="outline" onClick={() => void logsQuery.refetch()} disabled={logsQuery.isFetching}>
                <RefreshCw className="mr-2 h-4 w-4" aria-hidden="true" />
                Refresh
              </Button>
              <Button type="button" variant="outline" onClick={() => exportCurrentPage(visibleLogs)} disabled={visibleLogs.length === 0}>
                <Download className="mr-2 h-4 w-4" aria-hidden="true" />
                Export page
              </Button>
            </div>
          </CardHeader>
          <CardContent>
            {logsQuery.isError ? (
              <div role="alert" className="rounded-md border border-destructive/30 p-4 text-sm text-destructive">
                Could not load audit events. Check your access and connection, then retry.
                <Button className="ml-3" type="button" variant="outline" size="sm" onClick={() => void logsQuery.refetch()}>
                  Retry
                </Button>
              </div>
            ) : logsQuery.isLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Loading audit events…</p>
            ) : visibleLogs.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">
                {logs.length ? 'No events match this page filter.' : 'No audit events have been recorded for this tenant.'}
              </p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Time</TableHead>
                    <TableHead>Actor</TableHead>
                    <TableHead>Action</TableHead>
                    <TableHead>Resource</TableHead>
                    <TableHead>Request ID</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {visibleLogs.map((log) => (
                    <TableRow key={log.id}>
                      <TableCell className="whitespace-nowrap">{new Date(log.createdAt).toLocaleString()}</TableCell>
                      <TableCell>
                        <div>{log.actorUserId || 'System'}</div>
                        <div className="text-xs text-muted-foreground">{log.actorRole || '—'}</div>
                      </TableCell>
                      <TableCell>{log.action}</TableCell>
                      <TableCell>{log.resourceType}{log.resourceId ? ` · ${log.resourceId}` : ''}</TableCell>
                      <TableCell className="max-w-40 truncate">{log.requestId || '—'}</TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            )}
            <div className="mt-4 flex items-center justify-between border-t pt-4 text-sm">
              <span className="text-muted-foreground">Page {page + 1} of {totalPages}</span>
              <div className="flex gap-2">
                <Button
                  aria-label="Previous page"
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page === 0 || logsQuery.isFetching}
                  onClick={() => setPage((current) => Math.max(0, current - 1))}
                >
                  <ChevronLeft className="h-4 w-4" aria-hidden="true" />
                </Button>
                <Button
                  aria-label="Next page"
                  type="button"
                  variant="outline"
                  size="sm"
                  disabled={page + 1 >= totalPages || logsQuery.isFetching}
                  onClick={() => setPage((current) => current + 1)}
                >
                  <ChevronRight className="h-4 w-4" aria-hidden="true" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
