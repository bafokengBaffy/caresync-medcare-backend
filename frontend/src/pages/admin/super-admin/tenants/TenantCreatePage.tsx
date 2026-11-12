import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Building2,
  Globe,
  User,
  Mail,
  Phone,
  MapPin,
  CreditCard,
  ShieldCheck,
  CheckCircle2,
  ArrowLeft,
  ArrowRight,
  Loader2,
  AlertCircle,
  Users,
  Activity,
  Zap,
  ClipboardList,
} from 'lucide-react';
import { toast } from 'sonner';
import api from '@/lib/api-client';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
export type TenantPlan = 'FREE' | 'PRO' | 'ENTERPRISE';

interface FormData {
  // Step 1 - Organization
  name: string;
  subdomain: string;
  description: string;
  timezone: string;
  // Step 2 - Owner
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  // Step 3 - Plan
  plan: TenantPlan;
  // Step 4 - Location
  country: string;
  city: string;
  address: string;
}

// ─────────────────────────────────────────────────────────────
// Constants
// ─────────────────────────────────────────────────────────────
const STEPS = [
  { id: 1, label: 'Organization', icon: Building2 },
  { id: 2, label: 'Owner', icon: User },
  { id: 3, label: 'Plan', icon: CreditCard },
  { id: 4, label: 'Location', icon: MapPin },
] as const;

const PLAN_DETAILS: Record<
  TenantPlan,
  {
    title: string;
    price: string;
    description: string;
    features: string[];
    icon: typeof Users;
    color: string;
  }
> = {
  FREE: {
    title: 'Free',
    price: '$0',
    description: 'For small clinics getting started.',
    features: [
      'Up to 5 staff users',
      'Up to 100 patient records',
      'Basic appointments & notes',
      '1 GB document storage',
    ],
    icon: Users,
    color: 'from-gray-500 to-gray-700',
  },
  PRO: {
    title: 'Pro',
    price: '$49',
    description: 'For growing practices with multiple practitioners.',
    features: [
      'Up to 50 staff users',
      'Up to 2,500 patient records',
      'Advanced analytics & reports',
      'Billing & invoicing',
      '25 GB document storage',
    ],
    icon: Activity,
    color: 'from-blue-500 to-indigo-600',
  },
  ENTERPRISE: {
    title: 'Enterprise',
    price: '$249',
    description: 'For multi-location organisations & hospitals.',
    features: [
      'Unlimited staff users',
      'Unlimited patient records',
      'Multi-location support',
      'Custom integrations & API',
      'Priority 24/7 support',
      'SLA & dedicated success manager',
    ],
    icon: Zap,
    color: 'from-purple-500 to-pink-600',
  },
};

const SUBDOMAIN_REGEX = /^[a-z0-9](?:[a-z0-9-]{0,61}[a-z0-9])?$/;
const EMAIL_REGEX = /^\S+@\S+\.\S+$/;
const PHONE_REGEX = /^\+?[0-9 ()-]{7,20}$/;

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export default function TenantCreatePage() {
  const navigate = useNavigate();
  const [step, setStep] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [touched, setTouched] = useState<Record<string, boolean>>({});

  const [form, setForm] = useState<FormData>({
    name: '',
    subdomain: '',
    description: '',
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone || 'UTC',
    ownerName: '',
    ownerEmail: '',
    ownerPhone: '',
    plan: 'FREE',
    country: '',
    city: '',
    address: '',
  });

  const update = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((prev) => ({ ...prev, [key]: value }));
    setError(null);
  };

  const markTouched = (field: string) => setTouched((p) => ({ ...p, [field]: true }));

  // ───────────────────────────────────────────────
  // Validation per step
  // ───────────────────────────────────────────────
  const validation = useMemo(() => {
    const v: Record<string, string | null> = {};

    // Step 1
    if (!form.name.trim()) v.name = 'Organization name is required';
    else if (form.name.trim().length < 3) v.name = 'Must be at least 3 characters';

    if (!form.subdomain.trim()) v.subdomain = 'Subdomain is required';
    else if (!SUBDOMAIN_REGEX.test(form.subdomain))
      v.subdomain = 'Only lowercase letters, numbers and hyphens; must start/end with letter or number';
    else if (form.subdomain.length < 3 || form.subdomain.length > 63)
      v.subdomain = 'Must be 3–63 characters';

    // Step 2
    if (!form.ownerName.trim()) v.ownerName = 'Owner name is required';
    if (!form.ownerEmail.trim()) v.ownerEmail = 'Owner email is required';
    else if (!EMAIL_REGEX.test(form.ownerEmail)) v.ownerEmail = 'Invalid email address';
    if (form.ownerPhone && !PHONE_REGEX.test(form.ownerPhone))
      v.ownerPhone = 'Invalid phone number';

    // Step 4
    if (!form.country.trim()) v.country = 'Country is required';
    if (!form.city.trim()) v.city = 'City is required';

    return v;
  }, [form]);

  const stepIsValid = (s: number): boolean => {
    if (s === 1) return !validation.name && !validation.subdomain;
    if (s === 2) return !validation.ownerName && !validation.ownerEmail && !validation.ownerPhone;
    if (s === 3) return !!form.plan;
    if (s === 4) return !validation.country && !validation.city;
    return false;
  };

  const handleNext = () => {
    if (!stepIsValid(step)) {
      // Mark all fields on this step as touched
      if (step === 1) {
        markTouched('name');
        markTouched('subdomain');
      } else if (step === 2) {
        markTouched('ownerName');
        markTouched('ownerEmail');
        markTouched('ownerPhone');
      } else if (step === 4) {
        markTouched('country');
        markTouched('city');
      }
      setError('Please fix the highlighted fields before continuing.');
      return;
    }
    setError(null);
    setStep((s) => Math.min(STEPS.length, s + 1));
  };

  const handleBack = () => {
    if (step === 1) {
      navigate('/admin/super/tenants');
      return;
    }
    setError(null);
    setStep((s) => Math.max(1, s - 1));
  };

  const handleSubmit = async () => {
    // Validate all steps
    for (let s = 1; s <= STEPS.length; s++) {
      if (!stepIsValid(s)) {
        setStep(s);
        setError('Some required fields are missing. Please review each step.');
        return;
      }
    }

    setIsSubmitting(true);
    setError(null);
    try {
      const result = (await api.post<{
        data?: { id?: string; name?: string };
        id?: string;
        name?: string;
      }>('/api/v1/admin/tenants', form)).data;
      const created = result.data ?? result;
      toast.success(`Tenant "${created.name ?? form.name}" created successfully`);
      navigate(`/admin/super/tenants/${created.id ?? ''}`);
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'An error occurred';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSubmitting(false);
    }
  };

  // ───────────────────────────────────────────────
  // Field helper
  // ───────────────────────────────────────────────
  const Field = ({
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
    icon?: typeof User;
    children: React.ReactNode;
  }) => (
    <div>
      <label htmlFor={id} className="block text-sm font-medium text-gray-700 mb-1.5 dark:text-slate-200">
        {label}
        {required && <span className="text-red-500 ml-0.5">*</span>}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none dark:text-slate-300" />
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

  const inputCls = (field: string) =>
    `w-full pl-9 pr-3 py-2.5 border rounded-lg text-sm focus:outline-none focus:ring-2 transition-colors ${ touched[field] && validation[field] ? 'border-red-300 focus:ring-red-500 focus:border-red-500' : 'border-gray-300 focus:ring-indigo-500 focus:border-indigo-500' }`;

  // ───────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 py-8 px-4 sm:px-6 lg:px-8 dark:bg-slate-950">
      <div className="max-w-3xl mx-auto">
        {/* Progress */}
        <div className="mb-8">
          <div className="flex items-center justify-between relative">
            <div className="absolute left-0 right-0 top-5 h-0.5 bg-gray-200 -z-0 dark:bg-slate-800" />
            <div
              className="absolute left-0 top-5 h-0.5 bg-indigo-600 transition-all duration-300 -z-0"
              style={{ width: `${((step - 1) / (STEPS.length - 1)) * 100}%` }}
            />
            {STEPS.map((s) => {
              const Icon = s.icon;
              const done = step > s.id;
              const active = step === s.id;
              return (
                <div key={s.id} className="relative z-10 flex flex-col items-center">
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors border-2 ${ done ? 'bg-indigo-600 border-indigo-600 text-white' : active ? 'bg-white border-indigo-600 text-indigo-600 ring-4 ring-indigo-100' : 'bg-white border-gray-300 text-gray-400 dark:text-slate-300' } dark:border-slate-600 dark:text-slate-300`}
                  >
                    {done ? <CheckCircle2 className="w-5 h-5" /> : <Icon className="w-5 h-5" />}
                  </div>
                  <span
                    className={`mt-2 text-xs font-medium ${ active ? 'text-indigo-700' : done ? 'text-indigo-600' : 'text-gray-500 dark:text-slate-400' }`}
                  >
                    {s.label}
                  </span>
                </div>
              );
            })}
          </div>
        </div>

        {/* Card */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden dark:bg-slate-900 dark:border-slate-700">
          <div className="px-6 py-6 sm:px-8 border-b border-gray-200 dark:border-slate-700">
            <h2 className="text-xl font-bold text-gray-900 dark:text-slate-50">
              {step === 1 && 'Organization Details'}
              {step === 2 && 'Tenant Owner'}
              {step === 3 && 'Choose a Plan'}
              {step === 4 && 'Location & Address'}
            </h2>
            <p className="mt-1 text-sm text-gray-500 dark:text-slate-400">
              Step {step} of {STEPS.length}
            </p>
          </div>

          <div className="px-6 py-6 sm:px-8">
            {error && (
              <div className="mb-6 p-3 bg-red-50 border border-red-200 rounded-md flex items-start gap-2">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Step 1 */}
            {step === 1 && (
              <div className="space-y-5 animate-in fade-in">
                <Field
                  label="Organization Name"
                  id="name"
                  required
                  icon={Building2}
                  error={touched.name ? validation.name : null}
                >
                  <input
                    id="name"
                    type="text"
                    value={form.name}
                    onChange={(e) => update('name', e.target.value)}
                    onBlur={() => markTouched('name')}
                    placeholder="e.g. City Health Clinic"
                    className={inputCls('name')}
                  />
                </Field>

                <Field
                  label="Subdomain"
                  id="subdomain"
                  required
                  icon={Globe}
                  error={touched.subdomain ? validation.subdomain : null}
                  hint="Used for the tenant's dedicated portal URL"
                >
                  <div className="flex rounded-lg shadow-sm">
                    <span className="inline-flex items-center px-3 rounded-l-lg border border-r-0 border-gray-300 bg-gray-50 text-gray-500 text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-400">
                      https://
                    </span>
                    <input
                      id="subdomain"
                      type="text"
                      value={form.subdomain}
                      onChange={(e) =>
                        update('subdomain', e.target.value.toLowerCase().replace(/[^a-z0-9-]/g, ''))
                      }
                      onBlur={() => markTouched('subdomain')}
                      placeholder="city-health"
                      className={`flex-1 min-w-0 px-3 py-2.5 border text-sm focus:outline-none focus:ring-2 ${ touched.subdomain && validation.subdomain ? 'border-red-300 focus:ring-red-500' : 'border-gray-300 focus:ring-indigo-500' }`}
                    />
                    <span className="inline-flex items-center px-3 rounded-r-lg border border-l-0 border-gray-300 bg-gray-50 text-gray-500 text-sm dark:border-slate-600 dark:bg-slate-950 dark:text-slate-400">
                      .caresync.com
                    </span>
                  </div>
                </Field>

                <Field label="Description (optional)" id="description">
                  <textarea
                    id="description"
                    rows={3}
                    value={form.description}
                    onChange={(e) => update('description', e.target.value)}
                    placeholder="Briefly describe this tenant..."
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-slate-600"
                  />
                </Field>

                <Field label="Timezone" id="timezone">
                  <select
                    id="timezone"
                    value={form.timezone}
                    onChange={(e) => update('timezone', e.target.value)}
                    className="w-full px-3 py-2.5 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500 dark:border-slate-600"
                  >
                    {[
                      'UTC',
                      'Africa/Johannesburg',
                      'Africa/Lagos',
                      'Africa/Nairobi',
                      'Europe/London',
                      'Europe/Paris',
                      'America/New_York',
                      'America/Los_Angeles',
                      'Asia/Dubai',
                      'Asia/Singapore',
                      'Australia/Sydney',
                    ].map((tz) => (
                      <option key={tz} value={tz}>
                        {tz}
                      </option>
                    ))}
                  </select>
                </Field>
              </div>
            )}

            {/* Step 2 */}
            {step === 2 && (
              <div className="space-y-5 animate-in fade-in">
                <div className="p-3 bg-indigo-50 border border-indigo-200 rounded-lg text-sm text-indigo-800 flex items-start gap-2">
                  <ShieldCheck className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p>
                    The owner will receive an email invitation to set up their password and be
                    assigned the <strong>TENANT_ADMIN</strong> role. They cannot be promoted from
                    public sign-up.
                  </p>
                </div>

                <Field
                  label="Owner Full Name"
                  id="ownerName"
                  required
                  icon={User}
                  error={touched.ownerName ? validation.ownerName : null}
                >
                  <input
                    id="ownerName"
                    type="text"
                    value={form.ownerName}
                    onChange={(e) => update('ownerName', e.target.value)}
                    onBlur={() => markTouched('ownerName')}
                    placeholder="Dr. Jane Doe"
                    className={inputCls('ownerName')}
                  />
                </Field>

                <Field
                  label="Owner Email"
                  id="ownerEmail"
                  required
                  icon={Mail}
                  error={touched.ownerEmail ? validation.ownerEmail : null}
                  hint="Invitation link will be sent here"
                >
                  <input
                    id="ownerEmail"
                    type="email"
                    value={form.ownerEmail}
                    onChange={(e) => update('ownerEmail', e.target.value)}
                    onBlur={() => markTouched('ownerEmail')}
                    placeholder="owner@clinic.com"
                    className={inputCls('ownerEmail')}
                  />
                </Field>

                <Field
                  label="Owner Phone (optional)"
                  id="ownerPhone"
                  icon={Phone}
                  error={touched.ownerPhone ? validation.ownerPhone : null}
                >
                  <input
                    id="ownerPhone"
                    type="tel"
                    value={form.ownerPhone}
                    onChange={(e) => update('ownerPhone', e.target.value)}
                    onBlur={() => markTouched('ownerPhone')}
                    placeholder="+27 11 123 4567"
                    className={inputCls('ownerPhone')}
                  />
                </Field>
              </div>
            )}

            {/* Step 3 */}
            {step === 3 && (
              <div className="space-y-4 animate-in fade-in">
                {(Object.keys(PLAN_DETAILS) as TenantPlan[]).map((planKey) => {
                  const p = PLAN_DETAILS[planKey];
                  const Icon = p.icon;
                  const selected = form.plan === planKey;
                  return (
                    <label
                      key={planKey}
                      className={`block p-5 border-2 rounded-xl cursor-pointer transition-all ${ selected ? 'border-indigo-600 bg-indigo-50/40 ring-2 ring-indigo-100' : 'border-gray-200 hover:border-gray-300 bg-white dark:bg-slate-900' } dark:hover:border-slate-600 dark:bg-slate-900`}
                    >
                      <div className="flex items-start gap-4">
                        <div
                          className={`p-3 rounded-lg ${
                            selected
                              ? `bg-gradient-to-br ${p.color} text-white`: 'bg-gray-100 text-gray-600 dark:text-slate-300' } dark:text-slate-300`}
                        >
                          <Icon className="w-6 h-6" />
                        </div>
                        <div className="flex-1">
                          <div className="flex items-center justify-between">
                            <div>
                              <h3 className="font-semibold text-gray-900 flex items-center gap-2 dark:text-slate-50">
                                {p.title}
                                {planKey === 'PRO' && (
                                  <span className="text-[10px] font-bold uppercase bg-blue-100 text-blue-700 px-1.5 py-0.5 rounded">
                                    Popular
                                  </span>
                                )}
                              </h3>
                              <p className="text-xs text-gray-500 mt-0.5 dark:text-slate-400">{p.description}</p>
                            </div>
                            <div className="text-right">
                              <p className="text-2xl font-bold text-gray-900 dark:text-slate-50">{p.price}</p>
                              <p className="text-xs text-gray-500 dark:text-slate-400">/month</p>
                            </div>
                          </div>
                          <ul className="mt-3 grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-1.5">
                            {p.features.map((f) => (
                              <li key={f} className="flex items-start gap-1.5 text-xs text-gray-600 dark:text-slate-300">
                                <CheckCircle2 className="w-3.5 h-3.5 text-emerald-500 flex-shrink-0 mt-0.5" />
                                {f}
                              </li>
                            ))}
                          </ul>
                        </div>
                        <input
                          type="radio"
                          name="plan"
                          value={planKey}
                          checked={selected}
                          onChange={() => update('plan', planKey)}
                          className="mt-1 h-4 w-4 text-indigo-600 focus:ring-indigo-500 border-gray-300 dark:border-slate-600"
                        />
                      </div>
                    </label>
                  );
                })}
              </div>
            )}

            {/* Step 4 */}
            {step === 4 && (
              <div className="space-y-5 animate-in fade-in">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-5">
                  <Field
                    label="Country"
                    id="country"
                    required
                    icon={Globe}
                    error={touched.country ? validation.country : null}
                  >
                    <input
                      id="country"
                      type="text"
                      value={form.country}
                      onChange={(e) => update('country', e.target.value)}
                      onBlur={() => markTouched('country')}
                      placeholder="South Africa"
                      className={inputCls('country')}
                    />
                  </Field>
                  <Field
                    label="City"
                    id="city"
                    required
                    icon={Building2}
                    error={touched.city ? validation.city : null}
                  >
                    <input
                      id="city"
                      type="text"
                      value={form.city}
                      onChange={(e) => update('city', e.target.value)}
                      onBlur={() => markTouched('city')}
                      placeholder="Johannesburg"
                      className={inputCls('city')}
                    />
                  </Field>
                </div>
                <Field label="Street Address (optional)" id="address" icon={MapPin}>
                  <input
                    id="address"
                    type="text"
                    value={form.address}
                    onChange={(e) => update('address', e.target.value)}
                    placeholder="123 Main Street, Sandton"
                    className={inputCls('address')}
                  />
                </Field>

                <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200 dark:bg-slate-950 dark:border-slate-700">
                  <h4 className="flex items-center gap-2 text-sm font-semibold text-gray-900 mb-2 dark:text-slate-50">
                    <ClipboardList className="w-4 h-4 text-indigo-600" />
                    Review
                  </h4>
                  <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-2 text-sm">
                    <div>
                      <dt className="text-gray-500 dark:text-slate-400">Name</dt>
                      <dd className="font-medium text-gray-900 dark:text-slate-50">{form.name || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 dark:text-slate-400">Subdomain</dt>
                      <dd className="font-medium text-gray-900 dark:text-slate-50">
                        {form.subdomain || '—'}.caresync.com
                      </dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 dark:text-slate-400">Owner</dt>
                      <dd className="font-medium text-gray-900 dark:text-slate-50">{form.ownerName || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 dark:text-slate-400">Email</dt>
                      <dd className="font-medium text-gray-900 dark:text-slate-50">{form.ownerEmail || '—'}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 dark:text-slate-400">Plan</dt>
                      <dd className="font-medium text-gray-900 dark:text-slate-50">{form.plan}</dd>
                    </div>
                    <div>
                      <dt className="text-gray-500 dark:text-slate-400">Location</dt>
                      <dd className="font-medium text-gray-900 dark:text-slate-50">
                        {[form.city, form.country].filter(Boolean).join(', ') || '—'}
                      </dd>
                    </div>
                  </dl>
                </div>
              </div>
            )}
          </div>

          {/* Footer */}
          <div className="px-6 py-4 bg-gray-50 border-t border-gray-200 flex items-center justify-between dark:bg-slate-950 dark:border-slate-700">
            <button
              onClick={handleBack}
              disabled={isSubmitting}
              className="inline-flex items-center px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50 disabled:opacity-50 dark:text-slate-200 dark:bg-slate-900 dark:border-slate-600 dark:hover:bg-slate-950"
            >
              <ArrowLeft className="w-4 h-4 mr-2" />
              {step === 1 ? 'Cancel' : 'Back'}
            </button>
            <button
              onClick={step === STEPS.length ? handleSubmit : handleNext}
              disabled={isSubmitting}
              className="inline-flex items-center px-5 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSubmitting && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
              {step === STEPS.length ? 'Create Tenant' : 'Continue'}
              {step !== STEPS.length && <ArrowRight className="w-4 h-4 ml-2" />}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}