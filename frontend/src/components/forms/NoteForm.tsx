import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { noteSchema, type NoteFormValues } from '@/lib/validators';
import { SPECIALTIES, NOTE_TYPES } from '@/lib/constants';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Button } from '@/components/ui/button';
import { FormField } from './FormField';
import { useCreateNote } from '@/hooks/use-notes';

export function NoteForm() {
  const nav = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<NoteFormValues>({ resolver: zodResolver(noteSchema) });
  const create = useCreateNote();
  const onSubmit = async (v: NoteFormValues) => { await create.mutateAsync(v); nav('/notes'); };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Patient ID" error={errors.patientId?.message} required><Input {...register('patientId')} /></FormField>
        <FormField label="Provider ID" error={errors.providerId?.message} required><Input {...register('providerId')} /></FormField>
        <FormField label="Appointment ID" error={errors.appointmentId?.message} required><Input {...register('appointmentId')} /></FormField>
        <FormField label="Specialty" required><select {...register('specialty')} className="input"><option value="">Select…</option>{SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}</select></FormField>
        <FormField label="Note Type" required><select {...register('noteType')} className="input">{NOTE_TYPES.map((s) => <option key={s} value={s}>{s}</option>)}</select></FormField>
      </div>
      <FormField label="Subjective" error={errors.soapData?.subjective?.message} required><Textarea {...register('soapData.subjective')} /></FormField>
      <FormField label="Objective" error={errors.soapData?.objective?.message} required><Textarea {...register('soapData.objective')} /></FormField>
      <FormField label="Assessment" error={errors.soapData?.assessment?.message} required><Textarea {...register('soapData.assessment')} /></FormField>
      <FormField label="Plan" error={errors.soapData?.plan?.message} required><Textarea {...register('soapData.plan')} /></FormField>
      <div className="flex justify-end gap-2">
        <Button variant="outline" type="button" onClick={() => nav(-1)}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>Create Note</Button>
      </div>
    </form>
  );
}
