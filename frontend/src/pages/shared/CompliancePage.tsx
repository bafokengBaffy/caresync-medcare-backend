import { AlertTriangle, FileText, ShieldCheck } from 'lucide-react';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';

export default function CompliancePage() {
  return (
    <div className="mx-auto max-w-4xl space-y-6 py-8">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-semibold tracking-tight"><ShieldCheck className="h-6 w-6 text-primary" />Privacy and compliance</h1>
        <p className="mt-1 text-sm text-muted-foreground">Review access records and contact the privacy team about personal-data requests.</p>
      </header>
      <Card>
        <CardHeader className="flex flex-row items-start gap-3">
          <FileText className="mt-1 h-5 w-5 text-primary" />
          <div><CardTitle>Audit records</CardTitle><CardDescription>Authorized administrators can review available audit events from the audit pages.</CardDescription></div>
        </CardHeader>
        <CardContent className="text-sm text-muted-foreground">Self-service data exports, generated compliance reports, and account-deletion requests are not connected to backend workflows in this deployment.</CardContent>
      </Card>
      <div role="status" className="flex items-start gap-3 rounded-lg border border-amber-300 bg-amber-50/70 p-4 text-sm text-amber-950 dark:border-amber-800 dark:bg-amber-950/30 dark:text-amber-100">
        <AlertTriangle className="mt-0.5 h-4 w-4 shrink-0" />
        <p>Do not treat this screen as a submission receipt or a statement of regulatory compliance. Contact your organization’s privacy administrator to make a data request.</p>
      </div>
    </div>
  );
}
