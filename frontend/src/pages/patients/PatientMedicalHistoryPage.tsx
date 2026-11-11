import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  HeartPulse,
  AlertTriangle,
  Pill,
  Activity,
  Syringe
} from 'lucide-react';

const PatientMedicalHistoryPage = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  
  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-white border-b border-gray-200 px-6 py-6 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate(`/patients/${patientId}`)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <HeartPulse className="w-6 h-6 text-rose-500" />
              Medical History
            </h1>
            <p className="text-sm text-gray-500 mt-1">Comprehensive medical background for patient.</p>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-8">
        <div role="status" className="rounded-lg border border-amber-300 bg-amber-50 p-4 text-sm text-amber-900">
          Medical history is not connected to a database yet. Do not use this page as a source of clinical information.
        </div>
        
        {/* Top Grid - Allergies & Conditions */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Conditions */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Activity className="w-5 h-5 text-indigo-500" /> Active Conditions
              </h2>
            </div>
            <ul className="divide-y divide-gray-100">
              <li className="p-4 text-sm text-gray-500">No condition records are available.</li>
            </ul>
          </div>

          {/* Allergies */}
          <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-red-200 flex justify-between items-center bg-red-50">
              <h2 className="text-lg font-semibold text-red-900 flex items-center gap-2">
                <AlertTriangle className="w-5 h-5 text-red-600" /> Allergies
              </h2>
            </div>
            <ul className="divide-y divide-red-100">
              <li className="p-4 text-sm text-gray-500">No allergy records are available.</li>
            </ul>
          </div>
        </div>

        {/* Medications */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200 flex justify-between items-center bg-gray-50">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              <Pill className="w-5 h-5 text-emerald-500" /> Current Medications
            </h2>
          </div>
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Medication</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dosage</th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Frequency</th>
                  <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">Status</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                <tr><td colSpan={4} className="px-6 py-6 text-center text-sm text-gray-500">No medication records are available.</td></tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Immunizations */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h2 className="text-lg font-semibold text-gray-900 mb-4 flex items-center gap-2">
            <Syringe className="w-5 h-5 text-blue-500" /> Immunization Records
          </h2>
          <div className="p-4 bg-gray-50 rounded-lg text-center border border-gray-200 text-sm text-gray-500 italic">
            No recent immunization records found.
          </div>
        </div>

      </div>
    </div>
  );
};

export default PatientMedicalHistoryPage;