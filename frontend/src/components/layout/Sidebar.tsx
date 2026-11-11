import { Link, NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Stethoscope, Calendar, FileText, Receipt, CreditCard, Settings, Shield, Building, ChevronLeft } from 'lucide-react';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useProfile } from '@/hooks/use-profile';
import { useUiStore } from '@/stores/ui-store';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';
import { translate, type TranslationKey } from '@/lib/i18n';
import { initials } from '@/lib/utils';

const items: Array<{ to: string; label: TranslationKey; icon: typeof LayoutDashboard }> = [
  { to: '/dashboard', label: 'nav.dashboard', icon: LayoutDashboard },
  { to: '/patients', label: 'nav.patients', icon: Users },
  { to: '/providers', label: 'nav.providers', icon: Stethoscope },
  { to: '/appointments', label: 'nav.appointments', icon: Calendar },
  { to: '/notes', label: 'nav.notes', icon: FileText },
  { to: '/invoices', label: 'nav.invoices', icon: Receipt },
  { to: '/payments', label: 'nav.payments', icon: CreditCard },
];
const platformAdmin: Array<{ to: string; label: string; icon: typeof Building }> = [
  { to: '/admin/super', label: 'Platform dashboard', icon: LayoutDashboard },
  { to: '/admin/super/users', label: 'Users', icon: Users },
  { to: '/admin/tenants', label: 'nav.tenants', icon: Building },
  { to: '/admin/super/registration/requests', label: 'Registration requests', icon: Shield },
];
const tenantAdmin: Array<{ to: string; label: string; icon: typeof Building }> = [
  { to: '/admin/tenant', label: 'Tenant dashboard', icon: LayoutDashboard },
  { to: '/admin/tenant/users', label: 'Users', icon: Users },
  { to: '/admin/tenant/staff', label: 'Staff', icon: Stethoscope },
  { to: '/admin/tenant/settings', label: 'Tenant settings', icon: Settings },
];
const bottom: Array<{ to: string; label: TranslationKey; icon: typeof Settings }> = [
  { to: '/settings', label: 'nav.settings', icon: Settings },
];

export function Sidebar() {
  const { sidebarCollapsed: collapsed, toggleSidebar, language } = useUiStore();
  const user = useAuthStore((s) => s.user);
  const role = user?.role;
  const isPatient = role === 'PATIENT';
  const isSuperAdmin = role === 'SUPER_ADMIN';
  const isTenantAdmin = role === 'TENANT_ADMIN' || role === 'ADMIN';
  const { data: profile } = useProfile();
  const t = (key: TranslationKey) => translate(language, key);
  const visibleItems = isPatient
    ? [
        { to: '/portal', label: 'Patient home', icon: LayoutDashboard },
        { to: '/portal/appointments', label: 'My appointments', icon: Calendar },
        { to: '/portal/records', label: 'My records', icon: FileText },
        { to: '/portal/billing', label: 'My billing', icon: Receipt },
      ]
    : isSuperAdmin
      ? platformAdmin.slice(0, 2)
      : items.filter(({ to }) => {
          if (['/providers', '/notes'].includes(to)) {
            return ['ADMIN', 'TENANT_ADMIN', 'PROVIDER', 'CLINICIAN', 'MANAGER'].includes(role ?? '');
          }
          if (['/invoices', '/payments'].includes(to)) {
            return ['ADMIN', 'TENANT_ADMIN', 'FINANCE', 'MANAGER'].includes(role ?? '');
          }
          return true;
        });

  return (
    <aside className={cn('fixed inset-y-0 left-0 z-40 flex h-screen flex-col border-r bg-card transition-[width] duration-300 ease-in-out', collapsed ? 'w-16' : 'w-64')}>
      <div className="flex h-16 shrink-0 items-center justify-between border-b px-3">
        {!collapsed && (
          <Link to="/dashboard" aria-label="CareSync dashboard" className="min-w-0">
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
          <NavLink key={to} to={to} title={collapsed ? (typeof label === 'string' && label.startsWith('nav.') ? t(label as TranslationKey) : label) : undefined} className={({ isActive }) => cn('flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted', isActive && 'bg-primary/10 text-primary')}>
            <Icon className="h-4 w-4 shrink-0" />{!collapsed && <span>{typeof label === 'string' && label.startsWith('nav.') ? t(label as TranslationKey) : label}</span>}
          </NavLink>
        ))}
        {isTenantAdmin && !isPatient && (
          <>
            {!collapsed && <div className="px-3 pt-4 text-xs font-semibold uppercase text-muted-foreground">{t('nav.admin')}</div>}
            {tenantAdmin.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} title={collapsed ? label : undefined} className={({ isActive }) => cn('flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted', isActive && 'bg-primary/10 text-primary')}>
                <Icon className="h-4 w-4 shrink-0" />{!collapsed && <span>{label}</span>}
              </NavLink>
            ))}
          </>
        )}
        {role === 'SUPER_ADMIN' && !collapsed && <div className="px-3 pt-4 text-xs font-semibold uppercase text-muted-foreground">Platform administration</div>}
        {role === 'SUPER_ADMIN' && platformAdmin.slice(2).map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} title={collapsed ? label : undefined} className={({ isActive }) => cn('flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium text-foreground transition-colors hover:bg-muted', isActive && 'bg-primary/10 text-primary')}>
            <Icon className="h-4 w-4 shrink-0" />{!collapsed && <span>{label}</span>}
          </NavLink>
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
        {!isPatient && bottom.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} title={collapsed ? t(label) : undefined} className={({ isActive }) => cn('flex min-h-10 items-center gap-3 rounded-md px-3 py-2 text-sm font-medium transition-colors hover:bg-muted', isActive && 'bg-primary/10 text-primary')}>
            <Icon className="h-4 w-4 shrink-0" />{!collapsed && <span>{t(label)}</span>}
          </NavLink>
        ))}
      </div>
    </aside>
  );
}
