import { useEffect, useState, type ReactNode } from 'react';

const STARTUP_DELAY_MS = 5_000;

export function StartupGate({ children }: { children: ReactNode }) {
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const timeout = window.setTimeout(() => setReady(true), STARTUP_DELAY_MS);
    return () => window.clearTimeout(timeout);
  }, []);

  if (ready) return children;

  return (
    <main
      aria-label="Loading CareSync MedCare"
      className="flex min-h-screen items-center justify-center bg-slate-950 px-6 text-center text-white"
    >
      <div className="flex flex-col items-center">
        <div className="mb-7 flex h-36 w-36 items-center justify-center overflow-hidden rounded-full bg-white p-5 shadow-2xl shadow-blue-950/40">
          <img
            src="/logo.png"
            alt="CareSync MedCare"
            className="h-full w-full animate-spin object-contain motion-reduce:animate-none"
          />
        </div>
        <p className="text-lg font-semibold tracking-wide">CareSync MedCare</p>
        <p className="mt-2 text-sm text-slate-300">Preparing a more connected care experience</p>
        <div className="mt-7 h-1 w-48 overflow-hidden rounded-full bg-white/15">
          <div className="h-full w-1/2 animate-pulse rounded-full bg-cyan-300" />
        </div>
      </div>
    </main>
  );
}
