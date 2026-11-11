import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Mail,
  Phone,
  Stethoscope,
  Award,
  Calendar,
  Clock,
  Loader2,
  AlertTriangle,
  User,
  FileText,
} from 'lucide-react';
import { useProvider } from '@/hooks/use-providers';

const ProviderDetailPage = () => {
  const { providerId } = useParams<{ providerId: string }>();
  const navigate = useNavigate();
  const { data: provider, isLoading, isError } = useProvider(providerId!);
  const [activeTab, setActiveTab] = useState<'profile' | 'appointments' | 'schedule'>('profile');

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  if (isError || !provider) return <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-red-500"><AlertTriangle className="w-12 h-12 mb-4" /><p>Provider not found</p></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/providers')} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><ArrowLeft className="w-5 h-5" /></button>
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xl">
                {provider.firstName?.charAt(0)}{provider.lastName?.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">Dr. {provider.firstName} {provider.lastName}</h1>
                <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                  <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">NPI: {provider.npi || 'N/A'}</span>
                  <span className="capitalize bg-blue-50 text-blue-700 px-2 py-0.5 rounded text-xs flex items-center gap-1"><Stethoscope className="w-3 h-3" />{provider.specialty?.toLowerCase()}</span>
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate(`/providers/${provider.id}/edit`)} className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <Edit2 className="w-4 h-4 mr-2" /> Edit Profile
            </button>
            <button onClick={() => navigate(`/providers/${provider.id}/schedule`)} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
              <Calendar className="w-4 h-4 mr-2" /> Manage Schedule
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6 flex gap-6">
          {(['profile', 'appointments', 'schedule'] as const).map(tab => (
            <button key={tab} onClick={() => setActiveTab(tab)} className={`py-3 text-sm font-medium border-b-2 transition-colors capitalize ${activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
              {tab}
            </button>
          ))}
        </div>

        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Contact & Credentials */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2 flex items-center gap-2"><User className="w-5 h-5 text-indigo-500" /> Contact & Credentials</h2>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">Email</dt>
                    <dd className="mt-1 flex items-center gap-2 text-sm text-gray-900 font-medium"><Mail className="w-4 h-4 text-gray-400" /> {provider.email}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">Phone</dt>
                    <dd className="mt-1 flex items-center gap-2 text-sm text-gray-900 font-medium"><Phone className="w-4 h-4 text-gray-400" /> {provider.phoneNumber || 'Not provided'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">License Number</dt>
                    <dd className="mt-1 flex items-center gap-2 text-sm text-gray-900"><Award className="w-4 h-4 text-gray-400" /> {provider.licenseNumber || 'N/A'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">Experience</dt>
                    <dd className="mt-1 text-sm text-gray-900">{provider.yearsOfExperience || 'N/A'} years</dd>
                  </div>
                </dl>
                {provider.bio && (
                  <div className="mt-6 pt-4 border-t border-gray-100">
                    <dt className="text-xs font-medium text-gray-500 uppercase mb-2">Bio</dt>
                    <dd className="text-sm text-gray-600">{provider.bio}</dd>
                  </div>
                )}
              </div>

              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-2">Provider status</h2>
                <p className="text-sm text-gray-600">{provider.active ? 'Active' : 'Inactive'}</p>
              </div>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-2">Profile created</h2>
                <p className="text-sm font-medium text-gray-900">{provider.createdAt ? new Date(provider.createdAt).toLocaleDateString() : '—'}</p>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Loading provider appointments...</p>
          </div>
        )}

        {activeTab === 'schedule' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center text-gray-500">
            <Clock className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Loading provider schedule...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default ProviderDetailPage;