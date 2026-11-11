import { useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Clock,
  Plus,
  Trash2,
  Save,
  Loader2,
  CalendarDays,
  CheckCircle2,
  Copy
} from 'lucide-react';

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

interface TimeBlock { id: string; dayOfWeek: number; startTime: string; endTime: string; }

const ProviderAvailabilityPage = () => {
  const { providerId } = useParams<{ providerId: string }>();
  const navigate = useNavigate();
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const [blocks, setBlocks] = useState<TimeBlock[]>([
    { id: '1', dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
    { id: '2', dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
    { id: '3', dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
    { id: '4', dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
    { id: '5', dayOfWeek: 5, startTime: '09:00', endTime: '13:00' },
  ]);

  const addBlock = (day: number) => {
    setBlocks([...blocks, { id: Math.random().toString(), dayOfWeek: day, startTime: '09:00', endTime: '17:00' }]);
    setSaveSuccess(false);
  };

  const removeBlock = (id: string) => {
    setBlocks(blocks.filter(b => b.id !== id));
    setSaveSuccess(false);
  };

  const updateBlock = (id: string, field: 'startTime' | 'endTime', value: string) => {
    setBlocks(blocks.map(b => b.id === id ? { ...b, [field]: value } : b));
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(r => setTimeout(r, 800));
    setSaveSuccess(true);
    setIsSaving(false);
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-white border-b border-gray-200 px-6 py-6 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(`/providers/${providerId}`)} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><ArrowLeft className="w-5 h-5" /></button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <CalendarDays className="w-6 h-6 text-indigo-600" />
                Provider Availability
              </h1>
              <p className="text-sm text-gray-500 mt-1">Configure weekly working hours for scheduling.</p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {saveSuccess && <span className="text-sm font-medium text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Saved!</span>}
            <button onClick={handleSave} disabled={isSaving} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save Schedule
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 divide-y divide-gray-100">
          {DAYS.map((dayName, index) => {
            const dayBlocks = blocks.filter(b => b.dayOfWeek === index);
            return (
              <div key={dayName} className="p-6 flex flex-col sm:flex-row gap-6 hover:bg-gray-50">
                <div className="w-32 flex-shrink-0 pt-2">
                  <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">{dayName}</h3>
                  <p className="text-xs text-gray-500 mt-1">{dayBlocks.length} block(s)</p>
                </div>
                <div className="flex-1 space-y-3">
                  {dayBlocks.length === 0 ? (
                    <div className="flex items-center gap-4 py-2">
                      <span className="text-sm text-gray-400 italic">Unavailable</span>
                      <button onClick={() => addBlock(index)} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded">
                        <Plus className="w-3 h-3" /> Add Hours
                      </button>
                    </div>
                  ) : (
                    dayBlocks.map(block => (
                      <div key={block.id} className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                        <div className="flex items-center gap-2">
                          <Clock className="w-4 h-4 text-gray-400" />
                          <input type="time" value={block.startTime} onChange={(e) => updateBlock(block.id, 'startTime', e.target.value)} className="text-sm border-gray-300 rounded-md p-1.5 border" />
                          <span className="text-gray-400 text-sm">to</span>
                          <input type="time" value={block.endTime} onChange={(e) => updateBlock(block.id, 'endTime', e.target.value)} className="text-sm border-gray-300 rounded-md p-1.5 border" />
                        </div>
                        <button onClick={() => removeBlock(block.id)} className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded ml-auto" title="Remove"><Trash2 className="w-4 h-4" /></button>
                      </div>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

export default ProviderAvailabilityPage;