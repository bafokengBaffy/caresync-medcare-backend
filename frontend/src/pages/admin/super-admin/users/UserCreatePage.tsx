import { useState, type FormEvent } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { adminTenantsApi } from '@/api/admin-tenants';
import { adminUsersApi } from '@/api/admin-users';
import type { FirebaseAccountLookup } from '@/types/admin-user';

const provisionableRoles = [
  'TENANT_ADMIN',
  'MANAGER',
  'STAFF',
  'RECEPTION',
  'RECEPTIONIST',
  'FINANCE',
  'CONSENT_MANAGER',
  'PRIVACY_OFFICER',
];

export default function UserCreatePage() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();
  const tenantsQuery = useQuery({
    queryKey: ['admin-tenants', 'user-provision'],
    queryFn: adminTenantsApi.listForSelection,
  });
  const [email, setEmail] = useState('');
  const [account, setAccount] = useState<FirebaseAccountLookup | null>(null);
  const [createNew, setCreateNew] = useState(false);
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [role, setRole] = useState('TENANT_ADMIN');
  const [tenantId, setTenantId] = useState('');
  const [lookupError, setLookupError] = useState('');
  const [lookupPending, setLookupPending] = useState(false);

  const provisionMutation = useMutation({
    mutationFn: () => {
      if (!account && !createNew) throw new Error('Find an existing Firebase account before provisioning.');
      if (!account && !email.trim()) throw new Error('Enter an email address for the new account.');
      if (!tenantId) throw new Error('Select a tenant for this role.');
      return adminUsersApi.provisionTenantUser({
        ...(account ? { firebaseUid: account.firebaseUid } : {}),
        email: account?.email ?? email.trim(),
        fullName: fullName.trim(),
        phone: phone.trim() || undefined,
        role,
        tenantId,
        permissions: [],
      });
    },
    onSuccess: async (user) => {
      toast.success('User provisioned successfully');
      await queryClient.invalidateQueries({ queryKey: ['admin-users'] });
      navigate(`/admin/super/users/${encodeURIComponent(user.firebaseUid)}`);
    },
  });

  const findAccount = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLookupError('');
    setAccount(null);
    setLookupPending(true);
    try {
      const found = await adminUsersApi.lookupFirebaseAccount(email.trim());
      setAccount(found);
      setFullName(found.displayName ?? '');
    } catch (error) {
      setLookupError(error instanceof Error ? error.message : 'Firebase account lookup failed.');
    } finally {
      setLookupPending(false);
    }
  };

  return (
    <main className="mx-auto max-w-2xl space-y-6 p-6">
      <header>
        <Link className="text-sm text-blue-700 underline" to="/admin/super/users">Back to users</Link>
        <h1 className="mt-3 text-2xl font-semibold">Provision a user</h1>
        <p className="text-sm text-slate-600 dark:text-slate-300">Link an existing Firebase account or create a new Firebase identity and assign its CareSync role.</p>
      </header>

      <div className="flex gap-2">
        <button className="rounded border px-3 py-2" onClick={() => { setCreateNew(false); setAccount(null); }} type="button">
          Existing Firebase account
        </button>
        <button className="rounded border px-3 py-2" onClick={() => { setCreateNew(true); setAccount(null); }} type="button">
          Create new account
        </button>
      </div>

      {!createNew && <form className="space-y-4 rounded border p-5" onSubmit={findAccount}>
        <label className="block space-y-1">
          <span className="text-sm font-medium">Firebase account email</span>
          <input autoComplete="email" className="w-full rounded border px-3 py-2" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
        </label>
        <button className="rounded border px-4 py-2 disabled:opacity-50" disabled={lookupPending} type="submit">
          {lookupPending ? 'Searching...' : 'Find account'}
        </button>
        {lookupError && <p className="text-red-700" role="alert">{lookupError}</p>}
        {tenantsQuery.isError && <p className="text-red-700" role="alert">Tenants could not be loaded. {tenantsQuery.error.message}</p>}
      </form>}

      {(account || createNew) && (
        <form className="space-y-4 rounded border p-5" onSubmit={(event) => { event.preventDefault(); provisionMutation.mutate(); }}>
          {account
            ? <p className="rounded bg-green-50 p-3 text-sm text-green-900" role="status">Found {account.email} (Firebase UID: {account.firebaseUid})</p>
            : <p className="text-sm text-slate-600 dark:text-slate-300">A password setup email is not sent by this provisioning flow.</p>}
          {createNew && (
            <label className="block space-y-1">
              <span className="text-sm font-medium">Email</span>
              <input autoComplete="email" className="w-full rounded border px-3 py-2" onChange={(event) => setEmail(event.target.value)} required type="email" value={email} />
            </label>
          )}
          <label className="block space-y-1">
            <span className="text-sm font-medium">Full name</span>
            <input autoComplete="name" className="w-full rounded border px-3 py-2" onChange={(event) => setFullName(event.target.value)} required value={fullName} />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Phone (optional)</span>
            <input autoComplete="tel" className="w-full rounded border px-3 py-2" onChange={(event) => setPhone(event.target.value)} value={phone} />
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Role</span>
            <select className="w-full rounded border px-3 py-2" onChange={(event) => setRole(event.target.value)} value={role}>
              {provisionableRoles.map((value) => <option key={value} value={value}>{value}</option>)}
            </select>
          </label>
          <label className="block space-y-1">
            <span className="text-sm font-medium">Tenant</span>
            <select className="w-full rounded border px-3 py-2" onChange={(event) => setTenantId(event.target.value)} required value={tenantId}>
              <option value="">Select a tenant</option>
              {(tenantsQuery.data?.content ?? []).map((tenant) => <option key={tenant.id} value={tenant.id}>{tenant.name}</option>)}
            </select>
          </label>
          {provisionMutation.isError && <p className="text-red-700" role="alert">Account was not provisioned. {provisionMutation.error.message}</p>}
          <button className="rounded bg-blue-700 px-4 py-2 text-white disabled:opacity-50" disabled={provisionMutation.isPending || !fullName.trim() || (createNew && !email.trim()) || !tenantId} type="submit">
            {provisionMutation.isPending ? 'Provisioning...' : 'Provision user'}
          </button>
        </form>
      )}
    </main>
  );
}
