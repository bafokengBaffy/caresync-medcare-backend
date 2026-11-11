import { act, cleanup, render, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { ThemeController } from './ThemeController';
import { useUiStore } from '@/stores/ui-store';

function setSystemTheme(isDark: boolean) {
  const media = {
    matches: isDark,
    media: '(prefers-color-scheme: dark)',
    onchange: null,
    addEventListener: () => undefined,
    removeEventListener: () => undefined,
    addListener: (_: (event: MediaQueryListEvent) => void) => undefined,
    removeListener: (_: (event: MediaQueryListEvent) => void) => undefined,
    dispatchEvent: () => true,
  } as MediaQueryList;

  vi.stubGlobal('matchMedia', vi.fn(() => media));
  return media;
}

describe('ThemeController', () => {
  afterEach(() => {
    cleanup();
    document.documentElement.classList.remove('dark');
    document.documentElement.lang = 'en';
    vi.unstubAllGlobals();
    act(() => useUiStore.setState({ theme: 'system', language: 'en' }));
  });

  it('applies the explicitly selected dark theme and selected language', async () => {
    useUiStore.setState({ theme: 'dark', language: 'st' });
    render(<ThemeController />);

    await waitFor(() => {
      expect(document.documentElement).toHaveClass('dark');
      expect(document.documentElement.lang).toBe('st');
    });
  });

  it('follows the system colour preference when system mode is selected', async () => {
    setSystemTheme(true);
    useUiStore.setState({ theme: 'system' });
    render(<ThemeController />);

    await waitFor(() => expect(document.documentElement).toHaveClass('dark'));
  });
});
