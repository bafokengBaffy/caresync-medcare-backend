import { cleanup, fireEvent, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import SettingsPage from './SettingsPage';
import { useUiStore } from '@/stores/ui-store';

describe('SettingsPage', () => {
  afterEach(() => {
    cleanup();
    useUiStore.setState({ theme: 'system', language: 'en' });
  });

  it('updates the persisted theme and language preferences from the settings controls', () => {
    render(<SettingsPage />);

    fireEvent.change(screen.getByLabelText('Colour theme'), { target: { value: 'dark' } });
    fireEvent.change(screen.getByLabelText('Display language'), { target: { value: 'st' } });

    expect(useUiStore.getState().theme).toBe('dark');
    expect(useUiStore.getState().language).toBe('st');
  });
});
