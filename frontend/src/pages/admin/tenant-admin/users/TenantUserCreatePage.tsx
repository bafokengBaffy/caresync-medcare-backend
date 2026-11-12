import { useNavigate, Link } from 'react-router-dom';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import {
  UserPlus,
  Mail,
  User,
  Phone,
  Briefcase,
  Loader2,
  AlertCircle,
  ArrowLeft,
  Lock,
  Shield,
  FileText,
  CreditCard,
  Eye,
  ClipboardCheck,
  Users,
  Fingerprint,
  Info,
  Link2,
} from 'lucide-react';

import api from '@/lib/api-client';
import { errorMessage } from '@/lib/error-message';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// ─────────────────────────────────────────────────────────────
// Types & Schemas
// ─────────────────────────────────────────────────────────────
type RoleId = 'MANAGER' | 'STAFF' | 'RECEPTION' | 'RECEPTIONIST' | 'FINANCE' | 'CONSENT_MANAGER' | 'PRIVACY_OFFICER';

interface RoleDef {
  id: RoleId;
  name: string;
  description: string;
  icon: React.ElementType;
}

const TENANT_ROLES: RoleDef[] = [
  { id: 'MANAGER', name: 'Manager', description: 'Day-to-day operational management.', icon: ClipboardCheck },
  { id: 'STAFF', name: 'Staff', description: 'General operational tasks.', icon: FileText },
  { id: 'RECEPTION', name: 'Reception', description: 'Front-desk operations.', icon: Users },
  { id: 'RECEPTIONIST', name: 'Receptionist', description: 'Patient registration and check-in.', icon: Users },
  { id: 'FINANCE', name: 'Finance', description: 'Invoices, payments, billing.', icon: CreditCard },
  { id: 'CONSENT_MANAGER', name: 'Consent Manager', description: 'Patient consent workflows.', icon: FileText },
  { id: 'PRIVACY_OFFICER', name: 'Privacy Officer', description: 'Privacy and consent governance.', icon: Eye },
];

const provisionSchema = z.object({
  mode: z.enum(['CREATE_ACCOUNT', 'LINK_EXISTING']),
  email: z.string().email('Invalid email address'),
  firebaseUid: z.string().optional(),
  fullName: z.string().min(2, 'Full name is required'),
  phone: z.string().optional(),
  jobTitle: z.string().optional(),
  role: z.enum(['MANAGER', 'STAFF', 'RECEPTION', 'RECEPTIONIST', 'FINANCE', 'CONSENT_MANAGER', 'PRIVACY_OFFICER']),
  sendWelcomeEmail: z.boolean().default(true),
  requireEmailVerification: z.boolean().default(true),
  notes: z.string().optional(),
}).superRefine((values, context) => {
  if (values.mode === 'LINK_EXISTING' && !values.firebaseUid?.trim()) {
    context.addIssue({
      code: z.ZodIssueCode.custom,
      path: ['firebaseUid'],
      message: 'Enter the Firebase UID provided by the account holder.',
    });
  }
});

type ProvisionFormValues = z.infer<typeof provisionSchema>;

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
export default function TenantUserCreatePage() {
  const tenantId = useAuthStore((state) => state.user?.tenantId);
  const queryClient = useQueryClient();
  const navigate = useNavigate();

  const form = useForm<ProvisionFormValues>({
    resolver: zodResolver(provisionSchema),
    defaultValues: {
      mode: 'CREATE_ACCOUNT',
      email: '',
      firebaseUid: '',
      fullName: '',
      phone: '',
      jobTitle: '',
      role: 'STAFF',
      sendWelcomeEmail: true,
      requireEmailVerification: true,
      notes: '',
    },
  });

  // Provision Mutation
  const provisionMutation = useMutation({
    mutationFn: (values: ProvisionFormValues) => api.post('/api/v1/tenant/users/provision', {
      email: values.email,
      fullName: values.fullName,
      phone: values.phone || null,
      role: values.role,
      ...(values.mode === 'LINK_EXISTING' && values.firebaseUid?.trim()
        ? { firebaseUid: values.firebaseUid.trim() }
        : {}),
    }),
    onSuccess: (response) => {
      toast.success(`User ${response.data.email} added to your tenant.`);
      queryClient.invalidateQueries({ queryKey: ['tenant-users'] });
      navigate(`/admin/tenant/users/${response.data.firebaseUid}`);
    },
    onError: (err: unknown) => {
      toast.error(errorMessage(err, 'Provisioning failed.'));
    },
  });

  const onSubmit = (values: ProvisionFormValues) => {
    provisionMutation.mutate(values);
  };

  if (!tenantId) {
    return (
      <Alert variant="destructive" className="m-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>No Tenant Assigned</AlertTitle>
        <AlertDescription>Your account is not associated with a tenant.</AlertDescription>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto max-w-3xl py-8 space-y-6">
      {/* Breadcrumb */}
      <div className="flex items-center gap-2 text-sm text-muted-foreground">
        <Link to="/admin/tenant/users" className="hover:text-foreground inline-flex items-center gap-1">
          <ArrowLeft className="h-3.5 w-3.5" /> User Directory
        </Link>
      </div>

      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
          <UserPlus className="h-8 w-8 text-primary" />
          Add Tenant User
        </h1>
        <p className="text-muted-foreground mt-1">
          Provision a new staff member into your tenant. Clinical roles must be provisioned by the platform administrator.
        </p>
      </div>

      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        {/* Account Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Mail className="h-4 w-4 text-primary" /> Account Details
            </CardTitle>
            <CardDescription>Create an account for this tenant or link an existing Firebase account using the account holder’s Firebase UID.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label>Account Action</Label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => form.setValue('mode', 'CREATE_ACCOUNT')}
                  className={`text-left p-3 rounded-lg border-2 transition-all ${form.watch('mode') === 'CREATE_ACCOUNT' ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/30'}`}
                >
                  <div className="flex items-center gap-2">
                    <UserPlus className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold">Create New Account</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Create a Firebase account and assign the selected tenant role.</p>
                </button>
                <button
                  type="button"
                  onClick={() => form.setValue('mode', 'LINK_EXISTING')}
                  className={`text-left p-3 rounded-lg border-2 transition-all ${form.watch('mode') === 'LINK_EXISTING' ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/30'}`}
                >
                  <div className="flex items-center gap-2">
                    <Link2 className="h-4 w-4 text-primary" />
                    <p className="text-sm font-semibold">Link Existing</p>
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">Link a self-registered account.</p>
                </button>
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="email">Email <span className="text-destructive">*</span></Label>
              <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="email" type="email" placeholder="staff@clinic.com" className="pl-9" {...form.register('email')} />
              </div>
              {form.formState.errors.email && <p className="text-sm text-destructive">{form.formState.errors.email.message}</p>}
            </div>

            {form.watch('mode') === 'LINK_EXISTING' && (
              <div className="space-y-2">
                <Label htmlFor="firebaseUid">Firebase UID <span className="text-destructive">*</span></Label>
                <div className="relative">
                  <Fingerprint className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="firebaseUid" placeholder="e.g. 8dK2xQz9..." className="pl-9 font-mono" {...form.register('firebaseUid')} />
                </div>
                {form.formState.errors.firebaseUid && <p className="text-sm text-destructive">{form.formState.errors.firebaseUid.message}</p>}
              </div>
            )}
          </CardContent>
        </Card>

        {/* Identity Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <User className="h-4 w-4 text-primary" /> Personal Identity
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="fullName">Full Name <span className="text-destructive">*</span></Label>
              <div className="relative">
                <User className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                <Input id="fullName" placeholder="Jane Doe" className="pl-9" {...form.register('fullName')} />
              </div>
              {form.formState.errors.fullName && <p className="text-sm text-destructive">{form.formState.errors.fullName.message}</p>}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="space-y-2">
                <Label htmlFor="phone">Phone (optional)</Label>
                <div className="relative">
                  <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="phone" type="tel" placeholder="+27 11 123 4567" className="pl-9" {...form.register('phone')} />
                </div>
              </div>
              <div className="space-y-2">
                <Label htmlFor="jobTitle">Job Title (optional)</Label>
                <div className="relative">
                  <Briefcase className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input id="jobTitle" placeholder="Front Desk Lead" className="pl-9" {...form.register('jobTitle')} />
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Role Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Shield className="h-4 w-4 text-primary" /> Role Assignment
            </CardTitle>
            <CardDescription>
              Only non-clinical roles can be assigned here. Provider and Clinician roles require platform administrator approval.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {TENANT_ROLES.map((role) => {
                const Icon = role.icon;
                const selected = form.watch('role') === role.id;
                return (
                  <button
                    key={role.id}
                    type="button"
                    onClick={() => form.setValue('role', role.id)}
                    className={`text-left p-3 rounded-lg border-2 transition-all ${selected ? 'border-primary bg-primary/5' : 'border-muted hover:border-muted-foreground/30'}`}
                  >
                    <div className="flex items-start gap-2">
                      <div className={`p-1.5 rounded-md flex-shrink-0 ${selected ? 'bg-primary text-primary-foreground' : 'bg-muted text-muted-foreground'}`}>
                        <Icon className="h-4 w-4" />
                      </div>
                      <div className="min-w-0">
                        <p className="text-sm font-semibold">{role.name}</p>
                        <p className="text-xs text-muted-foreground mt-0.5">{role.description}</p>
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            {form.formState.errors.role && <p className="text-sm text-destructive">{form.formState.errors.role.message}</p>}
          </CardContent>
        </Card>

        {/* Options Section */}
        <Card>
          <CardHeader>
            <CardTitle className="text-base flex items-center gap-2">
              <Lock className="h-4 w-4 text-primary" /> Provisioning Options
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="rounded-lg border p-3">
              <div>
                <p className="text-sm font-medium">Account sign-in</p>
                <p className="text-xs text-muted-foreground">New users set a password through the sign-in screen’s password reset flow. Existing accounts keep their current credentials.</p>
              </div>
            </div>
          </CardContent>
          <CardFooter className="bg-muted/30 border-t px-6 py-4 flex justify-end gap-2">
            <Button type="button" variant="outline" onClick={() => navigate('/admin/tenant/users')}>
              Cancel
            </Button>
            <Button type="submit" disabled={provisionMutation.isPending}>
              {provisionMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <UserPlus className="mr-2 h-4 w-4" />}
              Add User
            </Button>
          </CardFooter>
        </Card>
      </form>

      <div className="flex items-start gap-2 text-xs text-muted-foreground">
        <Info className="h-3.5 w-3.5 mt-0.5 flex-shrink-0" />
        <p>
          For clinical roles (Provider, Clinician), contact your platform administrator to provision users with provider record links.
        </p>
      </div>
    </div>
  );
}
