import { format, isValid, parseISO } from 'date-fns';
import { ReceiptText } from 'lucide-react';
import { PortalSection } from './PortalSection';
import { usePatientPortal } from '@/hooks/use-patient-portal';

function displayDate(value: string | null) {
  if (!value) return '—';
  const date = parseISO(value);
  return isValid(date) ? format(date, 'PP') : '—';
}

export default function MyBillingPage() {
  const { invoices } = usePatientPortal();
  return (
    <PortalSection
      title="My billing"
      description="View invoices associated with your own patient record."
      pending={invoices.isPending}
      error={invoices.error}
      retry={() => void invoices.refetch()}
    >
      <div className="overflow-x-auto rounded-lg border bg-card">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted/50 text-left text-xs uppercase text-muted-foreground">
            <tr>
              <th scope="col" className="px-4 py-3">Invoice</th>
              <th scope="col" className="px-4 py-3">Issued</th>
              <th scope="col" className="px-4 py-3">Due</th>
              <th scope="col" className="px-4 py-3">Amount</th>
              <th scope="col" className="px-4 py-3">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border">
            {(invoices.data ?? []).map((invoice) => (
              <tr key={invoice.id}>
                <td className="px-4 py-3 font-medium">{invoice.invoiceNumber}</td>
                <td className="px-4 py-3 text-muted-foreground">{displayDate(invoice.issuedAt)}</td>
                <td className="px-4 py-3 text-muted-foreground">{displayDate(invoice.dueAt)}</td>
                <td className="whitespace-nowrap px-4 py-3">
                  {(invoice.amountCents / 100).toLocaleString(undefined, {
                    style: 'currency',
                    currency: invoice.currency,
                  })}
                </td>
                <td className="px-4 py-3">{invoice.status.replaceAll('_', ' ')}</td>
              </tr>
            ))}
            {(invoices.data?.length ?? 0) === 0 && (
              <tr><td colSpan={5} className="p-8 text-center text-muted-foreground"><ReceiptText className="mx-auto mb-2 h-6 w-6" />No invoices are available.</td></tr>
            )}
          </tbody>
        </table>
      </div>
    </PortalSection>
  );
}
