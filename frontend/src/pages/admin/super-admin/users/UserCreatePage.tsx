import { useState, useEffect, useMemo } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
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
  Info,
  Lock,
  FileText,
  Activity,
  CreditCard,
  Eye,
  ClipboardCheck,
  KeyRound,
  Link2,
  AlertTriangle,
} from 'lucide-react';
import { toast } from 'sonner';

// ─────────────────────────────────────────────────────────────
// Role catalogue (matches SYSTEM_USERS_AND_RESPONSIBILITIES.txt)
// ─────────────────────────────────────────────────────────────
const ROLES = [
  {
    id: 'SUPER_ADMIN',
    name: 'Super Admin',
    description: 'Full cross-tenant system access. Platform owner only.',
    scope: 'PLATFORM' as const,
    color: 'purple',
    requiresTenant: false,
    requiresProviderLink: false,
    icon: ShieldCheck,
  },
  {
    id: 'TENANT_ADMIN',
    name: 'Tenant Admin',
    description: 'Administers one tenant. Cannot access other tenants.',
    scope: 'TENANT' as const,
    color: 'blue',
    requiresTenant: true,
    requiresProviderLink: false,
    icon: Shield,
  },
  {
    id: 'ADMIN',
    name: 'Admin',
    description: 'Organisation-wide admin within a tenant.',
    scope: 'TENANT' as const,
    color: 'indigo',
    requiresTenant: true,
    requiresProviderLink: false,
    icon: Shield,
  },
  {
    id: 'MANAGER',
    name: 'Manager',
    description: 'Coordinates day-to-day tenant operations.',
    scope: 'TENANT' as const,
    color: 'sky',
    requiresTenant: true,
    requiresProviderLink: false,
    icon: ClipboardCheck,
  },
  {
    id: 'PROVIDER',
    name: 'Provider',
    description: 'Delivers clinical care. Must be linked to a provider record.',
    scope: 'TENANT' as const,
    color: 'emerald',
    requiresTenant: true,
    requiresProviderLink: true,
    icon: Activity,
  },
  {
    id: 'CLINICIAN',
    name: 'Clinician',
    description: 'Provides clinical services and documentation.',
    scope: 'TENANT' as const,
    color: 'teal',
    requiresTenant: true,
    requiresProviderLink: true,
    icon: Activity,
  },
  {
    id: 'RECEPTION',
    name: 'Reception',
    description: 'Handles patient-facing front-desk operations.',
    scope: 'TENANT' as const,
    color: 'cyan',
    requiresTenant: true,
    requiresProviderLink: false,
    icon: UsersIcon,
  },
  {
    id: 'RECEPTIONIST',
    name: 'Receptionist',
    description: 'Front-desk registration and check-in tasks.',
    scope: 'TENANT' as const,
    color: 'cyan',
    requiresTenant: true,
    requiresProviderLink: false,
    icon: UsersIcon,
  },
  {
    id: 'STAFF',
    name: 'Staff',
    description: 'Authorised general operational tasks.',
    scope: 'TENANT' as const,
    color: 'gray',
    requiresTenant: true,
    requiresProviderLink: false,
    icon: FileText,
  },
  {
    id: 'FINANCE',
    name: 'Finance',
    description: 'Manages invoices, payments and billing activity.',
    scope: 'TENANT' as const,
    color: 'amber',
    requiresTenant: true,
    requiresProviderLink: false,
    icon: CreditCard,
  },
  {
    id: 'CONSENT_MANAGER',
    name: 'Consent Manager',
    description: 'Manages patient consent workflows and records.',
    scope: 'TENANT' as const,
    color: 'rose',
    requiresTenant: true,
    requiresProviderLink: false,
    icon: FileText,
  },
  {
    id: 'PRIVACY_OFFICER',
    name: 'Privacy Officer',
    description: 'Monitors and governs privacy / consent controls.',
    scope: 'TENANT' as const,
    color: 'pink',
    requiresTenant: true,
    requiresProviderLink: false,
    icon: Eye,
  },
] as const;

type RoleId = (typeof ROLES)[number]['id'];

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
  email?: string;
}

interface FormState {
  // Step 1 - Firebase link
  email: string;
  firebaseUid: string;

  // Step 2 - Identity
  fullName: string;
  phone: string;

  // Step 3 - Role & tenant
  role: RoleId | '';
  tenantId: string;

  // Step 4 - Provider link (conditional)
  providerId: string;
  providerSpecialisation: string;

}

const STEP_LABELS = [
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
export default function UserCreatePage() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const presetTenantId = searchParams.get('tenantId') ?? '';

  const [step, setStep] = useState(1);
  const [form, setForm] = useState<FormState>({
    email: '',
    firebaseUid: '',
    fullName: '',
    phone: '',
    role: '',
    tenantId: presetTenantId,
    providerId: '',
    providerSpecialisation: '',
  });

  const [touched, setTouched] = useState<Record<string, boolean>>({});
  const [error, setError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Tenants list
  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [isLoadingTenants, setIsLoadingTenants] = useState(false);

  // Provider records for selected tenant
  const [providers, setProviders] = useState<ProviderRecord[]>([]);
  const [isLoadingProviders, setIsLoadingProviders] = useState(false);

  // Firebase lookup
  const [firebaseLookupStatus, setFirebaseLookupStatus] =
    useState<'idle' | 'searching' | 'found' | 'not-found'>('idle');

  const selectedRole = useMemo(
    () => ROLES.find((r) => r.id === form.role),
    [form.role]
  );

  const requiresProviderLink = selectedRole?.requiresProviderLink ?? false;
  const requiresTenant = selectedRole?.requiresTenant ?? true;

  // ───────────────────────────────────────────────
  // Load tenants once
  // ───────────────────────────────────────────────
  useEffect(() => {
    const loadTenants = async () => {
      setIsLoadingTenants(true);
      try {
        const res = await fetch('/api/v1/admin/tenants?size=100&status=ACTIVE', {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('firebaseToken') ?? ''}`,
          },
        });
        if (res.ok) {
          const result = await res.json();
          const data = result.data ?? result;
          setTenants(data.content ?? []);
        }
      } catch {
        // silently ignore - form will surface error on submit
      } finally {
        setIsLoadingTenants(false);
      }
    };
    loadTenants();
  }, []);

  // ───────────────────────────────────────────────
  // Load providers when tenant changes
  // ───────────────────────────────────────────────
  useEffect(() => {
    if (!form.tenantId || !requiresProviderLink) {
      setProviders([]);
      return;
    }
    const load = async () => {
      setIsLoadingProviders(true);
      try {
        const res = await fetch(
          `/api/v1/admin/tenants/${form.tenantId}/providers`,
          {
            headers: {
              'Content-Type': 'application/json',
              Authorization: `Bearer ${localStorage.getItem('firebaseToken') ?? ''}`,
            },
          }
        );
        if (res.ok) {
          const result = await res.json();
          const data = result.data ?? result;
          setProviders(data.content ?? data ?? []);
        }
      } finally {
        setIsLoadingProviders(false);
      }
    };
    load();
  }, [form.tenantId, requiresProviderLink]);

  // ───────────────────────────────────────────────
  // Firebase user lookup by email
  // ───────────────────────────────────────────────
  const lookupFirebaseUser = async () => {
    if (!EMAIL_RE.test(form.email)) {
      setError('Enter a valid email first');
      return;
    }
    setFirebaseLookupStatus('searching');
    setError(null);
    try {
      const res = await fetch(
        `/api/v1/admin/users/firebase-account?email=${encodeURIComponent(form.email)}`,
        {
          headers: {
            'Content-Type': 'application/json',
            Authorization: `Bearer ${localStorage.getItem('firebaseToken') ?? ''}`,
          },
        }
      );
      if (res.ok) {
        const result = await res.json();
        const data = result.data ?? result;
        setForm((f) => ({
          ...f,
          firebaseUid: data.firebaseUid ?? '',
          fullName: f.fullName || data.displayName || '',
        }));
        setFirebaseLookupStatus('found');
      } else if (res.status === 404) {
        setFirebaseLookupStatus('not-found');
        setForm((f) => ({ ...f, firebaseUid: '' }));
      } else {
        const response = await res.json().catch(() => ({}));
        throw new Error(response.message || 'Firebase account lookup failed');
      }
    } catch (e) {
      setError(e instanceof Error ? e.message : 'Firebase account lookup failed');
      setFirebaseLookupStatus('idle');
    }
  };

  // ───────────────────────────────────────────────
  // Validation
  // ───────────────────────────────────────────────
  const validation = useMemo(() => {
    const v: Record<string, string | null> = {};
    if (step >= 1) {
      if (!form.email.trim()) v.email = 'Email is required';
      else if (!EMAIL_RE.test(form.email)) v.email = 'Invalid email';
      if (!form.firebaseUid.trim())
        v.firebaseUid = 'Look up an existing Firebase account before provisioning';
    }
    if (step >= 2) {
      if (!form.fullName.trim()) v.fullName = 'Full name required';
      else if (form.fullName.trim().length < 2) v.fullName = 'Too short';
      if (form.phone && !PHONE_RE.test(form.phone)) v.phone = 'Invalid phone';
    }
    if (step >= 3) {
      if (!form.role) v.role = 'Select a role';
      if (requiresTenant && !form.tenantId) v.tenantId = 'Tenant is required';
    }
    if (step >= 4) {
      if (requiresProviderLink && !form.providerId)
        v.providerId = 'Select a provider record to link';
    }
    return v;
  }, [form, step, requiresTenant, requiresProviderLink]);

  const stepValid = (s: number): boolean => {
    if (s === 1) return !validation.email && !validation.firebaseUid;
    if (s === 2) return !validation.fullName && !validation.phone;
    if (s === 3)
      return !validation.role && (!requiresTenant || !validation.tenantId);
    if (s === 4) return !requiresProviderLink || !validation.providerId;
    return true;
  };

  const totalSteps = requiresProviderLink ? 5 : 4;
  // Skip step 4 if provider link not required
  const displaySteps = requiresProviderLink
    ? STEP_LABELS
    : STEP_LABELS.filter((s) => s.id !== 4);

  const next = () => {
    if (!stepValid(step)) {
      Object.keys(validation).forEach((k) =>
        setTouched((p) => ({ ...p, [k]: true }))
      );
      setError('Please fix the highlighted fields');
      return;
    }
    setError(null);
    if (step === 3 && !requiresProviderLink) {
      setStep(5); // skip provider step
    } else {
      setStep((s) => Math.min(5, s + 1));
    }
  };

  const back = () => {
    if (step === 1) {
      navigate(-1);
      return;
    }
    if (step === 5 && !requiresProviderLink) {
      setStep(3);
    } else {
      setStep((s) => Math.max(1, s - 1));
    }
    setError(null);
  };

  const submit = async () => {
    // Re-validate everything
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
        firebaseUid: form.firebaseUid.trim(),
        fullName: form.fullName.trim(),
        phone: form.phone || undefined,
        role: form.role,
        tenantId: requiresTenant ? form.tenantId : undefined,
        specialty: requiresProviderLink
          ? providers.find((provider) => provider.id === form.providerId)?.specialisation
          : undefined,
        permissions: [],
      };

      const res = await fetch('/api/v1/admin/users/provision', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${localStorage.getItem('firebaseToken') ?? ''}`,
        },
        body: JSON.stringify(payload),
      });

      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Failed to provision user');
      }

      const result = await res.json();
      const created = result.data ?? result;
      toast.success(`User ${created.email ?? form.email} provisioned`);
      navigate(`/admin/super/users/${encodeURIComponent(created.firebaseUid)}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Provisioning failed';
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
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 top-5 h-0.5 bg-gray-200 -z-0" />
            <div
              className="absolute left-0 top-5 h-0.5 bg-indigo-600 transition-all duration-300 -z-0"
              style={{
                width: `${((step - 1) / (totalSteps - 1)) * 100}%`,
              }}
            />
            {displaySteps.map((s) => {
              const Icon = s.icon;
              const done = step > s.id;
              const active = step === s.id;
              return (
                <div key={s.id} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors border-2 ${
                      done
                        ? 'bg-indigo-600 border-indigo-600 text-white'
                        : active
                        ? 'bg-white border-indigo-600 text-indigo-600 ring-4 ring-indigo-100'
                        : 'bg-white border-gray-300 text-gray-400'
                    }`}
                  >
                    {done ? (
                      <CheckCircle2 className="w-5 h-5" />
                    ) : (
                      <Icon className="w-5 h-5" />
                    )}
                  </div>
                  <span
                    className={`mt-2 text-[11px] font-medium hidden sm:block ${
                      active
                        ? 'text-indigo-700'
                        : done
                        ? 'text-indigo-600'
                        : 'text-gray-500'
                    }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-5 sm:px-8 border-b border-gray-200">
            <h1 className="text-xl font-bold text-gray-900">
              {step === 1 && 'Link Firebase Account'}
              {step === 2 && 'User Identity'}
              {step === 3 && 'Role & Tenant Assignment'}
              {step === 4 && 'Provider Record Link'}
              {step === 5 && 'Review & Provision'}
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Admin-only provisioning. Public sign-up cannot grant these privileges.
            </p>
          </div>

          <div className="px-6 py-6 sm:px-8">
            {error && (
              <div className="mb-5 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* ── STEP 1 ── */}
            {step === 1 && (
              <div className="space-y-5 animate-in fade-in">
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2 text-sm text-blue-800">
                  <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p>
                    A Firebase authentication account is required. You can either link an
                    existing Firebase user (by UID) or send an invite link for the user to
                    create one.
                  </p>
                </div>

                <Field
                  label="User Email"
                  id="email"
                  required
                  icon={Mail}
                  error={touched.email ? validation.email : null}
                  hint="Used for Firebase account, welcome email, and audit trail"
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
                      onClick={lookupFirebaseUser}
                      disabled={
                        !EMAIL_RE.test(form.email) ||
                        firebaseLookupStatus === 'searching'
                      }
                      className="inline-flex items-center px-3 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50 flex-shrink-0"
                    >
                      {firebaseLookupStatus === 'searching' ? (
                        <Loader2 className="w-4 h-4 animate-spin" />
                      ) : (
                        <Search className="w-4 h-4" />
                      )}
                    </button>
                  </div>
                  {firebaseLookupStatus === 'found' && (
                    <p className="mt-1 text-xs text-emerald-600 flex items-center gap-1">
                      <CheckCircle2 className="w-3 h-3" />
                      Firebase account found — UID linked automatically
                    </p>
                  )}
                  {firebaseLookupStatus === 'not-found' && (
                    <p className="mt-1 text-xs text-amber-600 flex items-center gap-1">
                      <AlertTriangle className="w-3 h-3" />
                      No Firebase account found. Create the account in Firebase first, then retry.
                    </p>
                  )}
                </Field>

                <Field
                  label="Firebase UID"
                  id="firebaseUid"
                  icon={KeyRound}
                  error={touched.firebaseUid ? validation.firebaseUid : null}
                  hint="Use the UID returned by the Firebase account lookup."
                >
                  <input
                    id="firebaseUid"
                    type="text"
                    value={form.firebaseUid}
                    onChange={(e) =>
                      setForm((f) => ({
                        ...f,
                        firebaseUid: e.target.value,
                      }))
                    }
                    onBlur={() =>
                      setTouched((p) => ({ ...p, firebaseUid: true }))
                    }
                    placeholder="e.g. 8dK2xQz9..."
                    className={inputCls(
                      'firebaseUid',
                      touched.firebaseUid,
                      validation.firebaseUid
                    )}
                  />
                </Field>

              </div>
            )}

            {/* ── STEP 2 ── */}
            {step === 2 && (
              <div className="space-y-5 animate-in fade-in">
                <Field
                  label="Full Name"
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
                    onBlur={() =>
                      setTouched((p) => ({ ...p, fullName: true }))
                    }
                    placeholder="Dr. Jane Doe"
                    className={inputCls(
                      'fullName',
                      touched.fullName,
                      validation.fullName
                    )}
                  />
                </Field>

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
              </div>
            )}

            {/* ── STEP 3 ── */}
            {step === 3 && (
              <div className="space-y-5 animate-in fade-in">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Assign Role <span className="text-red-500">*</span>
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
                          className={`text-left p-3 rounded-lg border-2 transition-all ${
                            selected
                              ? 'border-indigo-600 bg-indigo-50'
                              : 'border-gray-200 hover:border-gray-300 bg-white'
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <div
                              className={`p-1.5 rounded-md flex-shrink-0 ${
                                selected
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-gray-100 text-gray-600'
                              }`}
                            >
                              <Icon className="w-4 h-4" />
                            </div>
                            <div className="min-w-0">
                              <p className="text-sm font-semibold text-gray-900 flex items-center gap-1.5">
                                {role.name}
                                {role.scope === 'PLATFORM' && (
                                  <Lock className="w-3 h-3 text-purple-500" />
                                )}
                              </p>
                              <p className="text-xs text-gray-500 mt-0.5">
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
                      <AlertCircle className="w-3 h-3" />
                      {validation.role}
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
                    hint="The user will only see data scoped to this tenant."
                  >
                    <select
                      id="tenantId"
                      value={form.tenantId}
                      onChange={(e) => {
                        setForm((f) => ({ ...f, tenantId: e.target.value, providerId: '' }));
                        setTouched((p) => ({ ...p, tenantId: true }));
                      }}
                      disabled={isLoadingTenants}
                      className={inputCls(
                        'tenantId',
                        touched.tenantId,
                        validation.tenantId,
                        true
                      )}
                    >
                      <option value="">
                        {isLoadingTenants ? 'Loading…' : 'Select a tenant'}
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
                      <strong>{selectedRole?.name}</strong> operates at platform level and does
                      not belong to any single tenant.
                    </p>
                  </div>
                )}
              </div>
            )}

            {/* ── STEP 4 ── */}
            {step === 4 && requiresProviderLink && (
              <div className="space-y-5 animate-in fade-in">
                <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-lg text-sm text-emerald-800 flex items-start gap-2">
                  <Link2 className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p>
                    Clinical roles must be linked to a <strong>provider record</strong> so that
                    appointments, clinical notes and consent flow correctly attribute to the
                    practitioner.
                  </p>
                </div>

                <Field
                  label="Provider Record"
                  id="providerId"
                  required
                  icon={Activity}
                  error={touched.providerId ? validation.providerId : null}
                  hint={
                    isLoadingProviders
                      ? 'Loading provider records…'
                      : 'Select an existing provider or create one via the Providers module'
                  }
                >
                  <select
                    id="providerId"
                    value={form.providerId}
                    onChange={(e) => {
                      setForm((f) => ({ ...f, providerId: e.target.value }));
                      setTouched((p) => ({ ...p, providerId: true }));
                    }}
                    disabled={isLoadingProviders}
                    className={inputCls(
                      'providerId',
                      touched.providerId,
                      validation.providerId,
                      true
                    )}
                  >
                    <option value="">
                      {isLoadingProviders ? 'Loading…' : 'Select provider record'}
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
                      <p>No provider records exist in this tenant yet.</p>
                      <button
                        onClick={() =>
                          navigate(
                            `/admin/super/tenants/${form.tenantId}/providers/create`
                          )
                        }
                        className="mt-1 text-amber-900 font-semibold underline"
                      >
                        Create a provider record first →
                      </button>
                    </div>
                  </div>
                )}

                <Field
                  label="Specialisation (optional)"
                  id="providerSpecialisation"
                  icon={FileText}
                  hint="Stored as metadata for this provider-user link"
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
                    placeholder="e.g. General Practitioner, Dentist, Counsellor"
                    className="w-full pl-9 pr-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500"
                  />
                </Field>
              </div>
            )}

            {/* ── STEP 5 (Review) ── */}
            {step === 5 && (
              <div className="space-y-5 animate-in fade-in">
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-sm text-indigo-800 flex items-start gap-2">
                  <ClipboardCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p>
                    Review all details carefully. Once provisioned, the Firebase role claim,
                    tenant membership and provider link are assigned immediately. This action
                    is audited.
                  </p>
                </div>

                <div className="border border-gray-200 rounded-lg divide-y divide-gray-200">
                  <ReviewRow label="Email" value={form.email} />
                  <ReviewRow
                    label="Firebase account"
                    value={`Linked (UID: ${form.firebaseUid.slice(0, 12)}…)`}
                  />
                  <ReviewRow label="Full name" value={form.fullName} />
                  {form.phone && <ReviewRow label="Phone" value={form.phone} />}
                  <ReviewRow label="Role" value={selectedRole?.name ?? '—'} />
                  {requiresTenant && (
                    <ReviewRow
                      label="Tenant"
                      value={
                        tenants.find((t) => t.id === form.tenantId)?.name ??
                        form.tenantId ??
                        '—'
                      }
                    />
                  )}
                  {requiresProviderLink && (
                    <ReviewRow
                      label="Provider record"
                      value={
                        providers.find((p) => p.id === form.providerId)?.name ??
                        form.providerId ??
                        '—'
                      }
                    />
                  )}
                  <ReviewRow
                    label="Role scope"
                    value={
                      selectedRole?.scope === 'PLATFORM'
                        ? 'Platform-wide (all tenants)'
                        : 'Tenant-scoped only'
                    }
                  />
                </div>

              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between">
            <button
              onClick={back}
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50"
            >
              Back
            </button>
            <button
              onClick={step === 5 ? submit : next}
              disabled={isSubmitting}
              className="inline-flex items-center px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {step === 5 ? 'Provision User' : 'Continue'}
              {step !== 5 && <ChevronRight className="w-4 h-4 ml-1" />}
            </button>
          </div>
        </div>

        {/* Safety footer */}
        <div className="mt-4 flex items-start gap-2 text-xs text-gray-500">
          <Lock className="w-3.5 h-3.5 mt-0.5 flex-shrink-0" />
          <p>
            Only users with <strong>SUPER_ADMIN</strong> or <strong>TENANT_ADMIN</strong> role
            claims can invoke this provisioning endpoint. Every action here is written to the
            immutable audit log.
          </p>
        </div>
      </div>
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Small components
// ─────────────────────────────────────────────────────────────
function UsersIcon(props: { className?: string }) {
  return (
    <svg
      className={props.className}
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
    >
      <path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2" />
      <circle cx="9" cy="7" r="4" />
      <path d="M22 21v-2a4 4 0 0 0-3-3.87" />
      <path d="M16 3.13a4 4 0 0 1 0 7.75" />
    </svg>
  );
}

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
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none z-10" />
        )}
        {children}
      </div>
      {error ? (
        <p className="mt-1 text-xs text-red-600 flex items-center gap-1">
          <AlertCircle className="w-3 h-3" />
          {error}
        </p>
      ) : hint ? (
        <p className="mt-1 text-xs text-gray-500">{hint}</p>
      ) : null}
    </div>
  );
}

function ReviewRow({ label, value }: { label: string; value: string }) {
  return (
    <div className="px-4 py-3 flex items-start justify-between gap-4">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        {label}
      </span>
      <span className="text-sm text-gray-900 font-medium text-right break-all">
        {value || '—'}
      </span>
    </div>
  );
}

function inputCls(
  field: string,
  touched?: boolean,
  error?: string | null,
  isSelect = false
) {
  const base = isSelect ? 'w-full pl-9 pr-3 py-2.5' : 'w-full pl-9 pr-3 py-2.5';
  return `${base} border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${
    touched && error
      ? 'border-red-300 focus:ring-red-500 focus:border-red-500'
      : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500'
  }`;
}