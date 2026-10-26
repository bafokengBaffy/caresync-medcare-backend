import { Outlet, Link } from 'react-router-dom';
export function AuthLayout() {
  return (
    <div className="flex min-h-screen flex-col bg-gradient-to-br from-blue-50 to-indigo-100 dark:from-slate-900 dark:to-slate-800">
      <header className="flex items-center justify-between px-6 py-4">
        <Link to="/" className="flex items-center gap-2 text-lg font-bold"><span className="flex h-8 w-8 items-center justify-center rounded bg-primary text-primary-foreground">C</span>CareSync MedCare</Link>
      </header>
      <main className="flex flex-1 items-center justify-center px-4 py-12"><Outlet /></main>
      <footer className="text-center text-xs text-muted-foreground py-4">© 2026 CareSync MedCare</footer>
    </div>
  );
}
