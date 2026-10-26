import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { useNavigate } from 'react-router-dom';
import { loginSchema, type LoginFormValues } from '@/lib/validators';
import { Input } from '@/components/ui/input';
import { Button } from '@/components/ui/button';
import { FormField } from './FormField';
import { useAuth } from '@/hooks/use-auth';
import { toast } from 'sonner';

export function LoginForm() {
  const nav = useNavigate();
  const { login } = useAuth();
  const { register, handleSubmit, formState: { errors, isSubmitting } } = useForm<LoginFormValues>({ resolver: zodResolver(loginSchema) });
  const onSubmit = async (v: LoginFormValues) => { try { await login(v.email, v.password); nav('/dashboard'); } catch { toast.error('Invalid credentials'); } };
  return (
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
      <FormField label="Email" error={errors.email?.message} required><Input type="email" {...register('email')} /></FormField>
      <FormField label="Password" error={errors.password?.message} required><Input type="password" {...register('password')} /></FormField>
      <Button type="submit" className="w-full" disabled={isSubmitting}>Sign in</Button>
    </form>
  );
}
