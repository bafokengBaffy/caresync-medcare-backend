import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useUiStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';

export function AppLayout() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  return (
    <div className="flex h-screen min-h-0 overflow-hidden bg-background">
      <Sidebar />
      <div className={cn('flex min-h-0 min-w-0 flex-1 flex-col transition-[margin] duration-300 ease-in-out', collapsed ? 'ml-16' : 'ml-64')}>
        <Topbar />
        <main className="min-h-0 flex-1 overflow-y-auto overscroll-y-contain">
          <div className="page-container min-h-full"><Outlet /></div>
        </main>
      </div>
    </div>
  );
}
