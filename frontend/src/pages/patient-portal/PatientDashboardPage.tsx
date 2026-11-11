import { Link } from 'react-router-dom';
import { CalendarDays, FileText, ReceiptText } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { usePatientPortal } from '@/hooks/use-patient-portal';

function SummaryCard({ label, value, to, icon: Icon }: {
  label: string;
  value: string;
  to: string;
  icon: typeof CalendarDays;
}) {
  return (
    <article className="rounded-xl border bg-card p-5">
      <div className="flex items-center justify-between">
        <p className="text-sm text-muted-foreground">{label}</p>
        <Icon className="h-5 w-5 text-primary" />
      </div>
      <p className="mt-3 text-2xl font-semibold">{value}</p>
      <Button asChild variant="link" className="mt-2 h-auto p-0">
        <Link to={to}>View details</Link>
      </Button>
    </article>
  );
}

export default function PatientDashboardPage() {
  const { profile, appointments, invoices, records } = usePatientPortal();
  const failedQuery = [profile, appointments, invoices, records].find((query) => query.isError);
  const pending = [profile, appointments, invoices, records].some((query) => query.isPending);

  return (
    <section className="space-y-6 p-4 text-foreground md:p-6">
      <header>
        <h1 className="text-2xl font-bold tracking-tight">
          {profile.data ? `Welcome, ${profile.data.firstName}` : 'Patient portal'}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Your personal CareSync information and services.
        </p>
      </header>
      {pending ? (
        <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3" aria-busy="true">
          {[0, 1, 2].map((item) => <div key={item} className="h-36 animate-pulse rounded-xl bg-muted" />)}
        </div>
      ) : failedQuery?.error ? (
        <div className="rounded-lg border border-destructive/30 bg-destructive/5 p-5 text-sm" role="alert">
          Portal information could not be loaded: {failedQuery.error.message}
        </div>
      ) : (
        <>
          {profile.data && (
            <article className="rounded-xl border bg-card p-5">
              <h2 className="font-semibold">{profile.data.firstName} {profile.data.lastName}</h2>
              <p className="mt-1 text-sm text-muted-foreground">
                {profile.data.tenantName}
                {profile.data.email ? ` · ${profile.data.email}` : ''}
                {profile.data.phone ? ` · ${profile.data.phone}` : ''}
              </p>
            </article>
          )}
          <div className="grid gap-4 sm:grid-cols-2 xl:grid-cols-3">
            <SummaryCard label="Appointments" value={String(appointments.data?.length ?? 0)} to="/portal/appointments" icon={CalendarDays} />
            <SummaryCard label="Documents" value={String(records.data?.length ?? 0)} to="/portal/records" icon={FileText} />
            <SummaryCard label="Invoices" value={String(invoices.data?.length ?? 0)} to="/portal/billing" icon={ReceiptText} />
          </div>
        </>
      )}
    </section>
  );
}
