import { PageHeader } from '@/components/common/PageHeader';
import { InvoiceForm } from '@/components/forms';
import { Card, CardContent } from '@/components/ui/card';
export function InvoiceCreatePage() {
  return (
    <div className="space-y-4">
      <PageHeader title="New Invoice" />
      <Card><CardContent className="pt-6"><InvoiceForm /></CardContent></Card>
    </div>
  );
}
