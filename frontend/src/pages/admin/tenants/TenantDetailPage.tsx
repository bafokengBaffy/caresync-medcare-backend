import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Building2,
  Users,
  Activity,
  CreditCard,
  Shield,
  Loader2,
  AlertTriangle,
  FileText,
  Settings,
  Mail,
  Calendar,
  Zap,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { format } from 'date-fns';
import { errorMessage } from '@/lib/error-message';

interface TenantDetail {
  id: string;
  name: string;
  subdomain: string;
  status: 'ACTIVE' | 'INACTIVE' | 'SUSPENDED';
  plan: 'FREE' | 'PRO' | 'ENTERPRISE';
  createdAt: string;
  ownerEmail: string;
  stats: {
    totalUsers: number;
    totalPatients: number;
    monthlyAppointments: number;
    storageUsedMB: number;
  };
  limits: {
    maxUsers: number;
    maxPatients: number;
    storageLimitMB: number;
    features: string[];
  };
}

const TenantDetailPage = () => {
  const { tenantId } = useParams<{ tenantId: string }>();
  const navigate = useNavigate();
  const [tenant, setTenant] = useState<TenantDetail | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isUpdating, setIsUpdating] = useState(false);

  useEffect(() => {
    const fetchTenant = async () => {
      try {
        const response = await fetch(`/api/v1/admin/tenants/${tenantId}`, {
          headers: { 'Content-Type': 'application/json' }
        });
        if (!response.ok) throw new Error('Tenant not found');
        const data = await response.json();
        setTenant(data);
      } catch (err: unknown) {
        setError(errorMessage(err, 'Could not load tenant details.'));
      } finally {
        setIsLoading(false);
      }
    };
    if (tenantId) fetchTenant();
  }, [tenantId]);

  const toggleStatus = async () => {
    if (!tenant) return;
    const newStatus = tenant.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    if (!confirm(`Are you sure you want to change status to ${newStatus}?`)) return;
    
    setIsUpdating(true);
    try {
      await fetch(`/api/v1/admin/tenants/${tenant.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus })
      });
      setTenant({ ...tenant, status: newStatus });
    } catch (err) {
      alert('Failed to update tenant status');
    } finally {
      setIsUpdating(false);
    }
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-slate-950"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  if (error || !tenant) return <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-red-500 dark:bg-slate-950"><AlertTriangle className="w-12 h-12 mb-4" /><p>{error || 'Tenant not found'}</p><button onClick={() => navigate(-1)} className="mt-4 text-indigo-600 hover:underline">Go Back</button></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-12 dark:bg-slate-950">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6 sticky top-0 z-10 dark:bg-slate-900 dark:border-slate-700">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/admin/tenants')} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500 dark:hover:bg-slate-900 dark:text-slate-400">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-4">
              <div className="h-12 w-12 bg-indigo-100 rounded-xl flex items-center justify-center">
                <Building2 className="w-6 h-6 text-indigo-600" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3 dark:text-slate-50">
                  {tenant.name}
                  <span className={`text-xs px-2.5 py-1 rounded-full font-medium ${
                    tenant.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' : 'bg-red-100 text-red-800'
                  }`}>
                    {tenant.status}
                  </span>
                </h1>
                <p className="text-sm text-gray-500 dark:text-slate-400">{tenant.subdomain}.caresync.com</p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={toggleStatus} disabled={isUpdating} className={`inline-flex items-center px-4 py-2 border rounded-md shadow-sm text-sm font-medium transition-colors ${ tenant.status === 'ACTIVE' ? 'border-red-300 text-red-700 bg-white hover:bg-red-50' : 'border-emerald-300 text-emerald-700 bg-white hover:bg-emerald-50' } dark:bg-slate-900 dark:bg-slate-900`}>
              {isUpdating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Shield className="w-4 h-4 mr-2" />}
              {tenant.status === 'ACTIVE' ? 'Suspend Tenant' : 'Activate Tenant'}
            </button>
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 dark:border-slate-600 dark:text-slate-200 dark:bg-slate-900 dark:hover:bg-slate-950">
              <Settings className="w-4 h-4 mr-2" /> Edit Settings
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8 grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Top Stats Cards */}
        <div className="lg:col-span-3 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 dark:bg-slate-900 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-slate-400">Total Users</h3>
              <Users className="w-5 h-5 text-blue-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-gray-900 dark:text-slate-50">{tenant.stats.totalUsers}</p>
              <span className="text-sm text-gray-500 dark:text-slate-400">/ {tenant.limits.maxUsers}</span>
            </div>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-2 dark:bg-slate-800">
              <div className="bg-blue-500 h-2 rounded-full" style={{ width: `${(tenant.stats.totalUsers / tenant.limits.maxUsers) * 100}%` }}></div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 dark:bg-slate-900 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-slate-400">Total Patients</h3>
              <Activity className="w-5 h-5 text-emerald-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-gray-900 dark:text-slate-50">{tenant.stats.totalPatients}</p>
              <span className="text-sm text-gray-500 dark:text-slate-400">/ {tenant.limits.maxPatients}</span>
            </div>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-2 dark:bg-slate-800">
              <div className="bg-emerald-500 h-2 rounded-full" style={{ width: `${(tenant.stats.totalPatients / tenant.limits.maxPatients) * 100}%` }}></div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 dark:bg-slate-900 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-slate-400">Monthly Appts</h3>
              <Calendar className="w-5 h-5 text-purple-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-gray-900 dark:text-slate-50">{tenant.stats.monthlyAppointments}</p>
            </div>
            <p className="mt-4 text-xs text-emerald-600 flex items-center gap-1"><Activity className="w-3 h-3" /> +12% from last month</p>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 dark:bg-slate-900 dark:border-slate-700">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-medium text-gray-500 dark:text-slate-400">Storage Used</h3>
              <Zap className="w-5 h-5 text-amber-500" />
            </div>
            <div className="flex items-baseline gap-2">
              <p className="text-3xl font-bold text-gray-900 dark:text-slate-50">{tenant.stats.storageUsedMB} MB</p>
              <span className="text-sm text-gray-500 dark:text-slate-400">/ {tenant.limits.storageLimitMB} MB</span>
            </div>
            <div className="mt-4 w-full bg-gray-200 rounded-full h-2 dark:bg-slate-800">
              <div className="bg-amber-500 h-2 rounded-full" style={{ width: `${(tenant.stats.storageUsedMB / tenant.limits.storageLimitMB) * 100}%` }}></div>
            </div>
          </div>
        </div>

        {/* Left Column - Info */}
        <div className="lg:col-span-2 space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 dark:bg-slate-900 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2 dark:text-slate-50">
              <FileText className="w-5 h-5 text-indigo-500" /> Tenant Information
            </h2>
            <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-6">
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-slate-400">Owner Email</dt>
                <dd className="mt-1 flex items-center gap-2 text-sm text-gray-900 dark:text-slate-50"><Mail className="w-4 h-4 text-gray-400 dark:text-slate-300" />{tenant.ownerEmail}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-slate-400">Created Date</dt>
                <dd className="mt-1 flex items-center gap-2 text-sm text-gray-900 dark:text-slate-50"><Calendar className="w-4 h-4 text-gray-400 dark:text-slate-300" />{format(new Date(tenant.createdAt), 'MMMM d, yyyy')}</dd>
              </div>
              <div>
                <dt className="text-sm font-medium text-gray-500 dark:text-slate-400">Current Plan</dt>
                <dd className="mt-1 flex items-center gap-2">
                  <span className={`px-2.5 py-0.5 rounded-md text-xs font-bold uppercase tracking-wide ${ tenant.plan === 'ENTERPRISE' ? 'bg-purple-100 text-purple-700' : tenant.plan === 'PRO' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 dark:text-slate-200' } dark:text-slate-200`}>
                    {tenant.plan}
                  </span>
                </dd>
              </div>
            </dl>
          </div>
        </div>

        {/* Right Column - Features */}
        <div className="lg:col-span-1">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 dark:bg-slate-900 dark:border-slate-700">
            <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2 dark:text-slate-50">
              <CreditCard className="w-5 h-5 text-indigo-500" /> Plan Features
            </h2>
            <ul className="space-y-3">
              {['Billing & Invoicing', 'Custom Subdomain', 'Advanced Analytics', 'Priority Support'].map(feature => {
                const isIncluded = tenant.limits.features.includes(feature);
                return (
                  <li key={feature} className="flex items-center justify-between">
                    <span className={`text-sm ${isIncluded ? 'text-gray-700 dark:text-slate-200' : 'text-gray-400 line-through'}`}>{feature}</span>
                    {isIncluded ? (
                      <CheckCircle2 className="w-5 h-5 text-emerald-500" />
                    ) : (
                      <XCircle className="w-5 h-5 text-gray-300 dark:text-slate-300" />
                    )}
                  </li>
                );
              })}
            </ul>
          </div>
        </div>
      </div>
    </div>
  );
};

export default TenantDetailPage;