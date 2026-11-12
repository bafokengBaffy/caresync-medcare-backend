import { useState, useEffect, useMemo } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { toast } from 'sonner';
import { errorMessage } from '@/lib/error-message';
import {
  ShieldCheck,
  Shield,
  ShieldAlert,
  Lock,
  Save,
  Loader2,
  AlertCircle,
  RefreshCw,
  ChevronRight,
  CheckCircle2,
  XCircle,
  Info,
  Users,
  FileText,
  CreditCard,
  Settings,
  Activity,
  Key,
  AlertTriangle,
  Database,
} from 'lucide-react';

import api from '@/lib/api-client';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from '@/components/ui/tooltip';

// ─────────────────────────────────────────────────────────────
// Types & Constants
// ─────────────────────────────────────────────────────────────
type Permission =
  | 'PATIENT_READ' | 'PATIENT_WRITE' | 'PATIENT_DELETE'
  | 'BILLING_READ' | 'BILLING_WRITE' | 'BILLING_DELETE'
  | 'APPOINTMENT_READ' | 'APPOINTMENT_WRITE'
  | 'CLINICAL_NOTE_READ' | 'CLINICAL_NOTE_WRITE'
  | 'USER_MANAGE' | 'TENANT_MANAGE'
  | 'AUDIT_READ' | 'SETTINGS_MANAGE';

interface RoleConfig {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  scope: 'PLATFORM' | 'TENANT';
  permissions: Record<Permission, boolean>;
}

const PERMISSION_GROUPS: {
  title: string;
  icon: React.ElementType;
  permissions: { key: Permission; label: string; description: string }[];
}[] = [
  {
    title: 'Patient Data',
    icon: Users,
    permissions: [
      { key: 'PATIENT_READ', label: 'View Patients', description: 'Access patient demographics and records' },
      { key: 'PATIENT_WRITE', label: 'Edit Patients', description: 'Create and update patient records' },
      { key: 'PATIENT_DELETE', label: 'Delete Patients', description: 'Soft-delete or archive patient records' },
    ],
  },
  {
    title: 'Clinical Operations',
    icon: FileText,
    permissions: [
      { key: 'APPOINTMENT_READ', label: 'View Appointments', description: 'Access scheduling and calendar data' },
      { key: 'APPOINTMENT_WRITE', label: 'Manage Appointments', description: 'Book, reschedule, or cancel appointments' },
      { key: 'CLINICAL_NOTE_READ', label: 'View Clinical Notes', description: 'Read SOAP notes and clinical assessments' },
      { key: 'CLINICAL_NOTE_WRITE', label: 'Create Clinical Notes', description: 'Write and update clinical documentation' },
    ],
  },
  {
    title: 'Billing & Finance',
    icon: CreditCard,
    permissions: [
      { key: 'BILLING_READ', label: 'View Invoices', description: 'Access invoices, payments, and claims' },
      { key: 'BILLING_WRITE', label: 'Manage Billing', description: 'Create invoices and record payments' },
      { key: 'BILLING_DELETE', label: 'Delete Billing Records', description: 'Void or delete invoices and payments' },
    ],
  },
  {
    title: 'Platform Administration',
    icon: Settings,
    permissions: [
      { key: 'USER_MANAGE', label: 'Manage Users', description: 'Provision, suspend, and assign roles to users' },
      { key: 'TENANT_MANAGE', label: 'Manage Tenants', description: 'Create, configure, and suspend tenants' },
      { key: 'AUDIT_READ', label: 'View Audit Logs', description: 'Access immutable audit trail records' },
      { key: 'SETTINGS_MANAGE', label: 'Manage Settings', description: 'Configure global system settings' },
    ],
  },
];

const ROLE_ICONS: Record<string, React.ElementType> = {
  SUPER_ADMIN: ShieldAlert,
  TENANT_ADMIN: ShieldCheck,
  MANAGER: Users,
  PROVIDER: Activity,
  CLINICIAN: Activity,
  RECEPTION: Users,
  RECEPTIONIST: Users,
  STAFF: Users,
  FINANCE: CreditCard,
  CONSENT_MANAGER: FileText,
  PRIVACY_OFFICER: Lock,
};

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export default function RoleManagementPage() {
  const queryClient = useQueryClient();
  const [activeRoleId, setActiveRoleId] = useState<string | null>(null);
  const [dirtyChanges, setDirtyChanges] = useState<Record<string, Record<Permission, boolean>>>({});

  // Fetch Roles from API
  const { data: rolesData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['admin-roles'],
    queryFn: async () => {
      const response = await api.get('/api/v1/admin/roles');
      return response.data.data as RoleConfig[];
    },
  });

  const roles = rolesData || [];
  const activeRole = useMemo(
    () => roles.find((r) => r.id === activeRoleId) || roles[0],
    [roles, activeRoleId]
  );

  // Sync active role ID on first load
  useEffect(() => {
    if (!activeRoleId && roles.length > 0) {
      setActiveRoleId(roles[0].id);
    }
  }, [roles, activeRoleId]);

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: (payload: { roleId: string; permissions: Record<Permission, boolean> }) =>
      api.put(`/api/v1/admin/roles/${payload.roleId}/permissions`, { permissions: payload.permissions }),
    onSuccess: () => {
      toast.success('Role permissions updated successfully.');
      queryClient.invalidateQueries({ queryKey: ['admin-roles'] });
      setDirtyChanges((prev) => {
        const next = { ...prev };
        if (activeRoleId) delete next[activeRoleId];
        return next;
      });
    },
    onError: (err: unknown) => {
      toast.error(errorMessage(err, 'Failed to save permissions.'));
    },
  });

  const handleTogglePermission = (permission: Permission, value: boolean) => {
    if (!activeRole) return;
    if (activeRole.name === 'SUPER_ADMIN') {
      toast.warning('SUPER_ADMIN permissions are immutable.');
      return;
    }

    setDirtyChanges((prev) => {
      const currentRoleState = prev[activeRole.id] || { ...activeRole.permissions };
      return {
        ...prev,
        [activeRole.id]: {
          ...currentRoleState,
          [permission]: value,
        },
      };
    });
  };

  const handleSave = () => {
    if (!activeRole || !dirtyChanges[activeRole.id]) return;
    saveMutation.mutate({
      roleId: activeRole.id,
      permissions: dirtyChanges[activeRole.id],
    });
  };

  const currentPermissions = (role: RoleConfig): Record<Permission, boolean> => {
    return dirtyChanges[role.id] || role.permissions;
  };

  const hasUnsavedChanges = activeRoleId ? !!dirtyChanges[activeRoleId] : false;

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-7xl py-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <Skeleton className="h-96 w-full" />
          <Skeleton className="h-96 w-full md:col-span-3" />
        </div>
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive" className="m-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Roles</AlertTitle>
        <AlertDescription>{error?.message || 'Could not load role definitions.'}</AlertDescription>
        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Retry
        </Button>
      </Alert>
    );
  }

  return (
    <TooltipProvider>
      <div className="container mx-auto max-w-7xl py-8 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
              <Lock className="h-8 w-8 text-primary" />
              Role & Permission Management
            </h1>
            <p className="text-muted-foreground mt-1">
              Configure role-based access control (RBAC) policies across the platform.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => refetch()}>
              <RefreshCw className="mr-2 h-4 w-4" /> Reload
            </Button>
            <Button
              onClick={handleSave}
              disabled={!hasUnsavedChanges || saveMutation.isPending || activeRole?.name === 'SUPER_ADMIN'}
            >
              {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
          </div>
        </div>

        {/* Unsaved Changes Alert */}
        {hasUnsavedChanges && (
          <Alert className="border-amber-500/50 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100">
            <AlertTriangle className="h-4 w-4 text-amber-600" />
            <AlertTitle>Unsaved Changes</AlertTitle>
            <AlertDescription>
              You have unsaved permission changes for <strong>{activeRole?.name}</strong>. Click Save to apply them.
            </AlertDescription>
          </Alert>
        )}

        <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
          {/* Sidebar: Roles List */}
          <Card className="lg:col-span-1 h-fit">
            <CardHeader>
              <CardTitle className="text-base">Defined Roles</CardTitle>
              <CardDescription>Select a role to configure.</CardDescription>
            </CardHeader>
            <CardContent className="p-2 space-y-1">
              {roles.map((role) => {
                const Icon = ROLE_ICONS[role.name] || Shield;
                const isActive = activeRoleId === role.id;
                const isDirty = !!dirtyChanges[role.id];
                return (
                  <button
                    key={role.id}
                    onClick={() => setActiveRoleId(role.id)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2.5 rounded-md text-sm transition-colors text-left ${
                      isActive
                        ? 'bg-primary/10 text-primary font-medium'
                        : 'text-muted-foreground hover:bg-muted'
                    }`}
                  >
                    <span className="flex items-center gap-2 truncate">
                      <Icon className="h-4 w-4 flex-shrink-0" />
                      <span className="truncate">{role.name.replace(/_/g, ' ')}</span>
                    </span>
                    <span className="flex items-center gap-1 flex-shrink-0">
                      {isDirty && <span className="h-1.5 w-1.5 rounded-full bg-amber-500" />}
                      {role.isSystem && <Lock className="h-3 w-3 opacity-50" />}
                      <ChevronRight className={`h-4 w-4 ${isActive ? 'opacity-100' : 'opacity-0'}`} />
                    </span>
                  </button>
                );
              })}
            </CardContent>
          </Card>

          {/* Main: Permissions Matrix */}
          <div className="lg:col-span-3 space-y-6">
            {!activeRole ? (
              <Card>
                <CardContent className="p-12 text-center">
                  <Shield className="mx-auto h-12 w-12 text-muted-foreground/50" />
                  <p className="mt-4 text-muted-foreground">Select a role to configure permissions.</p>
                </CardContent>
              </Card>
            ) : (
              <>
                {/* Role Info Card */}
                <Card>
                  <CardHeader>
                    <div className="flex items-start justify-between gap-4">
                      <div>
                        <CardTitle className="flex items-center gap-2">
                          {(() => {
                            const Icon = ROLE_ICONS[activeRole.name] || Shield;
                            return <Icon className="h-5 w-5 text-primary" />;
                          })()}
                          {activeRole.name.replace(/_/g, ' ')}
                          {activeRole.isSystem && (
                            <Badge variant="secondary" className="ml-2">
                              <Lock className="h-3 w-3 mr-1" /> System Role
                            </Badge>
                          )}
                          <Badge variant="outline" className="ml-1">
                            {activeRole.scope === 'PLATFORM' ? 'Platform-wide' : 'Tenant-scoped'}
                          </Badge>
                        </CardTitle>
                        <CardDescription className="mt-2">{activeRole.description}</CardDescription>
                      </div>
                    </div>
                  </CardHeader>
                  {activeRole.name === 'SUPER_ADMIN' && (
                    <CardContent className="pt-0">
                      <Alert className="border-amber-500/50 bg-amber-50 text-amber-900 dark:bg-amber-950 dark:text-amber-100">
                        <AlertTriangle className="h-4 w-4 text-amber-600" />
                        <AlertTitle>Immutable Role</AlertTitle>
                        <AlertDescription>
                          SUPER_ADMIN permissions cannot be modified for security reasons.
                        </AlertDescription>
                      </Alert>
                    </CardContent>
                  )}
                </Card>

                {/* Permissions Groups */}
                {PERMISSION_GROUPS.map((group) => {
                  const GroupIcon = group.icon;
                  return (
                    <Card key={group.title}>
                      <CardHeader className="pb-3">
                        <CardTitle className="text-base flex items-center gap-2">
                          <GroupIcon className="h-4 w-4 text-primary" />
                          {group.title}
                        </CardTitle>
                      </CardHeader>
                      <CardContent className="space-y-2">
                        {group.permissions.map((perm) => {
                          const isEnabled = currentPermissions(activeRole)[perm.key];
                          const isDisabled = activeRole.name === 'SUPER_ADMIN';
                          return (
                            <div
                              key={perm.key}
                              className="flex items-center justify-between gap-4 p-3 rounded-lg border bg-card hover:bg-muted/50 transition-colors"
                            >
                              <div className="flex-1 min-w-0">
                                <div className="flex items-center gap-2">
                                  <p className="text-sm font-medium">{perm.label}</p>
                                  {isEnabled ? (
                                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                                  ) : (
                                    <XCircle className="h-3.5 w-3.5 text-muted-foreground/50" />
                                  )}
                                </div>
                                <p className="text-xs text-muted-foreground mt-0.5">
                                  {perm.description}
                                </p>
                              </div>
                              <Tooltip>
                                <TooltipTrigger asChild>
                                  <div>
                                    <Switch
                                      checked={isEnabled}
                                      onCheckedChange={(v) => handleTogglePermission(perm.key, v)}
                                      disabled={isDisabled}
                                      aria-label={perm.label}
                                    />
                                  </div>
                                </TooltipTrigger>
                                <TooltipContent>
                                  {isDisabled
                                    ? 'SUPER_ADMIN permissions are immutable'
                                    : isEnabled
                                      ? 'Click to disable'
                                      : 'Click to enable'}
                                </TooltipContent>
                              </Tooltip>
                            </div>
                          );
                        })}
                      </CardContent>
                    </Card>
                  );
                })}

                {/* Save Footer */}
                {activeRole.name !== 'SUPER_ADMIN' && (
                  <Card className="sticky bottom-4 border-primary/50 shadow-lg">
                    <CardFooter className="p-4 flex flex-col sm:flex-row items-center justify-between gap-3">
                      <div className="flex items-center gap-2 text-sm">
                        <Info className="h-4 w-4 text-muted-foreground" />
                        <span className="text-muted-foreground">
                          {hasUnsavedChanges ? 'You have unsaved changes' : 'All changes saved'}
                        </span>
                      </div>
                      <div className="flex gap-2">
                        <Button
                          variant="outline"
                          onClick={() => {
                            if (!activeRoleId) return;
                            setDirtyChanges((prev) => {
                              const next = { ...prev };
                              delete next[activeRoleId];
                              return next;
                            });
                          }}
                          disabled={!hasUnsavedChanges}
                        >
                          Discard
                        </Button>
                        <Button onClick={handleSave} disabled={!hasUnsavedChanges || saveMutation.isPending}>
                          {saveMutation.isPending && <Loader2 className="mr-2 h-4 w-4 animate-spin" />}
                          Save Permissions
                        </Button>
                      </div>
                    </CardFooter>
                  </Card>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    </TooltipProvider>
  );
}
