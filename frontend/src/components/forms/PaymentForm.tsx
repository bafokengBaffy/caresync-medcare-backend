import { useForm } from 'react-hook-form';
import { useNavigate } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormField } from './FormField';
import { useCreatePayment } from '@/hooks/use-payments';
import { PAYMENT_METHODS } from '@/lib/constants';

export function PaymentForm({ invoiceId }: { invoiceId?: string }) {
  const nav = useNavigate();
  const { register, handleSubmit } = useForm<{ invoiceId: string; amountCents: number; method: string }>({
    defaultValues: { invoiceId: invoiceId ?? '', amountCents: 0, method: 'CARD' },
  });
  const create = useCreatePayment();
  const onSubmit = async (v: { invoiceId: string; amountCents: number; method: string }) => {
    await create.mutateAsync({ invoiceId: v.invoiceId, amountCents: Number(v.amountCents), method: v.method as never });
    nav(invoiceId ? `/invoices/${invoiceId}` : '/payments');
  };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="Invoice ID" required><Input {...register('invoiceId')} /></FormField>
      <FormField label="Amount (cents)" required><Input type="number" {...register('amountCents')} /></FormField>
      <FormField label="Method" required><select {...register('method')} className="input">{PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}</select></FormField>
      <div className="flex justify-end gap-2"><Button variant="outline" type="button" onClick={() => nav(-1)}>Cancel</Button><Button type="submit">Record Payment</Button></div>
    </form>
  );
}
