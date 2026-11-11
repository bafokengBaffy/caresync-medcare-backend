import { useState } from 'react';
import {
  Clock,
  Plus,
  Trash2,
  Save,
  Loader2,
  CalendarDays,
  AlertTriangle,
  CheckCircle2,
  Copy
} from 'lucide-react';

interface TimeBlock {
  id: string;
  dayOfWeek: number; // 0-6 (Sun-Sat)
  startTime: string; // HH:mm
  endTime: string;   // HH:mm
}

const DAYS = ['Sunday', 'Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday'];

const AvailabilityPage = () => {
  const [blocks, setBlocks] = useState<TimeBlock[]>([
    { id: '1', dayOfWeek: 1, startTime: '09:00', endTime: '17:00' },
    { id: '2', dayOfWeek: 2, startTime: '09:00', endTime: '17:00' },
    { id: '3', dayOfWeek: 3, startTime: '09:00', endTime: '17:00' },
    { id: '4', dayOfWeek: 4, startTime: '09:00', endTime: '17:00' },
    { id: '5', dayOfWeek: 5, startTime: '09:00', endTime: '13:00' },
  ]);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const addBlock = (dayOfWeek: number) => {
    const newBlock: TimeBlock = {
      id: Math.random().toString(36).substr(2, 9),
      dayOfWeek,
      startTime: '09:00',
      endTime: '17:00'
    };
    setBlocks([...blocks, newBlock]);
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

  const copyToAllDays = (block: TimeBlock) => {
    const otherDays = [0, 1, 2, 3, 4, 5, 6].filter(d => d !== block.dayOfWeek);
    const newBlocks = otherDays.map(day => ({
      id: Math.random().toString(36).substr(2, 9),
      dayOfWeek: day,
      startTime: block.startTime,
      endTime: block.endTime
    }));
    
    // Remove existing blocks for those days to avoid overlaps
    const filteredBlocks = blocks.filter(b => !otherDays.includes(b.dayOfWeek));
    setBlocks([...filteredBlocks, ...newBlocks]);
    setSaveSuccess(false);
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // API Call
      await new Promise(resolve => setTimeout(resolve, 1000)); // Simulate network request
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 3000); // Hide success message after 3s
    } catch (error) {
      alert('Failed to save availability');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <CalendarDays className="w-6 h-6 text-indigo-600" />
              Manage Availability
            </h1>
            <p className="mt-1 text-sm text-gray-500">Set your standard working hours for patient scheduling.</p>
          </div>
          <div className="mt-4 sm:mt-0 flex items-center gap-3">
            {saveSuccess && (
              <span className="text-sm font-medium text-emerald-600 flex items-center gap-1">
                <CheckCircle2 className="w-4 h-4" /> Saved!
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Schedule
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full px-6 py-8 flex-1">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <div className="p-4 bg-amber-50 border-b border-amber-100 flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              <strong>Note:</strong> These hours define when patients can book appointments. Existing confirmed appointments will not be affected if you remove a time block.
            </p>
          </div>

          <div className="divide-y divide-gray-100">
            {DAYS.map((dayName, index) => {
              const dayBlocks = blocks.filter(b => b.dayOfWeek === index);
              
              return (
                <div key={dayName} className="p-6 flex flex-col sm:flex-row gap-6 hover:bg-gray-50 transition-colors">
                  {/* Day Label */}
                  <div className="w-32 flex-shrink-0 pt-2">
                    <h3 className="text-sm font-bold text-gray-900 uppercase tracking-wide">{dayName}</h3>
                    <p className="text-xs text-gray-500 mt-1">{dayBlocks.length} block(s)</p>
                  </div>

                  {/* Time Blocks */}
                  <div className="flex-1 space-y-3">
                    {dayBlocks.length === 0 ? (
                      <div className="flex items-center gap-4 py-2">
                        <span className="text-sm text-gray-400 italic">Unavailable all day</span>
                        <button onClick={() => addBlock(index)} className="text-xs font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1 bg-indigo-50 px-2 py-1 rounded">
                          <Plus className="w-3 h-3" /> Add Hours
                        </button>
                      </div>
                    ) : (
                      dayBlocks.map(block => (
                        <div key={block.id} className="flex flex-wrap items-center gap-3 bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                          <div className="flex items-center gap-2">
                            <Clock className="w-4 h-4 text-gray-400" />
                            <input
                              type="time"
                              value={block.startTime}
                              onChange={(e) => updateBlock(block.id, 'startTime', e.target.value)}
                              className="text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 p-1.5 border"
                            />
                            <span className="text-gray-400 text-sm">to</span>
                            <input
                              type="time"
                              value={block.endTime}
                              onChange={(e) => updateBlock(block.id, 'endTime', e.target.value)}
                              className="text-sm border-gray-300 rounded-md focus:ring-indigo-500 focus:border-indigo-500 p-1.5 border"
                            />
                          </div>
                          
                          <div className="flex items-center gap-1 ml-auto">
                            <button 
                              onClick={() => copyToAllDays(block)}
                              className="p-1.5 text-gray-400 hover:text-indigo-600 hover:bg-indigo-50 rounded transition-colors"
                              title="Apply to all days"
                            >
                              <Copy className="w-4 h-4" />
                            </button>
                            <button 
                              onClick={() => removeBlock(block.id)}
                              className="p-1.5 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors"
                              title="Remove block"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      ))
                    )}
                    
                    {dayBlocks.length > 0 && (
                      <button onClick={() => addBlock(index)} className="text-xs font-medium text-gray-500 hover:text-gray-800 flex items-center gap-1 mt-2">
                        <Plus className="w-3 h-3" /> Add another block
                      </button>
                    )}
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

export default AvailabilityPage;