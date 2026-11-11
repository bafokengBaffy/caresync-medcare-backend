import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  User,
  Mail,
  Shield,
  Building,
  Clock,
  Activity,
  Key,
  Smartphone,
  Monitor,
  AlertTriangle,
  Loader2,
  Calendar,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';

interface UserDetail {
  id: string;
  email: string;
  name: string;
  role: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  tenantId?: string;
  tenantName?: string;
  createdAt: string;
  lastLogin?: string;
  mfaEnabled: boolean;
  activeSessions: Array<{
    id: string;
    device: string;
    ip: string;
    location: string;
    lastActive: string;
    isCurrent: boolean;
  }>;
  recentActivity: Array<{
    id: string;
    action: string;
    timestamp: string;
    ip: string;
  }>;
}

const UserDetailPage = () => {
  const { userId } = useParams<{ userId: string }>();
  const navigate = useNavigate();
  const [user, setUser] = useState<UserDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchUserDetails = async () => {
      try {
        const response = await fetch(`/api/v1/admin/users/${userId}`, {
          headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error('User not found');
        const data = await response.json();
        setUser(data);
      } catch (err: any) {
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    };
    if (userId) fetchUserDetails();
  }, [userId]);

  const revokeSession = async (sessionId: string) => {
    if (!confirm('Are you sure you want to revoke this session? The user will be logged out immediately.')) return;
    try {
      await fetch(`/api/v1/admin/users/${userId}/sessions/${sessionId}`, { method: 'DELETE' });
      setUser(prev => prev ? { ...prev, activeSessions: prev.activeSessions.filter(s => s.id !== sessionId) } : null);
    } catch (err) {
      alert('Failed to revoke session');
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  if (error || !user) return <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-red-500"><AlertTriangle className="w-12 h-12 mb-4" /><p>{error || 'User not found'}</p><button onClick={() => navigate(-1)} className="mt-4 text-indigo-600 hover:underline">Go Back</button></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate('/admin/users')} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
              {user.name}
              <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                user.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 
                user.status === 'SUSPENDED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
              }`}>
                {user.status}
              </span>
            </h1>
            <p className="text-sm text-gray-500 mt-1">User ID: {user.id}</p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Left Column - Details */}
        <div className="lg:col-span-1 space-y-6">
          {/* Profile Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <User className="w-5 h-5 text-indigo-500" /> Profile Information
            </h2>
            <div className="space-y-4">
              <div>
                <label className="text-xs font-medium text-gray-500">Email Address</label>
                <div className="mt-1 flex items-center gap-2 text-sm text-gray-900 font-medium">
                  <Mail className="w-4 h-4 text-gray-400" /> {user.email}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Role</label>
                <div className="mt-1 flex items-center gap-2 text-sm text-gray-900">
                  <Shield className="w-4 h-4 text-gray-400" /> {user.role.replace('_', ' ')}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Tenant</label>
                <div className="mt-1 flex items-center gap-2 text-sm text-gray-900">
                  <Building className="w-4 h-4 text-gray-400" /> {user.tenantName || 'System Level'}
                </div>
              </div>
              <div>
                <label className="text-xs font-medium text-gray-500">Joined Date</label>
                <div className="mt-1 flex items-center gap-2 text-sm text-gray-900">
                  <Calendar className="w-4 h-4 text-gray-400" /> {format(new Date(user.createdAt), 'MMMM d, yyyy')}
                </div>
              </div>
            </div>
          </div>

          {/* Security Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
              <Key className="w-5 h-5 text-indigo-500" /> Security Settings
            </h2>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Multi-Factor Auth</span>
                {user.mfaEnabled ? (
                  <span className="flex items-center gap-1 text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded"><CheckCircle2 className="w-3 h-3" /> Enabled</span>
                ) : (
                  <span className="flex items-center gap-1 text-xs font-medium text-red-600 bg-red-50 px-2 py-1 rounded"><XCircle className="w-3 h-3" /> Disabled</span>
                )}
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-700">Last Login</span>
                <span className="text-sm text-gray-900">{user.lastLogin ? format(new Date(user.lastLogin), 'PPp') : 'Never'}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Right Column - Sessions & Activity */}
        <div className="lg:col-span-2 space-y-6">
          {/* Active Sessions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Monitor className="w-5 h-5 text-indigo-500" /> Active Sessions
              </h2>
            </div>
            <ul className="divide-y divide-gray-200">
              {user.activeSessions.length === 0 ? (
                <li className="p-6 text-center text-sm text-gray-500">No active sessions found.</li>
              ) : (
                user.activeSessions.map(session => (
                  <li key={session.id} className="p-6 flex items-center justify-between hover:bg-gray-50">
                    <div className="flex items-center gap-4">
                      <div className="p-2 bg-gray-100 rounded-lg">
                        {session.device.includes('Mobile') ? <Smartphone className="w-6 h-6 text-gray-600" /> : <Monitor className="w-6 h-6 text-gray-600" />}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-900 flex items-center gap-2">
                          {session.device}
                          {session.isCurrent && <span className="text-[10px] uppercase bg-indigo-100 text-indigo-700 px-1.5 py-0.5 rounded font-bold">Current</span>}
                        </p>
                        <p className="text-xs text-gray-500">{session.ip} • {session.location}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-4">
                      <span className="text-xs text-gray-400">{format(new Date(session.lastActive), 'PPp')}</span>
                      {!session.isCurrent && (
                        <button onClick={() => revokeSession(session.id)} className="text-xs font-medium text-red-600 hover:text-red-800 bg-red-50 hover:bg-red-100 px-3 py-1.5 rounded transition-colors">
                          Revoke
                        </button>
                      )}
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>

          {/* Recent Activity */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-500" /> Recent Activity
              </h2>
            </div>
            <ul className="divide-y divide-gray-200">
              {user.recentActivity.length === 0 ? (
                <li className="p-6 text-center text-sm text-gray-500">No recent activity.</li>
              ) : (
                user.recentActivity.map(log => (
                  <li key={log.id} className="p-6 flex gap-4 hover:bg-gray-50">
                    <div className="mt-0.5 relative">
                      <div className="w-8 h-8 rounded-full bg-indigo-50 border border-indigo-100 flex items-center justify-center z-10 relative">
                        <Clock className="w-4 h-4 text-indigo-600" />
                      </div>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-gray-900">{log.action}</p>
                      <p className="text-xs text-gray-500 mt-1">IP: {log.ip} • {format(new Date(log.timestamp), 'MMM d, yyyy HH:mm')}</p>
                    </div>
                  </li>
                ))
              )}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDetailPage;