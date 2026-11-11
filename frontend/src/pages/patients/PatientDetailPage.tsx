import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Edit2,
  Phone,
  Mail,
  MapPin,
  Calendar,
  ShieldAlert,
  Activity,
  FileText,
  Clock,
  Stethoscope,
  AlertTriangle,
  Loader2,
  HeartPulse,
  User
} from 'lucide-react';
import { format } from 'date-fns';
import { usePatient } from '@/hooks/use-patients';

const PatientDetailPage = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const { data: patient, isLoading, isError } = usePatient(patientId!);
  const [activeTab, setActiveTab] = useState<'overview' | 'history' | 'appointments'>('overview');

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  if (isError || !patient) return <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-red-500"><AlertTriangle className="w-12 h-12 mb-4" /><p>Patient not found</p></div>;

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/patients')} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div className="flex items-center gap-4">
              <div className="h-14 w-14 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold text-xl">
                {patient.firstName?.charAt(0)}{patient.lastName?.charAt(0)}
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900">{patient.firstName} {patient.lastName}</h1>
                <p className="text-sm text-gray-500 flex items-center gap-2 mt-1">
                  <span className="font-mono bg-gray-100 px-2 py-0.5 rounded text-xs">Patient ID: {patient.id}</span>
                  <span className="flex items-center gap-1"><Calendar className="w-3.5 h-3.5" /> {patient.dateOfBirth ? format(new Date(patient.dateOfBirth), 'MMM d, yyyy') : 'Unknown DOB'}</span>
                </p>
              </div>
            </div>
          </div>
          <div className="flex gap-3">
            <button onClick={() => navigate(`/patients/${patient.id}/documents`)} className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <FileText className="w-4 h-4 mr-2" /> Documents
            </button>
            <button onClick={() => navigate(`/patients/${patient.id}/edit`)} className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <Edit2 className="w-4 h-4 mr-2" /> Edit Profile
            </button>
            <button onClick={() => navigate(`/patients/${patient.id}/medical-history`)} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
              <FileText className="w-4 h-4 mr-2" /> Medical History
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Tabs */}
        <div className="border-b border-gray-200 mb-6 flex gap-6">
          {(['overview', 'history', 'appointments'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`py-3 text-sm font-medium border-b-2 transition-colors capitalize ${
                activeTab === tab ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        {activeTab === 'overview' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <div className="lg:col-span-2 space-y-6">
              {/* Contact Info Card */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2 flex items-center gap-2">
                  <User className="w-5 h-5 text-indigo-500" /> Contact & Demographics
                </h2>
                <dl className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">Phone</dt>
                    <dd className="mt-1 flex items-center gap-2 text-sm text-gray-900 font-medium"><Phone className="w-4 h-4 text-gray-400" /> {patient.phone || 'Not provided'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">Email</dt>
                    <dd className="mt-1 flex items-center gap-2 text-sm text-gray-900 font-medium"><Mail className="w-4 h-4 text-gray-400" /> {patient.email || 'Not provided'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">Address</dt>
                    <dd className="mt-1 flex items-center gap-2 text-sm text-gray-900"><MapPin className="w-4 h-4 text-gray-400" /> {patient.address || 'Not provided'}</dd>
                  </div>
                  <div>
                    <dt className="text-xs font-medium text-gray-500 uppercase">Gender</dt>
                    <dd className="mt-1 text-sm text-gray-900 capitalize">{patient.gender?.toLowerCase() || 'Not specified'}</dd>
                  </div>
                </dl>
              </div>

              {/* Recent Vitals */}
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <h2 className="text-lg font-semibold text-gray-900 mb-4 border-b pb-2 flex items-center gap-2">
                  <Activity className="w-5 h-5 text-rose-500" /> Recent Vitals
                </h2>
                <div className="rounded-lg border border-dashed border-gray-300 p-6 text-center text-sm text-gray-500">
                  No vital-sign records are available for this patient.
                </div>
              </div>
            </div>

            {/* Sidebar - Emergency */}
            <div className="space-y-6">
              <div className="bg-white rounded-xl shadow-sm border border-amber-200 bg-amber-50/30 p-6">
                <h2 className="text-sm font-semibold text-amber-800 mb-4 uppercase tracking-wider flex items-center gap-2">
                  <ShieldAlert className="w-4 h-4 text-amber-600" /> Emergency Contact
                </h2>
                <div className="space-y-3">
                  <div>
                    <p className="text-sm font-bold text-gray-900">{patient.emergencyContactName || 'Not provided'}</p>
                    <p className="text-xs text-gray-500">Emergency contact</p>
                  </div>
                  {patient.emergencyContactPhone && (
                    <p className="flex items-center gap-2 text-sm font-medium text-amber-700"><Phone className="w-4 h-4" /> {patient.emergencyContactPhone}</p>
                  )}
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === 'history' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center text-gray-500">
            <FileText className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Medical history module loading...</p>
          </div>
        )}

        {activeTab === 'appointments' && (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 text-center text-gray-500">
            <Calendar className="w-12 h-12 mx-auto mb-3 text-gray-300" />
            <p>Recent appointments loading...</p>
          </div>
        )}
      </div>
    </div>
  );
};

export default PatientDetailPage;