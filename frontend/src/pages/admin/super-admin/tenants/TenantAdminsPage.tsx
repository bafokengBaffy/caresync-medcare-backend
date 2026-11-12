import { useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { ArrowLeft, Building2, CircleAlert, LoaderCircle, Plus, ShieldCheck, UserRoundCog, UserX } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useProvisionTenantAdmin, useRemoveTenantAdmin, useTenantAdmins, useUpdateTenantAdminRole, useUpdateTenantAdminStatus } from '@/hooks/use-admin-users';
import type { AdminUser } from '@/types/admin-user';

const initialForm = { firebaseUid: '', email: '', fullName: '', phone: '' };

export default function TenantAdminsPage() {
  const { tenantId = '' } = useParams();
  const navigate = useNavigate();
  const adminsQuery = useTenantAdmins(tenantId);
  const provision = useProvisionTenantAdmin(tenantId);
  const updateStatus = useUpdateTenantAdminStatus(tenantId);
  const updateRole = useUpdateTenantAdminRole(tenantId);
  const remove = useRemoveTenantAdmin(tenantId);
  const [form, setForm] = useState(initialForm);
  const [showForm, setShowForm] = useState(false);

  const provisionAdmin = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    await provision.mutateAsync({
      firebaseUid: form.firebaseUid.trim(),
      email: form.email.trim(),
      fullName: form.fullName.trim(),
      phone: form.phone.trim() || undefined,
    });
    setForm(initialForm);
    setShowForm(false);
  };

  const changeRole = async (admin: AdminUser, role: string) => {
    if (role === admin.role) return;
    if (!window.confirm(`Change ${admin.fullName}'s role to ${role.replaceAll('_', ' ')}?`)) return;
    await updateRole.mutateAsync({ firebaseUid: admin.firebaseUid, role });
  };

  const toggleStatus = async (admin: AdminUser) => {
    const status = admin.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    if (!window.confirm(`${status === 'SUSPENDED' ? 'Suspend' : 'Reactivate'} ${admin.fullName}?`)) return;
    await updateStatus.mutateAsync({ firebaseUid: admin.firebaseUid, status });
  };

  const removeAdmin = async (admin: AdminUser) => {
    if (!window.confirm(`Remove ${admin.fullName}'s account access? This disables the Firebase account.`)) return;
    await remove.mutateAsync(admin.firebaseUid);
  };

  if (!tenantId) {
    return <p className="p-8 text-sm text-destructive">A tenant identifier is required.</p>;
  }

  return (
    <div className="space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-start gap-3">
          <Button variant="outline" size="icon" aria-label="Back to tenant" onClick={() => navigate(`/admin/super/tenants/${tenantId}`)}>
            <ArrowLeft className="h-4 w-4" />
          </Button>
          <div className="rounded-xl bg-primary/10 p-3 text-primary"><Building2 className="h-6 w-6" /></div>
          <div>
            <h1 className="text-2xl font-semibold text-foreground">Tenant administrators</h1>
            <p className="mt-1 text-sm text-muted-foreground">Manage administrator access for this tenant. All changes are recorded by the backend audit service.</p>
          </div>
        </div>
        <Button onClick={() => setShowForm((value) => !value)}>
          <Plus className="mr-2 h-4 w-4" /> Add administrator
        </Button>
      </header>

      {showForm && (
        <form onSubmit={provisionAdmin} className="rounded-xl border bg-card p-5 shadow-sm">
          <div className="mb-4 flex items-center gap-2">
            <ShieldCheck className="h-5 w-5 text-primary" />
            <h2 className="font-semibold">Provision tenant administrator</h2>
          </div>
          <p className="mb-4 flex items-start gap-2 rounded-md bg-muted p-3 text-sm text-muted-foreground">
            <CircleAlert className="mt-0.5 h-4 w-4 shrink-0" />
            The Firebase Auth account must already exist. Provisioning assigns the tenant role and is verified against the tenant by the backend.
          </p>
          <div className="grid gap-4 sm:grid-cols-2">
            <label className="space-y-1.5 text-sm font-medium">
              <span>Firebase UID *</span>
              <input required maxLength={128} value={form.firebaseUid} onChange={(e) => setForm({ ...form, firebaseUid: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 font-normal" />
            </label>
            <label className="space-y-1.5 text-sm font-medium">
              <span>Account email *</span>
              <input required type="email" maxLength={320} value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 font-normal" />
            </label>
            <label className="space-y-1.5 text-sm font-medium">
              <span>Full name *</span>
              <input required maxLength={200} value={form.fullName} onChange={(e) => setForm({ ...form, fullName: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 font-normal" />
            </label>
            <label className="space-y-1.5 text-sm font-medium">
              <span>Phone</span>
              <input maxLength={32} value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} className="h-10 w-full rounded-md border border-input bg-background px-3 font-normal" />
            </label>
          </div>
          <div className="mt-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => setShowForm(false)}>Cancel</Button>
            <Button type="submit" disabled={provision.isPending}>
              {provision.isPending && <LoaderCircle className="mr-2 h-4 w-4 animate-spin" />}
              Provision admin
            </Button>
          </div>
        </form>
      )}

      <section className="overflow-hidden rounded-xl border bg-card shadow-sm">
        <div className="flex items-center justify-between border-b p-4">
          <div>
            <h2 className="font-semibold">Administrators</h2>
            <p className="text-sm text-muted-foreground">
              {adminsQuery.data?.total ?? 0} tenant administrator{adminsQuery.data?.total === 1 ? '' : 's'}
            </p>
          </div>
          <UserRoundCog className="h-5 w-5 text-muted-foreground" />
        </div>
        {adminsQuery.isLoading ? (
          <div className="flex items-center justify-center gap-2 p-12 text-sm text-muted-foreground">
            <LoaderCircle className="h-5 w-5 animate-spin" /> Loading administrators…
          </div>
        ) : adminsQuery.isError ? (
          <div className="p-8 text-center">
            <p className="text-sm text-destructive">Could not load tenant administrators.</p>
            <Button variant="outline" className="mt-3" onClick={() => void adminsQuery.refetch()}>Try again</Button>
          </div>
        ) : !adminsQuery.data?.content.length ? (
          <div className="p-12 text-center">
            <ShieldCheck className="mx-auto h-10 w-10 text-muted-foreground/50" />
            <p className="mt-3 font-medium">No tenant administrators found</p>
            <p className="mt-1 text-sm text-muted-foreground">Provision an existing Firebase account to grant administrator access.</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead className="bg-muted/50 text-xs uppercase text-muted-foreground">
                <tr>
                  <th className="px-4 py-3 font-medium">Administrator</th>
                  <th className="px-4 py-3 font-medium">Role</th>
                  <th className="px-4 py-3 font-medium">Status</th>
                  <th className="px-4 py-3 font-medium">Added</th>
                  <th className="px-4 py-3 text-right font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y">
                {adminsQuery.data.content.map((admin) => (
                  <tr key={admin.firebaseUid}>
                    <td className="px-4 py-3">
                      <p className="font-medium text-foreground">{admin.fullName}</p>
                      <p className="text-xs text-muted-foreground">{admin.email}</p>
                    </td>
                    <td className="px-4 py-3">
                      <select
                        aria-label={`Change role for ${admin.fullName}`}
                        value={admin.role}
                        onChange={(event) => void changeRole(admin, event.target.value)}
                        disabled={updateRole.isPending}
                        className="h-9 rounded-md border border-input bg-background px-2"
                      >
                        <option value="TENANT_ADMIN">Tenant admin</option>
                        <option value="MANAGER">Manager</option>
                        <option value="STAFF">Staff</option>
                      </select>
                    </td>
                    <td className="px-4 py-3">
                      <span className={`rounded-full px-2.5 py-1 text-xs font-medium ${admin.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-amber-100 text-amber-800'}`}>
                        {admin.status}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-muted-foreground">{new Date(admin.createdAt).toLocaleDateString()}</td>
                    <td className="px-4 py-3">
                      <div className="flex justify-end gap-2">
                        <Button
                          size="sm"
                          variant="outline"
                          disabled={updateStatus.isPending}
                          onClick={() => void toggleStatus(admin)}
                        >
                          {admin.status === 'ACTIVE' ? 'Suspend' : 'Reactivate'}
                        </Button>
                        <Button
                          size="icon"
                          variant="destructive"
                          aria-label={`Remove ${admin.fullName}`}
                          disabled={remove.isPending}
                          onClick={() => void removeAdmin(admin)}
                        >
                          <UserX className="h-4 w-4" />
                        </Button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </div>
  );
}
