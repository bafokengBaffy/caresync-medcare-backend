import { Link } from 'react-router-dom';
import { ArrowLeft } from 'lucide-react';
import { PageHeader } from '@/components/ui/page-header';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { NoteForm } from '@/components/forms/NoteForm';

export default function NoteCreatePage() {
  return (
    <div className="page-container space-y-6">
      <PageHeader
        title="New clinical note"
        description="Record a SOAP note for a completed appointment."
        actions={
          <Button asChild variant="outline">
            <Link to="/notes"><ArrowLeft className="mr-2 h-4 w-4" /> Back to notes</Link>
          </Button>
        }
      />
      <Card>
        <CardContent className="pt-6">
          <NoteForm />
        </CardContent>
      </Card>
    </div>
  );
}
