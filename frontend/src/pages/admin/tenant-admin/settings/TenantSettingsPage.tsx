import { useState, useEffect } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { toast } from 'sonner';
import { errorMessage } from '@/lib/error-message';
import type { UseFormReturn } from 'react-hook-form';
import {
  Settings,
  Save,
  Loader2,
  AlertCircle,
  RefreshCw,
  Building2,
  Mail,
  Phone,
  Globe,
  Clock,
  Palette,
  Bell,
  Shield,
  FileText,
  Info,
  MapPin,
  Calendar,
  Upload,
  Image as ImageIcon,
  Languages,
} from 'lucide-react';

import api from '@/lib/api-client';
import { useAuthStore } from '@/stores/auth-store';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle, CardDescription, CardFooter } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Alert, AlertDescription, AlertTitle } from '@/components/ui/alert';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { Skeleton } from '@/components/ui/skeleton';
import { Switch } from '@/components/ui/switch';
import { Textarea } from '@/components/ui/textarea';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
} from '@/components/ui/tabs';

// ─────────────────────────────────────────────────────────────
// Zod Schema
// ─────────────────────────────────────────────────────────────
const tenantSettingsSchema = z.object({
  // Profile
  name: z.string().min(2, 'Name is required'),
  description: z.string().max(500).optional(),
  logoUrl: z.string().url().or(z.literal('')).optional(),
  primaryColor: z.string().regex(/^#([0-9A-F]{3}){1,2}$/i, 'Must be a valid hex color').optional(),
  // Contact
  contactEmail: z.string().email('Invalid email'),
  contactPhone: z.string().optional(),
  website: z.string().url().or(z.literal('')).optional(),
  // Location
  address: z.string().optional(),
  city: z.string().optional(),
  country: z.string().optional(),
  timezone: z.string(),
  // Hours
  operatingHours: z.object({
    monday: z.string(),
    tuesday: z.string(),
    wednesday: z.string(),
    thursday: z.string(),
    friday: z.string(),
    saturday: z.string(),
    sunday: z.string(),
  }),
  // Notifications
  notifyOnNewPatient: z.boolean(),
  notifyOnNewAppointment: z.boolean(),
  notifyOnInvoicePaid: z.boolean(),
  notifyOnLowStock: z.boolean(),
  // Localization
  defaultLanguage: z.enum(['en', 'st', 'af']),
  currency: z.enum(['LSL', 'ZAR', 'USD']),
});

type TenantSettingsFormValues = z.infer<typeof tenantSettingsSchema>;

const DEFAULT_HOURS = {
  monday: '08:00 - 17:00',
  tuesday: '08:00 - 17:00',
  wednesday: '08:00 - 17:00',
  thursday: '08:00 - 17:00',
  friday: '08:00 - 17:00',
  saturday: '09:00 - 13:00',
  sunday: 'Closed',
};

// ─────────────────────────────────────────────────────────────
// Main Component
// ─────────────────────────────────────────────────────────────
export default function TenantSettingsPage() {
  const tenantId = useAuthStore((state) => state.user?.tenantId);
  const queryClient = useQueryClient();
  const [activeTab, setActiveTab] = useState('profile');

  // Fetch Settings
  const { data: settingsData, isLoading, isError, error, refetch } = useQuery({
    queryKey: ['tenant-settings', tenantId],
    queryFn: async () => {
      const response = await api.get('/api/v1/tenant/settings');
      const revision = Number(String(response.headers.etag ?? '0').replaceAll('"', ''));
      return { settings: response.data.data as TenantSettingsFormValues, revision };
    },
    staleTime: 0,
    refetchInterval: 30_000,
    enabled: !!tenantId,
  });

  // Form
  const form = useForm<TenantSettingsFormValues>({
    resolver: zodResolver(tenantSettingsSchema),
    defaultValues: {
      name: '',
      description: '',
      logoUrl: '',
      primaryColor: '#0ea5e9',
      contactEmail: '',
      contactPhone: '',
      website: '',
      address: '',
      city: '',
      country: '',
      timezone: 'Africa/Maseru',
      operatingHours: DEFAULT_HOURS,
      notifyOnNewPatient: true,
      notifyOnNewAppointment: true,
      notifyOnInvoicePaid: false,
      notifyOnLowStock: true,
      defaultLanguage: 'en',
      currency: 'LSL',
    },
  });
  const isDirty = form.formState.isDirty;
  const [loadedRevision, setLoadedRevision] = useState<number | null>(null);

  useEffect(() => {
    if (settingsData && !isDirty) {
      form.reset(settingsData.settings);
      setLoadedRevision(settingsData.revision);
    }
  }, [settingsData, form, isDirty]);

  // Save Mutation
  const saveMutation = useMutation({
    mutationFn: ({ values, revision }: { values: TenantSettingsFormValues; revision: number }) => api.put('/api/v1/tenant/settings', values, { headers: { 'If-Match': String(revision) } }),
    onSuccess: async (_, variables) => {
      toast.success('Tenant settings saved.');
      form.reset(variables.values);
      setLoadedRevision(variables.revision + 1);
      await queryClient.invalidateQueries({ queryKey: ['tenant-settings', tenantId] });
    },
    onError: (err: unknown) => {
      void refetch();
      toast.error(errorMessage(err, 'Failed to save settings.'));
    },
  });

  const onSubmit = (values: TenantSettingsFormValues) => {
    if (settingsData) saveMutation.mutate({ values, revision: settingsData.revision });
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

  if (isLoading) {
    return (
      <div className="container mx-auto max-w-4xl py-8 space-y-6">
        <Skeleton className="h-12 w-64" />
        <Skeleton className="h-96 w-full" />
      </div>
    );
  }

  if (isError) {
    return (
      <Alert variant="destructive" className="m-6">
        <AlertCircle className="h-4 w-4" />
        <AlertTitle>Error Loading Settings</AlertTitle>
        <AlertDescription>{error?.message || 'Could not load tenant settings.'}</AlertDescription>
        <Button variant="outline" className="mt-4" onClick={() => refetch()}>
          <RefreshCw className="mr-2 h-4 w-4" /> Retry
        </Button>
      </Alert>
    );
  }

  return (
    <div className="container mx-auto max-w-4xl py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight flex items-center gap-2">
            <Settings className="h-8 w-8 text-primary" />
            Tenant Settings
          </h1>
          <p className="text-muted-foreground mt-1">
            Configure your clinic's profile, branding, hours, and notifications.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {isDirty && (
            <Button variant="outline" onClick={() => { if (settingsData) { form.reset(settingsData.settings); setLoadedRevision(settingsData.revision); } }} disabled={saveMutation.isPending}>
              <RefreshCw className="mr-2 h-4 w-4" /> Discard
            </Button>
          )}
          <Button onClick={form.handleSubmit(onSubmit)} disabled={!isDirty || saveMutation.isPending}>
            {saveMutation.isPending ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
            Save Changes
          </Button>
        </div>
      </div>

      {settingsData && isDirty && loadedRevision !== null && settingsData.revision > loadedRevision && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Newer settings are available</AlertTitle>
          <AlertDescription className="flex flex-wrap items-center justify-between gap-3">
            Another session saved a newer version. Your edits are preserved; reload the server version before saving again.
            <Button type="button" variant="outline" size="sm" onClick={() => { form.reset(settingsData.settings); setLoadedRevision(settingsData.revision); }}>Reload server version</Button>
          </AlertDescription>
        </Alert>
      )}

      {isDirty && (
        <Alert className="border-amber-500/50 bg-amber-50 dark:bg-amber-950">
          <AlertCircle className="h-4 w-4 text-amber-600" />
          <AlertTitle>Unsaved Changes</AlertTitle>
          <AlertDescription>You have unsaved changes to tenant settings. Click Save to apply them.</AlertDescription>
        </Alert>
      )}

      <form onSubmit={form.handleSubmit(onSubmit)}>
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="grid w-full grid-cols-2 lg:grid-cols-4">
            <TabsTrigger value="profile">Profile</TabsTrigger>
            <TabsTrigger value="contact">Contact</TabsTrigger>
            <TabsTrigger value="hours">Hours</TabsTrigger>
            <TabsTrigger value="preferences">Preferences</TabsTrigger>
          </TabsList>

          {/* ── Profile Tab ── */}
          <TabsContent value="profile" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Building2 className="h-4 w-4 text-primary" /> Organization Profile
                </CardTitle>
                <CardDescription>Basic identity for your clinic or practice.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="name">Organization Name <span className="text-destructive">*</span></Label>
                  <Input id="name" {...form.register('name')} />
                  {form.formState.errors.name && <p className="text-sm text-destructive">{form.formState.errors.name.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="description">Description</Label>
                  <Textarea
                    id="description"
                    rows={3}
                    placeholder="Brief description of your clinic..."
                    {...form.register('description')}
                  />
                  <p className="text-xs text-muted-foreground">Max 500 characters.</p>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Palette className="h-4 w-4 text-primary" /> Branding
                </CardTitle>
                <CardDescription>Customize the appearance of your tenant portal.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="logoUrl">Logo URL</Label>
                  <div className="relative">
                    <ImageIcon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="logoUrl" placeholder="https://cdn.example.com/logo.png" className="pl-9" {...form.register('logoUrl')} />
                  </div>
                  <p className="text-xs text-muted-foreground">Upload your logo to Supabase Storage and paste the public URL.</p>
                  {form.formState.errors.logoUrl && <p className="text-sm text-destructive">{form.formState.errors.logoUrl.message}</p>}
                </div>
                <div className="space-y-2">
                  <Label htmlFor="primaryColor">Primary Brand Color</Label>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      {...form.register('primaryColor')}
                      className="h-10 w-16 rounded border cursor-pointer"
                    />
                    <Input
                      id="primaryColor"
                      className="flex-1 font-mono"
                      placeholder="#0ea5e9"
                      {...form.register('primaryColor')}
                    />
                  </div>
                  {form.formState.errors.primaryColor && <p className="text-sm text-destructive">{form.formState.errors.primaryColor.message}</p>}
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Contact Tab ── */}
          <TabsContent value="contact" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Mail className="h-4 w-4 text-primary" /> Contact Information
                </CardTitle>
                <CardDescription>Public contact details shown to patients.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="contactEmail">Contact Email <span className="text-destructive">*</span></Label>
                    <Input id="contactEmail" type="email" placeholder="info@clinic.com" {...form.register('contactEmail')} />
                    {form.formState.errors.contactEmail && <p className="text-sm text-destructive">{form.formState.errors.contactEmail.message}</p>}
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="contactPhone">Contact Phone</Label>
                    <div className="relative">
                      <Phone className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input id="contactPhone" type="tel" placeholder="+266 1234 5678" className="pl-9" {...form.register('contactPhone')} />
                    </div>
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="website">Website</Label>
                  <div className="relative">
                    <Globe className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="website" placeholder="https://clinic.com" className="pl-9" {...form.register('website')} />
                  </div>
                  {form.formState.errors.website && <p className="text-sm text-destructive">{form.formState.errors.website.message}</p>}
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <MapPin className="h-4 w-4 text-primary" /> Location
                </CardTitle>
                <CardDescription>Physical location of your clinic.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="space-y-2">
                  <Label htmlFor="address">Street Address</Label>
                  <Input id="address" placeholder="123 Main Street" {...form.register('address')} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <Label htmlFor="city">City</Label>
                    <Input id="city" placeholder="Maseru" {...form.register('city')} />
                  </div>
                  <div className="space-y-2">
                    <Label htmlFor="country">Country</Label>
                    <Input id="country" placeholder="Lesotho" {...form.register('country')} />
                  </div>
                </div>
                <div className="space-y-2">
                  <Label htmlFor="timezone">Timezone</Label>
                  <div className="relative">
                    <Clock className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                    <Input id="timezone" placeholder="Africa/Maseru" className="pl-9" {...form.register('timezone')} />
                  </div>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Hours Tab ── */}
          <TabsContent value="hours" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Calendar className="h-4 w-4 text-primary" /> Operating Hours
                </CardTitle>
                <CardDescription>When your clinic is open for appointments.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                {(['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'] as const).map((day) => (
                  <div key={day} className="flex items-center gap-4">
                    <span className="w-24 text-sm font-medium capitalize">{day}</span>
                    <Input
                      placeholder="08:00 - 17:00"
                      {...form.register(`operatingHours.${day}`)}
                      className="flex-1"
                    />
                  </div>
                ))}
                <Alert className="border-blue-500/50 bg-blue-50 dark:bg-blue-950">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertTitle>Format</AlertTitle>
                  <AlertDescription>Use format like "08:00 - 17:00" or "Closed". Appointments outside these hours may require admin override.</AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>

          {/* ── Preferences Tab ── */}
          <TabsContent value="preferences" className="space-y-6">
            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Bell className="h-4 w-4 text-primary" /> Notifications
                </CardTitle>
                <CardDescription>Control what triggers email and in-app alerts for your admins.</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <ToggleRow
                  label="New Patient Registered"
                  description="Notify admins when a new patient is added."
                  field="notifyOnNewPatient"
                  form={form}
                />
                <ToggleRow
                  label="New Appointment Booked"
                  description="Notify admins when an appointment is scheduled."
                  field="notifyOnNewAppointment"
                  form={form}
                />
                <ToggleRow
                  label="Invoice Paid"
                  description="Notify admins when a payment is received."
                  field="notifyOnInvoicePaid"
                  form={form}
                />
                <ToggleRow
                  label="Low Inventory Stock"
                  description="Notify when supplies drop below threshold."
                  field="notifyOnLowStock"
                  form={form}
                />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Languages className="h-4 w-4 text-primary" /> Localization
                </CardTitle>
                <CardDescription>Language and currency defaults for your tenant.</CardDescription>
              </CardHeader>
              <CardContent className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label>Default Language</Label>
                  <Select
                    value={form.watch('defaultLanguage')}
                    onValueChange={(v) => form.setValue('defaultLanguage', v as 'en' | 'st' | 'af', { shouldDirty: true })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="en">English</SelectItem>
                      <SelectItem value="st">Sesotho</SelectItem>
                      <SelectItem value="af">Afrikaans</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="space-y-2">
                  <Label>Currency</Label>
                  <Select
                    value={form.watch('currency')}
                    onValueChange={(v) => form.setValue('currency', v as 'LSL' | 'ZAR' | 'USD', { shouldDirty: true })}
                  >
                    <SelectTrigger><SelectValue /></SelectTrigger>
                    <SelectContent>
                      <SelectItem value="LSL">LSL — Lesotho Loti</SelectItem>
                      <SelectItem value="ZAR">ZAR — South African Rand</SelectItem>
                      <SelectItem value="USD">USD — US Dollar</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <CardTitle className="text-base flex items-center gap-2">
                  <Shield className="h-4 w-4 text-primary" /> Security & Compliance
                </CardTitle>
                <CardDescription>Data residency and compliance policies.</CardDescription>
              </CardHeader>
              <CardContent>
                <Alert className="border-blue-500/50 bg-blue-50 dark:bg-blue-950">
                  <Info className="h-4 w-4 text-blue-600" />
                  <AlertTitle>Enterprise Compliance</AlertTitle>
                  <AlertDescription>
                    Data retention policies, MFA enforcement, and audit log access are managed by your platform administrator. Contact support to change your compliance plan.
                  </AlertDescription>
                </Alert>
              </CardContent>
            </Card>
          </TabsContent>
        </Tabs>
      </form>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Sub-components
// ─────────────────────────────────────────────────────────────
function ToggleRow({
  label,
  description,
  field,
  form,
}: {
  label: string;
  description: string;
  field: keyof TenantSettingsFormValues;
  form: UseFormReturn<TenantSettingsFormValues>;
}) {
  return (
    <div className="flex items-start justify-between gap-3 p-4 rounded-lg border">
      <div>
        <Label className="text-base">{label}</Label>
        <p className="text-sm text-muted-foreground">{description}</p>
      </div>
      <Switch
        checked={form.watch(field) as boolean}
        onCheckedChange={(v) => form.setValue(field, v, { shouldDirty: true })}
      />
    </div>
  );
}
