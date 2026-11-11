import { Outlet } from 'react-router-dom';
export function AuthLayout() {
  return (
    <div className="bg-slate-50 px-4 py-12 sm:px-6 lg:py-16 dark:bg-slate-950">
      <Outlet />
    </div>
  );
}
