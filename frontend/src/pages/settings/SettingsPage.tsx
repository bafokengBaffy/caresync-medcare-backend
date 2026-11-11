import { Settings } from 'lucide-react';
import { useUiStore } from '@/stores/ui-store';
import { translate, type TranslationKey } from '@/lib/i18n';

const SettingsPage = () => {
  const { theme, setTheme, language, setLanguage } = useUiStore();
  const t = (key: TranslationKey) => translate(language, key);

  return (
    <div className="mx-auto w-full max-w-4xl space-y-6">
      <div>
        <h1 className="flex items-center gap-2 text-2xl font-bold tracking-tight">
          <Settings className="h-6 w-6 text-primary" />
          {t('settings.title')}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">{t('settings.description')}</p>
      </div>

      <section className="space-y-4 rounded-lg border bg-card p-6">
        <div>
          <h2 className="text-lg font-semibold">{t('settings.appearance')}</h2>
        </div>

        <div className="grid gap-4 sm:grid-cols-2">
          <div className="space-y-2">
            <label htmlFor="settings-theme" className="text-sm font-medium">{t('settings.theme')}</label>
            <select
              id="settings-theme"
              value={theme}
              onChange={(event) => setTheme(event.target.value as 'light' | 'dark' | 'system')}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="system">{t('theme.system')}</option>
              <option value="light">{t('theme.light')}</option>
              <option value="dark">{t('theme.dark')}</option>
            </select>
          </div>
          <div className="space-y-2">
            <label htmlFor="settings-language" className="text-sm font-medium">{t('settings.language')}</label>
            <select
              id="settings-language"
              value={language}
              onChange={(event) => setLanguage(event.target.value as 'en' | 'st')}
              className="h-10 w-full rounded-md border border-input bg-background px-3 text-sm"
            >
              <option value="en">{t('language.english')}</option>
              <option value="st">{t('language.sesotho')}</option>
            </select>
          </div>
        </div>
      </section>
    </div>
  );
};

export default SettingsPage;