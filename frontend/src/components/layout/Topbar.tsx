import { LogOut, Moon, Sun, User } from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Button } from '@/components/ui/button';
import { useProfile } from '@/hooks/use-profile';
import { useAuth } from '@/hooks/use-auth';
import { initials } from '@/lib/utils';
import { useUiStore } from '@/stores/ui-store';
import { translate, type TranslationKey } from '@/lib/i18n';
import { TenantContextSelector } from './TenantContextSelector';

export function Topbar() {
  const { user, logout } = useAuth();
  const { data: profile } = useProfile();
  const navigate = useNavigate();
  const { theme, setTheme, language, setLanguage } = useUiStore();
  const t = (key: TranslationKey) => translate(language, key);
  const onLogout = async () => { await logout(); navigate('/auth/login'); };
  return (
    <header className="relative z-30 flex h-16 shrink-0 items-center justify-end gap-3 border-b bg-background/95 px-6 backdrop-blur">
      <TenantContextSelector />
      <div className="flex items-center gap-3">
        <label className="sr-only" htmlFor="display-language">{t('action.language')}</label>
        <select
          id="display-language"
          value={language}
          onChange={(event) => setLanguage(event.target.value as 'en' | 'st')}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="en">{t('language.english')}</option>
          <option value="st">{t('language.sesotho')}</option>
        </select>
        <label className="sr-only" htmlFor="display-theme">{t('settings.theme')}</label>
        <select
          id="display-theme"
          value={theme}
          onChange={(event) => setTheme(event.target.value as 'light' | 'dark' | 'system')}
          className="h-9 rounded-md border border-input bg-background px-2 text-sm"
        >
          <option value="system">{t('theme.system')}</option>
          <option value="light">{t('theme.light')}</option>
          <option value="dark">{t('theme.dark')}</option>
        </select>
        <Button
          variant="ghost"
          size="icon"
          aria-label={t('action.toggleTheme')}
          title={t('action.toggleTheme')}
          onClick={() => setTheme(theme === 'dark' ? 'light' : 'dark')}
        >
          {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
        </Button>
        <Avatar>
          <AvatarImage src={profile?.profileImageUrl ?? undefined} alt="" />
          <AvatarFallback>
            {initials(profile?.fullName.split(' ')[0] ?? user?.displayName?.split(' ')[0], profile?.fullName.split(' ').slice(1).join(' ') ?? user?.displayName?.split(' ').slice(1).join(' '))}
          </AvatarFallback>
        </Avatar>
        <div className="hidden text-sm md:block">
          <div className="font-medium">{profile?.fullName || user?.displayName || user?.email}</div>
          <div className="text-xs text-muted-foreground">{user?.role ?? 'USER'}</div>
        </div>
        <Button variant="ghost" size="icon" aria-label={t('action.profile')} title={t('action.profile')} onClick={() => navigate('/shared/profile')}><User className="h-4 w-4" /></Button>
        <Button variant="ghost" size="icon" aria-label={t('action.signOut')} title={t('action.signOut')} onClick={onLogout}><LogOut className="h-4 w-4" /></Button>
      </div>
    </header>
  );
}
