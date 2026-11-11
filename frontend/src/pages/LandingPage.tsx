import {
  Activity,
  ArrowRight,
  CalendarDays,
  ClipboardPlus,
  FileHeart,
  LockKeyhole,
  ShieldCheck,
  UsersRound,
} from 'lucide-react';
import { Link } from 'react-router-dom';

const features = [
  {
    icon: UsersRound,
    title: 'Patient-first records',
    description: 'Keep patient profiles, history, and care details together in one organized workspace.',
  },
  {
    icon: CalendarDays,
    title: 'Coordinated scheduling',
    description: 'Manage appointments and provider availability with a clearer view of the day ahead.',
  },
  {
    icon: FileHeart,
    title: 'Connected clinical notes',
    description: 'Bring visit documentation closer to the people and appointments it supports.',
  },
  {
    icon: ClipboardPlus,
    title: 'Practical operations',
    description: 'Support the everyday workflows that help care teams stay aligned.',
  },
];

export default function LandingPage() {
  return (
    <>
      <section className="relative isolate overflow-hidden bg-slate-950">
        <div aria-hidden="true" className="absolute inset-0 -z-10 overflow-hidden">
          <div className="absolute -right-40 -top-52 h-[34rem] w-[34rem] rounded-full bg-blue-600/25 blur-3xl" />
          <div className="absolute -bottom-64 left-1/4 h-[30rem] w-[30rem] rounded-full bg-cyan-500/15 blur-3xl" />
          <div className="absolute inset-0 bg-[linear-gradient(rgba(255,255,255,0.035)_1px,transparent_1px),linear-gradient(90deg,rgba(255,255,255,0.035)_1px,transparent_1px)] bg-[size:64px_64px] [mask-image:linear-gradient(to_bottom,black,transparent)]" />
        </div>

        <div className="mx-auto grid min-h-[650px] max-w-7xl items-center gap-14 px-5 py-20 sm:px-8 lg:grid-cols-[1.1fr_0.9fr] lg:py-28">
          <div className="max-w-2xl">
            <div className="mb-7 inline-flex items-center gap-2 rounded-full border border-cyan-200/20 bg-cyan-100/10 px-3.5 py-2 text-sm font-medium text-cyan-100">
              <Activity aria-hidden="true" className="h-4 w-4" />
              A more connected care experience
            </div>
            <h1 className="text-5xl font-semibold leading-[1.08] tracking-tight text-white sm:text-6xl lg:text-7xl">
              Care teams, working <span className="text-cyan-300">in sync.</span>
            </h1>
            <p className="mt-7 max-w-xl text-lg leading-8 text-slate-300">
              CareSync MedCare brings patient information, appointments, clinical notes, and everyday
              operations into one clear workspace for your team.
            </p>
            <div className="mt-9 flex flex-col gap-3 sm:flex-row">
              <Link
                to="/auth/register"
                className="inline-flex items-center justify-center gap-2 rounded-xl bg-cyan-300 px-6 py-3.5 text-sm font-semibold text-slate-950 transition hover:bg-cyan-200 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-cyan-200 focus-visible:ring-offset-2 focus-visible:ring-offset-slate-950"
              >
                Explore CareSync <ArrowRight aria-hidden="true" className="h-4 w-4" />
              </Link>
              <a
                href="#features"
                className="inline-flex items-center justify-center rounded-xl border border-white/20 px-6 py-3.5 text-sm font-semibold text-white transition hover:border-white/40 hover:bg-white/5"
              >
                Discover the platform
              </a>
            </div>
            <div className="mt-10 flex items-center gap-3 text-sm text-slate-400">
              <ShieldCheck aria-hidden="true" className="h-5 w-5 text-cyan-300" />
              Secure sign-in for your care team
            </div>
          </div>

          <div className="relative mx-auto w-full max-w-lg">
            <div className="absolute -inset-5 rounded-[2rem] bg-blue-500/20 blur-2xl" />
            <div className="relative overflow-hidden rounded-[1.75rem] border border-white/15 bg-white p-3 shadow-2xl shadow-black/30">
              <img
                src="/logo.png"
                alt="CareSync MedCare — Health Today, Hope Tomorrow"
                className="w-full rounded-2xl object-contain"
              />
              <div className="grid grid-cols-2 gap-3 p-3 pt-1 sm:grid-cols-3">
                <div className="rounded-xl bg-slate-50 p-3">
                  <UsersRound aria-hidden="true" className="h-5 w-5 text-blue-700" />
                  <p className="mt-2 text-xs font-semibold text-slate-800">Patient records</p>
                </div>
                <div className="rounded-xl bg-slate-50 p-3">
                  <CalendarDays aria-hidden="true" className="h-5 w-5 text-blue-700" />
                  <p className="mt-2 text-xs font-semibold text-slate-800">Appointments</p>
                </div>
                <div className="col-span-2 rounded-xl bg-slate-50 p-3 sm:col-span-1">
                  <FileHeart aria-hidden="true" className="h-5 w-5 text-blue-700" />
                  <p className="mt-2 text-xs font-semibold text-slate-800">Clinical notes</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section id="features" className="scroll-mt-24 bg-white px-5 py-20 sm:px-8 lg:py-28 dark:bg-slate-950">
        <div className="mx-auto max-w-7xl">
          <div className="max-w-2xl">
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-cyan-300">A single workspace</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl dark:text-white">
              The details of care, connected.
            </h2>
            <p className="mt-4 text-base leading-7 text-slate-600 dark:text-slate-300">
              Designed to help teams move between the information and workflows they use every day.
            </p>
          </div>
          <div className="mt-12 grid gap-5 sm:grid-cols-2 lg:grid-cols-4">
            {features.map(({ icon: Icon, title, description }) => (
              <article
                key={title}
                className="rounded-2xl border border-slate-200 bg-white p-6 transition hover:-translate-y-1 hover:border-blue-200 hover:shadow-xl hover:shadow-blue-950/5 dark:border-white/10 dark:bg-slate-900 dark:hover:border-cyan-400/30"
              >
                <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-50 text-blue-700 dark:bg-blue-400/10 dark:text-cyan-300">
                  <Icon aria-hidden="true" className="h-6 w-6" />
                </div>
                <h3 className="mt-5 text-lg font-semibold text-slate-950 dark:text-white">{title}</h3>
                <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">{description}</p>
              </article>
            ))}
          </div>
        </div>
      </section>

      <section id="workflow" className="scroll-mt-24 bg-slate-50 px-5 py-20 sm:px-8 lg:py-24 dark:bg-slate-900/60">
        <div className="mx-auto grid max-w-7xl gap-12 lg:grid-cols-2 lg:items-center">
          <div>
            <p className="text-sm font-semibold uppercase tracking-[0.18em] text-blue-700 dark:text-cyan-300">Built for daily work</p>
            <h2 className="mt-4 text-3xl font-semibold tracking-tight text-slate-950 sm:text-4xl dark:text-white">
              Less time switching. More time caring.
            </h2>
            <p className="mt-5 text-base leading-7 text-slate-600 dark:text-slate-300">
              Move from a patient profile to a scheduled visit and its clinical documentation without
              losing the context your team needs.
            </p>
            <Link to="/auth/register" className="mt-7 inline-flex items-center gap-2 text-sm font-semibold text-blue-700 hover:text-blue-800 dark:text-cyan-300">
              See what CareSync can do <ArrowRight aria-hidden="true" className="h-4 w-4" />
            </Link>
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div className="rounded-2xl border border-slate-200 bg-white p-6 dark:border-white/10 dark:bg-slate-900">
              <CalendarDays aria-hidden="true" className="h-6 w-6 text-blue-700 dark:text-cyan-300" />
              <h3 className="mt-4 font-semibold text-slate-950 dark:text-white">Plan the next step</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Keep appointments and availability in view for better coordination.</p>
            </div>
            <div className="rounded-2xl border border-slate-200 bg-white p-6 sm:translate-y-8 dark:border-white/10 dark:bg-slate-900">
              <FileHeart aria-hidden="true" className="h-6 w-6 text-blue-700 dark:text-cyan-300" />
              <h3 className="mt-4 font-semibold text-slate-950 dark:text-white">Keep the story together</h3>
              <p className="mt-2 text-sm leading-6 text-slate-600 dark:text-slate-300">Connect notes and patient details to the work happening today.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="security" className="scroll-mt-24 bg-white px-5 py-20 sm:px-8 lg:py-24 dark:bg-slate-950">
        <div className="mx-auto flex max-w-5xl flex-col items-center rounded-3xl bg-blue-950 px-7 py-12 text-center sm:px-12 sm:py-16">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-white/10 text-cyan-300">
            <LockKeyhole aria-hidden="true" className="h-7 w-7" />
          </div>
          <h2 className="mt-6 text-3xl font-semibold tracking-tight text-white sm:text-4xl">Your team's workspace starts here.</h2>
          <p className="mt-4 max-w-2xl text-base leading-7 text-blue-100/80">
            Sign in to access your CareSync workspace, or create an account to get started with the platform.
          </p>
          <div className="mt-8 flex flex-col gap-3 sm:flex-row">
            <Link to="/auth/login" className="rounded-xl bg-white px-6 py-3 text-sm font-semibold text-blue-950 transition hover:bg-blue-50">
              Sign in to CareSync
            </Link>
            <Link to="/auth/register" className="rounded-xl border border-white/25 px-6 py-3 text-sm font-semibold text-white transition hover:bg-white/10">
              Create an account
            </Link>
          </div>
        </div>
      </section>
    </>
  );
}
