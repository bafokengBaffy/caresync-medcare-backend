import { useEffect, useState, type FormEvent } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { format, isValid, parseISO } from 'date-fns';
import { AlertCircle, Calendar, Loader2, Mail, Phone, Save, Shield, User } from 'lucide-react';
import { toast } from 'sonner';
import { profileApi } from '@/api/profile';
import { ImageUpload } from '@/components/ui/ImageUpload';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { profileQueryKey, useProfile } from '@/hooks/use-profile';
import { initials } from '@/lib/utils';

function getErrorMessage(error: unknown): string {
  return error instanceof Error
    ? error.message
    : 'The profile could not be saved. Please try again.';
}

export default function ProfilePage() {
  const queryClient = useQueryClient();
  const profileQuery = useProfile();
  const profile = profileQuery.data;
  const [fullName, setFullName] = useState('');
  const [phone, setPhone] = useState('');
  const [formError, setFormError] = useState<string | null>(null);

  useEffect(() => {
    if (!profile) return;
    setFullName(profile.fullName);
    setPhone(profile.phone ?? '');
  }, [profile]);

  const saveMutation = useMutation({
    mutationFn: profileApi.update,
    onSuccess: (updatedProfile) => {
      queryClient.setQueryData(profileQueryKey(updatedProfile.firebaseUid), updatedProfile);
      toast.success('Profile saved.');
      setFormError(null);
    },
    onError: (error) => {
      setFormError(getErrorMessage(error));
    },
  });

  const uploadImage = async (file: File) => {
    const updatedProfile = await profileApi.uploadImage(file);
    queryClient.setQueryData(profileQueryKey(updatedProfile.firebaseUid), updatedProfile);
    if (!updatedProfile.profileImageUrl) {
      throw new Error('The server did not return the saved profile image URL.');
    }
    toast.success('Profile image updated.');
    return updatedProfile.profileImageUrl;
  };

  const save = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    const trimmedName = fullName.trim();
    if (!trimmedName) {
      setFormError('Enter your name before saving.');
      return;
    }
    if (trimmedName.length > 200) {
      setFormError('Your name must be 200 characters or fewer.');
      return;
    }
    if (phone.trim().length > 32) {
      setFormError('Your phone number must be 32 characters or fewer.');
      return;
    }
    setFormError(null);
    saveMutation.mutate({ fullName: trimmedName, phone: phone.trim() });
  };

  if (profileQuery.isPending) {
    return (
      <main className="mx-auto w-full max-w-3xl space-y-6 p-6 text-foreground" aria-busy="true">
        <div className="h-8 w-48 animate-pulse rounded bg-muted" />
        <div className="h-48 animate-pulse rounded-xl bg-muted" />
        <div className="h-64 animate-pulse rounded-xl bg-muted" />
      </main>
    );
  }

  if (profileQuery.isError || !profile) {
    return (
      <main className="mx-auto w-full max-w-3xl p-6 text-foreground">
        <section className="rounded-xl border border-destructive/30 bg-card p-6" role="alert">
          <div className="flex items-start gap-3">
            <AlertCircle className="mt-0.5 h-5 w-5 shrink-0 text-destructive" />
            <div className="space-y-3">
              <h1 className="font-semibold">Profile unavailable</h1>
              <p className="text-sm text-muted-foreground">{getErrorMessage(profileQuery.error)}</p>
              <Button type="button" variant="outline" onClick={() => void profileQuery.refetch()}>
                Try again
              </Button>
            </div>
          </div>
        </section>
      </main>
    );
  }

  const createdDate = profile.createdAt ? parseISO(profile.createdAt) : null;
  const formattedCreatedDate =
    createdDate && isValid(createdDate) ? format(createdDate, 'MMMM d, yyyy') : 'Unavailable';

  return (
    <main className="mx-auto w-full max-w-3xl space-y-6 p-6 text-foreground">
      <header>
        <h1 className="flex items-center gap-2 text-2xl font-bold">
          <User aria-hidden="true" className="h-6 w-6 text-primary" />
          My Profile
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Manage your personal information and account details.
        </p>
      </header>

      <section className="flex flex-col items-center gap-6 rounded-xl border bg-card p-6 shadow-sm sm:flex-row">
        <ImageUpload
          className="flex flex-col items-center sm:items-start"
          currentImageUrl={profile.profileImageUrl ?? undefined}
          fallbackText={initials(
            profile.fullName.split(' ')[0],
            profile.fullName.split(' ').slice(1).join(' '),
          )}
          uploadFile={uploadImage}
        />
        <div className="min-w-0 flex-1 text-center sm:text-left">
          <h2 className="truncate text-xl font-semibold">{profile.fullName || profile.email}</h2>
          <p className="mt-1 flex items-center justify-center gap-1 text-sm text-muted-foreground sm:justify-start">
            <Shield aria-hidden="true" className="h-4 w-4 text-primary" />
            {profile.role.replaceAll('_', ' ')}
          </p>
          <p className="mt-1 text-xs text-muted-foreground">
            Upload a JPG, PNG, or WebP image up to 5 MB.
          </p>
        </div>
      </section>

      <form className="space-y-6" onSubmit={save} noValidate>
        {formError && (
          <div
            className="flex items-start gap-3 rounded-md border border-destructive/30 bg-destructive/5 p-4 text-destructive"
            role="alert"
          >
            <AlertCircle aria-hidden="true" className="mt-0.5 h-5 w-5 shrink-0" />
            <p className="text-sm">{formError}</p>
          </div>
        )}

        <section className="rounded-xl border bg-card p-6 shadow-sm">
          <h2 className="mb-5 border-b pb-3 text-lg font-semibold">Personal details</h2>
          <div className="grid grid-cols-1 gap-5 md:grid-cols-2">
            <div className="md:col-span-2">
              <label htmlFor="profile-full-name" className="mb-1.5 block text-sm font-medium">
                Full name
              </label>
              <Input
                id="profile-full-name"
                autoComplete="name"
                maxLength={200}
                required
                value={fullName}
                onChange={(event) => setFullName(event.target.value)}
              />
            </div>
            <div>
              <label htmlFor="profile-email" className="mb-1.5 block text-sm font-medium">
                Email address
              </label>
              <div className="relative">
                <Mail
                  aria-hidden="true"
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="profile-email"
                  className="pl-9"
                  type="email"
                  value={profile.email}
                  readOnly
                  aria-describedby="profile-email-help"
                />
              </div>
              <p id="profile-email-help" className="mt-1 text-xs text-muted-foreground">
                Contact an administrator to change your email address.
              </p>
            </div>
            <div>
              <label htmlFor="profile-phone" className="mb-1.5 block text-sm font-medium">
                Phone number
              </label>
              <div className="relative">
                <Phone
                  aria-hidden="true"
                  className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground"
                />
                <Input
                  id="profile-phone"
                  className="pl-9"
                  type="tel"
                  autoComplete="tel"
                  maxLength={32}
                  value={phone}
                  onChange={(event) => setPhone(event.target.value)}
                />
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-col justify-between gap-3 rounded-xl border bg-muted/40 p-4 text-sm sm:flex-row sm:items-center">
          <div className="flex items-center gap-2 text-muted-foreground">
            <Calendar aria-hidden="true" className="h-4 w-4" />
            Account created on {formattedCreatedDate}
          </div>
          <p className="text-muted-foreground">
            Organisation:{' '}
            <span className="font-medium text-foreground">
              {profile.tenantName ??
                (profile.role === 'SUPER_ADMIN' ? 'Platform-wide' : 'Not assigned')}
            </span>
          </p>
        </section>

        <div className="flex justify-end">
          <Button type="submit" disabled={saveMutation.isPending}>
            {saveMutation.isPending ? (
              <Loader2 aria-hidden="true" className="mr-2 h-4 w-4 animate-spin" />
            ) : (
              <Save aria-hidden="true" className="mr-2 h-4 w-4" />
            )}
            Save profile
          </Button>
        </div>
      </form>
    </main>
  );
}
