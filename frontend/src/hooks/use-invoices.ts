import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invoicesApi } from '@/api/invoices';
import type { InvoiceCreatePayload } from '@/types/invoice';
import { toast } from 'sonner';

export const invoiceKeys = { all: ['invoices'] as const, detail: (id: string) => ['invoices', 'detail', id] as const };

export function useInvoices(params?: Record<string, unknown>) { return useQuery({ queryKey: [...invoiceKeys.all, params], queryFn: () => invoicesApi.list(params) }); }
export function useInvoice(id: string) { return useQuery({ queryKey: invoiceKeys.detail(id), queryFn: () => invoicesApi.get(id), enabled: !!id }); }
export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (p: InvoiceCreatePayload) => invoicesApi.create(p), onSuccess: () => { toast.success('Invoice created'); qc.invalidateQueries({ queryKey: invoiceKeys.all }); } });
}
export function useUpdateInvoiceStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({ mutationFn: (status: string) => invoicesApi.changeStatus(id, status), onSuccess: () => { toast.success('Invoice status updated'); qc.invalidateQueries({ queryKey: invoiceKeys.all }); } });
}
