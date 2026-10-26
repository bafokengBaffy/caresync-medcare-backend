import { LogOut, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useAuth } from '@/hooks/use-auth';
import { initials } from '@/lib/utils';

export function Topbar() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const onLogout = async () => { await logout(); navigate('/auth/login'); };
  return (
    <header className="sticky top-0 z-30 flex h-16 items-center justify-end gap-3 border-b bg-background/80 px-6 backdrop-blur">
      <div className="flex items-center gap-3">
        <Avatar><AvatarFallback>{initials(user?.displayName?.split(' ')[0], user?.displayName?.split(' ')[1])}</AvatarFallback></Avatar>
        <div className="hidden text-sm md:block">
          <div className="font-medium">{user?.displayName ?? user?.email}</div>
          <div className="text-xs text-muted-foreground">{user?.role ?? 'USER'}</div>
        </div>
        <Button variant="ghost" size="icon" onClick={() => navigate('/settings/profile')}><User className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" onClick={onLogout}><LogOut className="h-4 w-4" /></Button>
      </div>
    </header>
  );
}
