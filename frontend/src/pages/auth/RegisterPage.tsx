import { useState, type FormEvent } from 'react';
import { FirebaseError } from 'firebase/app';
import {
  ArrowRight,
  Check,
  Eye,
  EyeOff,
  LockKeyhole,
  Mail,
  UserRound,
  X,
} from 'lucide-react';
import {
  createUserWithEmailAndPassword,
  GoogleAuthProvider,
  sendEmailVerification,
  signInWithPopup,
  updateProfile,
} from 'firebase/auth';
import { Link, useNavigate } from 'react-router-dom';
import { auth } from '@/lib/firebase';

const requirements = [
  { label: 'At least 8 characters', test: (value: string) => value.length >= 8 },
  { label: 'One uppercase letter', test: (value: string) => /[A-Z]/.test(value) },
  { label: 'One lowercase letter', test: (value: string) => /[a-z]/.test(value) },
  { label: 'One number', test: (value: string) => /\d/.test(value) },
  { label: 'One special character', test: (value: string) => /[^A-Za-z0-9]/.test(value) },
];

function registrationError(error: unknown): string {
  if (!(error instanceof FirebaseError)) return 'We could not create your account. Please try again.';
  if (error.code === 'auth/email-already-in-use') return 'An account with this email already exists. Try signing in instead.';
  if (error.code === 'auth/weak-password') return 'Choose a stronger password and try again.';
  if (error.code === 'auth/invalid-email') return 'Enter a valid email address.';
  if (error.code === 'auth/popup-closed-by-user') return 'The Google sign-up window was closed before completion.';
  if (error.code === 'auth/operation-not-allowed') return 'This sign-up method is not enabled. Contact your administrator.';
  return 'We could not create your account. Please try again.';
}

export default function RegisterPage() {
  const navigate = useNavigate();
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [acceptedTerms, setAcceptedTerms] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const passwordValid = requirements.every(({ test }) => test(password));

  const handleEmailRegister = async (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    if (!passwordValid) {
      setError('Your password does not meet all the requirements.');
      return;
    }
    if (password !== confirmPassword) {
      setError('Your passwords do not match.');
      return;
    }
    if (!acceptedTerms) {
      setError('Please accept the terms and privacy policy to continue.');
      return;
    }

    setSubmitting(true);
    try {
      const credential = await createUserWithEmailAndPassword(auth, email.trim().toLowerCase(), password);
      await updateProfile(credential.user, { displayName: `${firstName.trim()} ${lastName.trim()}` });
      await sendEmailVerification(credential.user);
      navigate('/auth/verify-email');
    } catch (registerError) {
      setError(registrationError(registerError));
    } finally {
      setSubmitting(false);
    }
  };

  const handleGoogleRegister = async () => {
    setError(null);
    if (!acceptedTerms) {
      setError('Please accept the terms and privacy policy to continue.');
      return;
    }
    setSubmitting(true);
    try {
      const provider = new GoogleAuthProvider();
      provider.setCustomParameters({ prompt: 'select_account' });
      await signInWithPopup(auth, provider);
      navigate('/dashboard');
    } catch (registerError) {
      setError(registrationError(registerError));
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="mx-auto grid w-full max-w-6xl overflow-hidden rounded-3xl border border-slate-200 bg-white shadow-2xl shadow-slate-900/10 lg:grid-cols-[0.9fr_1.1fr] dark:border-white/10 dark:bg-slate-900">
      <section className="relative hidden flex-col justify-between overflow-hidden bg-slate-950 p-10 text-white lg:flex xl:p-14">
        <div aria-hidden="true" className="absolute inset-0">
          <div className="absolute -right-20 -top-20 h-80 w-80 rounded-full bg-blue-500/25 blur-3xl" />
          <div className="absolute -bottom-28 -left-24 h-80 w-80 rounded-full bg-cyan-400/15 blur-3xl" />
        </div>
        <Link to="/" className="relative z-10 inline-flex w-fit rounded-2xl bg-white p-3">
          <img src="/logo.png" alt="CareSync MedCare" className="h-14 w-auto object-contain" />
        </Link>
        <div className="relative z-10 max-w-lg py-12">
          <p className="text-sm font-semibold uppercase tracking-[0.2em] text-cyan-300">Start with your team</p>
          <h1 className="mt-5 text-4xl font-semibold leading-tight tracking-tight xl:text-5xl">
            Better coordination begins with a shared workspace.
          </h1>
          <p className="mt-5 text-base leading-7 text-slate-300">
            Create your CareSync account to bring the details of care into one connected place.
          </p>
        </div>
        <p className="relative z-10 text-sm text-slate-300">Health Today · Hope Tomorrow</p>
      </section>

      <section className="flex items-center justify-center px-5 py-10 sm:px-10 lg:px-12">
        <div className="w-full max-w-lg">
          <Link to="/" className="mb-7 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800 lg:hidden dark:text-cyan-300">
            <img src="/logo.png" alt="CareSync MedCare" className="h-9 w-auto object-contain" />
          </Link>
          <div className="mb-7">
            <p className="text-sm font-semibold uppercase tracking-[0.16em] text-blue-700 dark:text-cyan-300">Create your account</p>
            <h2 className="mt-3 text-3xl font-semibold tracking-tight text-slate-950 dark:text-white">Join CareSync MedCare</h2>
            <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">
              Set up your account to get started with your care workspace.
            </p>
          </div>

          {error && (
            <div role="alert" className="mb-5 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-800 dark:border-rose-900/60 dark:bg-rose-950/40 dark:text-rose-200">
              {error}
            </div>
          )}

          <button
            type="button"
            onClick={handleGoogleRegister}
            disabled={submitting}
            className="inline-flex h-12 w-full items-center justify-center gap-3 rounded-xl border border-slate-300 bg-white px-4 text-sm font-semibold text-slate-800 transition hover:bg-slate-50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60 dark:border-white/15 dark:bg-slate-900 dark:text-white dark:hover:bg-slate-800"
          >
            <svg aria-hidden="true" viewBox="0 0 24 24" className="h-5 w-5">
              <path fill="#4285F4" d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.09-1.92 3.27-4.74 3.27-8.1Z" />
              <path fill="#34A853" d="M12 23c2.97 0 5.46-.98 7.28-2.65l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.15v2.84A11 11 0 0 0 12 23Z" />
              <path fill="#FBBC05" d="M5.84 14.11a6.6 6.6 0 0 1 0-4.22V7.05H2.15a11 11 0 0 0 0 9.9l3.69-2.84Z" />
              <path fill="#EA4335" d="M12 4.36c1.62 0 3.06.56 4.2 1.66l3.15-3.15C17.45 1.09 14.97 0 12 0 7.7 0 3.98 2.46 2.15 6.05l3.69 2.84C6.71 6.29 9.14 4.36 12 4.36Z" />
            </svg>
            Continue with Google
          </button>

          <div className="my-6 flex items-center gap-4">
            <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
            <span className="text-xs font-medium uppercase tracking-wider text-slate-400">or with email</span>
            <div className="h-px flex-1 bg-slate-200 dark:bg-white/10" />
          </div>

          <form onSubmit={handleEmailRegister} className="space-y-4">
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label htmlFor="register-first-name" className="mb-2 block text-sm font-medium text-slate-800 dark:text-slate-200">First name</label>
                <div className="relative">
                  <UserRound aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                  <input id="register-first-name" value={firstName} onChange={(event) => setFirstName(event.target.value)} autoComplete="given-name" required className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-3 text-sm text-slate-950 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 dark:border-white/15 dark:bg-slate-950 dark:text-white" />
                </div>
              </div>
              <div>
                <label htmlFor="register-last-name" className="mb-2 block text-sm font-medium text-slate-800 dark:text-slate-200">Last name</label>
                <input id="register-last-name" value={lastName} onChange={(event) => setLastName(event.target.value)} autoComplete="family-name" required className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 dark:border-white/15 dark:bg-slate-950 dark:text-white" />
              </div>
            </div>

            <div>
              <label htmlFor="register-email" className="mb-2 block text-sm font-medium text-slate-800 dark:text-slate-200">Email address</label>
              <div className="relative">
                <Mail aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input id="register-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} autoComplete="email" required placeholder="you@yourclinic.com" className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-4 text-sm text-slate-950 outline-none placeholder:text-slate-400 focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 dark:border-white/15 dark:bg-slate-950 dark:text-white" />
              </div>
            </div>

            <div>
              <label htmlFor="register-password" className="mb-2 block text-sm font-medium text-slate-800 dark:text-slate-200">Password</label>
              <div className="relative">
                <LockKeyhole aria-hidden="true" className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input id="register-password" type={showPassword ? 'text' : 'password'} value={password} onChange={(event) => setPassword(event.target.value)} autoComplete="new-password" required className="h-11 w-full rounded-xl border border-slate-300 bg-white pl-10 pr-12 text-sm text-slate-950 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 dark:border-white/15 dark:bg-slate-950 dark:text-white" />
                <button type="button" aria-label={showPassword ? 'Hide password' : 'Show password'} onClick={() => setShowPassword((shown) => !shown)} className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-1 text-slate-400 hover:text-slate-700 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 dark:hover:text-white">
                  {showPassword ? <EyeOff aria-hidden="true" className="h-4 w-4" /> : <Eye aria-hidden="true" className="h-4 w-4" />}
                </button>
              </div>
              <ul aria-label="Password requirements" className="mt-3 grid gap-2 sm:grid-cols-2">
                {requirements.map(({ label, test }) => {
                  const passed = test(password);
                  const Icon = passed ? Check : X;
                  return (
                    <li key={label} className={`flex items-center gap-2 text-xs ${passed ? 'text-emerald-700 dark:text-emerald-300' : 'text-slate-500 dark:text-slate-400'}`}>
                      <Icon aria-hidden="true" className="h-3.5 w-3.5" />
                      {label}
                    </li>
                  );
                })}
              </ul>
            </div>

            <div>
              <label htmlFor="register-confirm-password" className="mb-2 block text-sm font-medium text-slate-800 dark:text-slate-200">Confirm password</label>
              <input id="register-confirm-password" type={showPassword ? 'text' : 'password'} value={confirmPassword} onChange={(event) => setConfirmPassword(event.target.value)} autoComplete="new-password" required className="h-11 w-full rounded-xl border border-slate-300 bg-white px-3 text-sm text-slate-950 outline-none focus:border-blue-600 focus:ring-4 focus:ring-blue-600/10 dark:border-white/15 dark:bg-slate-950 dark:text-white" />
            </div>

            <label className="flex cursor-pointer items-start gap-2.5 text-sm leading-5 text-slate-600 dark:text-slate-300">
              <input type="checkbox" checked={acceptedTerms} onChange={(event) => setAcceptedTerms(event.target.checked)} className="mt-0.5 h-4 w-4 rounded border-slate-300 text-blue-700 focus:ring-blue-600" />
              <span>I agree to follow my organization’s terms of use and privacy policies.</span>
            </label>

            <button type="submit" disabled={submitting || !passwordValid || password !== confirmPassword} className="inline-flex h-12 w-full items-center justify-center gap-2 rounded-xl bg-blue-700 px-4 text-sm font-semibold text-white shadow-lg shadow-blue-900/15 transition hover:bg-blue-800 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-blue-600 focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-60">
              {submitting ? 'Creating account…' : <>Create account <ArrowRight aria-hidden="true" className="h-4 w-4" /></>}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-slate-600 dark:text-slate-300">
            Already have an account? <Link to="/auth/login" className="font-semibold text-blue-700 hover:text-blue-800 dark:text-cyan-300">Sign in</Link>
          </p>
        </div>
      </section>
    </div>
  );
}
