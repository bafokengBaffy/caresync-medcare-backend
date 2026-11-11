import { describe, expect, it } from 'vitest';
import { translate } from './i18n';

describe('translate', () => {
  it('returns English messages for English users', () => {
    expect(translate('en', 'nav.patients')).toBe('Patients');
  });

  it('returns Sesotho messages for Sesotho users', () => {
    expect(translate('st', 'nav.patients')).toBe('Bakuli');
  });

  it('falls back to English when a translation is not available', () => {
    expect(translate('st', 'nav.dashboard')).toBe('Leqephe la kakaretso');
  });
});
