import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { appointmentSchema, type AppointmentFormValues } from '@/lib/validators';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormField } from './FormField';
import { useCreateAppointment } from '@/hooks/use-appointments';

export function AppointmentForm() {
  const nav = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<AppointmentFormValues>({ resolver: zodResolver(appointmentSchema) });
  const create = useCreateAppointment();
  const onSubmit = async (v: AppointmentFormValues) => { await create.mutateAsync(v); nav('/appointments'); };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Patient ID" error={errors.patientId?.message} required><Input {...register('patientId')} /></FormField>
        <FormField label="Provider ID" error={errors.providerId?.message} required><Input {...register('providerId')} /></FormField>
        <FormField label="Start" error={errors.scheduledStart?.message} required><Input type="datetime-local" {...register('scheduledStart')} /></FormField>
        <FormField label="End" error={errors.scheduledEnd?.message} required><Input type="datetime-local" {...register('scheduledEnd')} /></FormField>
        <FormField label="Type"><Input {...register('appointmentType')} /></FormField>
        <FormField label="Reason"><Input {...register('reason')} /></FormField>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" type="button" onClick={() => nav(-1)}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>Schedule</Button>
      </div>
    </form>
  );
}
