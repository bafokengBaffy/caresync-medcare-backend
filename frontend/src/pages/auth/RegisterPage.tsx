import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/forms';
export function RegisterPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader><CardTitle>Create an account</CardTitle><CardDescription>Registration is invite-only. Contact your admin.</CardDescription></CardHeader>
      <CardContent>
        <div className="space-y-4 opacity-50 pointer-events-none">
          <FormField label="Full name"><Input disabled /></FormField>
          <FormField label="Work email"><Input type="email" disabled /></FormField>
          <FormField label="Password"><Input type="password" disabled /></FormField>
        </div>
        <div className="mt-4 text-sm text-center"><Link to="/auth/login" className="text-primary hover:underline">Back to sign in</Link></div>
      </CardContent>
    </Card>
  );
}
