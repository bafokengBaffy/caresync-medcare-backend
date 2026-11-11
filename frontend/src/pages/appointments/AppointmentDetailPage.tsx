import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Calendar,
  Clock,
  Stethoscope,
  FileText,
  AlertTriangle,
  CheckCircle2,
  Loader2,
  FileSignature,
  Activity
} from 'lucide-react';
import { format } from 'date-fns';
import { useAppointment, useUpdateAppointmentStatus } from '@/hooks/use-appointments';

const AppointmentDetailPage = () => {
  const { id: appointmentId } = useParams<{ id: string }>();
  const navigate = useNavigate();
  
  // Hooks
  const { data: appointment, isLoading, isError } = useAppointment(appointmentId!);
  const updateStatusMutation = useUpdateAppointmentStatus();

  // State
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [newStatus, setNewStatus] = useState('');

  const handleStatusUpdate = () => {
    if (!appointmentId || !newStatus) return;
    updateStatusMutation.mutate({ id: appointmentId, status: newStatus }, {
      onSuccess: () => setIsStatusModalOpen(false)
    });
  };

  if (isLoading) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;
  if (isError || !appointment) return <div className="min-h-screen flex flex-col items-center justify-center bg-gray-50 text-red-500"><AlertTriangle className="w-12 h-12 mb-4" /><p>Appointment not found</p><button onClick={() => navigate(-1)} className="mt-4 text-indigo-600 hover:underline">Go Back</button></div>;

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-indigo-100 text-indigo-800 border-indigo-200';
      case 'COMPLETED': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'CANCELLED': return 'bg-red-100 text-red-800 border-red-200';
      case 'NO_SHOW': return 'bg-amber-100 text-amber-800 border-amber-200';
      default: return 'bg-blue-100 text-blue-800 border-blue-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/appointments')} className="p-2 hover:bg-gray-100 rounded-full transition-colors text-gray-500">
              <ArrowLeft className="w-5 h-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-3">
                Appointment Details
                <span className={`text-xs px-2.5 py-1 rounded-full font-medium border ${getStatusColor(appointment.status)}`}>
                  {appointment.status.replace('_', ' ')}
                </span>
              </h1>
              <p className="text-sm text-gray-500 mt-1">ID: {appointment.id}</p>
            </div>
          </div>
          <div className="flex gap-3">
            <button 
              onClick={() => { setNewStatus(appointment.status); setIsStatusModalOpen(true); }}
              className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 transition-colors"
            >
              <Activity className="w-4 h-4 mr-2" /> Update Status
            </button>
            <button 
              onClick={() => navigate(`/appointments/${appointment.id}/edit`)}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 transition-colors"
            >
              <FileSignature className="w-4 h-4 mr-2" /> Edit
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 grid grid-cols-1 md:grid-cols-3 gap-6">
        
        {/* Left Column - Info */}
        <div className="md:col-span-2 space-y-6">
          {/* Main Info Card */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-lg font-semibold text-gray-900 mb-6 flex items-center gap-2">
              <Calendar className="w-5 h-5 text-indigo-500" /> Schedule Information
            </h2>
            
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Date</p>
                <p className="text-lg font-semibold text-gray-900">
                  {format(new Date(appointment.scheduledStart), 'EEEE, MMMM d, yyyy')}
                </p>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-500 mb-1">Time</p>
                <p className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                  <Clock className="w-5 h-5 text-gray-400" />
                  {format(new Date(appointment.scheduledStart), 'h:mm a')} - {format(new Date(appointment.scheduledEnd), 'h:mm a')}
                </p>
              </div>
            </div>

            <div className="mt-8 pt-6 border-t border-gray-100">
              <h3 className="text-sm font-medium text-gray-900 mb-3">Clinical Details</h3>
              <dl className="grid grid-cols-1 sm:grid-cols-2 gap-x-4 gap-y-4">
                <div>
                  <dt className="text-sm text-gray-500">Type</dt>
                  <dd className="mt-1 text-sm font-medium text-gray-900">{appointment.appointmentType || 'General'}</dd>
                </div>
                <div className="sm:col-span-2">
                  <dt className="text-sm text-gray-500">Reason</dt>
                  <dd className="mt-1 text-sm text-gray-900 bg-gray-50 p-3 rounded-lg border border-gray-100 min-h-[60px]">
                    {appointment.reason || 'No reason provided.'}
                  </dd>
                </div>
              </dl>
            </div>
          </div>

          {/* Linked Clinical Note */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <FileText className="w-5 h-5 text-indigo-500" /> Clinical Notes
              </h2>
              {!appointment.firestoreNoteId && (
                <button className="text-sm font-medium text-indigo-600 hover:text-indigo-800 bg-indigo-50 px-3 py-1.5 rounded-md">
                  Create Note
                </button>
              )}
            </div>
            {appointment.firestoreNoteId ? (
              <div className="p-4 bg-emerald-50 rounded-lg border border-emerald-100 flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <CheckCircle2 className="w-5 h-5 text-emerald-600" />
                  <div>
                    <p className="text-sm font-medium text-emerald-900">Clinical note is attached</p>
                    <p className="text-xs text-emerald-700">ID: {appointment.firestoreNoteId}</p>
                  </div>
                </div>
                <button className="text-sm font-medium text-emerald-700 hover:text-emerald-900 underline">View Note</button>
              </div>
            ) : (
              <p className="text-sm text-gray-500 italic">No clinical note has been created for this appointment yet.</p>
            )}
          </div>
        </div>

        {/* Right Column - Participants */}
        <div className="space-y-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Patient</h2>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-blue-100 rounded-full flex items-center justify-center text-blue-700 font-bold">
                {appointment.patientName?.charAt(0) || 'P'}
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{appointment.patientName || 'Unknown Patient'}</p>
                <p className="text-xs text-gray-500 font-mono mt-0.5">{appointment.patientId}</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wider mb-4">Provider</h2>
            <div className="flex items-center gap-3">
              <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700">
                <Stethoscope className="w-5 h-5" />
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900">{appointment.providerName || 'Unknown Provider'}</p>
                <p className="text-xs text-gray-500 font-mono mt-0.5">{appointment.providerId}</p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Update Status Modal */}
      {isStatusModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-500 bg-opacity-75">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Update Appointment Status</h3>
            <p className="text-sm text-gray-500 mb-4">
              Changing the status will notify the patient and update the provider's schedule accordingly.
            </p>
            
            <select
              value={newStatus}
              onChange={(e) => setNewStatus(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border mb-6"
            >
              <option value="SCHEDULED">Scheduled</option>
              <option value="CONFIRMED">Confirmed</option>
              <option value="COMPLETED">Completed</option>
              <option value="CANCELLED">Cancelled</option>
              <option value="NO_SHOW">No Show</option>
            </select>

            {updateStatusMutation.isError && (
              <p className="mb-4 text-sm text-red-600 flex items-center gap-1">
                <AlertTriangle className="w-4 h-4" /> Failed to update status. Try again.
              </p>
            )}

            <div className="flex justify-end gap-3">
              <button 
                onClick={() => setIsStatusModalOpen(false)} 
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button 
                onClick={handleStatusUpdate} 
                disabled={updateStatusMutation.isPending || newStatus === appointment.status}
                className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50 flex items-center"
              >
                {updateStatusMutation.isPending && <Loader2 className="w-4 h-4 mr-2 animate-spin" />}
                Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AppointmentDetailPage;