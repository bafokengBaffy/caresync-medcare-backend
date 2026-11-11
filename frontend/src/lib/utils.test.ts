import { describe, it, expect } from 'vitest';
import { formatMoney, formatDate, initials, truncate, cn } from './utils';

describe('utils', () => {
  it('formatMoney', () => { expect(formatMoney(12000)).toContain('120'); });
  it('formatDate preserves a date-only value in the local timezone', () => {
    expect(formatDate('2026-01-01')).toBe('Jan 1, 2026');
  });
  it('initials', () => { expect(initials('John', 'Doe')).toBe('JD'); });
  it('truncate', () => { expect(truncate('hello world', 5)).toBe('hello…'); });
  it('cn merges', () => { expect(cn('a', 'b')).toBe('a b'); });
});
