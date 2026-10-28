import { useState, type FormEvent } from 'react';
import { FirebaseError } from 'firebase/app';
import {
  ArrowRight,
  Eye,
  EyeOff,
  HeartPulse,
  LockKeyhole,
  Mail,
  ShieldCheck,
} from 'lucide-react';
import {
  GoogleAuthProvider,
  browserLocalPersistence,
  browserSessionPersistence,
  setPersistence,
  signOut,
  signInWithEmailAndPassword,
  signInWithPopup,
} from 'firebase/auth';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { auth, parseFirebaseAuthError } from '@/lib/firebase';
import { readAuthClaims } from '@/lib/auth-claims';

class AuthClaimsNotReadyError extends Error {
  constructor() {
    super('Your account is signed in but is not yet assigned to a CareSync tenant and role. Verify your email, wait for administrator provisioning, then sign in again.');
    this.name = 'AuthClaimsNotReadyError';
  }
}

function getLoginError(error: unknown): string {
  if (error instanceof AuthClaimsNotReadyError) return error.message;
  if (!(error instanceof FirebaseError)) return 'We could not sign you in. Please try again.';
  if (error.code === 'auth/invalid-email') return 'Enter the complete email address linked to your account.';
  if (['auth/user-not-found', 'auth/wrong-password', 'auth/invalid-credential'].includes(error.code)) {
    return 'The email address or password is incorrect.';
  }
  if (['auth/invalid-api-key', 'auth/api-key-not-valid'].includes(error.code)) {
    return 'Sign-in is temporarily unavailable because the Firebase app is misconfigured. Please contact support.';
  }
  if (error.code === 'auth/network-request-failed') return 'We could not reach Firebase. Check your connection and try again.';
  if (error.code === 'auth/too-many-requests') return 'Too many attempts. Please wait or reset your password.';
  if (error.code === 'auth/user-disabled') return 'This account has been suspended. Contact your administrator.';
  if (error.code === 'auth/popup-closed-by-user') return 'The Google sign-in window was closed before completion.';
  if (error.code === 'auth/operation-not-allowed') return 'This sign-in method is not enabled. Contact your administrator.';
  return 'We could not sign you in. Please try again.';
}

export default function LoginPage() {
  const navigate = useNavigate();
  const location = useLocation();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [rememberMe, setRememberMe] = useState(true);
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [googleLoading, setGoogleLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const returnTo = (location.state as { from?: { pathname?: string } } | null)?.from?.pathname;

  const handleSuccess = () => navigate(returnTo && returnTo !== '/auth/login' ? returnTo : '/dashboard', { replace: true });

  const handleEmailLogin = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    setIsLoading(true);
    try {
      await setPersistence(auth, rememberMe ? browserLocalPersistence : browserSessionPersistence);
      const credential = await signInWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      const token = await credential.user.getIdTokenResult(true);
      if (!readAuthClaims(token.claims)) {
        await signOut(auth);
        throw new AuthClaimsNotReadyError();
      }
      handleSuccess();
    } catch (loginError) {
      const parsed = loginError instanceof AuthClaimsNotReadyError ? null : parseFirebaseAuthError(loginError);
      if (parsed && import.meta.env.DEV) {
        console.error('[CareSync Auth] Sign-in failed', {
          code: parsed.code,
          firebaseMessage: parsed.message,
          userMessage: parsed.userMessage,
          retryable: parsed.retryable,
        });
      }
      setError(parsed?.userMessage ?? getLoginError(loginError));
    } finally {
      setIsLoading(false);
    }
  };

  const handleGoogleLogin = async () => {
    setError(null);
    setGoogleLoading(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      const credential = await signInWithPopup(auth, provider);
      const token = await credential.user.getIdTokenResult(true);
      if (!readAuthClaims(token.claims)) {
        await signOut(auth);
        throw new AuthClaimsNotReadyError();
      }
      handleSuccess();
    } catch (loginError) {
      if (loginError instanceof FirebaseError && loginError.code === 'auth/popup-closed-by-user') {
        setError('The Google sign-in window was closed before completion.');
      } else {
        setError(getLoginError(loginError));
      }
    } finally {
      setGoogleLoading(false);
    }
  };

  const submitting = isLoading || googleLoading;

  return (
    <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 lg:min-h-[650px] lg:grid-cols-[1fr_0.95fr] dark:border-white/10 dark:bg-slate-900">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-slate-950 p-10 text-white lg:flex xl:p-14">
        <div aria-hidden="true" className="absolute inset-0">
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-blue-500/25 blur-3xl" />
          <div className="absolute -bottom-28 -left-24 h-80 w-80 rounded-full bg-cyan-400/15 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.04)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.04)_1px,transparent_1px)] bg-[size:48px_48px]" />
        </div>
        <Link to="/" className="relative z-10 inline-flex w-fit rounded-2xl bg-white p-3">
          <img src="/logo.png" alt="CareSync MedCare" className="h-14 w-auto object-contain" />
        </Link>
        <div className="relative z-10 max-w-lg py-12">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Care teams, connected</p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
            Welcome to a more coordinated way to care.
          </h1>
          <p className="mt-5 max-w-md text-base leading-7 text-slate-300">
            Bring patient records, schedules, and clinical workflows together in a workspace designed for your team.
          </p>
        </div>
        <div className="relative z-10 flex items-center gap-3 text-sm text-slate-300">
          <ShieldCheck aria-hidden="true" className="h-5 w-5 text-cyan-300" />
          Secure access for your care team
        </div>
      </section>

      <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-12">
        <div className="w-full max-w-md">
          <Link to="/" className="mb-8 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800 lg:hidden dark:text-cyan-300">
            <HeartPulse aria-hidden="true" className="h-5 w-5" /> CareSync MedCare
          </Link>
          <div className="mb-8">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-700 dark:text-cyan-300">Your workspace</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Sign in to CareSync</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Use your work account to continue to your care dashboard.
            </p>
          </div>

          {error && (
            <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleLogin}
            disabled={submitting}
            className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
          >
            {googleLoading ? (
              <span className="h-4 w-4 animate-spin rounded-full border-2 border-blue-700 border-t-transparent" />
            ) : (
              <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
                <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.09-1.92 3.27-4.74 3.27-8.1Z" />
                <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.15v2.84A11 11 0 0 0 12 23Z" />
                <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.15a11 11 0 0 0 0 9.9l3.69-2.84Z" />
                <path fill="#EA4335" d="M12 4.36c1.62 0 3.06.56 4.2 1.66l3.15-3.15C17.45 1.09 14.97 0 12 0 7.7 0 3.98 2.46 2.15 6.05l3.69 2.84C6.71 6.29 9.14 4.36 12 4.36Z" />
              </svg>
            )}
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">or with email</span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
          </div>

          <form onSubmit={handleEmailLogin} className="space-y-5">
            <div>
              <label htmlFor="login-email" className="mb-2 block text-sm font-medium text-slate-800 dark:text-slate-200">Email address</label>
              <div className="relative">
                <Mail aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-email"
                  type="email"
                  value={email}
                  onChange={(event) => setEmail(event.target.value)}
                  autoComplete="username"
                  required
                  placeholder="you@yourclinic.com"
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 dark:border-white/15 dark:bg-slate-950 dark:text-white"
                />
              </div>
            </div>

            <div>
              <div className="mb-2 flex items-center justify-between gap-3">
                <label htmlFor="login-password" className="text-sm font-medium text-slate-800 dark:text-slate-200">Password</label>
                <Link to="/auth/forgot-password" className="text-xs font-semibold text-blue-700 hover:text-blue-800 dark:text-cyan-300">Forgot password?</Link>
              </div>
              <div className="relative">
                <LockKeyhole aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  id="login-password"
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(event) => setPassword(event.target.value)}
                  autoComplete="current-password"
                  required
                  placeholder="Enter your password"
                  className="h-12 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-12 text-sm text-slate-950 outline-none transition placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 dark:border-white/15 dark:bg-slate-950 dark:text-white"
                />
                <button
                  type="button"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                  onClick={() => setShowPassword((visible) => !visible)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-1 text-slate-400 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:hover:text-white"
                >
                  {showPassword ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
                </button>
              </div>
            </div>

            <label className="flex cursor-pointer items-center gap-2.5 text-sm text-slate-600 dark:text-slate-300">
              <input
                type="checkbox"
                checked={rememberMe}
                onChange={(event) => setRememberMe(event.target.checked)}
                className="h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600"
              />
              Keep me signed in on this device
            </label>

            <button
              type="submit"
              disabled={submitting}
              className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-900/15 transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <>
                  <span className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Signing in…
                </>
              ) : (
                <>Sign in <ArrowRight aria-hidden="true" className="h-4 w-4" /></>
              )}
            </button>
          </form>

          <p className="mt-7 text-center text-sm text-slate-600 dark:text-slate-300">
            New to CareSync?{' '}
            <Link to="/auth/register" className="font-semibold text-blue-700 hover:text-blue-800 dark:text-cyan-300">Create an account</Link>
          </p>
          <p className="mt-6 text-center text-xs leading-5 text-slate-400">
            By continuing, you agree to use this workspace in accordance with your organization’s policies.
          </p>
        </div>
      </section>
    </div>
  );
}
