import { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
  User,
  ArrowLeft,
  Mail,
  Shield,
  Building,
  Calendar,
  Loader2,
  AlertCircle,
  RefreshCw,
  Save,
  Trash2,
  Ban,
  CheckCircle,
  Key,
  FileText,
  Fingerprint,
  Clock,
  Info,
  AlertTriangle,
  UserX,
  ShieldCheck,
  Activity,
} from 'lucide-react';

import api from '@/lib/api-client';
import { errorMessage } from '@/lib/error-message';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Separator } from '@/components/ui/separator';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';

// ─────────────────────────────────────────────────────────────
// Types & Schemas
// ─────────────────────────────────────────────────────────────
type RoleId = 'MANAGER' | 'STAFF' | 'RECEPTION' | 'RECEPTIONIST' | 'FINANCE' | 'CONSENT_MANAGER' | 'PRIVACY_OFFICER';

interface TenantUserDetail {
  firebaseUid: string;
  email: string;
  fullName: string;
  role: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
  permissions: string[];
  tenantId: string;
  tenantName: string;
  createdAt: string;
  lastLoginAt: string | null;
}

interface PermissionOption {
  key: string;
  label: string;
  description: string;
  category: string;
}

const PERMISSION_OPTIONS: PermissionOption[] = [
  { key: 'PATIENT_READ', label: 'Read Patients', description: 'View patient records and demographics', category: 'Patient Data' },
  { key: 'PATIENT_WRITE', label: 'Edit Patients', description: 'Create and update patient records', category: 'Patient Data' },
  { key: 'PATIENT_PREFERENCES_WRITE', label: 'Update Preferences', description: 'Manage patient communication preferences', category: 'Patient Data' },
  { key: 'PATIENT_DOCUMENT_READ', label: 'Read Documents', description: 'View uploaded patient documents', category: 'Documents' },
  { key: 'PATIENT_DOCUMENT_WRITE', label: 'Upload Documents', description: 'Upload and update patient documents', category: 'Documents' },
  { key: 'PATIENT_DOCUMENT_RESTORE', label: 'Restore Documents', description: 'Restore archived or deleted patient documents', category: 'Documents' },
  { key: 'MERGE_READ', label: 'Review Merges', description: 'View patient merge records', category: 'Data Management' },
  { key: 'CONSENT_READ', label: 'Read Consents', description: 'View patient consent records', category: 'Compliance' },
  { key: 'CONSENT_WRITE', label: 'Manage Consents', description: 'Record and revoke patient consents', category: 'Compliance' },
  { key: 'AUDIT_READ', label: 'View Audit Trail', description: 'Read the tenant audit log', category: 'Compliance' },
  { key: 'INVOICE_READ', label: 'Read Invoices', description: 'View invoices and payment records', category: 'Finance' },
  { key: 'INVOICE_WRITE', label: 'Manage Invoices', description: 'Create and update invoices', category: 'Finance' },
];

const ROLE_OPTIONS: RoleId[] = ['MANAGER', 'STAFF', 'RECEPTION', 'RECEPTIONIST', 'FINANCE', 'CONSENT_MANAGER', 'PRIVACY_OFFICER'];

const updateSchema = z.object({
  role: z.enum(['MANAGER', 'STAFF', 'RECEPTION', 'RECEPTIONIST', 'FINANCE', 'CONSENT_MANAGER', 'PRIVACY_OFFICER']),
  permissions: z.array(z.string()),
});

type UpdateFormValues = z.infer<typeof updateSchema>;

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
export default function TenantUserDetailPage() {
  const { userId } = useParams<{ userId: string }>();
  const tenantId = useAuthStore((state) => state.user?.tenantId);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);

  // Fetch User
  const { data: user, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['tenant-user', tenantId, userId],
    queryFn: async () => {
      const response = await api.get(`/api/v1/admin/users/${userId}`, { params: { tenantId } });
      const body = response.data as { data?: TenantUserDetail } & TenantUserDetail;
      return body.data ?? body;
    },
    enabled: !!tenantId && !!userId,
  });

  // Form
  const form = useForm<UpdateFormValues>({
    resolver: zodResolver(updateSchema),
    defaultValues: { role: 'STAFF', permissions: [] },
  });

  // Sync form when user loads
  useEffect(() => {
    if (user) {
      form.reset({
        role: user.role as RoleId,
        permissions: user.permissions || [],
      });
    }
  }, [user, form]);

  // Update Mutation
  const updateMutation = useMutation({
    mutationFn: (values: UpdateFormValues) =>
      api.patch(`/api/v1/admin/users/${userId}/role`, { ...values, tenantId }),
    onSuccess: () => {
      toast.success('User updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['tenant-user', tenantId, userId] });
      queryClient.invalidateQueries({ queryKey: ['tenant-users', tenantId] });
    },
    onError: (err: unknown) => {
      toast.error(errorMessage(err, 'Failed to update user.'));
    },
  });

  // Status Mutation
  const statusMutation = useMutation({
    mutationFn: (status: 'ACTIVE' | 'SUSPENDED') =>
      api.patch(`/api/v1/admin/users/${userId}/status`, { status }, { params: { tenantId } }),
    onSuccess: () => {
      toast.success('Status updated.');
      queryClient.invalidateQueries({ queryKey: ['tenant-user', tenantId, userId] });
      queryClient.invalidateQueries({ queryKey: ['tenant-users', tenantId] });
    },
    onError: (err: unknown) => {
      toast.error(errorMessage(err, 'Failed to update status.'));
    },
  });

  // Delete Mutation
  const deleteMutation = useMutation({
    mutationFn: () => api.delete(`/api/v1/admin/users/${userId}`, { params: { tenantId } }),
    onSuccess: () => {
      toast.success('User access removed.');
      queryClient.invalidateQueries({ queryKey: ['tenant-users', tenantId] });
      navigate('/admin/tenant/users');
    },
    onError: (err: unknown) => {
      toast.error(errorMessage(err, 'Failed to remove user.'));
    },
  });

  const togglePermission = (permissionKey: string) => {
    const current = form.getValues('permissions');
    if (current.includes(permissionKey)) {
      form.setValue('permissions', current.filter((p) => p !== permissionKey), { shouldDirty: true });
    } else {
      form.setValue('permissions', [...current, permissionKey], { shouldDirty: true });
    }
  };

  // Group permissions by category
  const permissionsByCategory = PERMISSION_OPTIONS.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {} as Record<string, PermissionOption[]>);

  if (!tenantId) {
    return <Alert variant="destructive" className="m-6"><AlertCircle className="h-4 w-4" /><AlertTitle>No Tenant</AlertTitle><AlertDescription>Your account is not associated with a tenant.</AlertDescription></Alert>;
  }

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl py-8 space-y-6">
        <Skeleton className="h-10 w-48" />
        <Skeleton className="h-32 w-full" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isError || !user) {
    return (
      <Alert variant="destructive" className="m-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Unable to Load User</AlertTitle>
        <AlertDescription>{error?.message || 'User not found.'}</AlertDescription>
        <div className="flex gap-2 mt-4">
          <Button variant="outline" onClick={() => navigate('/admin/tenant/users')}>
            <ArrowLeft className="mr-2 h-4 w-4" /> Back
          </Button>
          <Button variant="outline" onClick={() => refetch()}>
            <RefreshCw className="mr-2 h-4 w-4" /> Retry
          </Button>
        </div>
      </Alert>
    );
  }

  const isDirty = form.formState.isDirty;
  const isSuspended = user.status === 'SUSPENDED';

  return (
    <div className="container mx-auto max-w-4xl py-8 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/admin/tenant/users" className="hover:text-foreground inline-flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" /> User Directory
        </Link>
      </div>

      {/* Header Card */}
      <Card>
        <CardContent className="p-6">
          <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="h-14 w-14 rounded-full bg-primary/10 flex items-center justify-center text-primary font-bold text-xl">
                {(user.fullName || user.email).charAt(0).toUpperCase()}
              </div>
              <div>
                <h1 className="text-2xl font-bold tracking-tight flex items-center gap-2 flex-wrap">
                  {user.fullName || 'Unnamed User'}
                  <Badge
                    variant="outline"
                    className={user.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-900 dark:text-emerald-200 border-none' : 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200 border-none'}
                  >
                    {user.status}
                  </Badge>
                </h1>
                <p className="text-sm text-muted-foreground mt-1 flex items-center gap-1">
                  <Mail className="h-3.5 w-3.5" /> {user.email}
                </p>
                <p className="text-xs text-muted-foreground mt-1 flex items-center gap-1 font-mono">
                  <Fingerprint className="h-3 w-3" /> {user.firebaseUid}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-2">
              <Button variant="outline" onClick={() => refetch()}>
                <RefreshCw className="mr-2 h-4 w-4" /> Refresh
              </Button>
              <Button
                variant={isSuspended ? 'default' : 'destructive'}
                onClick={() => statusMutation.mutate(isSuspended ? 'ACTIVE' : 'SUSPENDED')}
                disabled={statusMutation.isPending}
              >
                {statusMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : isSuspended ? <CheckCircle className="mr-2 h-4 w-4" /> : <Ban className="mr-2 h-4 w-4" />}
                {isSuspended ? 'Activate' : 'Suspend'}
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Info Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        <InfoTile icon={Building} label="Tenant" value={user.tenantName} />
        <InfoTile icon={Shield} label="Current Role" value={user.role.replace(/_/g, ' ')} />
        <InfoTile icon={Calendar} label="Joined" value={new Date(user.createdAt).toLocaleDateString()} />
        <InfoTile icon={Clock} label="Last Login" value={user.lastLoginAt ? new Date(user.lastLoginAt).toLocaleDateString() : 'Never'} />
      </div>

      {/* Role & Permissions Form */}
      <form onSubmit={form.handleSubmit((v) => updateMutation.mutate(v))}>
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <ShieldCheck className="h-4 w-4 text-primary" /> Role & Permissions
            </CardTitle>
            <CardDescription>Update the user's role and grant explicit permission overrides.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Role */}
            <div className="space-y-2">
              <Label>Role</Label>
              <Select
                value={form.watch('role')}
                onValueChange={(v) => form.setValue('role', v as RoleId, { shouldDirty: true })}
              >
                <SelectTrigger><SelectValue /></SelectTrigger>
                <SelectContent>
                  {ROLE_OPTIONS.map((r) => (
                    <SelectItem key={r} value={r}>{r.replace(/_/g, ' ')}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>

            <Separator />

            {/* Permission Overrides */}
            <div>
              <div className="flex items-center justify-between mb-3">
                <div>
                  <Label>Permission Overrides</Label>
                  <p className="text-xs text-muted-foreground mt-0.5">
                    Grant additional access beyond the base role. Role-based access still applies.
                  </p>
                </div>
                <Badge variant="outline">{form.watch('permissions').length} active</Badge>
              </div>
              <div className="space-y-4">
                {Object.entries(permissionsByCategory).map(([category, perms]) => (
                  <div key={category}>
                    <p className="text-xs font-semibold text-muted-foreground uppercase mb-2">{category}</p>
                    <div className="space-y-2">
                      {perms.map((perm) => {
                        const isEnabled = form.watch('permissions').includes(perm.key);
                        return (
                          <div key={perm.key} className="flex items-center justify-between gap-4 p-3 rounded-lg border bg-card">
                            <div className="flex-1 min-w-0">
                              <p className="text-sm font-medium">{perm.label}</p>
                              <p className="text-xs text-muted-foreground">{perm.description}</p>
                            </div>
                            <Switch
                              checked={isEnabled}
                              onCheckedChange={() => togglePermission(perm.key)}
                              aria-label={perm.label}
                            />
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/30 border-t px-6 py-4 flex justify-between">
            <p className="text-sm text-muted-foreground">
              {isDirty ? 'You have unsaved changes' : 'All changes saved'}
            </p>
            <div className="flex gap-2">
              <Button
                type="button"
                variant="outline"
                onClick={() => user && form.reset({ role: user.role as RoleId, permissions: user.permissions })}
                disabled={!isDirty}
              >
                Discard
              </Button>
              <Button type="submit" disabled={!isDirty || updateMutation.isPending}>
                {updateMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
                Save Changes
              </Button>
            </div>
          </CardFooter>
        </Card>
      </form>

      {/* Danger Zone */}
      <Card className="border-destructive/50">
        <CardHeader>
          <CardTitle className="text-base text-destructive flex items-center gap-2">
            <AlertTriangle className="h-4 w-4" /> Danger Zone
          </CardTitle>
          <CardDescription>Irreversible actions that affect this user's access.</CardDescription>
        </CardHeader>
        <CardContent>
          <div className="flex items-center justify-between p-3 rounded-lg border border-destructive/30 bg-destructive/5">
            <div>
              <p className="text-sm font-medium">Remove Access</p>
              <p className="text-xs text-muted-foreground">Revokes tenant access and disables the Firebase account.</p>
            </div>
            <Button variant="destructive" size="sm" onClick={() => setIsDeleteModalOpen(true)}>
              <UserX className="mr-2 h-4 w-4" /> Remove
            </Button>
          </div>
        </CardContent>
      </Card>

      {/* ── Delete Confirmation Modal ── */}
      <Dialog open={isDeleteModalOpen} onOpenChange={setIsDeleteModalOpen}>
        <DialogContent>
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 text-destructive">
              <AlertTriangle className="h-5 w-5" /> Remove User Access
            </DialogTitle>
            <DialogDescription>
              Are you sure you want to remove <strong>{user.fullName || user.email}</strong>?
              <span className="block mt-2 text-destructive">
                This will immediately revoke tenant access and disable their Firebase account. This action is audit-logged.
              </span>
            </DialogDescription>
          </DialogHeader>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsDeleteModalOpen(false)}>Cancel</Button>
            <Button
              variant="destructive"
              onClick={() => deleteMutation.mutate()}
              disabled={deleteMutation.isPending}
            >
              {deleteMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
              Confirm Removal
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────
function InfoTile({ icon: Icon, label, value }: { icon: React.ElementType; label: string; value: string }) {
  return (
    <Card>
      <CardContent className="p-4">
        <div className="flex items-center gap-2 mb-1">
          <Icon className="h-4 w-4 text-muted-foreground" />
          <p className="text-xs font-medium text-muted-foreground uppercase">{label}</p>
        </div>
        <p className="text-sm font-semibold truncate">{value}</p>
      </CardContent>
    </Card>
  );
}
