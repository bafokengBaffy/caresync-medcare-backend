import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { invoiceSchema, type InvoiceFormValues } from '@/lib/validators';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormField } from './FormField';
import { useCreateInvoice } from '@/hooks/use-invoices';
import { Trash2, Plus } from 'lucide-react';

export function InvoiceForm() {
  const nav = useNavigate();
  const { register, handleSubmit, control, formState: { errors, isSubmitting } } = useForm<InvoiceFormValues>({
    resolver: zodResolver(invoiceSchema),
    defaultValues: { items: [{ cptCode: '', description: '', quantity: 1, unitPriceCents: 0 }] },
  });
  const { fields, append, remove } = useFieldArray({ control, name: 'items' });
  const create = useCreateInvoice();
  const onSubmit = async (v: InvoiceFormValues) => { await create.mutateAsync(v); nav('/invoices'); };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <div className="grid gap-4 sm:grid-cols-2">
        <FormField label="Patient ID" error={errors.patientId?.message} required><Input {...register('patientId')} /></FormField>
        <FormField label="Appointment ID (optional)"><Input {...register('appointmentId')} /></FormField>
      </div>
      <div className="space-y-2">
        <div className="flex items-center justify-between"><h3 className="text-sm font-semibold">Line items</h3><Button type="button" variant="outline" size="sm" onClick={() => append({ cptCode: '', description: '', quantity: 1, unitPriceCents: 0 })}><Plus className="h-4 w-4" />Add</Button></div>
        {fields.map((f, i) => (
          <div key={f.id} className="grid gap-2 rounded border p-3 sm:grid-cols-5">
            <Input placeholder="CPT" {...register(`items.${i}.cptCode` as const)} />
            <Input placeholder="Description" {...register(`items.${i}.description` as const)} className="sm:col-span-2" />
            <Input type="number" placeholder="Qty" {...register(`items.${i}.quantity` as const)} />
            <div className="flex gap-1">
              <Input type="number" placeholder="Price (¢)" {...register(`items.${i}.unitPriceCents` as const)} />
              <Button type="button" variant="ghost" size="icon" onClick={() => remove(i)}><Trash2 className="h-4 w-4" /></Button>
            </div>
          </div>
        ))}
      </div>
      <div className="flex justify-end gap-2">
        <Button variant="outline" type="button" onClick={() => nav(-1)}>Cancel</Button>
        <Button type="submit" disabled={isSubmitting}>Create Invoice</Button>
      </div>
    </form>
  );
}
