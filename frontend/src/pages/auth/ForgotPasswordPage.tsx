import { Link } from 'react-router-dom';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/forms';
export function ForgotPasswordPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader><CardTitle>Reset password</CardTitle><CardDescription>We'll email you a reset link</CardDescription></CardHeader>
      <CardContent>
        <FormField label="Email"><Input type="email" placeholder="you@example.com" /></FormField>
        <Button className="mt-4 w-full">Send reset link</Button>
        <div className="mt-4 text-sm text-center"><Link to="/auth/login" className="text-primary hover:underline">Back to sign in</Link></div>
      </CardContent>
    </Card>
  );
}
