import { initializeApp, getApps, type FirebaseApp } from 'firebase/app';
import {
  getAuth,
  GoogleAuthProvider,
  browserLocalPersistence,
  setPersistence,
  type Auth,
} from 'firebase/auth';
import { getFirestore, type Firestore } from 'firebase/firestore';
import { getAnalytics, isSupported, type Analytics } from 'firebase/analytics';

interface FirebaseEnvConfig {
  apiKey: string;
  authDomain: string;
  projectId: string;
  storageBucket: string;
  messagingSenderId: string;
  appId: string;
  measurementId?: string;
}

const rawConfig: FirebaseEnvConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY ?? '',
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN ?? '',
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID ?? '',
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET ?? '',
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID ?? '',
  appId: import.meta.env.VITE_FIREBASE_APP_ID ?? '',
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

const REQUIRED_KEYS: (keyof FirebaseEnvConfig)[] = ['apiKey', 'authDomain', 'projectId', 'appId'];
const missingKeys = REQUIRED_KEYS.filter((key) => !rawConfig[key] || rawConfig[key] === 'REPLACE_ME' || rawConfig[key] === 'your-project-id');
export const isFirebaseConfigured = missingKeys.length === 0;

if (!isFirebaseConfigured && import.meta.env.DEV) {
  console.warn(`[Firebase] Missing or invalid env variables: ${missingKeys.join(', ')}. Auth and Firestore features will use fallback config.`);
}

const fallbackConfig: FirebaseEnvConfig = {
  apiKey: 'demo-api-key',
  authDomain: 'demo-project.firebaseapp.com',
  projectId: 'demo-project',
  storageBucket: 'demo-project.appspot.com',
  messagingSenderId: '1234567890',
  appId: '1:1234567890:web:demo',
};

const firebaseApp = getApps().length > 0 ? getApps()[0] : initializeApp(isFirebaseConfigured ? rawConfig : fallbackConfig);
const authInstance: Auth = getAuth(firebaseApp);
void setPersistence(authInstance, browserLocalPersistence).catch((error: unknown) => {
  if (import.meta.env.DEV) console.error('[CareSync Auth] Could not set browser persistence', error);
});

if (import.meta.env.DEV) {
  console.info('[CareSync Auth] projectId:', authInstance.app.options.projectId,
    'authDomain:', authInstance.app.options.authDomain,
    'apiKeyPresent:', Boolean(authInstance.app.options.apiKey));
}

export interface FirebaseAuthError {
  code: string;
  message: string;
  userMessage: string;
  retryable: boolean;
}

export function parseFirebaseAuthError(error: unknown): FirebaseAuthError {
  const e = error as {
    code?: string;
    message?: string;
    customData?: { serverResponse?: string | { message?: string } };
  };
  const serverResponse = e?.customData?.serverResponse;
  const serverMessage = typeof serverResponse === 'object' ? serverResponse.message : serverResponse;
  const code = e?.code ?? 'auth/unknown';
  const message = e?.message ?? serverMessage ?? 'Unknown error';

  const map: Record<string, { userMessage: string; retryable: boolean }> = {
    'auth/invalid-credential': { userMessage: 'Incorrect email or password. Please try again.', retryable: true },
    'auth/wrong-password': { userMessage: 'Incorrect email or password. Please try again.', retryable: true },
    'auth/user-not-found': { userMessage: 'No account found with that email address.', retryable: true },
    'auth/invalid-email': { userMessage: 'That email address is not valid.', retryable: true },
    'auth/user-disabled': { userMessage: 'This account has been disabled. Contact support.', retryable: false },
    'auth/email-not-verified': { userMessage: 'Please verify your email before signing in.', retryable: true },
    'auth/too-many-requests': { userMessage: 'Too many attempts. Try again in a few minutes.', retryable: true },
    'auth/network-request-failed': { userMessage: 'Network error. Check your connection and retry.', retryable: true },
    'auth/operation-not-allowed': { userMessage: 'Email sign-in is not enabled for this clinic.', retryable: false },
    'auth/api-key-not-valid': { userMessage: 'Application configuration error. Contact support.', retryable: false },
    'auth/invalid-api-key': { userMessage: 'Application configuration error. Contact support.', retryable: false },
    'auth/popup-closed-by-user': { userMessage: 'The Google sign-in window was closed before completion.', retryable: true },
  };

  const entry = map[code] ?? { userMessage: 'An unexpected error occurred. Please try again.', retryable: true };
  return { code, message, userMessage: entry.userMessage, retryable: entry.retryable };
}

export function diagnoseFirebaseAuth(): { projectId: string; authDomain: string; apiKeyPresent: boolean } {
  return {
    projectId: String(authInstance.app.options.projectId ?? ''),
    authDomain: String(authInstance.app.options.authDomain ?? ''),
    apiKeyPresent: Boolean(authInstance.app.options.apiKey),
  };
}

const dbInstance: Firestore | null = isFirebaseConfigured ? getFirestore(firebaseApp) : null;
let analyticsInstance: Analytics | null = null;

if (typeof window !== 'undefined' && isFirebaseConfigured) {
  isSupported().then((supported) => {
    if (supported && rawConfig.measurementId) {
      analyticsInstance = getAnalytics(firebaseApp);
    }
  }).catch(() => undefined);
}

const googleProvider = new GoogleAuthProvider();
googleProvider.setCustomParameters({ prompt: 'select_account' });
googleProvider.addScope('email');
googleProvider.addScope('profile');

export function requireAuth(): Auth {
  return authInstance;
}

export function requireDb(): Firestore {
  if (!dbInstance) {
    throw new Error('Firestore is not initialized. Please configure your Firebase environment variables.');
  }
  return dbInstance;
}

export const app: FirebaseApp = firebaseApp;
export const auth: Auth = authInstance;
export const db: Firestore | null = dbInstance;
export const analytics: Analytics | null = analyticsInstance;
export { googleProvider };
export type { FirebaseApp, Auth, Firestore, Analytics };