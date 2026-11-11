import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Search,
  Filter,
  FileText,
  User,
  Calendar,
  Eye,
  Download,
  AlertTriangle,
  Loader2,
  ChevronLeft,
  ChevronRight
} from 'lucide-react';
import { format } from 'date-fns';
// Assuming a generic search hook exists
import { useNotes } from '@/hooks/use-notes';

const NoteSearchPage = () => {
  const navigate = useNavigate();
  const [query, setQuery] = useState('');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [isFilterOpen, setIsFilterOpen] = useState(false);
  const [page, setPage] = useState(0);

  const { data, isLoading, isError } = useNotes({
    page,
    size: 10,
    search: query,
    // Add startDate, endDate, and diagnosis to params if your backend supports it
  });

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="max-w-5xl mx-auto">
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <Search className="w-6 h-6 text-indigo-600" />
            Clinical Note Search
          </h1>
          <p className="mt-1 text-sm text-gray-500">Full-text search across patient histories and SOAP notes.</p>
          
          <div className="mt-6 flex flex-col sm:flex-row gap-3">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
              <input
                type="text"
                placeholder="Search diagnoses, symptoms, or note content..."
                value={query}
                onChange={(e) => { setQuery(e.target.value); setPage(0); }}
                className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
              />
            </div>
            <button 
              onClick={() => setIsFilterOpen(!isFilterOpen)}
              className={`inline-flex items-center px-4 py-3 border rounded-lg shadow-sm text-sm font-medium transition-colors ${
                isFilterOpen ? 'bg-indigo-50 border-indigo-200 text-indigo-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <Filter className="w-4 h-4 mr-2" /> Filters
            </button>
          </div>

          {isFilterOpen && (
            <div className="mt-4 p-4 bg-gray-50 rounded-lg border border-gray-200 grid grid-cols-1 sm:grid-cols-2 gap-4 animate-in slide-in-from-top-2">
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">From Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="date" value={startDate} onChange={(e) => setStartDate(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm" />
                </div>
              </div>
              <div>
                <label className="block text-xs font-medium text-gray-700 mb-1">To Date</label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <input type="date" value={endDate} onChange={(e) => setEndDate(e.target.value)} className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm" />
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      <div className="max-w-5xl mx-auto w-full px-6 py-8 flex-1">
        {isLoading ? (
          <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
        ) : isError ? (
          <div className="p-12 text-center text-red-500"><AlertTriangle className="w-12 h-12 mx-auto mb-4" />Error running search.</div>
        ) : !data?.content || data.content.length === 0 ? (
          <div className="p-12 text-center bg-white rounded-xl border border-gray-200 shadow-sm">
            <FileText className="w-12 h-12 text-gray-300 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900">No notes found</h3>
            <p className="text-sm text-gray-500 mt-1">Try adjusting your search terms or date filters.</p>
          </div>
        ) : (
          <div className="space-y-4">
            {data.content.map((note: any) => (
              <div key={note.id} className="bg-white p-6 rounded-xl border border-gray-200 shadow-sm hover:shadow-md transition-shadow flex flex-col sm:flex-row gap-4 justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-2">
                    <span className="text-xs font-bold text-indigo-700 bg-indigo-50 px-2 py-0.5 rounded uppercase">Clinical Note</span>
                    <span className="text-xs text-gray-500 flex items-center gap-1"><Calendar className="w-3 h-3" /> {format(new Date(note.createdAt), 'MMM d, yyyy')}</span>
                  </div>
                  <h3 className="text-lg font-bold text-gray-900 mb-1">{note.title}</h3>
                  <div className="flex items-center gap-3 text-sm text-gray-600 mb-3">
                    <span className="flex items-center gap-1"><User className="w-4 h-4" /> {note.patientName || note.patientId}</span>
                  </div>
                  <p className="text-sm text-gray-500 line-clamp-2">
                    {note.soapData?.assessment || 'No assessment snippet available.'}
                  </p>
                </div>
                <div className="flex sm:flex-col items-center justify-end gap-2 sm:border-l sm:pl-4 border-gray-100">
                  <button onClick={() => navigate(`/clinical-notes/${note.id}`)} className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-indigo-700 bg-indigo-50 rounded hover:bg-indigo-100 transition-colors">
                    <Eye className="w-4 h-4 mr-2" /> View
                  </button>
                  <button className="flex items-center justify-center w-full px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded hover:bg-gray-50 transition-colors">
                    <Download className="w-4 h-4 mr-2" /> Export
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
        
        {/* Pagination */}
        {data?.content && data.content.length > 0 && (
          <div className="mt-6 flex items-center justify-between border-t border-gray-200 pt-4">
            <p className="text-sm text-gray-700">Page <span className="font-medium">{page + 1}</span> of <span className="font-medium">{data.totalPages || 1}</span></p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium bg-white hover:bg-gray-50 disabled:opacity-50">
                <ChevronLeft className="w-4 h-4" />
              </button>
              <button onClick={() => setPage(p => Math.min((data.totalPages || 1) - 1, p + 1))} disabled={page >= (data.totalPages || 1) - 1} className="px-3 py-1.5 border border-gray-300 rounded-md text-sm font-medium bg-white hover:bg-gray-50 disabled:opacity-50">
                <ChevronRight className="w-4 h-4" />
              </button>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default NoteSearchPage;