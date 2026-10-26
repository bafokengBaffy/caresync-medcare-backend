import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { paymentsApi } from '@/api/payments';
import type { PaymentCreatePayload } from '@/types/payment';
import { toast } from 'sonner';

export const paymentKeys = { all: ['payments'] as const };

export function usePayments(params?: Record<string, unknown>) { return useQuery({ queryKey: [...paymentKeys.all, params], queryFn: () => paymentsApi.list(params) }); }
export function useCreatePayment() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (p: PaymentCreatePayload) => paymentsApi.create(p), onSuccess: () => { toast.success('Payment recorded'); qc.invalidateQueries({ queryKey: paymentKeys.all }); } });
}
