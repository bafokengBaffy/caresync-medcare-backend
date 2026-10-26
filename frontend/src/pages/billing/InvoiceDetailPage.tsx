import { useParams } from 'react-router-dom';
import { PageHeader } from '@/components/common/PageHeader';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { StatusBadge } from '@/components/common/StatusBadge';
import { Button } from '@/components/ui/button';
import { useInvoice, useUpdateInvoiceStatus } from '@/hooks/use-invoices';
import { LoadingScreen } from '@/components/common/LoadingScreen';
import { formatMoney, formatDate } from '@/lib/utils';

export function InvoiceDetailPage() {
  const { id = '' } = useParams();
  const { data, isLoading } = useInvoice(id);
  const update = useUpdateInvoiceStatus(id);
  if (isLoading || !data) return <LoadingScreen />;
  return (
    <div className="space-y-4">
      <PageHeader title={`Invoice ${data.invoiceNumber}`} actions={<StatusBadge status={data.status} />} />
      <Card><CardHeader><CardTitle>Summary</CardTitle></CardHeader>
        <CardContent className="space-y-3">
          <div className="grid gap-4 sm:grid-cols-2">
            <div><div className="text-xs text-muted-foreground">Amount</div><div className="text-2xl font-bold">{formatMoney(data.amountCents)}</div></div>
            <div><div className="text-xs text-muted-foreground">Issued</div><div>{data.issuedAt ? formatDate(data.issuedAt) : 'Not issued'}</div></div>
          </div>
          <div className="flex gap-2 border-t pt-3">
            <Button size="sm" onClick={() => update.mutate('ISSUED')}>Issue</Button>
            <Button size="sm" variant="outline" onClick={() => update.mutate('PAID')}>Mark Paid</Button>
            <Button size="sm" variant="destructive" onClick={() => update.mutate('VOID')}>Void</Button>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
