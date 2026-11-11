import { useEffect } from 'react';
import { useUiStore } from '@/stores/ui-store';

export function ThemeController() {
  const theme = useUiStore((state) => state.theme);
  const language = useUiStore((state) => state.language);

  useEffect(() => {
    const media = typeof window.matchMedia === 'function'
      ? window.matchMedia('(prefers-color-scheme: dark)')
      : null;
    const applyTheme = () => {
      const isDark = theme === 'dark' || (theme === 'system' && (media?.matches ?? false));
      document.documentElement.classList.toggle('dark', isDark);
      document.documentElement.style.colorScheme = isDark ? 'dark' : 'light';
    };

    applyTheme();
    if (theme !== 'system' || !media) return;

    media.addEventListener('change', applyTheme);
    return () => media.removeEventListener('change', applyTheme);
  }, [theme]);

  useEffect(() => {
    document.documentElement.lang = language;
  }, [language]);

  return null;
}
