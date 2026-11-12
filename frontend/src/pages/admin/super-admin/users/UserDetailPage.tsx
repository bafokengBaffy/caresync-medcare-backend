import { useEffect, useState } from 'react';
import { Link, useParams } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminTenantsApi } from '@/api/admin-tenants';
import { adminUsersApi } from '@/api/admin-users';

const platformRoles = [
  'TENANT_ADMIN',
  'MANAGER',
  'STAFF',
  'RECEPTION',
  'RECEPTIONIST',
  'FINANCE',
  'CONSENT_MANAGER',
  'PRIVACY_OFFICER',
];

export default function UserDetailPage() {
  const { userId = '' } = useParams();
  const queryClient = useQueryClient();
  const userQuery = useQuery({
    queryKey: ['admin-user', userId],
    queryFn: () => adminUsersApi.getUser(userId),
    enabled: Boolean(userId),
  });
  const tenantsQuery = useQuery({
    queryKey: ['admin-tenants', 'user-detail'],
    queryFn: adminTenantsApi.listForSelection,
  });
  const user = userQuery.data;
  const [role, setRole] = useState('');
  const [tenantId, setTenantId] = useState('');
  const [permissionsText, setPermissionsText] = useState('');

  useEffect(() => {
    if (!user) return;
    setRole(user.role);
    setTenantId(user.tenantId ?? '');
    setPermissionsText(user.permissions.join(', '));
  }, [user]);

  const updateRoleMutation = useMutation({
    mutationFn: () => adminUsersApi.updateUserRole(
      userId,
      role,
      tenantId || null,
      permissionsText.split(',').map((permission) => permission.trim()).filter(Boolean),
    ),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-user', userId] }),
        queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
      ]);
      toast.success('Role and permissions updated');
    },
  });
  const updateStatusMutation = useMutation({
    mutationFn: (status: 'ACTIVE' | 'SUSPENDED') => adminUsersApi.updateUserStatus(
      userId,
      status,
      user?.tenantId,
    ),
    onSuccess: async () => {
      await Promise.all([
        queryClient.invalidateQueries({ queryKey: ['admin-user', userId] }),
        queryClient.invalidateQueries({ queryKey: ['admin-users'] }),
      ]);
    },
  });
  const availableRoles = user && !platformRoles.includes(user.role)
    ? [...platformRoles, user.role]
    : platformRoles;

  if (userQuery.isLoading) return <main className="p-6" role="status">Loading user...</main>;
  if (userQuery.isError || !user) {
    return <main className="space-y-4 p-6"><p className="text-red-700" role="alert">User could not be loaded. {userQuery.error?.message}</p><Link className="text-blue-700 underline" to="/admin/super/users">Back to users</Link></main>;
  }

  return (
    <main className="mx-auto max-w-3xl space-y-6 p-6">
      <header>
        <Link className="text-sm text-blue-700 underline" to="/admin/super/users">Back to users</Link>
        <h1 className="mt-3 text-2xl font-semibold">{user.fullName || user.email}</h1>
        <p className="text-slate-600 dark:text-slate-300">{user.email} · {user.firebaseUid}</p>
      </header>

      <section className="space-y-4 rounded border p-5">
        <h2 className="text-lg font-medium">Account status</h2>
        <p>Current status: <strong>{user.status}</strong></p>
        {user.status !== 'DELETED' && (
          <button
            className="rounded border px-3 py-2 disabled:opacity-50"
            disabled={updateStatusMutation.isPending}
            onClick={() => updateStatusMutation.mutate(user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE')}
            type="button"
          >{user.status === 'ACTIVE' ? 'Suspend account' : 'Reactivate account'}</button>
        )}
      </section>

      <form className="space-y-4 rounded border p-5" onSubmit={(event) => { event.preventDefault(); updateRoleMutation.mutate(); }}>
        <h2 className="text-lg font-medium">Role and permissions</h2>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Role</span>
          <select className="w-full rounded border px-3 py-2" onChange={(event) => setRole(event.target.value)} value={role}>
            {availableRoles.map((value) => <option key={value} value={value} disabled={value === 'ADMIN'}>{value === 'ADMIN' ? 'Legacy ADMIN (review required)' : value}</option>)}
          </select>
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Tenant</span>
          <select className="w-full rounded border px-3 py-2" onChange={(event) => setTenantId(event.target.value)} required value={tenantId}>
            <option value="">Select a tenant</option>
            {(tenantsQuery.data?.content ?? []).map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.name}</option>)}
          </select>
          {tenantsQuery.isError && <span className="text-sm text-red-700">Tenants could not be loaded. {tenantsQuery.error.message}</span>}
        </label>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Permission overrides</span>
          <textarea
            className="min-h-24 w-full rounded border px-3 py-2"
            onChange={(event) => setPermissionsText(event.target.value)}
            placeholder="PERMISSION_ONE, PERMISSION_TWO"
            value={permissionsText}
          />
          <span className="text-xs text-slate-600 dark:text-slate-300">Comma-separated permission codes; leave blank for no overrides.</span>
        </label>
        {user.role === 'ADMIN' && <p className="text-amber-700" role="note">Legacy ADMIN access has been denied. Choose a verified tenant role before saving this account.</p>}
        {updateRoleMutation.isError && <p className="text-red-700" role="alert">Role was not updated. {updateRoleMutation.error.message}</p>}
        {updateRoleMutation.isSuccess && <p className="text-green-700" role="status">Role and permissions updated.</p>}
        {updateStatusMutation.isError && <p className="text-red-700" role="alert">Status was not updated. {updateStatusMutation.error.message}</p>}
        <button className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50" disabled={user.role === 'SUPER_ADMIN' || updateRoleMutation.isPending || !tenantId} type="submit">
          {updateRoleMutation.isPending ? 'Saving...' : 'Save role and permissions'}
        </button>
      </form>

      <dl className="grid gap-3 rounded border p-5 text-sm md:grid-cols-2">
        <div><dt className="text-slate-600 dark:text-slate-300">Tenant ID</dt><dd>{user.tenantId ?? 'Platform'}</dd></div>
        <div><dt className="text-slate-600 dark:text-slate-300">Created</dt><dd>{new Date(user.createdAt).toLocaleString()}</dd></div>
      </dl>
    </main>
  );
}
