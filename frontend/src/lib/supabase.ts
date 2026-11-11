import { createClient, type SupabaseClient } from '@supabase/supabase-js';
import { auth } from '@/lib/firebase';

let client: SupabaseClient | null = null;

export function getSupabaseClient(): SupabaseClient {
  if (client) return client;

  const url = import.meta.env.VITE_SUPABASE_URL?.trim();
  const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY?.trim();
  if (!url || !anonKey) {
    throw new Error('Image storage is not configured. Contact your CareSync administrator.');
  }

  let parsedUrl: URL;
  try {
    parsedUrl = new URL(url);
  } catch {
    throw new Error('Image storage is not configured with a valid URL.');
  }

  const localDevelopmentHost = ['localhost', '127.0.0.1', '::1'].includes(parsedUrl.hostname);
  if (
    parsedUrl.protocol !== 'https:' &&
    !(import.meta.env.DEV && localDevelopmentHost && parsedUrl.protocol === 'http:')
  ) {
    throw new Error('Image storage must use HTTPS.');
  }

  client = createClient(url, anonKey, {
    auth: {
      autoRefreshToken: false,
      detectSessionInUrl: false,
      persistSession: false,
    },
    accessToken: async () => {
      const currentUser = auth.currentUser;
      if (!currentUser) {
        throw new Error('Sign in before uploading a profile image.');
      }
      return currentUser.getIdToken();
    },
  });

  return client;
}
