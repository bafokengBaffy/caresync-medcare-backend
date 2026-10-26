import { PageHeader } from '@/components/common/PageHeader';
import { NoteForm } from '@/components/forms';
import { Card, CardContent } from '@/components/ui/card';
export function NoteCreatePage() {
  return (
    <div className="space-y-4">
      <PageHeader title="New Clinical Note" description="SOAP note" />
      <Card><CardContent className="pt-6"><NoteForm /></CardContent></Card>
    </div>
  );
}
