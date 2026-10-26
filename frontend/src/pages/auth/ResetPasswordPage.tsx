import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FormField } from '@/components/forms';
export function ResetPasswordPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader><CardTitle>Set new password</CardTitle><CardDescription>Minimum 8 characters</CardDescription></CardHeader>
      <CardContent className="space-y-4">
        <FormField label="New password"><Input type="password" /></FormField>
        <FormField label="Confirm password"><Input type="password" /></FormField>
        <Button className="w-full">Update password</Button>
      </CardContent>
    </Card>
  );
}
