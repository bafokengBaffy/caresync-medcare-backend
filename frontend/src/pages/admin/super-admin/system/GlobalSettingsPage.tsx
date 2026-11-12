// src/pages/admin/super-admin/system/GlobalSettingsPage.tsx
import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { errorMessage } from '@/lib/error-message';
import {
  Settings,
  Shield,
  Save,
  Loader2,
  AlertTriangle,
  Globe,
  Database,
  Mail,
  Key,
  Server,
  Activity,
  Lock,
  UserX,
  RefreshCw,
  Zap,
} from 'lucide-react';

import api from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Switch } from '@/components/ui/switch';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';

// ─────────────────────────────────────────────────────────────
// Zod Schema for Validation (Prevents invalid data reaching backend)
// ─────────────────────────────────────────────────────────────
const settingsSchema = z.object({
  maintenanceMode: z.boolean(),
  allowRegistration: z.boolean(),
  enforceMfa: z.boolean(),
  sessionTimeoutMinutes: z.number().min(5).max(1440),
  maxLoginAttempts: z.number().min(1).max(20),
  passwordMinLength: z.number().min(8).max(64),
  supportEmail: z.string().email(),
  apiRateLimit: z.number().min(10).max(10000),
  defaultTenantPlan: z.enum(['FREE', 'PRO', 'ENTERPRISE']),
  enableAuditLogging: z.boolean(),
  webhookUrl: z.string().url().or(z.literal('')),
});

type SettingsFormValues = z.infer<typeof settingsSchema>;

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export default function GlobalSettingsPage() {
  const queryClient = useQueryClient();
  const { user } = useAuthStore();
  const [activeTab, setActiveTab] = useState('general');

  // 1. Fetch Current Settings
  const { data: settingsData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['global-settings'],
    queryFn: async () => {
      const response = await api.get('/api/v1/admin/settings');
      const revision = Number(String(response.headers.etag ?? '0').replaceAll('"', ''));
      return { settings: response.data.data as SettingsFormValues, revision };
    },
    staleTime: 0,
    refetchInterval: 30_000,
  });

  // 2. Setup Form
  const form = useForm<SettingsFormValues>({
    resolver: zodResolver(settingsSchema),
    defaultValues: {
      maintenanceMode: false,
      allowRegistration: true,
      enforceMfa: false,
      sessionTimeoutMinutes: 60,
      maxLoginAttempts: 5,
      passwordMinLength: 12,
      supportEmail: 'support@caresync.com',
      apiRateLimit: 1000,
      defaultTenantPlan: 'FREE',
      enableAuditLogging: true,
      webhookUrl: '',
    },
  });
  const { isDirty } = form.formState;
  const [loadedRevision, setLoadedRevision] = useState<number | null>(null);

  // 3. Reset form when data loads
  useEffect(() => {
    if (settingsData && !isDirty) {
      form.reset(settingsData.settings);
      setLoadedRevision(settingsData.revision);
    }
  }, [settingsData, form, isDirty]);

  // 4. Mutation for Saving
  const mutation = useMutation({
    mutationFn: ({ values, revision }: { values: SettingsFormValues; revision: number }) => {
      return api.put('/api/v1/admin/settings', values, { headers: { 'If-Match': String(revision) } });
    },
    onSuccess: async (_, variables) => {
      form.reset(variables.values);
      setLoadedRevision(variables.revision + 1);
      await queryClient.invalidateQueries({ queryKey: ['global-settings'] });
      toast.success('System settings updated successfully.');
    },
    onError: (err: unknown) => {
      void refetch();
      toast.error(errorMessage(err, 'Failed to update settings.'));
    },
  });

  const onSubmit = (values: SettingsFormValues) => {
    if (settingsData) mutation.mutate({ values, revision: settingsData.revision });
  };

  if (isLoading) {
    return (
      <div className="flex h-[80vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive" className="m-6">
        <AlertTriangle className="h-4 w-4" />
        <AlertTitle>Error Loading Settings</AlertTitle>
        <AlertDescription>
          {error?.message || 'Could not retrieve system settings. Please try again.'}
        </AlertDescription>
        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Retry
        </Button>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto max-w-5xl py-8 space-y-8">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-8 w-8 text-primary" />
            Global System Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure platform-wide security, defaults, and infrastructure policies.
          </p>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            onClick={() => refetch()}
            disabled={isLoading}
          >
            <RefreshCw className="mr-2 h-4 w-4" /> Reload
          </Button>
          <Button
            onClick={form.handleSubmit(onSubmit)}
            disabled={mutation.isPending || !form.formState.isDirty}
          >
            {mutation.isPending ? (
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save className="mr-2 h-4 w-4" />
            )}
            Save Changes
          </Button>
        </div>
      </div>

      {settingsData && isDirty && loadedRevision !== null && settingsData.revision > loadedRevision && (
        <Alert variant="destructive">
          <AlertTriangle className="h-4 w-4" />
          <AlertTitle>Newer settings are available</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            Another session saved a newer version. Your edits are preserved; reload the server version before saving again.
            <Button type="button" variant="outline" size="sm" onClick={() => { form.reset(settingsData.settings); setLoadedRevision(settingsData.revision); }}>Reload server version</Button>
          </AlertDescription>
        </Alert>
      )}

      {/* Tabs Layout */}
      <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
        <TabsList className="grid w-full grid-cols-2 lg:w-[600px]">
          <TabsTrigger value="general">General & Availability</TabsTrigger>
          <TabsTrigger value="security">Security & Auth</TabsTrigger>
        </TabsList>

        {/* ── General Tab ── */}
        <TabsContent value="general" className="space-y-6">
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Globe className="h-5 w-5 text-primary" />
                Platform Availability
              </CardTitle>
              <CardDescription>
                Control global platform states and registration policies.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* Maintenance Mode */}
              <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium flex items-center gap-2">
                    Maintenance Mode
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Suspend all public access and display a maintenance page. Super Admins can still log in.
                  </p>
                </div>
                <Switch
                  checked={form.watch('maintenanceMode')}
                  onCheckedChange={(checked) => form.setValue('maintenanceMode', checked, { shouldDirty: true })}
                />
              </div>

              {/* Allow Registrations */}
              <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Allow New Registrations</Label>
                  <p className="text-sm text-muted-foreground">
                    Allow new patients and tenants to sign up via the public portal.
                  </p>
                </div>
                <Switch
                  checked={form.watch('allowRegistration')}
                  onCheckedChange={(checked) => form.setValue('allowRegistration', checked, { shouldDirty: true })}
                />
              </div>

              {/* Default Plan */}
              <div className="grid gap-2 border rounded-lg p-4">
                <Label htmlFor="defaultTenantPlan" className="text-base font-medium">Default Tenant Plan</Label>
                <select
                  id="defaultTenantPlan"
                  {...form.register('defaultTenantPlan')}
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50"
                >
                  <option value="FREE">Free Tier</option>
                  <option value="PRO">Pro Tier</option>
                  <option value="ENTERPRISE">Enterprise Tier</option>
                </select>
              </div>

              {/* Support Email */}
              <div className="grid gap-2 border rounded-lg p-4">
                <Label htmlFor="supportEmail" className="text-base font-medium">Support Email</Label>
                <div className="relative">
                  <Mail className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    id="supportEmail"
                    className="pl-9"
                    placeholder="support@caresync.com"
                    {...form.register('supportEmail')}
                  />
                </div>
                {form.formState.errors.supportEmail && (
                  <p className="text-sm text-destructive">{form.formState.errors.supportEmail.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Database className="h-5 w-5 text-primary" />
                System Integrations
              </CardTitle>
              <CardDescription>
                Configure webhooks and audit logging. (Infrastructure secrets are managed via Render environment variables).
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="flex items-center justify-between space-x-2 rounded-lg border p-4">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium">Enable Audit Logging</Label>
                  <p className="text-sm text-muted-foreground">
                    Record all admin actions, logins, and data mutations to the immutable audit log.
                  </p>
                </div>
                <Switch
                  checked={form.watch('enableAuditLogging')}
                  onCheckedChange={(checked) => form.setValue('enableAuditLogging', checked, { shouldDirty: true })}
                />
              </div>

              <div className="grid gap-2 border rounded-lg p-4">
                <Label htmlFor="webhookUrl" className="text-base font-medium">Global Webhook URL</Label>
                <Input
                  id="webhookUrl"
                  placeholder="https://api.yourdomain.com/webhooks/caresync"
                  {...form.register('webhookUrl')}
                />
                <p className="text-xs text-muted-foreground">Used for triggering external events (e.g., Slack alerts, billing sync).</p>
                {form.formState.errors.webhookUrl && (
                  <p className="text-sm text-destructive">{form.formState.errors.webhookUrl.message}</p>
                )}
              </div>
            </CardContent>
          </Card>
        </TabsContent>

        {/* ── Security Tab ── */}
        <TabsContent value="security" className="space-y-6">
          <Card className="border-destructive/50">
            <CardHeader>
              <CardTitle className="flex items-center gap-2 text-destructive">
                <Shield className="h-5 w-5" />
                Security Policies (OWASP Strict Mode)
              </CardTitle>
              <CardDescription>
                Enforce strict authentication and authorization rules across the platform.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              {/* MFA */}
              <div className="flex items-center justify-between space-x-2 rounded-lg border p-4 border-destructive/20 bg-destructive/5">
                <div className="space-y-0.5">
                  <Label className="text-base font-medium flex items-center gap-2">
                    <Lock className="h-4 w-4" /> Enforce Multi-Factor Authentication (MFA)
                  </Label>
                  <p className="text-sm text-muted-foreground">
                    Force all Super Admins and Tenant Admins to set up MFA before accessing the dashboard.
                  </p>
                </div>
                <Switch
                  checked={form.watch('enforceMfa')}
                  onCheckedChange={(checked) => form.setValue('enforceMfa', checked, { shouldDirty: true })}
                />
              </div>

              {/* Session Timeout */}
              <div className="grid gap-2 border rounded-lg p-4">
                <Label htmlFor="sessionTimeoutMinutes" className="text-base font-medium">Session Timeout (Minutes)</Label>
                <Input
                  id="sessionTimeoutMinutes"
                  type="number"
                  {...form.register('sessionTimeoutMinutes', { valueAsNumber: true })}
                />
                <p className="text-xs text-muted-foreground">Users will be logged out after this period of inactivity.</p>
                {form.formState.errors.sessionTimeoutMinutes && (
                  <p className="text-sm text-destructive">{form.formState.errors.sessionTimeoutMinutes.message}</p>
                )}
              </div>

              {/* Max Login Attempts */}
              <div className="grid gap-2 border rounded-lg p-4">
                <Label htmlFor="maxLoginAttempts" className="text-base font-medium">Max Login Attempts</Label>
                <Input
                  id="maxLoginAttempts"
                  type="number"
                  {...form.register('maxLoginAttempts', { valueAsNumber: true })}
                />
                <p className="text-xs text-muted-foreground">Number of failed attempts before an account is temporarily locked.</p>
                {form.formState.errors.maxLoginAttempts && (
                  <p className="text-sm text-destructive">{form.formState.errors.maxLoginAttempts.message}</p>
                )}
              </div>

              {/* Password Min Length */}
              <div className="grid gap-2 border rounded-lg p-4">
                <Label htmlFor="passwordMinLength" className="text-base font-medium">Minimum Password Length</Label>
                <Input
                  id="passwordMinLength"
                  type="number"
                  {...form.register('passwordMinLength', { valueAsNumber: true })}
                />
                {form.formState.errors.passwordMinLength && (
                  <p className="text-sm text-destructive">{form.formState.errors.passwordMinLength.message}</p>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <Key className="h-5 w-5 text-primary" />
                API Configuration
              </CardTitle>
              <CardDescription>
                Global rate limits for the API Gateway.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-6">
              <div className="grid gap-2 border rounded-lg p-4">
                <Label htmlFor="apiRateLimit" className="text-base font-medium flex items-center gap-2">
                  <Zap className="h-4 w-4" /> Global Rate Limit (Requests per Minute)
                </Label>
                <Input
                  id="apiRateLimit"
                  type="number"
                  {...form.register('apiRateLimit', { valueAsNumber: true })}
                />
                <p className="text-xs text-muted-foreground">Applies to authenticated requests across all tenants.</p>
                {form.formState.errors.apiRateLimit && (
                  <p className="text-sm text-destructive">{form.formState.errors.apiRateLimit.message}</p>
                )}
              </div>
            </CardContent>
            <CardFooter className="bg-muted/50 rounded-b-xl border-t px-6 py-4">
              <Alert className="w-full">
                <AlertTriangle className="h-4 w-4" />
                <AlertTitle>Warning</AlertTitle>
                <AlertDescription>
                  Changing API rate limits requires a backend restart to take full effect across the Render Gateway.
                </AlertDescription>
              </Alert>
            </CardFooter>
          </Card>
        </TabsContent>
      </Tabs>
    </div>
  );
}
