import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

export function cn(...inputs: ClassValue[]) { return twMerge(clsx(inputs)); }
export function formatDate(d: string | Date, opts?: Intl.DateTimeFormatOptions) {
  const date = typeof d === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(d)
    ? new Date(`${d}T00:00:00`)
    : new Date(d);
  return new Intl.DateTimeFormat('en-US', opts ?? { dateStyle: 'medium' }).format(date);
}
export function formatDateTime(d: string | Date) { return formatDate(d, { dateStyle: 'medium', timeStyle: 'short' }); }
export function formatMoney(cents: number, currency = 'USD') { return new Intl.NumberFormat('en-US', { style: 'currency', currency }).format(cents / 100); }
export function initials(first?: string, last?: string) { return `${first?.[0] ?? ''}${last?.[0] ?? ''}`.toUpperCase() || '?'; }
export function truncate(s: string, n = 60) { return s.length > n ? `${s.slice(0, n)}…` : s; }
export function sleep(ms: number) { return new Promise((r) => setTimeout(r, ms)); }
