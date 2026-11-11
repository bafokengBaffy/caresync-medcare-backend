import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  Calendar,
  FileText,
  CreditCard,
  Activity,
  ChevronRight,
  Search
} from 'lucide-react';
import { format } from 'date-fns';

const PatientTimelinePage = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();

  // Mock Timeline Data (aggregated from various services)
  const timelineEvents = [
    { id: '1', type: 'APPOINTMENT', title: 'Annual Physical Exam', date: '2023-10-25T10:00:00Z', description: 'Dr. Smith', icon: Calendar, color: 'blue' },
    { id: '2', type: 'NOTE', title: 'Clinical Note Added', date: '2023-10-25T11:30:00Z', description: 'SOAP note for annual physical.', icon: FileText, color: 'indigo' },
    { id: '3', type: 'BILLING', title: 'Invoice #INV-2023-104', date: '2023-10-25T12:00:00Z', description: 'Amount: $150.00 (Paid)', icon: CreditCard, color: 'emerald' },
    { id: '4', type: 'APPOINTMENT', title: 'Follow-up Consultation', date: '2023-11-15T14:00:00Z', description: 'Dr. Smith', icon: Calendar, color: 'blue' },
    { id: '5', type: 'SYSTEM', title: 'Patient Profile Updated', date: '2023-11-01T09:15:00Z', description: 'Phone number changed.', icon: Activity, color: 'gray' },
  ].sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  const getColorClasses = (color: string) => {
    switch(color) {
      case 'blue': return 'bg-blue-100 text-blue-600 border-blue-200';
      case 'indigo': return 'bg-indigo-100 text-indigo-600 border-indigo-200';
      case 'emerald': return 'bg-emerald-100 text-emerald-600 border-emerald-200';
      default: return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-white border-b border-gray-200 px-6 py-6 sticky top-0 z-10">
        <div className="max-w-4xl mx-auto flex items-center gap-4">
          <button onClick={() => navigate(`/patients/${patientId}`)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500">
            <ArrowLeft className="w-5 h-5" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Clock className="w-6 h-6 text-indigo-600" />
              Patient Timeline
            </h1>
            <p className="text-sm text-gray-500 mt-1">Chronological history of all patient interactions.</p>
          </div>
        </div>
      </div>

      <div className="max-w-4xl mx-auto px-6 py-8">
        <div className="mb-6 relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input type="text" placeholder="Search timeline events..." className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-8">
          <div className="relative border-l-2 border-gray-100 ml-4 space-y-8 pb-4">
            {timelineEvents.map(event => {
              const Icon = event.icon;
              return (
                <div key={event.id} className="relative pl-8">
                  {/* Timeline Dot */}
                  <div className={`absolute -left-[17px] top-1 h-8 w-8 rounded-full border-2 border-white flex items-center justify-center ${getColorClasses(event.color)} shadow-sm`}>
                    <Icon className="w-4 h-4" />
                  </div>
                  
                  {/* Event Content */}
                  <div className="bg-gray-50 rounded-lg p-4 border border-gray-100 hover:border-gray-300 transition-colors group cursor-pointer">
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-xs font-bold text-gray-500 uppercase tracking-wider">{event.type}</span>
                      <span className="text-xs text-gray-400 font-medium">{format(new Date(event.date), 'MMM d, yyyy - h:mm a')}</span>
                    </div>
                    <h3 className="text-base font-bold text-gray-900 group-hover:text-indigo-600 transition-colors">{event.title}</h3>
                    <p className="text-sm text-gray-600 mt-1">{event.description}</p>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default PatientTimelinePage;