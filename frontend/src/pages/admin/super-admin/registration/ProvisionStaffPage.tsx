import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { isAxiosError } from 'axios';
import {
  Building2,
  Shield,
  ShieldCheck,
  Mail,
  User,
  Phone,
  Search,
  Loader2,
  AlertCircle,
  CheckCircle2,
  ChevronRight,
  ArrowLeft,
  Lock,
  FileText,
  Activity,
  CreditCard,
  Eye,
  ClipboardCheck,
  KeyRound,
  Link2,
  AlertTriangle,
  Briefcase,
  BadgeCheck,
  Fingerprint,
  Send,
  Wand2,
  X,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api-client';

// ─────────────────────────────────────────────────────────────
// Role catalogue (matches SYSTEM_USERS_AND_RESPONSIBILITIES.txt)
// ─────────────────────────────────────────────────────────────
type RoleId =
  | 'TENANT_ADMIN'
  | 'MANAGER'
  | 'PROVIDER'
  | 'CLINICIAN'
  | 'RECEPTION'
  | 'RECEPTIONIST'
  | 'STAFF'
  | 'FINANCE'
  | 'CONSENT_MANAGER'
  | 'PRIVACY_OFFICER';

interface RoleDef {
  id: RoleId;
  name: string;
  description: string;
  scope: 'PLATFORM' | 'TENANT';
  requiresTenant: boolean;
  requiresProviderLink: boolean;
  icon: typeof Shield;
  color: string;
}

const ROLES: RoleDef[] = [
  { id: 'TENANT_ADMIN', name: 'Tenant Admin', description: 'Administers one tenant.', scope: 'TENANT', requiresTenant: true, requiresProviderLink: false, icon: Shield, color: 'blue' },
  { id: 'MANAGER', name: 'Manager', description: 'Day-to-day tenant operations.', scope: 'TENANT', requiresTenant: true, requiresProviderLink: false, icon: ClipboardCheck, color: 'sky' },
  { id: 'PROVIDER', name: 'Provider', description: 'Clinical care. Requires provider record.', scope: 'TENANT', requiresTenant: true, requiresProviderLink: true, icon: Activity, color: 'emerald' },
  { id: 'CLINICIAN', name: 'Clinician', description: 'Clinical services & documentation.', scope: 'TENANT', requiresTenant: true, requiresProviderLink: true, icon: Activity, color: 'teal' },
  { id: 'RECEPTION', name: 'Reception', description: 'Front-desk operations.', scope: 'TENANT', requiresTenant: true, requiresProviderLink: false, icon: User, color: 'cyan' },
  { id: 'RECEPTIONIST', name: 'Receptionist', description: 'Patient registration and check-in.', scope: 'TENANT', requiresTenant: true, requiresProviderLink: false, icon: User, color: 'cyan' },
  { id: 'STAFF', name: 'Staff', description: 'General operational tasks.', scope: 'TENANT', requiresTenant: true, requiresProviderLink: false, icon: FileText, color: 'gray' },
  { id: 'FINANCE', name: 'Finance', description: 'Invoices, payments, billing.', scope: 'TENANT', requiresTenant: true, requiresProviderLink: false, icon: CreditCard, color: 'amber' },
  { id: 'CONSENT_MANAGER', name: 'Consent Manager', description: 'Patient consent workflows.', scope: 'TENANT', requiresTenant: true, requiresProviderLink: false, icon: FileText, color: 'rose' },
  { id: 'PRIVACY_OFFICER', name: 'Privacy Officer', description: 'Privacy and consent governance.', scope: 'TENANT', requiresTenant: true, requiresProviderLink: false, icon: Eye, color: 'pink' },
];

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
  status: string;
}

interface ProviderRecord {
  id: string;
  name: string;
  specialisation: string;
}

interface ApiEnvelope<T> {
  data: T;
}

type ProvisionMode = 'NEW_INVITE' | 'LINK_EXISTING';

interface FormState {
  mode: ProvisionMode;
  email: string;
  firebaseUid: string;
  fullName: string;
  phone: string;
  jobTitle: string;
  role: RoleId | '';
  tenantId: string;
  providerId: string;
  providerSpecialisation: string;
  sendWelcomeEmail: boolean;
  requireEmailVerification: boolean;
  notes: string;
  approveRequestId?: string;
}

const STEPS = [
  { id: 1, label: 'Account', icon: KeyRound },
  { id: 2, label: 'Identity', icon: User },
  { id: 3, label: 'Role & Tenant', icon: Shield },
  { id: 4, label: 'Provider Link', icon: Link2 },
  { id: 5, label: 'Review', icon: ClipboardCheck },
] as const;

const EMAIL_RE = /^\S+@\S+\.\S+$/;
const PHONE_RE = /^\+?[0-9 ()-]{7,20}$/;

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export default function ProvisionStaffPage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();

  const presetEmail = searchParams.get('email') ?? '';
  const presetUid = searchParams.get('firebaseUid') ?? '';
  const presetTenantId = searchParams.get('tenantId') ?? '';
  const approveRequestId = searchParams.get('requestId') ?? undefined;

  const [step, setStep] = useState(1);
  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const [form, setForm] = useState<FormState>({
    mode: presetUid ? 'LINK_EXISTING' : 'NEW_INVITE',
    email: presetEmail,
    firebaseUid: presetUid,
    fullName: '',
    phone: '',
    jobTitle: '',
    role: '',
    tenantId: presetTenantId,
    providerId: '',
    providerSpecialisation: '',
    sendWelcomeEmail: true,
    requireEmailVerification: true,
    notes: '',
    approveRequestId,
  });

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoadingTenants, setIsLoadingTenants] = useState(false);
  const [providers, setProviders] = useState<ProviderRecord[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);

  const [lookupStatus, setLookupStatus] = useState<
    'idle' | 'searching' | 'found' | 'not-found'
  >('idle');

  const selectedRole = useMemo(() => ROLES.find((r) => r.id === form.role), [form.role]);
  const requiresTenant = selectedRole?.requiresTenant ?? true;
  const requiresProviderLink = selectedRole?.requiresProviderLink ?? false;

  // Pre-fill from query when arriving from approve flow
  useEffect(() => {
    if (presetEmail && presetUid) {
      setLookupStatus('found');
    }
  }, [presetEmail, presetUid]);

  // Load tenants
  useEffect(() => {
    const load = async () => {
      setIsLoadingTenants(true);
      try {
        const response = await api.get<ApiEnvelope<{ content: Tenant[] }> | { content: Tenant[] }>(
          '/api/v1/admin/tenants',
          { params: { size: 200, status: 'ACTIVE' } },
        );
        const result = response.data;
        const data = 'data' in result ? result.data : result;
        setTenants(data.content ?? []);
      } catch (loadError) {
        const message = isAxiosError<{ message?: string }>(loadError)
          ? loadError.response?.data?.message ?? 'Could not load active tenants.'
          : 'Could not load active tenants.';
        setError(message);
        toast.error(message);
      } finally {
        setIsLoadingTenants(false);
      }
    };
    load();
  }, []);

  // Load providers when tenant changes
  useEffect(() => {
    if (!form.tenantId || !requiresProviderLink) {
      setProviders([]);
      return;
    }
    const load = async () => {
      setIsLoadingProviders(true);
      try {
        const response = await api.get<ApiEnvelope<ProviderRecord[]> | ProviderRecord[]>(
          `/api/v1/admin/tenants/${form.tenantId}/providers`,
        );
        const result = response.data;
        setProviders(Array.isArray(result) ? result : result.data);
      } catch (loadError) {
        const message = isAxiosError<{ message?: string }>(loadError)
          ? loadError.response?.data?.message ?? 'Could not load providers for this tenant.'
          : 'Could not load providers for this tenant.';
        setError(message);
        toast.error(message);
      } finally {
        setIsLoadingProviders(false);
      }
    };
    load();
  }, [form.tenantId, requiresProviderLink]);

  // ───────────────────────────────────────────────
  // Firebase lookup
  // ───────────────────────────────────────────────
  const lookupFirebase = async () => {
    if (!EMAIL_RE.test(form.email)) {
      setError('Enter a valid email address first');
      return;
    }
    setLookupStatus('searching');
    setError(null);
    try {
      const response = await api.get<
        ApiEnvelope<{ firebaseUid: string; displayName?: string | null }>
      >(
        '/api/v1/admin/firebase/users/lookup',
        {
          params: { email: form.email },
          validateStatus: (status) => status < 500,
        },
      );
      if (response.status === 404) {
        setLookupStatus('not-found');
        setForm((f) => ({ ...f, firebaseUid: '', mode: 'NEW_INVITE' }));
        return;
      }
      const data = response.data.data;
      setForm((f) => ({
        ...f,
        firebaseUid: data.firebaseUid,
        fullName: f.fullName || data.displayName || '',
        mode: 'LINK_EXISTING',
      }));
      setLookupStatus('found');
    } catch (lookupError) {
      const message = isAxiosError<{ message?: string }>(lookupError)
        ? lookupError.response?.data?.message ?? 'Could not look up this Firebase account.'
        : 'Could not look up this Firebase account.';
      setError(message);
      toast.error(message);
      setLookupStatus('idle');
    }
  };

  // ───────────────────────────────────────────────
  // Validation
  // ───────────────────────────────────────────────
  const validation = useMemo(() => {
    const v: Record<string, string | null> = {};

    if (!form.email.trim()) v.email = 'Email required';
    else if (!EMAIL_RE.test(form.email)) v.email = 'Invalid email';

    if (form.mode === 'LINK_EXISTING' && !form.firebaseUid.trim())
      v.firebaseUid = 'Firebase UID required for existing accounts';

    if (!form.fullName.trim()) v.fullName = 'Full name required';
    else if (form.fullName.trim().length < 2) v.fullName = 'Too short';

    if (form.phone && !PHONE_RE.test(form.phone)) v.phone = 'Invalid phone';

    if (!form.role) v.role = 'Select a role';
    if (requiresTenant && !form.tenantId) v.tenantId = 'Tenant required';
    if (requiresProviderLink && !form.providerId)
      v.providerId = 'Provider record required';

    return v;
  }, [form, requiresTenant, requiresProviderLink]);

  const stepValid = (s: number) => {
    if (s === 1) {
      return (
        !validation.email &&
        (form.mode === 'NEW_INVITE' || !validation.firebaseUid)
      );
    }
    if (s === 2) return !validation.fullName && !validation.phone;
    if (s === 3)
      return !validation.role && (!requiresTenant || !validation.tenantId);
    if (s === 4) return !requiresProviderLink || !validation.providerId;
    return true;
  };

  const displaySteps = requiresProviderLink
    ? STEPS
    : STEPS.filter((s) => s.id !== 4);

  const next = () => {
    if (!stepValid(step)) {
      Object.keys(validation).forEach((k) =>
        setTouched((p) => ({ ...p, [k]: true }))
      );
      setError('Please fix the highlighted fields');
      return;
    }
    setError(null);
    if (step === 3 && !requiresProviderLink) setStep(5);
    else setStep((s) => Math.min(5, s + 1));
  };

  const back = () => {
    if (step === 1) return navigate('/admin/super/registration/requests');
    if (step === 5 && !requiresProviderLink) setStep(3);
    else setStep((s) => Math.max(1, s - 1));
    setError(null);
  };

  const submit = async () => {
    for (const s of [1, 2, 3, 4, 5]) {
      if (s === 4 && !requiresProviderLink) continue;
      if (!stepValid(s)) {
        setStep(s);
        setError('Some required fields are missing');
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);

    try {
      const payload = {
        email: form.email.trim().toLowerCase(),
        firebaseUid: form.firebaseUid || undefined,
        mode: form.mode,
        fullName: form.fullName.trim(),
        phone: form.phone || undefined,
        jobTitle: form.jobTitle || undefined,
        role: form.role,
        tenantId: requiresTenant ? form.tenantId : undefined,
        providerId: requiresProviderLink ? form.providerId : undefined,
        providerSpecialisation: form.providerSpecialisation || undefined,
        sendWelcomeEmail: form.sendWelcomeEmail,
        requireEmailVerification: form.requireEmailVerification,
        notes: form.notes || undefined,
        approveRequestId: form.approveRequestId,
      };

      const response = await api.post<ApiEnvelope<{ id?: string; email?: string }>>(
        '/api/v1/admin/users/provision',
        payload,
      );
      const created = response.data.data;
      toast.success(`User ${created.email ?? form.email} provisioned successfully`);
      navigate(`/admin/super/users/${created.id ?? ''}`);
    } catch (e) {
      const msg = isAxiosError<{ message?: string }>(e)
        ? e.response?.data?.message ?? 'Provisioning failed'
        : e instanceof Error ? e.message : 'Provisioning failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ───────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 dark:bg-slate-950">
      <div className="max-w-3xl mx-auto">
        {/* Breadcrumb */}
        <div className="mb-4 flex items-center gap-2 text-sm text-gray-500 dark:text-slate-400">
          <button
            onClick={() => navigate('/admin/super/registration/requests')}
            className="hover:text-gray-700 inline-flex items-center gap-1 dark:hover:text-slate-200"
          >
            <ArrowLeft className="w-3.5 h-3.5" />
            Registration requests
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="text-gray-900 font-medium dark:text-slate-50">Provision staff</span>
        </div>

        {/* Progress */}
        <div className="mb-6">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 top-5 h-0.5 bg-gray-200 dark:bg-slate-800" />
            <div
              className="absolute left-0 top-5 h-0.5 bg-indigo-600 transition-all duration-300"
              style={{ width: `${((step - 1) / (displaySteps.length - 1)) * 100}%` }}
            />
            {displaySteps.map((s) => {
              const Icon = s.icon;
              const done = step > s.id;
              const active = step === s.id;
              return (
                <div key={s.id} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center border-2 transition-colors ${ done ? 'bg-indigo-600 border-indigo-600 text-white' : active ? 'bg-white border-indigo-600 text-indigo-600 ring-4 ring-indigo-100' : 'bg-white border-gray-300 text-gray-400 dark:text-slate-300' } dark:border-slate-600 dark:text-slate-300`}
                  >
                    {done ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span
                    className={`mt-1.5 text-[11px] font-medium hidden sm:block ${ active ? 'text-indigo-700' : done ? 'text-indigo-600' : 'text-gray-500 dark:text-slate-400' }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden dark:bg-slate-900 dark:border-slate-700">
          <div className="px-6 py-5 border-b border-gray-200 flex items-start justify-between dark:border-slate-700">
            <div>
              <h1 className="text-xl font-bold text-gray-900 dark:text-slate-50">
                {step === 1 && 'Account'}
                {step === 2 && 'Personal identity'}
                {step === 3 && 'Role & tenant'}
                {step === 4 && 'Provider record link'}
                {step === 5 && 'Review & provision'}
              </h1>
              <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
                Step {step} of {displaySteps.length}
                {form.approveRequestId && (
                  <span className="ml-2 inline-flex items-center gap-1 text-xs bg-emerald-50 text-emerald-700 px-2 py-0.5 rounded-full">
                    <CheckCircle2 className="w-3 h-3" />
                    Approving request
                  </span>
                )}
              </p>
            </div>
            <button
              onClick={() => navigate('/admin/super/registration/requests')}
              className="p-1.5 rounded hover:bg-gray-100 text-gray-400 dark:hover:bg-slate-900 dark:text-slate-300"
              title="Cancel"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          <div className="px-6 py-6">
            {error && (
              <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* ── Step 1 ── */}
            {step === 1 && (
              <div className="space-y-5 animate-in fade-in">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-slate-200">
                    Provisioning mode
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    <button
                      type="button"
                      onClick={() =>
                        setForm((f) => ({ ...f, mode: 'NEW_INVITE', firebaseUid: '' }))
                      }
                      className={`text-left p-3 rounded-lg border-2 transition-all ${ form.mode === 'NEW_INVITE' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300 bg-white dark:bg-slate-900' } dark:hover:border-slate-600 dark:bg-slate-900`}
                    >
                      <div className="flex items-center gap-2">
                        <Send className="w-4 h-4 text-indigo-600" />
                        <p className="text-sm font-semibold text-gray-900 dark:text-slate-50">
                          Invite new user
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 dark:text-slate-400">
                        Send a Firebase invite email. The user creates their own account.
                      </p>
                    </button>
                    <button
                      type="button"
                      onClick={() => setForm((f) => ({ ...f, mode: 'LINK_EXISTING' }))}
                      className={`text-left p-3 rounded-lg border-2 transition-all ${ form.mode === 'LINK_EXISTING' ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300 bg-white dark:bg-slate-900' } dark:hover:border-slate-600 dark:bg-slate-900`}
                    >
                      <div className="flex items-center gap-2">
                        <Link2 className="w-4 h-4 text-indigo-600" />
                        <p className="text-sm font-semibold text-gray-900 dark:text-slate-50">
                          Link existing account
                        </p>
                      </div>
                      <p className="text-xs text-gray-500 mt-1 dark:text-slate-400">
                        Link an existing Firebase account (e.g. self-registered user).
                      </p>
                    </button>
                  </div>
                </div>

                <Field
                  label="Email"
                  id="email"
                  required
                  icon={Mail}
                  error={touched.email ? validation.email : null}
                >
                  <div className="flex gap-2">
                    <input
                      id="email"
                      type="email"
                      value={form.email}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, email: e.target.value }))
                      }
                      onBlur={() => setTouched((p) => ({ ...p, email: true }))}
                      placeholder="staff@clinic.com"
                      className={inputCls('email', touched.email, validation.email)}
                    />
                    <button
                      type="button"
                      onClick={lookupFirebase}
                      disabled={!EMAIL_RE.test(form.email) || lookupStatus === 'searching'}
                      className="inline-flex items-center gap-1 px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 dark:border-slate-600 dark:text-slate-200 dark:bg-slate-900 dark:hover:bg-slate-950"
                    >
                      {lookupStatus === 'searching' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                      Lookup
                    </button>
                  </div>
                  {lookupStatus === 'found' && (
                    <p className="mt-1 text-xs text-emerald-600 flex items-center gap-1">
                      <BadgeCheck className="w-3 h-3" />
                      Firebase account found & linked
                    </p>
                  )}
                  {lookupStatus === 'not-found' && (
                    <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      No Firebase account — invite email will be sent
                    </p>
                  )}
                </Field>

                {form.mode === 'LINK_EXISTING' && (
                  <Field
                    label="Firebase UID"
                    id="firebaseUid"
                    required
                    icon={Fingerprint}
                    error={touched.firebaseUid ? validation.firebaseUid : null}
                  >
                    <input
                      id="firebaseUid"
                      type="text"
                      value={form.firebaseUid}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, firebaseUid: e.target.value }))
                      }
                      onBlur={() =>
                        setTouched((p) => ({ ...p, firebaseUid: true }))
                      }
                      placeholder="e.g. 8dK2xQz9…"
                      className={`${inputCls(
                        'firebaseUid',
                        touched.firebaseUid,
                        validation.firebaseUid
                      )} font-mono`}
                    />
                  </Field>
                )}
              </div>
            )}

            {/* ── Step 2 ── */}
            {step === 2 && (
              <div className="space-y-5 animate-in fade-in">
                <Field
                  label="Full name"
                  id="fullName"
                  required
                  icon={User}
                  error={touched.fullName ? validation.fullName : null}
                >
                  <input
                    id="fullName"
                    type="text"
                    value={form.fullName}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, fullName: e.target.value }))
                    }
                    onBlur={() => setTouched((p) => ({ ...p, fullName: true }))}
                    placeholder="Dr. Jane Doe"
                    className={inputCls(
                      'fullName',
                      touched.fullName,
                      validation.fullName
                    )}
                  />
                </Field>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <Field
                    label="Phone (optional)"
                    id="phone"
                    icon={Phone}
                    error={touched.phone ? validation.phone : null}
                  >
                    <input
                      id="phone"
                      type="tel"
                      value={form.phone}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, phone: e.target.value }))
                      }
                      onBlur={() => setTouched((p) => ({ ...p, phone: true }))}
                      placeholder="+27 11 123 4567"
                      className={inputCls('phone', touched.phone, validation.phone)}
                    />
                  </Field>
                  <Field label="Job title (optional)" id="jobTitle" icon={Briefcase}>
                    <input
                      id="jobTitle"
                      type="text"
                      value={form.jobTitle}
                      onChange={(e) =>
                        setForm((f) => ({ ...f, jobTitle: e.target.value }))
                      }
                      placeholder="e.g. Senior Dentist"
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:ring-indigo-500 focus:border-indigo-500 dark:border-slate-600"
                    />
                  </Field>
                </div>
              </div>
            )}

            {/* ── Step 3 ── */}
            {step === 3 && (
              <div className="space-y-5 animate-in fade-in">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2 dark:text-slate-200">
                    Role <span className="text-red-500">*</span>
                  </label>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 max-h-80 overflow-y-auto pr-1">
                    {ROLES.map((role) => {
                      const Icon = role.icon;
                      const selected = form.role === role.id;
                      return (
                        <button
                          key={role.id}
                          type="button"
                          onClick={() => {
                            setForm((f) => ({
                              ...f,
                              role: role.id,
                              tenantId: role.requiresTenant ? f.tenantId : '',
                              providerId: role.requiresProviderLink
                                ? f.providerId
                                : '',
                            }));
                            setTouched((p) => ({ ...p, role: true }));
                          }}
                          className={`text-left p-3 rounded-lg border-2 transition-all ${ selected ? 'border-indigo-600 bg-indigo-50' : 'border-gray-200 hover:border-gray-300 bg-white dark:bg-slate-900' } dark:hover:border-slate-600 dark:bg-slate-900`}
                        >
                          <div className="flex items-start gap-2">
                            <div
                              className={`p-1.5 rounded-md flex-shrink-0 ${ selected ? 'bg-indigo-600 text-white' : 'bg-gray-100 text-gray-600 dark:text-slate-300' } dark:text-slate-300`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5 dark:text-slate-50">
                                {role.name}
                                {role.scope === 'PLATFORM' && (
                                  <Lock className="w-3 h-3 text-purple-500" />
                                )}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5 dark:text-slate-400">
                                {role.description}
                              </p>
                            </div>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                  {touched.role && validation.role && (
                    <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
                      <AlertCircle className="w-3 h-3" /> {validation.role}
                    </p>
                  )}
                </div>

                {requiresTenant && (
                  <Field
                    label="Tenant"
                    id="tenantId"
                    required
                    icon={Building2}
                    error={touched.tenantId ? validation.tenantId : null}
                  >
                    <select
                      id="tenantId"
                      value={form.tenantId}
                      onChange={(e) => {
                        setForm((f) => ({
                          ...f,
                          tenantId: e.target.value,
                          providerId: '',
                        }));
                        setTouched((p) => ({ ...p, tenantId: true }));
                      }}
                      disabled={isLoadingTenants}
                      className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm dark:border-slate-600"
                    >
                      <option value="">
                        {isLoadingTenants ? 'Loading…' : 'Select tenant'}
                      </option>
                      {tenants.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.subdomain})
                        </option>
                      ))}
                    </select>
                  </Field>
                )}

                {!requiresTenant && (
                  <div className="p-3 bg-purple-50 border border-purple-200 rounded-lg text-sm text-purple-800 flex items-start gap-2">
                    <Lock className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <p>
                      <strong>{selectedRole?.name}</strong> is a platform-level role. It has no
                      tenant scope and applies globally.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── Step 4 ── */}
            {step === 4 && requiresProviderLink && (
              <div className="space-y-5 animate-in fade-in">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800 flex items-start gap-2">
                  <Link2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong>{selectedRole?.name}</strong> roles must be linked to a provider
                    record so appointments, notes and consent resolve correctly.
                  </p>
                </div>

                <Field
                  label="Provider record"
                  id="providerId"
                  required
                  icon={Activity}
                  error={touched.providerId ? validation.providerId : null}
                  hint={isLoadingProviders ? 'Loading…' : undefined}
                >
                  <select
                    id="providerId"
                    value={form.providerId}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, providerId: e.target.value }));
                      setTouched((p) => ({ ...p, providerId: true }));
                    }}
                    disabled={isLoadingProviders}
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm dark:border-slate-600"
                  >
                    <option value="">
                      {isLoadingProviders ? 'Loading…' : 'Select provider'}
                    </option>
                    {providers.map((p) => (
                      <option key={p.id} value={p.id}>
                        {p.name}
                        {p.specialisation ? ` — ${p.specialisation}` : ''}
                      </option>
                    ))}
                  </select>
                </Field>

                {providers.length === 0 && !isLoadingProviders && form.tenantId && (
                  <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg text-sm text-amber-800 flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                    <div>
                      <p>No provider records exist for this tenant.</p>
                      <button
                        onClick={() =>
                          navigate(
                            `/admin/super/tenants/${form.tenantId}/providers/create`
                          )
                        }
                        className="mt-1 font-semibold underline"
                      >
                        Create one first →
                      </button>
                    </div>
                  </div>
                )}

                <Field
                  label="Specialisation (optional)"
                  id="providerSpecialisation"
                  icon={Briefcase}
                >
                  <input
                    id="providerSpecialisation"
                    type="text"
                    value={form.providerSpecialisation}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        providerSpecialisation: e.target.value,
                      }))
                    }
                    placeholder="e.g. General Practitioner, Dentist"
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm dark:border-slate-600"
                  />
                </Field>
              </div>
            )}

            {/* ── Step 5 ── */}
            {step === 5 && (
              <div className="space-y-5 animate-in fade-in">
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-sm text-indigo-800 flex items-start gap-2">
                  <Wand2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p>
                    The following will be written to Firebase + CareSync in one atomic
                    operation. Every step is audited.
                  </p>
                </div>

                <div className="border border-gray-200 rounded-lg divide-y divide-gray-200 dark:border-slate-700 dark:divide-slate-700">
                  <ReviewRow label="Email" value={form.email} />
                  <ReviewRow
                    label="Account mode"
                    value={
                      form.mode === 'NEW_INVITE'
                        ? 'Invite email (new Firebase account)'
                        : `Link existing Firebase UID`
                    }
                  />
                  {form.firebaseUid && (
                    <ReviewRow label="Firebase UID" value={form.firebaseUid} mono />
                  )}
                  <ReviewRow label="Full name" value={form.fullName} />
                  {form.phone && <ReviewRow label="Phone" value={form.phone} />}
                  {form.jobTitle && <ReviewRow label="Job title" value={form.jobTitle} />}
                  <ReviewRow label="Role" value={selectedRole?.name ?? '—'} />
                  <ReviewRow
                    label="Scope"
                    value={
                      selectedRole?.scope === 'PLATFORM'
                        ? 'Platform-wide (all tenants)'
                        : 'Tenant-scoped'
                    }
                  />
                  {requiresTenant && (
                    <ReviewRow
                      label="Tenant"
                      value={tenants.find((t) => t.id === form.tenantId)?.name ?? '—'}
                    />
                  )}
                  {requiresProviderLink && (
                    <ReviewRow
                      label="Provider record"
                      value={
                        providers.find((p) => p.id === form.providerId)?.name ?? '—'
                      }
                    />
                  )}
                </div>

                <div className="space-y-2">
                  <CheckboxRow
                    checked={form.sendWelcomeEmail}
                    onChange={(v) =>
                      setForm((f) => ({ ...f, sendWelcomeEmail: v }))
                    }
                    label="Send welcome email"
                    description="Onboarding instructions and first-login link."
                  />
                  <CheckboxRow
                    checked={form.requireEmailVerification}
                    onChange={(v) =>
                      setForm((f) => ({ ...f, requireEmailVerification: v }))
                    }
                    label="Require email verification"
                    description="User must verify email before first login."
                  />
                </div>

                <Field label="Admin notes (optional)" id="notes">
                  <textarea
                    id="notes"
                    rows={2}
                    value={form.notes}
                    onChange={(e) =>
                      setForm((f) => ({ ...f, notes: e.target.value }))
                    }
                    placeholder="Internal notes for audit trail"
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm dark:border-slate-600"
                  />
                </Field>
              </div>
            )}
          </div>

          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between dark:bg-slate-950 dark:border-slate-700">
            <button
              onClick={back}
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 dark:text-slate-200 dark:bg-slate-900 dark:border-slate-600 dark:hover:bg-slate-950"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {step === 1 ? 'Cancel' : 'Back'}
            </button>
            <button
              onClick={step === 5 ? submit : next}
              disabled={isSubmitting}
              className="inline-flex items-center px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {step === 5 ? 'Provision user' : 'Continue'}
              {step !== 5 && <ChevronRight className="w-4 h-4 ml-1" />}
            </button>
          </div>
        </div>

        <div className="mt-4 flex items-start gap-2 text-xs text-gray-500 dark:text-slate-400">
          <Lock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <p>
            Only <strong>SUPER_ADMIN</strong> or <strong>TENANT_ADMIN</strong> role claims can
            provision users. Every action is written to the immutable audit log with actor,
            timestamp and IP.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Small components
// ─────────────────────────────────────────────────────────────
function Field({
  label,
  id,
  required,
  error,
  hint,
  icon: Icon,
  children,
}: {
  label: string;
  id: string;
  required?: boolean;
  error?: string | null;
  hint?: string;
  icon?: typeof Mail;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5 dark:text-slate-200">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10 dark:text-slate-300" />
        )}
        {children}
      </div>
      {error ? (
        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-xs text-gray-500 dark:text-slate-400">{hint}</p>
      ) : null}
    </div>
  );
}

function CheckboxRow({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  label: string;
  description: string;
}) {
  return (
    <label className="flex items-start gap-3 p-3 bg-gray-50 rounded-lg border border-gray-200 hover:border-gray-300 cursor-pointer dark:bg-slate-950 dark:border-slate-700 dark:hover:border-slate-600">
      <input
        type="checkbox"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
        className="mt-0.5 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 rounded dark:border-slate-600"
      />
      <div>
        <p className="text-sm font-medium text-gray-900 dark:text-slate-50">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5 dark:text-slate-400">{description}</p>
      </div>
    </label>
  );
}

function ReviewRow({
  label,
  value,
  mono,
}: {
  label: string;
  value: string;
  mono?: boolean;
}) {
  return (
    <div className="px-4 py-3 flex items-start justify-between gap-4">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide dark:text-slate-400">
        {label}
      </span>
      <span
        className={`text-sm text-gray-900 font-medium text-right break-all ${ mono ? 'font-mono text-xs' : '' } dark:text-slate-50`}
      >
        {value || '—'}
      </span>
    </div>
  );
}

function inputCls(field: string, touched?: boolean, error?: string | null) {
  return `w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${ touched && error ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500' }`;
}
