import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  Clock,
  User,
  Loader2,
  Plus,
  CalendarX
} from 'lucide-react';
import { format, startOfWeek, addDays } from 'date-fns';

const ProviderSchedulePage = () => {
  const { providerId } = useParams<{ providerId: string }>();
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());

  const weekStart = startOfWeek(currentDate, { weekStartsOn: 1 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  // Mock schedule data
  const appointments = [
    { id: '1', day: 1, startTime: '09:00', endTime: '09:30', patientName: 'John Doe', type: 'General Checkup' },
    { id: '2', day: 1, startTime: '10:00', endTime: '10:30', patientName: 'Jane Smith', type: 'Follow-up' },
    { id: '3', day: 2, startTime: '14:00', endTime: '14:30', patientName: 'Alice Johnson', type: 'Consultation' },
    { id: '4', day: 4, startTime: '11:00', endTime: '12:00', patientName: 'Bob Brown', type: 'Procedure' },
  ];

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-white border-b border-gray-200 px-6 py-6 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(`/providers/${providerId}`)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><ArrowLeft className="w-5 h-5" /></button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <CalendarIcon className="w-6 h-6 text-indigo-600" />
                Provider Schedule
              </h1>
              <p className="text-sm text-gray-500 mt-1">{format(weekStart, 'MMMM d')} - {format(addDays(weekStart, 6), 'MMMM d, yyyy')}</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-gray-100 rounded-md p-1">
              <button onClick={() => setCurrentDate(addDays(currentDate, -7))} className="p-1.5 hover:bg-white rounded text-gray-600"><ChevronLeft className="w-5 h-5" /></button>
              <button onClick={() => setCurrentDate(new Date())} className="px-3 py-1 text-sm font-medium text-gray-700 hover:bg-white rounded">Today</button>
              <button onClick={() => setCurrentDate(addDays(currentDate, 7))} className="p-1.5 hover:bg-white rounded text-gray-600"><ChevronRight className="w-5 h-5" /></button>
            </div>
            <button onClick={() => navigate('/appointments/create')} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" /> Block Time
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
            {weekDays.map((day, i) => (
              <div key={i} className="py-3 px-2 text-center border-r border-gray-200 last:border-r-0">
                <p className="text-xs font-medium uppercase tracking-wider text-gray-500">{format(day, 'EEE')}</p>
                <p className="mt-1 text-xl font-bold text-gray-900">{format(day, 'd')}</p>
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 min-h-[500px]">
            {weekDays.map((day, i) => {
              const dayAppts = appointments.filter(a => a.day === i);
              return (
                <div key={i} className="border-r border-gray-200 last:border-r-0 p-2 space-y-2 bg-white">
                  {dayAppts.length === 0 ? (
                    <div className="h-full flex items-center justify-center text-xs text-gray-300 italic">Available</div>
                  ) : (
                    dayAppts.map(appt => (
                      <div key={appt.id} className="p-2 rounded border-l-4 border-indigo-500 bg-indigo-50 text-xs cursor-pointer hover:shadow-md">
                        <p className="font-bold text-indigo-800">{appt.startTime} - {appt.endTime}</p>
                        <p className="font-medium text-gray-900 mt-1 flex items-center gap-1"><User className="w-3 h-3" /> {appt.patientName}</p>
                        <p className="text-gray-600 mt-1">{appt.type}</p>
                      </div>
                    ))
                  )}
                </div>
              );
            })}
          </div>
        </div>
      </div>
    </div>
  );
};

export default ProviderSchedulePage;