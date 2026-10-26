import { Link } from 'react-router-dom';
import { LoginForm } from '@/components/forms';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
export function LoginPage() {
  return (
    <Card className="w-full max-w-md">
      <CardHeader><CardTitle>Welcome back</CardTitle><CardDescription>Sign in to your CareSync account</CardDescription></CardHeader>
      <CardContent>
        <LoginForm />
        <div className="mt-4 flex justify-between text-sm"><Link to="/auth/forgot-password" className="text-primary hover:underline">Forgot password?</Link><Link to="/auth/register" className="text-primary hover:underline">Create account</Link></div>
      </CardContent>
    </Card>
  );
}
