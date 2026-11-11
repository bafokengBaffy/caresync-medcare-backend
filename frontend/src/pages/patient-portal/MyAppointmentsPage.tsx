import { format, isValid, parseISO } from 'date-fns';
import { CalendarDays } from 'lucide-react';
import { PortalSection } from './PortalSection';
import { usePatientPortal } from '@/hooks/use-patient-portal';

function displayDate(value: string) {
  const date = parseISO(value);
  return isValid(date) ? format(date, 'PPp') : 'Date unavailable';
}

export default function MyAppointmentsPage() {
  const { appointments } = usePatientPortal();
  return (
    <PortalSection
      title="My appointments"
      description="Review appointments linked to your CareSync patient record."
      pending={appointments.isPending}
      error={appointments.error}
      retry={() => void appointments.refetch()}
    >
      <div className="overflow-hidden rounded-lg border bg-card">
        <div className="divide-y divide-border">
          {(appointments.data ?? []).map((appointment) => (
            <article key={appointment.id} className="flex flex-col gap-3 p-4 sm:flex-row sm:items-center sm:justify-between">
              <div className="flex items-start gap-3">
                <CalendarDays className="mt-1 h-5 w-5 shrink-0 text-primary" />
                <div>
                  <h2 className="font-medium">{appointment.appointmentType || 'Care appointment'}</h2>
                  <p className="text-sm text-muted-foreground">
                    {displayDate(appointment.scheduledStart)}
                    {appointment.providerName ? ` · ${appointment.providerName}` : ''}
                    {appointment.specialty ? ` · ${appointment.specialty.replaceAll('_', ' ')}` : ''}
                  </p>
                </div>
              </div>
              <span className="w-fit rounded-full bg-muted px-3 py-1 text-xs font-medium text-foreground">
                {appointment.status.replaceAll('_', ' ')}
              </span>
            </article>
          ))}
          {(appointments.data?.length ?? 0) === 0 && (
            <p className="p-8 text-center text-sm text-muted-foreground">No appointments are currently linked to your account.</p>
          )}
        </div>
      </div>
    </PortalSection>
  );
}
