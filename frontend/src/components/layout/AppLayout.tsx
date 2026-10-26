import { Outlet } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { useUiStore } from '@/stores/ui-store';
import { cn } from '@/lib/utils';

export function AppLayout() {
  const collapsed = useUiStore((s) => s.sidebarCollapsed);
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <div className={cn('flex flex-col transition-all', collapsed ? 'ml-16' : 'ml-64')}>
        <Topbar />
        <main className="page-container flex-1"><Outlet /></main>
      </div>
    </div>
  );
}
