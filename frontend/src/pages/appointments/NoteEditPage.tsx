import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Save,
  Loader2,
  AlertCircle,
  ShieldAlert,
  FileSignature,
  History
} from 'lucide-react';
import { useNote, useUpdateNote } from '@/hooks/use-notes';
import type { ClinicalNoteUpdatePayload } from '@/types/clinical-note';

const NoteEditPage = () => {
  const { noteId } = useParams<{ noteId: string }>();
  const navigate = useNavigate();
  
  const { data: note, isLoading: isLoadingNote } = useNote(noteId!);
  const updateMutation = useUpdateNote();

  const [formData, setFormData] = useState<ClinicalNoteUpdatePayload>({
    title: '',
    soapData: { subjective: '', objective: '', assessment: '', plan: '' }
  });
  
  const [addendum, setAddendum] = useState('');
  const [showAddendum, setShowAddendum] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Populate form when data loads
  useEffect(() => {
    if (note) {
      setFormData({
        title: note.title || '',
        soapData: note.soapData || { subjective: '', objective: '', assessment: '', plan: '' }
      });
    }
  }, [note]);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    if (name.includes('.')) {
      const [parent, child] = name.split('.');
      setFormData(prev => ({
        ...prev,
        [parent]: { ...(prev as any)[parent], [child]: value }
      }));
    } else {
      setFormData(prev => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    // OWASP: Data Integrity Check
    if (!formData.title) {
      setError('Title cannot be empty.');
      return;
    }

    const payload = {
      ...formData,
      ...(showAddendum && addendum ? { addendum } : {})
    };

    updateMutation.mutate({ id: noteId!, data: payload }, {
      onSuccess: () => navigate(`/clinical-notes/${noteId}`),
      onError: (err: any) => setError(err?.message || 'Failed to update note.')
    });
  };

  if (isLoadingNote) return <div className="min-h-screen flex items-center justify-center bg-gray-50"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>;

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto">
        <div className="mb-8 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate(-1)} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
              <ArrowLeft className="w-5 h-5 text-gray-600" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <FileSignature className="w-6 h-6 text-indigo-600" />
                Amend Clinical Note
              </h1>
              <p className="text-sm text-gray-500 mt-1">Editing existing SOAP record. Changes are audited.</p>
            </div>
          </div>
          <button 
            onClick={() => setShowAddendum(!showAddendum)}
            className={`inline-flex items-center px-3 py-1.5 rounded-md text-sm font-medium border transition-colors ${
              showAddendum ? 'bg-amber-50 border-amber-200 text-amber-700' : 'bg-white border-gray-300 text-gray-700 hover:bg-gray-50'
            }`}
          >
            <History className="w-4 h-4 mr-2" /> Add Addendum
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          {error && (
            <div className="p-4 bg-red-50 border border-red-200 rounded-md flex items-start gap-3">
              <AlertCircle className="w-5 h-5 text-red-600 flex-shrink-0 mt-0.5" />
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {/* Warning Banner */}
          <div className="p-4 bg-amber-50 border border-amber-200 rounded-md flex items-start gap-3">
            <ShieldAlert className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-amber-800">
              <strong>Audit Notice:</strong> Modifying a signed clinical note will create a new version in the audit log. 
              {showAddendum ? ' Your additions will be appended as a new timestamped addendum.' : ' Consider using an addendum to preserve the original record.'}
            </p>
          </div>

          {/* Note Content */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sm:p-8">
            <div className="mb-6">
              <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
              <input type="text" name="title" value={formData.title} onChange={handleChange} required className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-medium" />
            </div>

            <div className="space-y-6">
              {['subjective', 'objective', 'assessment', 'plan'].map(field => (
                <div key={field}>
                  <label className="block text-sm font-medium text-gray-700 mb-1 capitalize">{field}</label>
                  <textarea 
                    name={`soapData.${field}`} 
                    value={(formData.soapData as any)[field]} 
                    onChange={handleChange} 
                    rows={3} 
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm" 
                  />
                </div>
              ))}
            </div>
          </div>

          {/* Addendum Section */}
          {showAddendum && (
            <div className="bg-white rounded-xl shadow-sm border border-amber-200 p-6 sm:p-8 animate-in slide-in-from-top-4">
              <h2 className="text-lg font-semibold text-amber-900 mb-2 flex items-center gap-2">
                <History className="w-5 h-5 text-amber-600" />
                Append Addendum
              </h2>
              <p className="text-sm text-amber-700 mb-4">
                This will be appended to the end of the original note with your digital signature and current timestamp.
              </p>
              <textarea
                value={addendum}
                onChange={(e) => setAddendum(e.target.value)}
                rows={4}
                placeholder="Enter the addendum text here (e.g., 'Patient called back with lab results...')"
                className="w-full px-3 py-2 border border-amber-300 rounded-lg focus:ring-amber-500 focus:border-amber-500 sm:text-sm bg-amber-50"
              />
            </div>
          )}

          <div className="flex items-center justify-end gap-4">
            <button type="button" onClick={() => navigate(-1)} className="px-6 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={updateMutation.isPending} className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
              {updateMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default NoteEditPage;