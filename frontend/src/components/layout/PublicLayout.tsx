import { useState } from 'react';
import { Link, NavLink, Outlet } from 'react-router-dom';
import { ArrowUpRight, Menu, X } from 'lucide-react';
import { cn } from '@/lib/utils';

const publicLinks = [
  { href: '/#features', label: 'Features' },
  { href: '/#workflow', label: 'How it works' },
  { href: '/#security', label: 'Security' },
];

export function PublicLayout() {
  const [menuOpen, setMenuOpen] = useState(false);

  return (
    <div className="min-h-screen bg-white text-slate-900 dark:bg-slate-950 dark:text-white">
      <header className="sticky top-0 z-40 border-b border-slate-200/80 bg-white/90 backdrop-blur-xl dark:border-white/10 dark:bg-slate-950/90">
        <div className="mx-auto flex h-20 max-w-7xl items-center justify-between px-5 sm:px-8">
          <Link to="/" aria-label="CareSync MedCare home" className="flex items-center">
            <img src="/logo.png" alt="CareSync MedCare" className="h-12 w-auto object-contain" />
          </Link>

          <nav aria-label="Public navigation" className="hidden items-center gap-9 md:flex">
            {publicLinks.map((item) => (
              <a
                key={item.href}
                href={item.href}
                className="text-sm font-medium text-slate-600 transition hover:text-blue-700 dark:text-slate-300 dark:hover:text-cyan-300"
              >
                {item.label}
              </a>
            ))}
          </nav>

          <div className="hidden items-center gap-3 md:flex">
            <Link
              to="/auth/login"
              className="rounded-lg px-4 py-2.5 text-sm font-semibold text-slate-700 transition hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
            >
              Sign in
            </Link>
            <Link
              to="/auth/register"
              className="inline-flex items-center gap-2 rounded-lg bg-blue-700 px-4 py-2.5 text-sm font-semibold text-white shadow-sm transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-500 focus-visible:ring-offset-2"
            >
              Get started <ArrowUpRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>

          <button
            type="button"
            aria-label={menuOpen ? 'Close navigation menu' : 'Open navigation menu'}
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((open) => !open)}
            className="rounded-lg p-2 text-slate-700 hover:bg-slate-100 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 md:hidden dark:text-white dark:hover:bg-white/10"
          >
            {menuOpen ? <X aria-hidden="true" /> : <Menu aria-hidden="true" />}
          </button>
        </div>

        {menuOpen && (
          <nav aria-label="Mobile navigation" className="border-t border-slate-200 px-5 py-4 md:hidden dark:border-white/10">
            <div className="mx-auto flex max-w-7xl flex-col gap-1">
              {publicLinks.map((item) => (
                <a
                  key={item.href}
                  href={item.href}
                  onClick={() => setMenuOpen(false)}
                  className="rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
                >
                  {item.label}
                </a>
              ))}
              <Link
                to="/auth/login"
                onClick={() => setMenuOpen(false)}
                className="rounded-lg px-3 py-3 text-sm font-medium text-slate-700 hover:bg-slate-100 dark:text-slate-200 dark:hover:bg-white/10"
              >
                Sign in
              </Link>
              <Link
                to="/auth/register"
                onClick={() => setMenuOpen(false)}
                className="mt-2 rounded-lg bg-blue-700 px-4 py-3 text-center text-sm font-semibold text-white"
              >
                Get started
              </Link>
            </div>
          </nav>
        )}
      </header>

      <main>
        <Outlet />
      </main>

      <footer className="border-t border-slate-200 bg-slate-50 dark:border-white/10 dark:bg-slate-900">
        <div className="mx-auto flex max-w-7xl flex-col gap-5 px-5 py-8 sm:flex-row sm:items-center sm:justify-between sm:px-8">
          <Link to="/" className="flex items-center">
            <img src="/logo.png" alt="CareSync MedCare" className="h-10 w-auto object-contain" />
          </Link>
          <p className="text-sm text-slate-500 dark:text-slate-400">
            Connected care, thoughtfully coordinated.
          </p>
          <div className="flex gap-5 text-sm">
            <NavLink
              to="/auth/login"
              className={({ isActive }) =>
                cn('text-slate-600 hover:text-blue-700 dark:text-slate-300 dark:hover:text-cyan-300', isActive && 'font-semibold')
              }
            >
              Sign in
            </NavLink>
            <Link to="/auth/register" className="font-semibold text-blue-700 hover:text-blue-800 dark:text-cyan-300">
              Create account
            </Link>
          </div>
        </div>
      </footer>
    </div>
  );
}
