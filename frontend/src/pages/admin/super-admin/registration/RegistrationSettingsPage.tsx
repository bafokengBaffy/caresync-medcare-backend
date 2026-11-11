import { useState, useEffect } from 'react';
import {
  Settings,
  Save,
  Loader2,
  AlertTriangle,
  CheckCircle2,
  Info,
  Lock,
  Mail,
  UserPlus,
  Shield,
  ShieldCheck,
  KeyRound,
  RefreshCw,
  Globe,
  Clock,
  AlertCircle,
  Eye,
  Bell,
  Calendar,
  FileText,
  ListChecks,
  ToggleLeft,
  ToggleRight,
  Fingerprint,
  UserCheck,
  Ban,
  Users,
  Zap,
  Timer,
} from 'lucide-react';
import { toast } from 'sonner';

// ─────────────────────────────────────────────────────────────
// Types
// ─────────────────────────────────────────────────────────────
interface RegistrationSettings {
  // Public signup
  publicSignupEnabled: boolean;
  allowedPublicRoles: string[];
  requireEmailVerification: boolean;
  autoApprovePublicSignup: boolean;
  allowGoogleSignup: boolean;
  allowMicrosoftSignup: boolean;
  allowAppleSignup: boolean;
  allowPasswordSignup: boolean;

  // Domain restrictions
  allowedEmailDomains: string[];
  blockDisposableEmails: boolean;

  // Request queue
  requestExpiryDays: number;
  autoRejectAfterDays: number;
  notifyAdminsOnNewRequest: boolean;
  notifyApplicantOnDecision: boolean;

  // Defaults for new requests
  defaultTenantId: string;
  defaultRole: string;
  defaultPermissions: string[];

  // Security
  requireAdminApprovalForAllRoles: boolean;
  enableAuditOnRequest: boolean;
  maxRequestsPerIpPerDay: number;
  maxSignupAttemptsPerEmail: number;

  // Invitation policy
  invitationExpiryDays: number;
  invitationMaxResends: number;
  requireMfaOnFirstLogin: boolean;
  forcePasswordResetOnFirstLogin: boolean;
}

interface Tenant {
  id: string;
  name: string;
  subdomain: string;
}

const DEFAULT_SETTINGS: RegistrationSettings = {
  publicSignupEnabled: true,
  allowedPublicRoles: ['PATIENT'],
  requireEmailVerification: true,
  autoApprovePublicSignup: false,
  allowGoogleSignup: true,
  allowMicrosoftSignup: false,
  allowAppleSignup: false,
  allowPasswordSignup: true,
  allowedEmailDomains: [],
  blockDisposableEmails: true,
  requestExpiryDays: 14,
  autoRejectAfterDays: 30,
  notifyAdminsOnNewRequest: true,
  notifyApplicantOnDecision: true,
  defaultTenantId: '',
  defaultRole: 'PATIENT',
  defaultPermissions: [],
  requireAdminApprovalForAllRoles: true,
  enableAuditOnRequest: true,
  maxRequestsPerIpPerDay: 10,
  maxSignupAttemptsPerEmail: 3,
  invitationExpiryDays: 7,
  invitationMaxResends: 3,
  requireMfaOnFirstLogin: false,
  forcePasswordResetOnFirstLogin: true,
};

const authHeaders = () => ({
  'Content-Type': 'application/json',
  Authorization: `Bearer ${localStorage.getItem('firebaseToken') ?? ''}`,
});

// ─────────────────────────────────────────────────────────────
// Component
// ─────────────────────────────────────────────────────────────
export default function RegistrationSettingsPage() {
  const [settings, setSettings] = useState<RegistrationSettings>(DEFAULT_SETTINGS);
  const [savedSettings, setSavedSettings] = useState<RegistrationSettings>(DEFAULT_SETTINGS);
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const [tenants, setTenants] = useState<Tenant[]>([]);
  const [newDomain, setNewDomain] = useState('');
  const [newRole, setNewRole] = useState('PATIENT');

  const [activeSection, setActiveSection] = useState<
    'signup' | 'requests' | 'security' | 'invitations'
  >('signup');

  const dirty = JSON.stringify(settings) !== JSON.stringify(savedSettings);

  // ───────────────────────────────────────────────
  // Load settings
  // ───────────────────────────────────────────────
  useEffect(() => {
    const load = async () => {
      setIsLoading(true);
      setError(null);
      try {
        const [settingsRes, tenantsRes] = await Promise.all([
          fetch('/api/v1/admin/registration/settings', { headers: authHeaders() }),
          fetch('/api/v1/admin/tenants?size=200&status=ACTIVE', {
            headers: authHeaders(),
          }),
        ]);
        if (settingsRes.ok) {
          const data = await settingsRes.json();
          setSettings({ ...DEFAULT_SETTINGS, ...data });
          setSavedSettings({ ...DEFAULT_SETTINGS, ...data });
        }
        if (tenantsRes.ok) {
          const tData = await tenantsRes.json();
          setTenants(tData.content ?? []);
        }
      } catch (e) {
        setError(e instanceof Error ? e.message : 'Failed to load settings');
      } finally {
        setIsLoading(false);
      }
    };
    load();
  }, []);

  // ───────────────────────────────────────────────
  // Save
  // ───────────────────────────────────────────────
  const save = async () => {
    setIsSaving(true);
    setError(null);
    try {
      const res = await fetch('/api/v1/admin/registration/settings', {
        method: 'PUT',
        headers: authHeaders(),
        body: JSON.stringify(settings),
      });
      if (!res.ok) {
        const err = await res.json().catch(() => ({}));
        throw new Error(err.message || 'Save failed');
      }
      setSavedSettings(settings);
      toast.success('Registration settings saved');
    } catch (e) {
      const msg = e instanceof Error ? e.message : 'Save failed';
      setError(msg);
      toast.error(msg);
    } finally {
      setIsSaving(false);
    }
  };

  const reset = () => {
    if (!window.confirm('Discard unsaved changes?')) return;
    setSettings(savedSettings);
  };

  const update = <K extends keyof RegistrationSettings>(
    key: K,
    value: RegistrationSettings[K]
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  // ───────────────────────────────────────────────
  // Render
  // ───────────────────────────────────────────────
  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 pb-24">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-5 sticky top-0 z-20">
        <div className="max-w-6xl mx-auto flex items-center justify-between gap-4">
          <div>
            <h1 className="text-xl font-bold text-gray-900 flex items-center gap-2">
              <Settings className="w-5 h-5 text-indigo-600" />
              Registration Settings
            </h1>
            <p className="mt-0.5 text-sm text-gray-500">
              Global control over public sign-up, request approvals and provisioning defaults.
            </p>
          </div>
          <div className="flex gap-2">
            {dirty && (
              <button
                onClick={reset}
                className="inline-flex items-center px-3 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Reset
              </button>
            )}
            <button
              onClick={save}
              disabled={isSaving || !dirty}
              className="inline-flex items-center px-4 py-2 rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
              ) : (
                <Save className="w-4 h-4 mr-2" />
              )}
              {dirty ? 'Save changes' : 'Saved'}
            </button>
          </div>
        </div>
      </div>

      {/* Error banner */}
      {error && (
        <div className="max-w-6xl mx-auto px-6 pt-4">
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2 text-sm text-red-800">
            <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
            <p>{error}</p>
          </div>
        </div>
      )}

      <div className="max-w-6xl mx-auto px-6 py-6 flex flex-col lg:flex-row gap-6">
        {/* Sidebar nav */}
        <aside className="w-full lg:w-56 flex-shrink-0">
          <nav className="bg-white rounded-lg border border-gray-200 shadow-sm p-2 sticky top-24 space-y-1">
            {[
              { id: 'signup', label: 'Public Sign-up', icon: UserPlus },
              { id: 'requests', label: 'Request Queue', icon: ListChecks },
              { id: 'security', label: 'Security', icon: Shield },
              { id: 'invitations', label: 'Invitations', icon: Mail },
            ].map((s) => {
              const Icon = s.icon;
              const active = activeSection === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveSection(s.id as any)}
                  className={`w-full flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors ${
                    active
                      ? 'bg-indigo-50 text-indigo-700'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  <Icon className="w-4 h-4" />
                  {s.label}
                </button>
              );
            })}
          </nav>
        </aside>

        {/* Content */}
        <div className="flex-1 space-y-6">
          {/* ── Signup ── */}
          {activeSection === 'signup' && (
            <div className="space-y-6 animate-in fade-in">
              <Section
                title="Public Sign-up"
                description="Controls whether new users can create Firebase accounts via the public registration page."
                icon={Globe}
              >
                <ToggleRow
                  label="Enable public sign-up"
                  description="Patients and prospective users can self-register. Disabling blocks the /register route for all visitors."
                  checked={settings.publicSignupEnabled}
                  onChange={(v) => update('publicSignupEnabled', v)}
                  warning={
                    !settings.publicSignupEnabled
                      ? 'All public signups currently blocked. Staff must be provisioned manually.'
                      : undefined
                  }
                />

                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 pt-3 border-t border-gray-200">
                  <ToggleRow
                    label="Password sign-up"
                    description="Users can sign up with email + password"
                    checked={settings.allowPasswordSignup}
                    onChange={(v) => update('allowPasswordSignup', v)}
                    compact
                    disabled={!settings.publicSignupEnabled}
                  />
                  <ToggleRow
                    label="Google sign-up"
                    description="Users can sign up with their Google account"
                    checked={settings.allowGoogleSignup}
                    onChange={(v) => update('allowGoogleSignup', v)}
                    compact
                    disabled={!settings.publicSignupEnabled}
                  />
                  <ToggleRow
                    label="Microsoft sign-up"
                    description="Users can sign up with a Microsoft account"
                    checked={settings.allowMicrosoftSignup}
                    onChange={(v) => update('allowMicrosoftSignup', v)}
                    compact
                    disabled={!settings.publicSignupEnabled}
                  />
                  <ToggleRow
                    label="Apple sign-up"
                    description="Users can sign up with Sign in with Apple"
                    checked={settings.allowAppleSignup}
                    onChange={(v) => update('allowAppleSignup', v)}
                    compact
                    disabled={!settings.publicSignupEnabled}
                  />
                </div>
              </Section>

              <Section
                title="What new users can request"
                description="Public sign-up can never grant privileged roles. These control what roles may be requested for admin review."
                icon={ShieldCheck}
              >
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2 text-sm text-blue-800 mb-4">
                  <Lock className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p>
                    <strong>Hard policy:</strong> ADMIN, MANAGER, PROVIDER, CLINICIAN,
                    RECEPTION, FINANCE, CONSENT_MANAGER, PRIVACY_OFFICER, SUPER_ADMIN and
                    TENANT_ADMIN can <strong>never</strong> be auto-granted via public signup.
                    They must always be admin-approved and provisioned.
                  </p>
                </div>

                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                  Roles available in public signup
                </label>
                <div className="space-y-2">
                  {[
                    { id: 'PATIENT', label: 'Patient', safe: true, desc: 'Portal access to own data only' },
                    { id: 'PROVIDER', label: 'Provider', safe: false, desc: 'Requires admin provisioning + provider record' },
                    { id: 'CLINICIAN', label: 'Clinician', safe: false, desc: 'Requires admin provisioning' },
                    { id: 'RECEPTIONIST', label: 'Receptionist', safe: false, desc: 'Requires admin provisioning + tenant' },
                    { id: 'STAFF', label: 'Staff', safe: false, desc: 'Requires admin provisioning + permissions' },
                  ].map((role) => {
                    const checked = settings.allowedPublicRoles.includes(role.id);
                    const locked = !role.safe;
                    return (
                      <label
                        key={role.id}
                        className={`flex items-start gap-3 p-3 rounded-lg border ${
                          locked
                            ? 'bg-gray-50 border-gray-200 opacity-75'
                            : checked
                            ? 'bg-indigo-50 border-indigo-200'
                            : 'bg-white border-gray-200 hover:border-gray-300'
                        } ${locked ? 'cursor-not-allowed' : 'cursor-pointer'}`}
                      >
                        <input
                          type="checkbox"
                          checked={checked}
                          disabled={locked}
                          onChange={(e) => {
                            if (e.target.checked) {
                              update('allowedPublicRoles', [
                                ...settings.allowedPublicRoles,
                                role.id,
                              ]);
                            } else {
                              update(
                                'allowedPublicRoles',
                                settings.allowedPublicRoles.filter((r) => r !== role.id)
                              );
                            }
                          }}
                          className="mt-0.5 h-4 w-4 text-indigo-600 border-gray-300 rounded"
                        />
                        <div className="flex-1">
                          <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                            {role.label}
                            {locked && (
                              <span className="text-[10px] uppercase bg-gray-200 text-gray-600 px-1.5 py-0.5 rounded">
                                Admin-only
                              </span>
                            )}
                          </p>
                          <p className="text-xs text-gray-500 mt-0.5">{role.desc}</p>
                        </div>
                      </label>
                    );
                  })}
                </div>
              </Section>

              <Section
                title="Domain & email policy"
                description="Restrict which email domains may sign up and block disposable inboxes."
                icon={Mail}
              >
                <ToggleRow
                  label="Block disposable email providers"
                  description="Reject signups from temp-mail, mailinator, etc."
                  checked={settings.blockDisposableEmails}
                  onChange={(v) => update('blockDisposableEmails', v)}
                  compact
                />

                <div className="pt-3 border-t border-gray-200">
                  <label className="block text-sm font-medium text-gray-700 mb-1.5">
                    Allowed email domains (optional)
                  </label>
                  <p className="text-xs text-gray-500 mb-2">
                    Leave empty to allow any domain. Otherwise, only these domains may sign
                    up. Patients can still be registered by staff.
                  </p>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {settings.allowedEmailDomains.map((d) => (
                      <span
                        key={d}
                        className="inline-flex items-center gap-1 bg-gray-100 text-gray-700 text-xs px-2 py-1 rounded"
                      >
                        {d}
                        <button
                          onClick={() =>
                            update(
                              'allowedEmailDomains',
                              settings.allowedEmailDomains.filter((x) => x !== d)
                            )
                          }
                          className="text-gray-400 hover:text-red-600"
                        >
                          ×
                        </button>
                      </span>
                    ))}
                  </div>
                  <div className="flex gap-2">
                    <input
                      type="text"
                      value={newDomain}
                      onChange={(e) => setNewDomain(e.target.value)}
                      placeholder="e.g. cityhealth.co.za"
                      className="flex-1 px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    />
                    <button
                      onClick={() => {
                        const d = newDomain.trim().toLowerCase();
                        if (!d || !/^[a-z0-9.-]+\.[a-z]{2,}$/.test(d)) {
                          toast.error('Invalid domain');
                          return;
                        }
                        if (!settings.allowedEmailDomains.includes(d)) {
                          update('allowedEmailDomains', [
                            ...settings.allowedEmailDomains,
                            d,
                          ]);
                        }
                        setNewDomain('');
                      }}
                      className="inline-flex items-center px-3 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700"
                    >
                      Add
                    </button>
                  </div>
                </div>
              </Section>

              <Section
                title="Verification & approval"
                description="When a new signup is created, what must happen before the user can log in?"
                icon={UserCheck}
              >
                <ToggleRow
                  label="Require email verification"
                  description="User must verify their email before logging in. Highly recommended."
                  checked={settings.requireEmailVerification}
                  onChange={(v) => update('requireEmailVerification', v)}
                />
                <ToggleRow
                  label="Auto-approve public signups"
                  description="Skips admin approval. Only enable if you want signups to be active immediately — cannot grant privileged roles even so."
                  checked={settings.autoApprovePublicSignup}
                  onChange={(v) => update('autoApprovePublicSignup', v)}
                  warning={
                    settings.autoApprovePublicSignup
                      ? 'Dangerous: unvetted users will be auto-activated (patients only).'
                      : undefined
                  }
                />
                <ToggleRow
                  label="Require admin approval for ALL roles"
                  description="Every new request must be approved by an admin — including patient signups."
                  checked={settings.requireAdminApprovalForAllRoles}
                  onChange={(v) => update('requireAdminApprovalForAllRoles', v)}
                />
              </Section>
            </div>
          )}

          {/* ── Request Queue ── */}
          {activeSection === 'requests' && (
            <div className="space-y-6 animate-in fade-in">
              <Section
                title="Request queue policy"
                description="Control how long requests stay in the queue and how admins are notified."
                icon={ListChecks}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <NumberField
                    label="Request expiry (days)"
                    description="Pending requests older than this are marked expired."
                    value={settings.requestExpiryDays}
                    onChange={(v) => update('requestExpiryDays', v)}
                    min={1}
                    max={90}
                    icon={Timer}
                  />
                  <NumberField
                    label="Auto-reject after (days)"
                    description="Automatically reject requests after this many days if no action."
                    value={settings.autoRejectAfterDays}
                    onChange={(v) => update('autoRejectAfterDays', v)}
                    min={1}
                    max={180}
                    icon={Clock}
                  />
                </div>
              </Section>

              <Section
                title="Notifications"
                description="Email and in-app alerts for new requests and decisions."
                icon={Bell}
              >
                <ToggleRow
                  label="Notify admins on new request"
                  description="Send an email to all SUPER_ADMIN and TENANT_ADMIN users when a request arrives."
                  checked={settings.notifyAdminsOnNewRequest}
                  onChange={(v) => update('notifyAdminsOnNewRequest', v)}
                  compact
                />
                <ToggleRow
                  label="Notify applicant on decision"
                  description="Send an email when the request is approved or rejected."
                  checked={settings.notifyApplicantOnDecision}
                  onChange={(v) => update('notifyApplicantOnDecision', v)}
                  compact
                />
              </Section>

              <Section
                title="Defaults for new requests"
                description="Applied automatically when a request has no explicit role or tenant."
                icon={Zap}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Default role
                    </label>
                    <select
                      value={settings.defaultRole}
                      onChange={(e) => update('defaultRole', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="PATIENT">Patient</option>
                      <option value="STAFF">Staff</option>
                      <option value="RECEPTIONIST">Receptionist</option>
                    </select>
                    <p className="mt-1 text-xs text-gray-500">
                      Only non-privileged roles can be a default.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1.5">
                      Default tenant (optional)
                    </label>
                    <select
                      value={settings.defaultTenantId}
                      onChange={(e) => update('defaultTenantId', e.target.value)}
                      className="w-full px-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
                    >
                      <option value="">No default (must be assigned)</option>
                      {tenants.map((t) => (
                        <option key={t.id} value={t.id}>
                          {t.name} ({t.subdomain})
                        </option>
                      ))}
                    </select>
                  </div>
                </div>
              </Section>
            </div>
          )}

          {/* ── Security ── */}
          {activeSection === 'security' && (
            <div className="space-y-6 animate-in fade-in">
              <Section
                title="Rate limits"
                description="Protect against signup spam and enumeration attacks."
                icon={Shield}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <NumberField
                    label="Max signups per IP per day"
                    description="Blocks bulk signup attempts from a single IP."
                    value={settings.maxRequestsPerIpPerDay}
                    onChange={(v) => update('maxRequestsPerIpPerDay', v)}
                    min={1}
                    max={100}
                    icon={Fingerprint}
                  />
                  <NumberField
                    label="Max attempts per email"
                    description="Prevents repeated submission for the same email."
                    value={settings.maxSignupAttemptsPerEmail}
                    onChange={(v) => update('maxSignupAttemptsPerEmail', v)}
                    min={1}
                    max={10}
                    icon={Mail}
                  />
                </div>
              </Section>

              <Section
                title="Audit"
                description="What gets recorded for every registration event."
                icon={FileText}
              >
                <ToggleRow
                  label="Audit all registration events"
                  description="Every signup, approve, reject, resend is written to the immutable audit log."
                  checked={settings.enableAuditOnRequest}
                  onChange={(v) => update('enableAuditOnRequest', v)}
                  warning={
                    !settings.enableAuditOnRequest
                      ? 'Not recommended — compliance requires full audit trail.'
                      : undefined
                  }
                />
              </Section>

              <Section
                title="Role assignment safety"
                description="Additional guards that prevent accidental privilege escalation."
                icon={Lock}
              >
                <div className="p-4 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-start gap-2">
                    <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                    <div>
                      <p className="text-sm font-semibold text-red-900">
                        Non-negotiable safety rules
                      </p>
                      <ul className="mt-2 space-y-1 text-xs text-red-800">
                        <li className="flex items-start gap-1">
                          <Ban className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          Public sign-up can never grant SUPER_ADMIN or TENANT_ADMIN
                        </li>
                        <li className="flex items-start gap-1">
                          <Ban className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          PROVIDER / CLINICIAN require a provider record link
                        </li>
                        <li className="flex items-start gap-1">
                          <Ban className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          FINANCE and ADMIN require explicit tenant + permission grant
                        </li>
                        <li className="flex items-start gap-1">
                          <Ban className="w-3 h-3 mt-0.5 flex-shrink-0" />
                          Firebase role claim must match CareSync user record
                        </li>
                      </ul>
                      <p className="mt-2 text-xs text-red-700 italic">
                        These rules are enforced by the backend and cannot be overridden here.
                      </p>
                    </div>
                  </div>
                </div>
              </Section>
            </div>
          )}

          {/* ── Invitations ── */}
          {activeSection === 'invitations' && (
            <div className="space-y-6 animate-in fade-in">
              <Section
                title="Invitation behaviour"
                description="When admins send email invitations to provision users."
                icon={Mail}
              >
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <NumberField
                    label="Invitation expiry (days)"
                    description="Invitation links expire after this many days."
                    value={settings.invitationExpiryDays}
                    onChange={(v) => update('invitationExpiryDays', v)}
                    min={1}
                    max={30}
                    icon={Calendar}
                  />
                  <NumberField
                    label="Max resends per invitation"
                    description="Limit on how many times an invite can be resent."
                    value={settings.invitationMaxResends}
                    onChange={(v) => update('invitationMaxResends', v)}
                    min={1}
                    max={20}
                    icon={RefreshCw}
                  />
                </div>
              </Section>

              <Section
                title="First-login policy"
                description="Security requirements when a provisioned user first logs in."
                icon={KeyRound}
              >
                <ToggleRow
                  label="Force password reset on first login"
                  description="User must set a new password immediately, even if invitation included one."
                  checked={settings.forcePasswordResetOnFirstLogin}
                  onChange={(v) => update('forcePasswordResetOnFirstLogin', v)}
                />
                <ToggleRow
                  label="Require MFA on first login"
                  description="User must set up multi-factor authentication during onboarding."
                  checked={settings.requireMfaOnFirstLogin}
                  onChange={(v) => update('requireMfaOnFirstLogin', v)}
                  warning={
                    settings.requireMfaOnFirstLogin
                      ? 'Strict mode — some users may need help from support.'
                      : undefined
                  }
                />
              </Section>

              <Section
                title="Welcome email"
                description="Content and delivery of the welcome message."
                icon={Bell}
              >
                <div className="p-3 bg-blue-50 border border-blue-200 rounded-lg flex items-start gap-2 text-sm text-blue-800">
                  <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />
                  <p>
                    The welcome email template can be customised under{' '}
                    <strong>System → Notifications</strong>. It includes a magic link,
                    onboarding guide, and points to the tenant portal.
                  </p>
                </div>
              </Section>
            </div>
          )}
        </div>
      </div>

      {/* Sticky save bar */}
      {dirty && (
        <div className="fixed bottom-0 left-0 right-0 bg-white border-t border-gray-200 shadow-lg z-30">
          <div className="max-w-6xl mx-auto px-6 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2 text-sm text-amber-700">
              <AlertCircle className="w-4 h-4" />
              <span>You have unsaved changes</span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={reset}
                className="px-3 py-1.5 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Discard
              </button>
              <button
                onClick={save}
                disabled={isSaving}
                className="inline-flex items-center px-4 py-1.5 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50"
              >
                {isSaving ? (
                  <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                ) : (
                  <Save className="w-4 h-4 mr-2" />
                )}
                Save changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

// ─────────────────────────────────────────────────────────────
// Small components
// ─────────────────────────────────────────────────────────────
function Section({
  title,
  description,
  icon: Icon,
  children,
}: {
  title: string;
  description: string;
  icon: typeof Globe;
  children: React.ReactNode;
}) {
  return (
    <section className="bg-white rounded-xl border border-gray-200 shadow-sm">
      <div className="px-6 py-4 border-b border-gray-200">
        <h2 className="text-base font-semibold text-gray-900 flex items-center gap-2">
          <Icon className="w-5 h-5 text-indigo-500" />
          {title}
        </h2>
        <p className="mt-0.5 text-sm text-gray-500">{description}</p>
      </div>
      <div className="p-6 space-y-4">{children}</div>
    </section>
  );
}

function ToggleRow({
  label,
  description,
  checked,
  onChange,
  warning,
  compact = false,
  disabled = false,
}: {
  label: string;
  description: string;
  checked: boolean;
  onChange: (v: boolean) => void;
  warning?: string;
  compact?: boolean;
  disabled?: boolean;
}) {
  return (
    <div
      className={`flex items-start justify-between gap-3 ${compact ? 'py-1' : 'p-3'} ${
        disabled ? 'opacity-60' : ''
      }`}
    >
      <div className="flex-1 min-w-0">
        <p className="text-sm font-medium text-gray-900">{label}</p>
        <p className="text-xs text-gray-500 mt-0.5">{description}</p>
        {warning && (
          <p className="mt-1.5 text-xs text-amber-700 flex items-center gap-1">
            <AlertTriangle className="w-3 h-3 flex-shrink-0" />
            {warning}
          </p>
        )}
      </div>
      <button
        type="button"
        onClick={() => !disabled && onChange(!checked)}
        disabled={disabled}
        className={`relative inline-flex h-6 w-11 flex-shrink-0 cursor-pointer rounded-full border-2 border-transparent transition-colors duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:ring-offset-2 disabled:cursor-not-allowed ${
          checked ? 'bg-indigo-600' : 'bg-gray-200'
        }`}
      >
        <span
          className={`pointer-events-none inline-block h-5 w-5 transform rounded-full bg-white shadow ring-0 transition duration-200 ${
            checked ? 'translate-x-5' : 'translate-x-0'
          }`}
        />
      </button>
    </div>
  );
}

function NumberField({
  label,
  description,
  value,
  onChange,
  min,
  max,
  icon: Icon,
}: {
  label: string;
  description: string;
  value: number;
  onChange: (v: number) => void;
  min: number;
  max: number;
  icon: typeof Timer;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-gray-700 mb-1.5">{label}</label>
      <div className="relative">
        <Icon className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400 pointer-events-none" />
        <input
          type="number"
          value={value}
          onChange={(e) => {
            const n = parseInt(e.target.value, 10);
            if (!isNaN(n)) onChange(Math.max(min, Math.min(max, n)));
          }}
          min={min}
          max={max}
          className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
        />
      </div>
      <p className="mt-1 text-xs text-gray-500">{description}</p>
    </div>
  );
}