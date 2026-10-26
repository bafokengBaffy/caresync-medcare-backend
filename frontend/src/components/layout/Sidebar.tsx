import { NavLink } from 'react-router-dom';
import { LayoutDashboard, Users, Stethoscope, Calendar, FileText, Receipt, CreditCard, Settings, Shield, Building, ChevronLeft } from 'lucide-react';
import { useUiStore } from '@/stores/ui-store';
import { useAuthStore } from '@/stores/auth-store';
import { cn } from '@/lib/utils';

const items = [
  { to: '/dashboard', label: 'Dashboard', icon: LayoutDashboard },
  { to: '/patients', label: 'Patients', icon: Users },
  { to: '/providers', label: 'Providers', icon: Stethoscope },
  { to: '/appointments', label: 'Appointments', icon: Calendar },
  { to: '/notes', label: 'Clinical Notes', icon: FileText },
  { to: '/invoices', label: 'Invoices', icon: Receipt },
  { to: '/payments', label: 'Payments', icon: CreditCard },
];
const admin = [
  { to: '/admin/tenants', label: 'Tenants', icon: Building },
  { to: '/admin/audit', label: 'Audit Log', icon: Shield },
];
const bottom = [{ to: '/settings', label: 'Settings', icon: Settings }];

export function Sidebar() {
  const { sidebarCollapsed: collapsed, toggleSidebar } = useUiStore();
  const role = useAuthStore((s) => s.user?.role);

  return (
    <aside className={cn('fixed inset-y-0 left-0 z-40 flex flex-col border-r bg-card transition-all', collapsed ? 'w-16' : 'w-64')}>
      <div className="flex h-16 items-center justify-between border-b px-4">
        {!collapsed && <span className="text-lg font-bold">CareSync</span>}
        <button onClick={toggleSidebar} className="rounded p-1 hover:bg-muted"><ChevronLeft className={cn('h-4 w-4 transition-transform', collapsed && 'rotate-180')} /></button>
      </div>
      <nav className="flex-1 space-y-1 overflow-y-auto p-2">
        {items.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => cn('flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted', isActive && 'bg-primary/10 text-primary')}>
            <Icon className="h-4 w-4 shrink-0" />{!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
        {role === 'ADMIN' && (
          <>
            {!collapsed && <div className="px-3 pt-4 text-xs font-semibold uppercase text-muted-foreground">Admin</div>}
            {admin.map(({ to, label, icon: Icon }) => (
              <NavLink key={to} to={to} className={({ isActive }) => cn('flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted', isActive && 'bg-primary/10 text-primary')}>
                <Icon className="h-4 w-4 shrink-0" />{!collapsed && <span>{label}</span>}
              </NavLink>
            ))}
          </>
        )}
      </nav>
      <div className="border-t p-2">
        {bottom.map(({ to, label, icon: Icon }) => (
          <NavLink key={to} to={to} className={({ isActive }) => cn('flex items-center gap-3 rounded-md px-3 py-2 text-sm font-medium hover:bg-muted', isActive && 'bg-primary/10 text-primary')}>
            <Icon className="h-4 w-4 shrink-0" />{!collapsed && <span>{label}</span>}
          </NavLink>
        ))}
      </div>
    </aside>
  );
}
