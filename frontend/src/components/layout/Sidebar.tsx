import { Link, NavLink } from 'react-router-dom';
import {
  Building,
  Calendar,
  ChevronLeft,
  CreditCard,
  FileText,
  LayoutDashboard,
  Receipt,
  Settings,
  Shield,
  Stethoscope,
  Users,
} from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useProfile } from '@/hooks/use-profile';
import { useUiStore } from '@/stores/ui-store';
import { useAuthStore } from '@/stores/auth-store';
import { cn, initials } from '@/lib/utils';
import { translate, type TranslationKey } from '@/lib/i18n';
import type { Role } from '@/lib/constants';

type NavigationItem = {
  to: string;
  label: string;
  icon: typeof LayoutDashboard;
};

type NavigationSection = {
  label: string;
  items: NavigationItem[];
};

const roleHome: Record<Role, string> = {
  SUPER_ADMIN: '/admin/super',
  TENANT_ADMIN: '/admin/tenant',
  PROVIDER: '/clinical/dashboard',
  CLINICIAN: '/clinical/dashboard',
  RECEPTION: '/reception/dashboard',
  RECEPTIONIST: '/reception/dashboard',
  STAFF: '/reception/dashboard',
  FINANCE: '/finance/dashboard',
  MANAGER: '/finance/dashboard',
  PATIENT: '/portal',
  CONSENT_MANAGER: '/shared/settings',
  PRIVACY_OFFICER: '/shared/settings',
};

const roleItems: Partial<Record<Role, NavigationItem[]>> = {
  SUPER_ADMIN: [{ to: '/admin/super', label: 'Platform dashboard', icon: LayoutDashboard }],
  TENANT_ADMIN: [{ to: '/admin/tenant', label: 'Tenant dashboard', icon: LayoutDashboard }],
  PROVIDER: [
    { to: '/clinical/dashboard', label: 'Clinical dashboard', icon: LayoutDashboard },
    { to: '/clinical/dental-charts', label: 'Dental charts', icon: Stethoscope },
    { to: '/clinical/eye-exams', label: 'Eye exams', icon: Stethoscope },
    { to: '/clinical/lab-results', label: 'Lab results', icon: FileText },
  ],
  CLINICIAN: [
    { to: '/clinical/dashboard', label: 'Clinical dashboard', icon: LayoutDashboard },
    { to: '/clinical/dental-charts', label: 'Dental charts', icon: Stethoscope },
    { to: '/clinical/eye-exams', label: 'Eye exams', icon: Stethoscope },
    { to: '/clinical/lab-results', label: 'Lab results', icon: FileText },
  ],
  RECEPTION: [
    { to: '/reception/dashboard', label: 'Reception dashboard', icon: LayoutDashboard },
    { to: '/reception/billing/invoices', label: 'Invoices', icon: Receipt },
    { to: '/reception/billing/settings', label: 'Billing settings', icon: Settings },
  ],
  RECEPTIONIST: [
    { to: '/reception/dashboard', label: 'Reception dashboard', icon: LayoutDashboard },
    { to: '/reception/billing/invoices', label: 'Invoices', icon: Receipt },
    { to: '/reception/billing/settings', label: 'Billing settings', icon: Settings },
  ],
  STAFF: [
    { to: '/reception/dashboard', label: 'Staff dashboard', icon: LayoutDashboard },
    { to: '/reception/billing/invoices', label: 'Invoices', icon: Receipt },
  ],
  FINANCE: [
    { to: '/finance/dashboard', label: 'Finance dashboard', icon: LayoutDashboard },
    { to: '/finance/payments', label: 'Payments', icon: CreditCard },
    { to: '/finance/service-fees', label: 'Service fees', icon: Receipt },
    { to: '/finance/reports', label: 'Financial reports', icon: FileText },
  ],
  MANAGER: [
    { to: '/finance/dashboard', label: 'Manager dashboard', icon: LayoutDashboard },
    { to: '/finance/payments', label: 'Payments', icon: CreditCard },
    { to: '/finance/service-fees', label: 'Service fees', icon: Receipt },
    { to: '/finance/reports', label: 'Financial reports', icon: FileText },
  ],
  PATIENT: [
    { to: '/portal', label: 'Patient home', icon: LayoutDashboard },
    { to: '/portal/appointments', label: 'My appointments', icon: Calendar },
    { to: '/portal/records', label: 'My records', icon: FileText },
    { to: '/portal/billing', label: 'My billing', icon: Receipt },
  ],
};

const roleSections: Partial<Record<Role, NavigationSection[]>> = {
  SUPER_ADMIN: [
    {
      label: 'Organizations',
      items: [{ to: '/admin/super/tenants', label: 'Tenants', icon: Building }],
    },
    {
      label: 'Users and access',
      items: [
        { to: '/admin/super/users', label: 'Users', icon: Users },
        { to: '/admin/super/roles', label: 'Role management', icon: Shield },
      ],
    },
    {
      label: 'Registration',
      items: [
        { to: '/admin/super/registration/requests', label: 'Registration requests', icon: FileText },
        { to: '/admin/super/registration/activations', label: 'Pending activations', icon: Shield },
        { to: '/admin/super/registration/provision-staff', label: 'Provision staff', icon: Stethoscope },
        { to: '/admin/super/registration/settings', label: 'Registration settings', icon: Settings },
      ],
    },
    {
      label: 'Billing',
      items: [
        { to: '/admin/super/revenue', label: 'Revenue', icon: Receipt },
        { to: '/admin/super/subscriptions', label: 'Subscriptions', icon: CreditCard },
      ],
    },
    {
      label: 'Audit and activity',
      items: [
        { to: '/admin/super/audit', label: 'Audit log', icon: FileText },
        { to: '/admin/super/activity', label: 'Platform activity', icon: Calendar },
      ],
    },
    {
      label: 'Platform settings',
      items: [
        { to: '/admin/super/settings', label: 'Global settings', icon: Settings },
        { to: '/admin/super/integrations', label: 'Integrations', icon: CreditCard },
      ],
    },
  ],
  TENANT_ADMIN: [
    {
      label: 'Users and staff',
      items: [
        { to: '/admin/tenant/users', label: 'Users', icon: Users },
        { to: '/admin/tenant/staff', label: 'Staff', icon: Stethoscope },
      ],
    },
    {
      label: 'Registration',
      items: [
        { to: '/admin/tenant/registration/patients', label: 'Patient registrations', icon: Users },
        { to: '/admin/tenant/registration/approvals', label: 'Pending approvals', icon: Shield },
        { to: '/admin/tenant/registration/staff', label: 'Staff provisioning', icon: Stethoscope },
      ],
    },
    {
      label: 'Security and settings',
      items: [
        { to: '/admin/tenant/roles', label: 'Role management', icon: Shield },
        { to: '/admin/tenant/settings', label: 'Tenant settings', icon: Settings },
        { to: '/admin/tenant/audit', label: 'Audit log', icon: FileText },
      ],
    },
  ],
};

const settingsLink: { to: string; label: TranslationKey; icon: typeof Settings } = {
  to: '/shared/settings',
  label: 'nav.settings',
  icon: Settings,
};

export function Sidebar() {
  const { sidebarCollapsed: collapsed, toggleSidebar, language } = useUiStore();
  const user = useAuthStore((state) => state.user);
  const role = user?.role;
  const { data: profile } = useProfile();
  const t = (key: TranslationKey) => translate(language, key);
  const visibleItems = role ? roleItems[role] ?? [] : [];
  const visibleSections = role ? roleSections[role] ?? [] : [];

  return (
    <aside className={cn('fixed inset-y-0 left-0 z-40 flex h-screen flex-col border-r bg-card transition-[width] duration-300 ease-in-out', collapsed ? 'w-16' : 'w-64')}>
      <div className="flex h-16 shrink-0 items-center justify-between border-b px-3">
        {!collapsed && (
          <Link to={role ? roleHome[role] : '/'} aria-label="CareSync workspace" className="min-w-0">
            <img src="/logo.png" alt="CareSync MedCare" className="h-10 max-w-[168px] object-contain object-left" />
          </Link>
        )}
        <button
          type="button"
          onClick={toggleSidebar}
          aria-label={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          aria-expanded={!collapsed}
          className="rounded-md p-2 text-muted-foreground transition-colors hover:bg-muted hover:text-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
        >
          <ChevronLeft aria-hidden="true" className={cn('h-4 w-4 transition-transform duration-300', collapsed && 'rotate-180')} />
        </button>
      </div>
      <nav aria-label="Workspace navigation" className="min-h-0 flex-1 space-y-1 overflow-y-auto overscroll-y-contain p-2">
        {visibleItems.map(({ to, label, icon: Icon }) => (
          <NavLink
            key={to}
            to={to}
            title={collapsed ? label : undefined}
            className={({ isActive }) => cn('flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted', isActive && 'bg-primary/10 text-primary')}
          >
            <Icon className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
        {visibleSections.map(({ label: sectionLabel, items }) => (
          <div key={sectionLabel} className="space-y-1">
            {!collapsed && <div className="px-3 pt-4 text-xs font-semibold uppercase text-muted-foreground">{sectionLabel}</div>}
            {items.map(({ to, label, icon: Icon }) => (
              <NavLink
                key={to}
                to={to}
                title={collapsed ? label : undefined}
                className={({ isActive }) => cn('flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted', isActive && 'bg-primary/10 text-primary')}
              >
                <Icon className="h-4 w-4 shrink-0" />
                {!collapsed && <span>{label}</span>}
              </NavLink>
            ))}
          </div>
        ))}
      </nav>
      <div className="shrink-0 border-t p-2">
        <div className={cn('mb-2 flex items-center gap-3 rounded-md px-2 py-2', collapsed && 'justify-center px-0')}>
          <Avatar className="h-8 w-8">
            <AvatarImage src={profile?.profileImageUrl ?? undefined} alt="" />
            <AvatarFallback className="text-xs">
              {initials(
                profile?.fullName.split(' ')[0] ?? user?.displayName?.split(' ')[0],
                profile?.fullName.split(' ').slice(1).join(' ') ?? user?.displayName?.split(' ').slice(1).join(' '),
              )}
            </AvatarFallback>
          </Avatar>
          {!collapsed && (
            <div className="min-w-0">
              <p className="truncate text-sm font-medium text-foreground">
                {profile?.fullName || user?.displayName || user?.email}
              </p>
              <p className="truncate text-xs text-muted-foreground">{profile?.role ?? role}</p>
            </div>
          )}
        </div>
        {role && role !== 'PATIENT' && (
          <NavLink
            to={settingsLink.to}
            title={collapsed ? t(settingsLink.label) : undefined}
            className={({ isActive }) => cn('flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted', isActive && 'bg-primary/10 text-primary')}
          >
            <Settings className="h-4 w-4 shrink-0" />
            {!collapsed && <span>{t(settingsLink.label)}</span>}
          </NavLink>
        )}
      </div>
    </aside>
  );
}
