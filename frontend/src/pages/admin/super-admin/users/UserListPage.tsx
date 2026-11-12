import { useState, useEffect, useMemo, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { errorMessage } from '@/lib/error-message';
import {
  Users,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Ban,
  CheckCircle,
  Mail,
  Building,
  Loader2,
  AlertCircle,
  Plus,
  ChevronLeft,
  ChevronRight,
  Filter,
  Download,
  RefreshCw,
  MoreHorizontal,
  UserCog,
  UserPlus,
  KeyRound,
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
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
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
import { Skeleton } from '@/components/ui/skeleton';

// ─────────────────────────────────────────────────────────────
// Types & Schemas
// ─────────────────────────────────────────────────────────────
const PAGE_SIZE = 15;

interface AdminUser {
  firebaseUid: string;
  email: string;
  fullName: string;
  role: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  tenantId: string | null;
  tenantName: string | null;
  createdAt: string;
  lastLoginAt: string | null;
  permissions?: string[];
}

interface PaginatedResponse<T> {
  content: T[];
  total: number;
  page: number;
  size: number;
}

const roleSchema = z.object({
  role: z.enum([
    'TENANT_ADMIN',
    'MANAGER',
    'PROVIDER',
    'CLINICIAN',
    'RECEPTION',
    'RECEPTIONIST',
    'STAFF',
    'FINANCE',
    'CONSENT_MANAGER',
    'PRIVACY_OFFICER',
  ]),
});

type RoleFormValues = z.infer<typeof roleSchema>;

const ROLE_BADGES: Record<string, { label: string; color: string; icon: React.ElementType }> = {
  SUPER_ADMIN: { label: 'Super Admin', color: 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200', icon: ShieldAlert },
  TENANT_ADMIN: { label: 'Tenant Admin', color: 'bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200', icon: ShieldCheck },
  MANAGER: { label: 'Manager', color: 'bg-sky-100 text-sky-800 dark:bg-sky-900 dark:text-sky-200', icon: UserCog },
  PROVIDER: { label: 'Provider', color: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200', icon: Shield },
  CLINICIAN: { label: 'Clinician', color: 'bg-teal-100 text-teal-800 dark:bg-teal-900 dark:text-teal-200', icon: Shield },
  RECEPTION: { label: 'Reception', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200', icon: Users },
  RECEPTIONIST: { label: 'Receptionist', color: 'bg-cyan-100 text-cyan-800 dark:bg-cyan-900 dark:text-cyan-200', icon: Users },
  STAFF: { label: 'Staff', color: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200', icon: Users },
  FINANCE: { label: 'Finance', color: 'bg-amber-100 text-amber-800 dark:bg-amber-900 dark:text-amber-200', icon: Shield },
  CONSENT_MANAGER: { label: 'Consent Manager', color: 'bg-rose-100 text-rose-800 dark:bg-rose-900 dark:text-rose-200', icon: Shield },
  PRIVACY_OFFICER: { label: 'Privacy Officer', color: 'bg-pink-100 text-pink-800 dark:bg-pink-900 dark:text-pink-200', icon: Shield },
};

const STATUS_BADGES: Record<string, string> = {
  ACTIVE: 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200',
  SUSPENDED: 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200',
  DELETED: 'bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200',
};

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export default function UserListPage() {
  const queryClient = useQueryClient();
  const [page, setPage] = useState(0);
  const [search, setSearch] = useState('');
  const [debouncedSearch, setDebouncedSearch] = useState('');
  const [roleFilter, setRoleFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  const [tenantFilter, setTenantFilter] = useState('');

  // Modals State
  const [selectedUser, setSelectedUser] = useState<AdminUser | null>(null);
  const [isRoleModalOpen, setIsRoleModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);

  // Debounce Search
  useEffect(() => {
    const timer = setTimeout(() => {
      setDebouncedSearch(search);
      setPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [search]);

  // Fetch Tenants for Filter
  const { data: tenantsData } = useQuery({
    queryKey: ['admin-tenants-options'],
    queryFn: () => adminTenantsApi.listForSelection(),
    staleTime: 1000 * 60 * 10,
  });

  // Fetch Users
  const {
    data: usersData,
    isLoading,
    isError,
    error,
    refetch,
    isFetching,
  } = useQuery({
    queryKey: ['admin-users', page, debouncedSearch, roleFilter, statusFilter, tenantFilter],
    queryFn: async () => {
      const params = new URLSearchParams({
        page: page.toString(),
        size: PAGE_SIZE.toString(),
      });
      if (debouncedSearch) params.append('search', debouncedSearch);
      if (roleFilter) params.append('role', roleFilter);
      if (statusFilter) params.append('status', statusFilter);
      if (tenantFilter) params.append('tenantId', tenantFilter);

      const response = await api.get(`/api/v1/admin/users?${params.toString()}`);
      const body = response.data as { data?: PaginatedResponse<AdminUser>; content?: AdminUser[] };
      return normalizePage((body.data ?? body) as PaginatedResponse<AdminUser>);
    },
  });

  const users = usersData?.content || [];
  const totalUsers = usersData?.total || 0;
  const totalPages = Math.max(1, Math.ceil(totalUsers / PAGE_SIZE));

  // ── Status Toggle Mutation ──
  const statusMutation = useMutation({
    mutationFn: ({ user, status }: { user: AdminUser; status: 'ACTIVE' | 'SUSPENDED' }) =>
      api.patch(`/api/v1/admin/users/${encodeURIComponent(user.firebaseUid)}/status`, { status }, {
        params: user.tenantId ? { tenantId: user.tenantId } : undefined,
      }),
    onSuccess: () => {
      toast.success('User status updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setIsStatusModalOpen(false);
      setSelectedUser(null);
    },
    onError: (err: unknown) => {
      toast.error(errorMessage(err, 'Failed to update user status.'));
    },
  });

  // ── Role Change Mutation ──
  const roleForm = useForm<RoleFormValues>({
    resolver: zodResolver(roleSchema),
  });

  const roleMutation = useMutation({
    mutationFn: (values: RoleFormValues) => {
      if (!selectedUser) throw new Error('Select a user first');
      if (!selectedUser.tenantId) throw new Error('Platform role changes require an explicit tenant assignment');
      return api.patch(`/api/v1/admin/users/${encodeURIComponent(selectedUser.firebaseUid)}/role`, {
        ...values,
        tenantId: selectedUser.tenantId,
        permissions: selectedUser.permissions ?? [],
      });
    },
    onSuccess: () => {
      toast.success('User role updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      setIsRoleModalOpen(false);
      setSelectedUser(null);
      roleForm.reset();
    },
    onError: (err: unknown) => {
      toast.error(errorMessage(err, 'Failed to update user role.'));
    },
  });

  const handleOpenRoleModal = (user: AdminUser) => {
    setSelectedUser(user);
    if (user.role === 'ADMIN') roleForm.reset();
    else roleForm.setValue('role', user.role as RoleFormValues['role']);
    setIsRoleModalOpen(true);
  };

  const handleOpenStatusModal = (user: AdminUser) => {
    setSelectedUser(user);
    setIsStatusModalOpen(true);
  };

  const handleExportCsv = useCallback(() => {
    if (users.length === 0) return;
    const headers = ['Firebase UID', 'Name', 'Email', 'Role', 'Status', 'Tenant', 'Joined'];
    const rows = users.map((u) => [
      u.firebaseUid,
      u.fullName,
      u.email,
      u.role,
      u.status,
      u.tenantName || 'Platform',
      new Date(u.createdAt).toLocaleDateString(),
    ]);
    const csv = [headers, ...rows].map((r) => r.map((c) => `"${c}"`).join(',')).join('\n');
    const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `caresync-users-${new Date().toISOString().slice(0, 10)}.csv`;
    link.click();
    URL.revokeObjectURL(url);
  }, [users]);

  // ───────────────────────────────────────────────
  // Render Helpers
  // ───────────────────────────────────────────────
  const RoleBadge = ({ role }: { role: string }) => {
    const meta = ROLE_BADGES[role] || ROLE_BADGES.STAFF;
    const Icon = meta.icon;
    return (
      <Badge variant="outline" className={`${meta.color} border-none flex items-center gap-1 w-fit`}>
        <Icon className="h-3 w-3" />
        {meta.label}
      </Badge>
    );
  };

  const StatusBadge = ({ status }: { status: string }) => (
    <Badge variant="outline" className={`${STATUS_BADGES[status]} border-none`}>
      {status}
    </Badge>
  );

  if (isError) {
    return (
      <Alert variant="destructive" className="m-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Users</AlertTitle>
        <AlertDescription>
          {error?.message || 'Could not retrieve users. Please try again.'}
        </AlertDescription>
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
            Platform User Directory
          </h1>
          <p className="text-muted-foreground mt-1">
            Manage all accounts, roles, and access permissions across every tenant.
          </p>
        </div>
        <div className="flex flex-wrap items-center gap-2">
          <Button variant="outline" onClick={handleExportCsv} disabled={users.length === 0}>
            <Download className="mr-2 h-4 w-4" /> Export CSV
          </Button>
          <Button variant="outline" onClick={() => refetch()} disabled={isFetching}>
            <RefreshCw className={`mr-2 h-4 w-4 ${isFetching ? 'animate-spin' : ''}`} /> Refresh
          </Button>
          <Button asChild>
            <Link to="/admin/super/users/create">
              <Plus className="mr-2 h-4 w-4" /> Provision User
            </Link>
          </Button>
        </div>
      </div>

      {/* Filters Toolbar */}
      <Card>
        <CardContent className="p-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
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
              {Object.keys(ROLE_BADGES).map((r) => (
                <SelectItem key={r} value={r}>{ROLE_BADGES[r].label}</SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Select value={statusFilter} onValueChange={(v) => { setStatusFilter(v === 'ALL' ? '' : v); setPage(0); }}>
            <SelectTrigger><SelectValue placeholder="All Statuses" /></SelectTrigger>
            <SelectContent>
              <SelectItem value="ALL">All Statuses</SelectItem>
              <SelectItem value="ACTIVE">Active</SelectItem>
              <SelectItem value="SUSPENDED">Suspended</SelectItem>
              <SelectItem value="DELETED">Deleted</SelectItem>
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

      {/* Users Table */}
      <Card>
        <CardHeader className="pb-4">
          <CardTitle className="text-lg">Users ({totalUsers})</CardTitle>
          <CardDescription>Manage individual user accounts and their platform access.</CardDescription>
        </CardHeader>
        <CardContent>
          {isLoading ? (
            <div className="space-y-3">
              {[...Array(5)].map((_, i) => (
                <Skeleton key={i} className="h-16 w-full" />
              ))}
            </div>
          ) : users.length === 0 ? (
            <div className="text-center py-12">
              <Users className="mx-auto h-12 w-12 text-muted-foreground/50" />
              <h3 className="mt-4 text-lg font-medium">No users found</h3>
              <p className="text-sm text-muted-foreground">Try adjusting your search or filters.</p>
            </div>
          ) : (
            <div className="overflow-x-auto rounded-md border">
              <Table>
                <TableHeader className="bg-muted/50">
                  <TableRow>
                    <TableHead>User</TableHead>
                    <TableHead>Role</TableHead>
                    <TableHead>Tenant</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Joined</TableHead>
                    <TableHead className="text-right">Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {users.map((user) => (
                    <TableRow key={user.firebaseUid} className="hover:bg-muted/30">
                      <TableCell>
                        <div className="flex items-center gap-3">
                          <div className="h-9 w-9 rounded-full bg-primary/10 text-primary flex items-center justify-center font-bold text-sm">
                            {(user.fullName || user.email).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <p className="font-medium text-sm">{user.fullName || 'Unnamed User'}</p>
                            <p className="text-xs text-muted-foreground">{user.email}</p>
                          </div>
                        </div>
                      </TableCell>
                      <TableCell><RoleBadge role={user.role} /></TableCell>
                      <TableCell>
                        {user.tenantName ? (
                          <span className="flex items-center gap-1 text-sm text-muted-foreground">
                            <Building className="h-3 w-3" /> {user.tenantName}
                          </span>
                        ) : (
                          <span className="text-xs italic text-muted-foreground">Platform Level</span>
                        )}
                      </TableCell>
                      <TableCell><StatusBadge status={user.status} /></TableCell>
                      <TableCell className="text-sm text-muted-foreground">
                        {new Date(user.createdAt).toLocaleDateString()}
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
                            <DropdownMenuItem asChild>
                              <Link to={`/admin/super/users/${user.firebaseUid}`}>
                                <UserCog className="mr-2 h-4 w-4" /> View Details
                              </Link>
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleOpenRoleModal(user)}>
                              <Shield className="mr-2 h-4 w-4" /> Change Role
                            </DropdownMenuItem>
                            <DropdownMenuSeparator />
                            <DropdownMenuItem
                              onClick={() => handleOpenStatusModal(user)}
                              className={user.status === 'ACTIVE' ? 'text-destructive' : 'text-emerald-600'}
                            >
                              {user.status === 'ACTIVE' ? (
                                <><Ban className="mr-2 h-4 w-4" /> Suspend Account</>
                              ) : (
                                <><CheckCircle className="mr-2 h-4 w-4" /> Activate Account</>
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
                Page {page + 1} of {totalPages} • {totalUsers} total users
              </p>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.max(0, p - 1))}
                  disabled={page === 0 || isFetching}
                >
                  <ChevronLeft className="h-4 w-4 mr-1" /> Previous
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  onClick={() => setPage((p) => Math.min(totalPages - 1, p + 1))}
                  disabled={page >= totalPages - 1 || isFetching}
                >
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
              This will immediately alter their access permissions.
            </DialogDescription>
          </DialogHeader>
          <form onSubmit={roleForm.handleSubmit((v) => roleMutation.mutate(v))} className="space-y-4 py-4">
            <div className="space-y-2">
              <Label htmlFor="role">New Role</Label>
              {selectedUser?.role === 'ADMIN' && <p className="text-sm text-amber-700">Legacy ADMIN access is blocked pending review. Choose the verified role and tenant for this account.</p>}
              <Select
                value={roleForm.watch('role')}
                onValueChange={(v) => roleForm.setValue('role', v as RoleFormValues['role'])}
              >
                <SelectTrigger><SelectValue placeholder="Select a role" /></SelectTrigger>
                <SelectContent>
                  {Object.keys(ROLE_BADGES).map((r) => (
                    <SelectItem key={r} value={r}>{ROLE_BADGES[r].label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => setIsRoleModalOpen(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={roleMutation.isPending}>
                {roleMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                Save Changes
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>

      {/* ── Status Confirmation Modal ── */}
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
                  This user will immediately lose access to the platform.
                </span>
              )}
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsStatusModalOpen(false)}>
              Cancel
            </Button>
            <Button
              variant={selectedUser?.status === 'ACTIVE' ? 'destructive' : 'default'}
              onClick={() => {
                if (!selectedUser) return;
                statusMutation.mutate({
                  user: selectedUser,
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
