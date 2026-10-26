import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { providerSchema, type ProviderFormValues } from '@/lib/validators';
import { SPECIALTIES } from '@/lib/constants';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormField } from './FormField';
import { useCreateProvider, useUpdateProvider } from '@/hooks/use-providers';
import type { Provider } from '@/types/provider';

export function ProviderForm({ initial }: { initial?: Provider }) {
  const nav = useNavigate();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<ProviderFormValues>({
    resolver: zodResolver(providerSchema),
    defaultValues: initial ? { userId: initial.userId, firstName: initial.firstName, lastName: initial.lastName, specialty: initial.specialty, licenseNumber: initial.licenseNumber } : {},
  });
  const create = useCreateProvider();
  const update = useUpdateProvider(initial?.id ?? '');
  const onSubmit = async (v: ProviderFormValues) => {
    if (initial) await update.mutateAsync(v); else await create.mutateAsync(v);
    nav('/providers');
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="User ID (Firebase UID)" error={errors.userId?.message} required><Input {...register('userId')} /></FormField>
        <FormField label="License Number" error={errors.licenseNumber?.message}><Input {...register('licenseNumber')} /></FormField>
        <FormField label="First Name" error={errors.firstName?.message} required><Input {...register('firstName')} /></FormField>
        <FormField label="Last Name" error={errors.lastName?.message} required><Input {...register('lastName')} /></FormField>
        <FormField label="Specialty" error={errors.specialty?.message} required>
          <select {...register('specialty')} className="input"><option value="">Select…</option>{SPECIALTIES.map((s) => <option key={s} value={s}>{s}</option>)}</select>
        </FormField>
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" type="button" onClick={() => nav(-1)}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>{initial ? 'Update' : 'Create'} Provider</Button>
      </div>
    </form>
  );
}
