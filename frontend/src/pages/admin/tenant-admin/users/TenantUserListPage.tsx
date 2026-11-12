import { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
  Users,
  Search,
  Plus,
  Loader2,
  AlertCircle,
  RefreshCw,
  ChevronLeft,
  ChevronRight,
  MoreHorizontal,
  UserCog,
  Ban,
  CheckCircle,
  Mail,
  Shield,
  ShieldCheck,
  Building2,
  X,
  Settings2,
} from 'lucide-react';

import api from '@/lib/api-client';
import { errorMessage } from '@/lib/error-message';
import { normalizePage } from '@/lib/pagination';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
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
  DialogFooter,
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
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';

// ─────────────────────────────────────────────────────────────
// Types & Schemas
// ─────────────────────────────────────────────────────────────
const PAGE_SIZE = 20;

interface TenantUser {
  firebaseUid: string;
  email: string;
  fullName: string;
  role: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  permissions: string[];
  createdAt: string;
  lastLoginAt: string | null;
}

interface PaginatedResponse<T> {
  content: T[];
  total: number;
  page: number;
  size: number;
}

const roleUpdateSchema = z.object({
  role: z.enum(['MANAGER', 'STAFF', 'RECEPTION', 'RECEPTIONIST', 'FINANCE', 'CONSENT_MANAGER', 'PRIVACY_OFFICER']),
});

type RoleUpdateFormValues = z.infer<typeof roleUpdateSchema>;

const ROLE_OPTIONS = ['MANAGER', 'STAFF', 'RECEPTION', 'RECEPTIONIST', 'FINANCE', 'CONSENT_MANAGER', 'PRIVACY_OFFICER'] as const;

const ROLE_BADGES: Record<string, string> = {
  MANAGER: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200',
  STAFF: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
  RECEPTION: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  RECEPTIONIST: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200',
  FINANCE: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200',
  CONSENT_MANAGER: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200',
  PRIVACY_OFFICER: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200',
};

const STATUS_BADGES: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  SUSPENDED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  DELETED: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
};

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
export default function TenantUserListPage() {
  const user = useAuthStore((state) => state.user);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [selectedUser, setSelectedUser] = useState<TenantUser | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  // Debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch Users
  const {
    data,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['tenant-users', user?.tenantId, page, debouncedSearch, statusFilter, roleFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        size: PAGE_SIZE.toString(),
      });
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (statusFilter) params.append('status', statusFilter);
      if (roleFilter) params.append('role', roleFilter);

      const response = await api.get(`/api/v1/admin/users?${params.toString()}`);
      const body = response.data as { data?: PaginatedResponse<TenantUser>; content?: TenantUser[] };
      return normalizePage((body.data ?? body) as PaginatedResponse<TenantUser>);
    },
    enabled: !!user?.tenantId,
  });

  const users = data?.content || [];
  const total = data?.total || 0;
  const totalPages = Math.max(1, Math.ceil(total / PAGE_SIZE));

  // Status Toggle
  const statusMutation = useMutation({
    mutationFn: ({ firebaseUid, status }: { firebaseUid: string; status: 'ACTIVE' | 'SUSPENDED' }) =>
      api.patch(`/api/v1/admin/users/${firebaseUid}/status`, { status }),
    onSuccess: () => {
      toast.success('User status updated.');
      queryClient.invalidateQueries({ queryKey: ['tenant-users'] });
      setIsStatusModalOpen(false);
      setSelectedUser(null);
    },
    onError: (err: unknown) => {
      toast.error(errorMessage(err, 'Failed to update status.'));
    },
  });

  // Role Update
  const roleForm = useForm<RoleUpdateFormValues>({
    resolver: zodResolver(roleUpdateSchema),
  });

  const roleMutation = useMutation({
    mutationFn: (values: RoleUpdateFormValues) =>
      api.patch(`/api/v1/admin/users/${selectedUser?.firebaseUid}/role`, {
        ...values,
        tenantId: user?.tenantId,
        permissions: selectedUser?.permissions ?? [],
      }),
    onSuccess: () => {
      toast.success('User role updated.');
      queryClient.invalidateQueries({ queryKey: ['tenant-users'] });
      setIsRoleModalOpen(false);
      setSelectedUser(null);
    },
    onError: (err: unknown) => {
      toast.error(errorMessage(err, 'Failed to update role.'));
    },
  });

  const handleOpenRoleModal = (user: TenantUser) => {
    setSelectedUser(user);
    roleForm.setValue('role', user.role as RoleUpdateFormValues['role']);
    setIsRoleModalOpen(true);
  };

  const handleOpenStatusModal = (user: TenantUser) => {
    setSelectedUser(user);
    setIsStatusModalOpen(true);
  };

  const RoleBadge = ({ role }: { role: string }) => (
    <Badge variant="outline" className={`${ROLE_BADGES[role] || ROLE_BADGES.STAFF} border-none`}>
      {role.replace(/_/g, ' ')}
    </Badge>
  );

  const StatusBadge = ({ status }: { status: string }) => (
    <Badge variant="outline" className={`${STATUS_BADGES[status] || ''} border-none`}>
      {status}
    </Badge>
  );

  if (!user?.tenantId) {
    return (
      <Alert variant="destructive" className="m-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Tenant Assigned</AlertTitle>
        <AlertDescription>Your account is not associated with a tenant.</AlertDescription>
      </Alert>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive" className="m-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Users</AlertTitle>
        <AlertDescription>{error?.message || 'Could not load tenant users.'}</AlertDescription>
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
            <Users className="h-8 w-8 text-primary" />
            Tenant Users
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage your clinic's staff accounts and access permissions.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button asChild>
            <Link to="/admin/tenant/users/new">
              <Plus className="mr-2 h-4 w-4" /> Add User
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters */}
      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-3 gap-3">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search by name, email, or UID..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="pl-9"
            />
          </div>
          <Select value={roleFilter} onValueChange={(v) => { setRoleFilter(v === 'ALL' ? '' : v); setPage(0); }}>
            <SelectTrigger><SelectValue placeholder="All Roles" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Roles</SelectItem>
              {ROLE_OPTIONS.map((r) => (
                <SelectItem key={r} value={r}>{r.replace(/_/g, ' ')}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'ALL' ? '' : v); setPage(0); }}>
            <SelectTrigger><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
            </SelectContent>
          </Select>
        </CardContent>
      </Card>

      {/* Table */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base">Staff Directory ({total})</CardTitle>
          <CardDescription>All users provisioned into your tenant.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => <Skeleton key={i} className="h-16 w-full" />)}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-16">
              <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No users found</h3>
              <p className="text-sm text-muted-foreground">Try adjusting filters or add a new user.</p>
            </div>
          ) : (
            <div className="rounded-md border overflow-x-auto">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Last Login</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((u) => (
                    <TableRow key={u.firebaseUid} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                            {(u.fullName || u.email).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{u.fullName || 'Unnamed User'}</p>
                            <p className="text-xs text-muted-foreground">{u.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><RoleBadge role={u.role} /></TableCell>
                      <TableCell><StatusBadge status={u.status} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {u.lastLoginAt ? new Date(u.lastLoginAt).toLocaleDateString() : 'Never'}
                      </TableCell>
                      <TableCell className="text-right">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="icon">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuLabel>Actions</DropdownMenuLabel>
                            <DropdownMenuItem onClick={() => navigate(`/admin/tenant/users/${u.firebaseUid}`)}>
                              <UserCog className="mr-2 h-4 w-4" /> Manage User
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenRoleModal(u)}>
                              <Shield className="mr-2 h-4 w-4" /> Change Role
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleOpenStatusModal(u)}
                              className={u.status === 'ACTIVE' ? 'text-destructive' : 'text-emerald-600'}
                            >
                              {u.status === 'ACTIVE' ? (
                                <><Ban className="mr-2 h-4 w-4" /> Suspend</>
                              ) : (
                                <><CheckCircle className="mr-2 h-4 w-4" /> Activate</>
                              )}
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </TableCell>
                    </TableRow>
                  ))}
                </TableBody>
              </Table>
            </div>
          )}

          {/* Pagination */}
          {!isLoading && users.length > 0 && (
            <div className="flex items-center justify-between mt-4">
              <p className="text-sm text-muted-foreground">
                Page {page + 1} of {totalPages} • {total} total users
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

      {/* ── Role Change Modal ── */}
      <Dialog open={isRoleModalOpen} onOpenChange={setIsRoleModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>Change User Role</DialogTitle>
            <DialogDescription>
              Update the role for <strong>{selectedUser?.fullName || selectedUser?.email}</strong>.
              <br />
              <span className="text-xs text-muted-foreground mt-1 inline-block">
                Note: Provider and Clinician roles require a provider record link. Manage those through Super Admin.
              </span>
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={roleForm.handleSubmit((v) => roleMutation.mutate(v))} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label>New Role</Label>
              <Select value={roleForm.watch('role')} onValueChange={(v) => roleForm.setValue('role', v as RoleUpdateFormValues['role'])}>
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r} value={r}>{r.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsRoleModalOpen(false)}>Cancel</Button>
              <Button type="submit" disabled={roleMutation.isPending}>
                {roleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Status Modal ── */}
      <Dialog open={isStatusModalOpen} onOpenChange={setIsStatusModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle>
              {selectedUser?.status === 'ACTIVE' ? 'Suspend' : 'Activate'} Account
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to {selectedUser?.status === 'ACTIVE' ? 'suspend' : 'activate'}{' '}
              <strong>{selectedUser?.fullName || selectedUser?.email}</strong>?
              {selectedUser?.status === 'ACTIVE' && (
                <span className="block mt-2 text-destructive">
                  This user will immediately lose access to the tenant.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusModalOpen(false)}>Cancel</Button>
            <Button
              variant={selectedUser?.status === 'ACTIVE' ? 'destructive' : 'default'}
              onClick={() => {
                if (!selectedUser) return;
                statusMutation.mutate({
                  firebaseUid: selectedUser.firebaseUid,
                  status: selectedUser.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE',
                });
              }}
              disabled={statusMutation.isPending}
            >
              {statusMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
