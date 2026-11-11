import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Calendar,
  User,
  Stethoscope,
  FileText,
  ArrowLeft,
  CheckCircle2,
  AlertCircle,
  Loader2,
} from 'lucide-react';
import { useCreateAppointment, useAvailability } from '@/hooks/use-appointments';
import type { AppointmentCreatePayload } from '@/types/appointment';

const AppointmentCreatePage = () => {
  const navigate = useNavigate();
  const createMutation = useCreateAppointment();

  // Form State
  const [formData, setFormData] = useState<AppointmentCreatePayload>({
    patientId: '',
    providerId: '',
    scheduledStart: '',
    scheduledEnd: '',
    appointmentType: 'General Checkup',
    reason: '',
  });

  const [error, setError] = useState<string | null>(null);
  const [availableSlots, setAvailableSlots] = useState<{start: string, end: string, available: boolean}[]>([]);

  // Availability Query (Only run if provider and date are selected)
  const queryDate = formData.scheduledStart ? formData.scheduledStart.split('T')[0] : '';
  const availabilityQuery = {
    providerId: formData.providerId,
    from: queryDate ? `${queryDate}T00:00:00Z` : '',
    to: queryDate ? `${queryDate}T23:59:59Z` : ''
  };

  const { data: availabilityData, isLoading: isLoadingAvailability } = useAvailability(availabilityQuery);

  // Update available slots when data changes
  useEffect(() => {
    if (availabilityData) {
      setAvailableSlots(availabilityData);
    } else {
      setAvailableSlots([]);
    }
  }, [availabilityData]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    setError(null); // Clear error on change
  };

  const handleSlotSelect = (start: string, end: string) => {
    setFormData(prev => ({ ...prev, scheduledStart: start, scheduledEnd: end }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // Validation (OWASP: Input Validation)
    if (!formData.patientId || !formData.providerId || !formData.scheduledStart || !formData.scheduledEnd) {
      setError('Please fill in all required fields.');
      return;
    }
    if (new Date(formData.scheduledStart) >= new Date(formData.scheduledEnd)) {
      setError('End time must be after start time.');
      return;
    }

    createMutation.mutate(formData, {
      onSuccess: () => {
        navigate('/appointments');
      },
      onError: (err: any) => {
        setError(err?.response?.data?.message || 'Failed to create appointment. Please try again.');
      }
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 flex items-center gap-4">
          <button onClick={() => navigate('/appointments')} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Schedule Appointment</h1>
            <p className="text-sm text-gray-500 mt-1">Create a new visit for a patient.</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <form onSubmit={handleSubmit} className="p-6 sm:p-8 space-y-8">
            
            {error && (
              <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-3">
                <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
                <p className="text-sm text-red-700">{error}</p>
              </div>
            )}

            {/* Section: Participants */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Participants</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Patient ID <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <User className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text" name="patientId" value={formData.patientId} onChange={handleChange} required
                      placeholder="e.g. PAT-12345"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Provider ID <span className="text-red-500">*</span></label>
                  <div className="relative">
                    <Stethoscope className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                    <input
                      type="text" name="providerId" value={formData.providerId} onChange={handleChange} required
                      placeholder="e.g. DOC-789"
                      className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                    />
                  </div>
                </div>
              </div>
            </div>

            {/* Section: Schedule */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Schedule</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date <span className="text-red-500">*</span></label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
                  <input
                    type="date" 
                    value={queryDate} 
                    onChange={(e) => {
                      // Clear selected time if date changes
                      setFormData(prev => ({ ...prev, scheduledStart: e.target.value ? `${e.target.value}T00:00:00` : '', scheduledEnd: '' }));
                    }}
                    required
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>

              {/* Time Slots (Only show if date and provider are selected) */}
              {queryDate && formData.providerId && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Available Time Slots <span className="text-red-500">*</span></label>
                  
                  {isLoadingAvailability ? (
                    <div className="flex items-center gap-2 text-sm text-gray-500 py-2">
                      <Loader2 className="w-4 h-4 animate-spin" /> Checking availability...
                    </div>
                  ) : availableSlots.length === 0 ? (
                    <div className="text-sm text-amber-600 bg-amber-50 p-3 rounded-lg border border-amber-200">
                      No availability found for this provider on the selected date.
                    </div>
                  ) : (
                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      {availableSlots.map((slot, idx) => {
                        const isSelected = formData.scheduledStart === slot.start;
                        return (
                          <button
                            key={idx}
                            type="button"
                            disabled={!slot.available}
                            onClick={() => handleSlotSelect(slot.start, slot.end)}
                            className={`py-2 px-3 text-sm rounded-lg border transition-colors ${
                              isSelected 
                                ? 'bg-indigo-600 text-white border-indigo-600 font-medium' 
                                : slot.available 
                                  ? 'bg-white text-gray-700 border-gray-300 hover:border-indigo-500' 
                                  : 'bg-gray-100 text-gray-400 border-gray-200 cursor-not-allowed'
                            }`}
                          >
                            {slot.start.split('T')[1].substring(0, 5)} - {slot.end.split('T')[1].substring(0, 5)}
                          </button>
                        );
                      })}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Section: Clinical Details */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-900 border-b pb-2">Clinical Details</h2>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Appointment Type</label>
                <select
                  name="appointmentType"
                  value={formData.appointmentType}
                  onChange={handleChange}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                >
                  <option value="General Checkup">General Checkup</option>
                  <option value="Consultation">Consultation</option>
                  <option value="Follow-up">Follow-up</option>
                  <option value="Urgent Care">Urgent Care</option>
                  <option value="Procedure">Procedure</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason for Visit</label>
                <div className="relative">
                  <FileText className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
                  <textarea
                    name="reason"
                    value={formData.reason}
                    onChange={handleChange}
                    rows={3}
                    placeholder="Brief description of the patient's symptoms or reason..."
                    className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
                  />
                </div>
              </div>
            </div>

            {/* Form Actions */}
            <div className="pt-4 border-t border-gray-200 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={() => navigate('/appointments')}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={createMutation.isPending}
                className="inline-flex items-center px-6 py-2 text-sm font-medium text-white bg-indigo-600 border border-transparent rounded-md hover:bg-indigo-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 disabled:opacity-50"
              >
                {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <CheckCircle2 className="w-4 h-4 mr-2" />}
                Schedule Appointment
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  );
};

export default AppointmentCreatePage;