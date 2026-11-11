import { useState, useMemo } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ChevronLeft,
  ChevronRight,
  Calendar as CalendarIcon,
  User,
  Loader2,
  AlertTriangle,
  Plus
} from 'lucide-react';
import { format, startOfWeek, addDays, isSameDay, parseISO } from 'date-fns';
import { useAppointments } from '@/hooks/use-appointments';
import type { Appointment } from '@/types/appointment';

const CalendarPage = () => {
  const navigate = useNavigate();
  const [currentDate, setCurrentDate] = useState(new Date());
  
  // Calculate week start (assuming Sunday start)
  const weekStart = startOfWeek(currentDate, { weekStartsOn: 0 });
  const weekDays = Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));

  // Fetch appointments for the current week
  const { data, isLoading, isError } = useAppointments({
    page: 0,
    size: 100, // Fetch enough for the week
    search: '',
    status: '' // Get all statuses
  });

  const appointments = data?.content || [];

  // Group appointments by day for easier rendering
  const appointmentsByDay = useMemo(() => {
    const map: Record<string, Appointment[]> = {};
    appointments.forEach(appt => {
      const dateStr = format(parseISO(appt.scheduledStart), 'yyyy-MM-dd');
      if (!map[dateStr]) map[dateStr] = [];
      map[dateStr].push(appt);
    });
    return map;
  }, [appointments]);

  const nextWeek = () => setCurrentDate(addDays(currentDate, 7));
  const prevWeek = () => setCurrentDate(addDays(currentDate, -7));
  const goToToday = () => setCurrentDate(new Date());

  // Color mapping based on status
  const getApptColor = (status: string) => {
    switch (status) {
      case 'CONFIRMED': return 'bg-indigo-100 border-indigo-500 text-indigo-800';
      case 'COMPLETED': return 'bg-emerald-100 border-emerald-500 text-emerald-800';
      case 'CANCELLED': return 'bg-red-100 border-red-500 text-red-800 opacity-60 line-through';
      case 'NO_SHOW': return 'bg-amber-100 border-amber-500 text-amber-800';
      default: return 'bg-blue-100 border-blue-500 text-blue-800';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <CalendarIcon className="w-6 h-6 text-indigo-600" />
              Clinical Calendar
            </h1>
            <p className="mt-1 text-sm text-gray-500">Weekly view of all scheduled appointments.</p>
          </div>
          <div className="flex items-center gap-3">
            <div className="flex items-center bg-gray-100 rounded-md p-1 border border-gray-200">
              <button onClick={prevWeek} className="p-1.5 hover:bg-white rounded shadow-sm text-gray-600">
                <ChevronLeft className="w-5 h-5" />
              </button>
              <button onClick={goToToday} className="px-3 py-1 text-sm font-medium text-gray-700 hover:bg-white rounded shadow-sm">
                Today
              </button>
              <button onClick={nextWeek} className="p-1.5 hover:bg-white rounded shadow-sm text-gray-600">
                <ChevronRight className="w-5 h-5" />
              </button>
            </div>
            <button
              onClick={() => navigate('/appointments/new')}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              New Appointment
            </button>
          </div>
        </div>
        <div className="max-w-7xl mx-auto mt-4 text-lg font-semibold text-gray-700">
          {format(weekStart, 'MMMM d')} - {format(addDays(weekStart, 6), 'MMMM d, yyyy')}
        </div>
      </div>

      {/* Calendar Grid */}
      <div className="max-w-7xl mx-auto w-full px-6 py-6 flex-1 flex flex-col">
        {isLoading ? (
          <div className="flex-1 flex justify-center items-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
        ) : isError ? (
          <div className="flex-1 flex flex-col justify-center items-center text-red-500"><AlertTriangle className="w-12 h-12 mb-4" />Error loading calendar data.</div>
        ) : (
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 flex-1 flex flex-col overflow-hidden">
            {/* Days Header */}
            <div className="grid grid-cols-7 border-b border-gray-200 bg-gray-50">
              {weekDays.map((day, i) => {
                const isToday = isSameDay(day, new Date());
                return (
                  <div key={i} className="py-3 px-2 text-center border-r border-gray-200 last:border-r-0">
                    <p className={`text-xs font-medium uppercase tracking-wider ${isToday ? 'text-indigo-600' : 'text-gray-500'}`}>
                      {format(day, 'EEE')}
                    </p>
                    <p className={`mt-1 text-xl font-bold ${isToday ? 'text-indigo-600 bg-indigo-50 w-8 h-8 rounded-full mx-auto flex items-center justify-center' : 'text-gray-900'}`}>
                      {format(day, 'd')}
                    </p>
                  </div>
                );
              })}
            </div>

            {/* Calendar Body */}
            <div className="grid grid-cols-7 flex-1 overflow-y-auto min-h-[500px]">
              {weekDays.map((day, i) => {
                const dateStr = format(day, 'yyyy-MM-dd');
                const dayAppts = appointmentsByDay[dateStr] || [];
                
                return (
                  <div key={i} className="border-r border-gray-200 last:border-r-0 p-2 space-y-2 bg-white min-h-[150px]">
                    {dayAppts.length === 0 ? (
                      <div className="h-full flex items-center justify-center text-xs text-gray-400 italic">
                        No appointments
                      </div>
                    ) : (
                      dayAppts.map(appt => (
                        <div
                          key={appt.id}
                          onClick={() => navigate(`/appointments/${appt.id}`)}
                          className={`p-2 rounded border-l-4 text-xs cursor-pointer hover:shadow-md transition-shadow ${getApptColor(appt.status)}`}
                        >
                          <p className="font-bold mb-1 truncate">
                            {format(parseISO(appt.scheduledStart), 'h:mm a')}
                          </p>
                          <p className="font-medium flex items-center gap-1 truncate">
                            <User className="w-3 h-3" /> {appt.patientName || 'Unknown'}
                          </p>
                          <p className="mt-1 opacity-80 truncate">{appt.appointmentType}</p>
                        </div>
                      ))
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default CalendarPage;