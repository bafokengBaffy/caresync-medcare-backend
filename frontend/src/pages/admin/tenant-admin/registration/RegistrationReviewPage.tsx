import { Fragment, useState } from 'react';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { Link } from 'react-router-dom';
import { Search } from 'lucide-react';
import { toast } from 'sonner';
import { adminRegistrationApi } from '@/api/admin-registration';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from '@/components/ui/table';

const PAGE_SIZE = 25;

export default function RegistrationReviewPage({
  title,
  tenantId,
}: {
  title: string;
  tenantId?: string;
}) {
  const queryClient = useQueryClient();
  const [status, setStatus] = useState('PENDING');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);
  const [reviewingId, setReviewingId] = useState<string | null>(null);
  const [patientId, setPatientId] = useState('');
  const [reason, setReason] = useState('');
  const requestsQuery = useQuery({
    queryKey: ['tenant-registration-requests', tenantId, status, search, page],
    queryFn: () => adminRegistrationApi.list({
      tenantId: tenantId!,
      status,
      search: search || undefined,
      page,
      size: PAGE_SIZE,
    }),
    enabled: Boolean(tenantId),
  });
  const refreshRequests = async () => {
    await queryClient.invalidateQueries({ queryKey: ['tenant-registration-requests', tenantId] });
    setReviewingId(null);
    setPatientId('');
    setReason('');
  };
  const approve = useMutation({
    mutationFn: () => adminRegistrationApi.approve(reviewingId!, tenantId!, patientId.trim()),
    onSuccess: async () => {
      toast.success('Registration approved');
      await refreshRequests();
    },
  });
  const reject = useMutation({
    mutationFn: () => adminRegistrationApi.reject(reviewingId!, tenantId!, reason.trim()),
    onSuccess: async () => {
      toast.success('Registration rejected');
      await refreshRequests();
    },
  });
  const requests = requestsQuery.data?.content ?? [];
  const totalPages = Math.max(1, Math.ceil((requestsQuery.data?.total ?? 0) / PAGE_SIZE));

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">{title}</h1>
        <p className="mt-1 text-sm text-muted-foreground">Review patient sign-up requests assigned to your tenant.</p>
      </div>
      {!tenantId ? (
        <p role="alert" className="rounded-md border border-destructive/30 p-4 text-sm text-destructive">
          Your account is not associated with a tenant.
        </p>
      ) : (
        <Card>
          <CardHeader>
            <CardTitle>Patient registrations</CardTitle>
            <CardDescription>{requestsQuery.data ? `${requestsQuery.data.total} matching requests` : 'Approve requests only after linking a patient record.'}</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="mb-4 flex flex-wrap gap-3">
              <label className="relative block min-w-56 flex-1">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden="true" />
                <input
                  aria-label="Search registration requests"
                  className="h-10 w-full rounded-md border bg-background pl-9 pr-3 text-sm"
                  placeholder="Search email or Firebase user ID"
                  value={search}
                  onChange={(event) => {
                    setSearch(event.target.value);
                    setPage(0);
                  }}
                />
              </label>
              <select
                aria-label="Registration status"
                className="h-10 rounded-md border bg-background px-3 text-sm"
                value={status}
                onChange={(event) => {
                  setStatus(event.target.value);
                  setPage(0);
                }}
              >
                <option value="PENDING">Pending</option>
                <option value="APPROVED">Approved</option>
                <option value="REJECTED">Rejected</option>
                <option value="ALL">All statuses</option>
              </select>
            </div>
            {requestsQuery.isError ? (
              <div role="alert" className="rounded-md border border-destructive/30 p-4 text-sm text-destructive">
                Could not load registration requests. Verify your permissions and retry.
                <Button className="ml-3" type="button" variant="outline" size="sm" onClick={() => void requestsQuery.refetch()}>Retry</Button>
              </div>
            ) : requestsQuery.isLoading ? (
              <p className="py-8 text-center text-sm text-muted-foreground">Loading registration requests…</p>
            ) : requests.length === 0 ? (
              <p className="py-8 text-center text-sm text-muted-foreground">No registration requests found.</p>
            ) : (
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Account</TableHead>
                    <TableHead>Requested role</TableHead>
                    <TableHead>Submitted</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead><span className="sr-only">Actions</span></TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {requests.map((request) => (
                    <Fragment key={request.id}>
                      <TableRow key={request.id}>
                        <TableCell>
                          <div className="font-medium">{request.email}</div>
                          <div className="text-xs text-muted-foreground">{request.firebaseUid}</div>
                        </TableCell>
                        <TableCell>{request.requestedRole}</TableCell>
                        <TableCell className="whitespace-nowrap">{new Date(request.submittedAt).toLocaleString()}</TableCell>
                        <TableCell>{request.status}</TableCell>
                        <TableCell className="text-right">
                          {request.status === 'PENDING' && (
                            <Button
                              type="button"
                              variant="outline"
                              size="sm"
                              onClick={() => {
                                setReviewingId((current) => current === request.id ? null : request.id);
                                setPatientId('');
                                setReason('');
                              }}
                            >
                              {reviewingId === request.id ? 'Close review' : 'Review'}
                            </Button>
                          )}
                        </TableCell>
                      </TableRow>
                      {reviewingId === request.id && request.status === 'PENDING' && (
                        <TableRow key={`${request.id}-review`}>
                          <TableCell colSpan={5}>
                            <div className="grid gap-3 rounded-md bg-muted/40 p-4 sm:grid-cols-2">
                              <label className="space-y-1 text-sm font-medium">
                                Patient record ID
                                <input
                                  required
                                  pattern="[0-9a-fA-F]{8}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{4}-[0-9a-fA-F]{12}"
                                  value={patientId}
                                  onChange={(event) => setPatientId(event.target.value)}
                                  className="h-10 w-full rounded-md border bg-background px-3 font-normal"
                                  placeholder="Required to approve"
                                />
                                <span className="block text-xs font-normal text-muted-foreground">
                                  Create or locate the patient record in <Link className="text-primary underline" to="/patients">Patients</Link>.
                                </span>
                              </label>
                              <label className="space-y-1 text-sm font-medium">
                                Rejection reason
                                <textarea
                                  maxLength={1000}
                                  value={reason}
                                  onChange={(event) => setReason(event.target.value)}
                                  className="min-h-10 w-full rounded-md border bg-background px-3 py-2 font-normal"
                                  placeholder="Required to reject"
                                />
                              </label>
                              <div className="flex flex-wrap gap-2 sm:col-span-2">
                                <Button type="button" disabled={!patientId.trim() || approve.isPending} onClick={() => approve.mutate()}>
                                  {approve.isPending ? 'Approving…' : 'Approve and link patient'}
                                </Button>
                                <Button type="button" variant="destructive" disabled={!reason.trim() || reject.isPending} onClick={() => reject.mutate()}>
                                  {reject.isPending ? 'Rejecting…' : 'Reject'}
                                </Button>
                                {(approve.isError || reject.isError) && (
                                  <p role="alert" className="basis-full text-sm text-destructive">
                                    The request could not be reviewed. Confirm the patient belongs to this tenant and retry.
                                  </p>
                                )}
                              </div>
                            </div>
                          </TableCell>
                        </TableRow>
                      )}
                    </Fragment>
                  ))}
                </TableBody>
              </Table>
            )}
            <div className="mt-4 flex items-center justify-between border-t pt-4 text-sm">
              <span className="text-muted-foreground">Page {page + 1} of {totalPages}</span>
              <div className="flex gap-2">
                <Button type="button" variant="outline" size="sm" disabled={page === 0 || requestsQuery.isFetching} onClick={() => setPage((value) => value - 1)}>Previous</Button>
                <Button type="button" variant="outline" size="sm" disabled={page + 1 >= totalPages || requestsQuery.isFetching} onClick={() => setPage((value) => value + 1)}>Next</Button>
              </div>
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
