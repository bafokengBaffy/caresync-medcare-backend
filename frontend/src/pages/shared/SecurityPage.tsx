import { useState } from 'react';
import {
  ShieldCheck,
  Key,
  Smartphone,
  Monitor,
  CheckCircle2,
  XCircle,
  Loader2,
  AlertTriangle,
  Lock,
  RefreshCw,
} from 'lucide-react';

const SecurityPage = () => {
  const [isUpdatingPassword, setIsUpdatingPassword] = useState(false);
  const [passwordSuccess, setPasswordSuccess] = useState(false);
  const [passwordError, setPasswordError] = useState<string | null>(null);

  const [passwords, setPasswords] = useState({ current: '', new: '', confirm: '' });
  const [mfaEnabled, setMfaEnabled] = useState(true);

  const sessions = [
    {
      id: '1',
      device: 'MacBook Pro - Chrome',
      ip: '192.168.1.45',
      location: 'Johannesburg, ZA',
      isCurrent: true,
      lastActive: 'Active now',
    },
    {
      id: '2',
      device: 'iPhone 14 - Safari',
      ip: '102.65.12.88',
      location: 'Johannesburg, ZA',
      isCurrent: false,
      lastActive: '2 hours ago',
    },
  ];

  const handlePasswordSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setPasswordError(null);
    setPasswordSuccess(false);

    // OWASP: Strong Password Validation
    if (passwords.new.length < 12) {
      setPasswordError('Password must be at least 12 characters long.');
      return;
    }
    if (passwords.new !== passwords.confirm) {
      setPasswordError('Passwords do not match.');
      return;
    }

    setIsUpdatingPassword(true);
    await new Promise((res) => setTimeout(res, 1000));
    setIsUpdatingPassword(false);
    setPasswordSuccess(true);
    setPasswords({ current: '', new: '', confirm: '' });
    setTimeout(() => setPasswordSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
            Security & Authentication
          </h1>
          <p className="mt-1 text-sm text-gray-500">
            Manage your password, MFA, and active sessions.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Password Change - Left Column */}
          <div className="lg:col-span-2 space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2 flex items-center gap-2">
                <Key className="w-5 h-5 text-indigo-500" /> Change Password
              </h2>

              <form onSubmit={handlePasswordSubmit} className="space-y-4">
                {passwordError && (
                  <div className="p-3 bg-red-50 text-red-700 text-sm rounded-md flex items-start gap-2">
                    <AlertTriangle className="w-4 h-4 mt-0.5 flex-shrink-0" /> {passwordError}
                  </div>
                )}
                {passwordSuccess && (
                  <div className="p-3 bg-emerald-50 text-emerald-700 text-sm rounded-md flex items-start gap-2">
                    <CheckCircle2 className="w-4 h-4 mt-0.5 flex-shrink-0" /> Password updated
                    successfully.
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Current Password
                  </label>
                  <input
                    type="password"
                    value={passwords.current}
                    onChange={(e) => setPasswords({ ...passwords, current: e.target.value })}
                    required
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg sm:text-sm"
                  />
                </div>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      New Password
                    </label>
                    <input
                      type="password"
                      value={passwords.new}
                      onChange={(e) => setPasswords({ ...passwords, new: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg sm:text-sm"
                    />
                    <p className="text-xs text-gray-500 mt-1">
                      Min 12 chars, 1 uppercase, 1 number, 1 symbol.
                    </p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Confirm New Password
                    </label>
                    <input
                      type="password"
                      value={passwords.confirm}
                      onChange={(e) => setPasswords({ ...passwords, confirm: e.target.value })}
                      required
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg sm:text-sm"
                    />
                  </div>
                </div>
                <div className="pt-2 flex justify-end">
                  <button
                    type="submit"
                    disabled={isUpdatingPassword}
                    className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700 disabled:opacity-50"
                  >
                    {isUpdatingPassword && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Update
                    Password
                  </button>
                </div>
              </form>
            </div>

            {/* Active Sessions */}
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2 flex items-center gap-2">
                <Monitor className="w-5 h-5 text-indigo-500" /> Active Sessions
              </h2>
              <ul className="divide-y divide-gray-100">
                {sessions.map((session) => (
                  <li key={session.id} className="py-3 flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {session.device.includes('iPhone') ? (
                          <Smartphone className="w-5 h-5 text-gray-600" />
                        ) : (
                          <Monitor className="w-5 h-5 text-gray-600" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                          {session.device}
                          {session.isCurrent && (
                            <span className="text-[10px] uppercase bg-emerald-100 text-emerald-700 px-1.5 py-0.5 rounded font-bold">
                              Current
                            </span>
                          )}
                        </p>
                        <p className="text-xs text-gray-500">
                          {session.ip} • {session.location}
                        </p>
                      </div>
                    </div>
                    {!session.isCurrent && (
                      <button className="text-xs font-medium text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-2 py-1 rounded transition-colors">
                        Revoke
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            </div>
          </div>

          {/* MFA - Right Column */}
          <div className="space-y-6">
            <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
              <h2 className="text-lg font-semibold text-gray-900 mb-2 flex items-center gap-2">
                <Lock className="w-5 h-5 text-indigo-500" /> Two-Factor Auth
              </h2>
              <p className="text-xs text-gray-500 mb-4">
                Add an extra layer of security to your account.
              </p>

              <div
                className={`p-4 rounded-lg border flex items-center gap-3 mb-4 ${mfaEnabled ? 'bg-emerald-50 border-emerald-200' : 'bg-red-50 border-red-200'}`}
              >
                {mfaEnabled ? (
                  <CheckCircle2 className="w-6 h-6 text-emerald-600" />
                ) : (
                  <XCircle className="w-6 h-6 text-red-600" />
                )}
                <div>
                  <p
                    className={`text-sm font-bold ${mfaEnabled ? 'text-emerald-800' : 'text-red-800'}`}
                  >
                    {mfaEnabled ? 'MFA is Enabled' : 'MFA is Disabled'}
                  </p>
                  <p className="text-xs text-gray-600">
                    {mfaEnabled ? 'Your account is secure.' : 'Your account is at risk.'}
                  </p>
                </div>
              </div>

              <button
                onClick={() => setMfaEnabled(!mfaEnabled)}
                className={`w-full py-2 rounded-md text-sm font-medium transition-colors ${mfaEnabled ? 'bg-gray-100 text-gray-700 hover:bg-gray-200' : 'bg-indigo-600 text-white hover:bg-indigo-700'}`}
              >
                {mfaEnabled ? 'Disable MFA' : 'Setup Authenticator App'}
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SecurityPage;
