import { useMutation, useQuery, useQueryClient } from '@tanstack/react-query';
import { invoicesApi } from '@/api/invoices';
import type { InvoiceCreatePayload, InvoiceUpdatePayload } from '@/types/invoice';
import { toast } from 'sonner';

export const invoiceKeys = { all: ['invoices'] as const, detail: (id: string) => ['invoices', 'detail', id] as const };

export function useInvoices(params?: Record<string, unknown>) {
  return useQuery({ queryKey: [...invoiceKeys.all, params], queryFn: () => invoicesApi.list(params) });
}

export function useInvoice(id: string) {
  return useQuery({ queryKey: invoiceKeys.detail(id), queryFn: () => invoicesApi.get(id), enabled: !!id });
}

export function useCreateInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (p: InvoiceCreatePayload) => invoicesApi.create(p),
    onSuccess: () => { toast.success('Invoice created'); qc.invalidateQueries({ queryKey: invoiceKeys.all }); },
  });
}

export function useUpdateInvoice(id?: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (payload: InvoiceUpdatePayload & { id?: string; data?: InvoiceUpdatePayload }) => {
      const targetId = payload.id ?? id;
      if (!targetId) throw new Error('Invoice id is required');
      const data = payload.data ?? payload;
      return invoicesApi.update(targetId, data);
    },
    onSuccess: () => { toast.success('Invoice updated'); qc.invalidateQueries({ queryKey: invoiceKeys.all }); },
  });
}

export function useDeleteInvoice() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id: string) => invoicesApi.remove(id),
    onSuccess: () => { toast.success('Invoice deleted'); qc.invalidateQueries({ queryKey: invoiceKeys.all }); },
  });
}

export function useUpdateInvoiceStatus(id: string) {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (status: string) => invoicesApi.changeStatus(id, status),
    onSuccess: () => { toast.success('Invoice status updated'); qc.invalidateQueries({ queryKey: invoiceKeys.all }); },
  });
}

export function useRecordPayment() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: ({ id, payload }: { id: string; payload: Record<string, unknown> }) => invoicesApi.recordPayment(id, payload),
    onSuccess: () => { toast.success('Payment recorded'); qc.invalidateQueries({ queryKey: invoiceKeys.all }); },
  });
}
