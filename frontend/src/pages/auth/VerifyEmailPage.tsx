import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { Mail, Loader2, CheckCircle2, AlertCircle, Send } from 'lucide-react';
import { auth } from '@/lib/firebase';
import { sendEmailVerification, onAuthStateChanged } from 'firebase/auth';
import { forceRefreshClaims, syncCurrentUser } from '@/api/auth-sync';
import { readAuthClaims } from '@/lib/auth-claims';

const VerifyEmailPage = () => {
  const navigate = useNavigate();
  const [isChecking, setIsChecking] = useState(true);
  const [isResending, setIsResending] = useState(false);
  const [resendSuccess, setResendSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [userEmail, setUserEmail] = useState<string | null>(null);

  // Poll auth state and check email verification
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (user) => {
      if (!user) {
        navigate('/auth/login');
        return;
      }
      setUserEmail(user.email);
      if (user.emailVerified) {
        await finishVerifiedLogin();
      } else {
        setIsChecking(false);
      }
    });
    return () => unsubscribe();
  }, [navigate]);

  const finishVerifiedLogin = async () => {
    setIsChecking(true);
    const sync = await syncCurrentUser();
    let claims = await forceRefreshClaims();
    if (readAuthClaims(claims ?? {})) {
      navigate('/dashboard', { replace: true });
      return;
    }
    if (sync.synced) {
      for (let attempt = 0; attempt < 4; attempt += 1) {
        await new Promise(resolve => window.setTimeout(resolve, 750));
        claims = await forceRefreshClaims();
        if (readAuthClaims(claims ?? {})) {
          navigate('/dashboard', { replace: true });
          return;
        }
      }
    }
    setError('Email verification is complete, but account provisioning is still pending. Wait briefly, then try again or contact an administrator.');
    setIsChecking(false);
  };

  const checkVerification = async () => {
    setIsChecking(true);
    await auth.currentUser?.reload();
    if (auth.currentUser?.emailVerified) {
      await finishVerifiedLogin();
    } else {
      setError('Email not yet verified. Check your inbox and click the verification link.');
      setIsChecking(false);
    }
  };

  const handleResend = async () => {
    setResendSuccess(false);
    setError(null);
    setIsResending(true);
    try {
      if (auth.currentUser) {
        await sendEmailVerification(auth.currentUser);
        setResendSuccess(true);
      }
    } catch (err: any) {
      if (err.code === 'auth/too-many-requests') {
        setError('Too many requests. Please wait a few minutes.');
      } else {
        setError('Could not resend email. Please try again.');
      }
    } finally {
      setIsResending(false);
    }
  };

  if (isChecking) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-600" />
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-6">
        <div className="bg-white py-8 px-6 shadow-sm rounded-xl border border-gray-200 text-center space-y-4">
          <div className="mx-auto h-16 w-16 bg-indigo-100 rounded-full flex items-center justify-center">
            <Mail className="w-8 h-8 text-indigo-600" />
          </div>
          <h2 className="text-2xl font-bold text-gray-900">Verify your email</h2>
          <p className="text-sm text-gray-600">
            A verification link will be sent to <span className="font-semibold">{userEmail}</span>. Check your inbox and click the link to activate your account. If it does not arrive, use “Resend verification email” below.
          </p>

          {error && (
            <div className="p-3 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-2 text-left">
              <AlertCircle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-amber-700">{error}</p>
            </div>
          )}
          {resendSuccess && (
            <div className="p-3 bg-emerald-50 border border-emerald-200 rounded-md flex items-start gap-2 text-left">
              <CheckCircle2 className="w-5 h-5 text-emerald-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-emerald-700">Verification email sent successfully.</p>
            </div>
          )}

          <div className="pt-2 space-y-3">
            <button onClick={checkVerification} className="w-full inline-flex items-center justify-center px-4 py-2.5 border border-transparent rounded-lg shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
              I've verified my email
            </button>
            <button onClick={handleResend} disabled={isResending} className="w-full inline-flex items-center justify-center px-4 py-2.5 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
              {isResending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Send className="w-4 h-4 mr-2" />}
              Resend verification email
            </button>
          </div>

          <p className="text-xs text-gray-500 pt-2">
            Didn't receive the email? Check your spam folder or ensure the address is correct.
          </p>
        </div>
      </div>
    </div>
  );
};

export default VerifyEmailPage;