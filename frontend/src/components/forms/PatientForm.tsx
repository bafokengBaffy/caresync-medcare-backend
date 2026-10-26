import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { patientSchema, type PatientFormValues } from '@/lib/validators';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormField } from './FormField';
import { useCreatePatient, useUpdatePatient } from '@/hooks/use-patients';
import type { Patient } from '@/types/patient';

export function PatientForm({ initial }: { initial?: Patient }) {
  const nav = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<PatientFormValues>({
    resolver: zodResolver(patientSchema),
    defaultValues: initial ? {
      firstName: initial.firstName, lastName: initial.lastName, dateOfBirth: initial.dateOfBirth,
      gender: initial.gender as PatientFormValues['gender'], email: initial.email, phone: initial.phone,
      address: initial.address, emergencyContactName: initial.emergencyContactName, emergencyContactPhone: initial.emergencyContactPhone,
    } : {},
  });
  const create = useCreatePatient();
  const update = useUpdatePatient(initial?.id ?? '');
  const onSubmit = async (v: PatientFormValues) => {
    if (initial) await update.mutateAsync(v); else await create.mutateAsync(v);
    nav('/patients');
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="First Name" error={errors.firstName?.message} required><Input {...register('firstName')} /></FormField>
        <FormField label="Last Name" error={errors.lastName?.message} required><Input {...register('lastName')} /></FormField>
        <FormField label="Date of Birth" error={errors.dateOfBirth?.message} required><Input type="date" {...register('dateOfBirth')} /></FormField>
        <FormField label="Gender" error={errors.gender?.message}>
          <select {...register('gender')} className="input">
            <option value="">Select…</option>
            <option value="MALE">Male</option><option value="FEMALE">Female</option>
            <option value="OTHER">Other</option><option value="UNKNOWN">Unknown</option>
          </select>
        </FormField>
        <FormField label="Email" error={errors.email?.message}><Input type="email" {...register('email')} /></FormField>
        <FormField label="Phone" error={errors.phone?.message}><Input {...register('phone')} /></FormField>
      </div>
      <FormField label="Address" error={errors.address?.message}><Input {...register('address')} /></FormField>
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Emergency Contact Name" error={errors.emergencyContactName?.message}><Input {...register('emergencyContactName')} /></FormField>
        <FormField label="Emergency Contact Phone" error={errors.emergencyContactPhone?.message}><Input {...register('emergencyContactPhone')} /></FormField>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" type="button" onClick={() => nav(-1)}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>{initial ? 'Update' : 'Create'} Patient</Button>
      </div>
    </form>
  );
}
