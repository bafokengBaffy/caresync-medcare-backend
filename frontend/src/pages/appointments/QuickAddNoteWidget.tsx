import { useState } from 'react';
import {
  X,
  Save,
  Loader2,
  FilePlus2,
  AlertCircle
} from 'lucide-react';
import { useCreateNote } from '@/hooks/use-notes';

interface QuickAddNoteWidgetProps {
  patientId: string;
  providerId: string;
  onClose: () => void;
  onSuccess?: () => void;
}

const QuickAddNoteWidget = ({ patientId, providerId, onClose, onSuccess }: QuickAddNoteWidgetProps) => {
  const createMutation = useCreateNote();
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [error, setError] = useState<string | null>(null);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim() || !content.trim()) {
      setError('Title and content are required.');
      return;
    }

    // A quick add typically goes into the "Subjective/Objective" field
    // depending on the clinic's workflow. We'll put it in Subjective for this example.
    const payload = {
      patientId,
      providerId,
      title,
      soapData: {
        subjective: content,
        objective: '',
        assessment: '',
        plan: ''
      }
    };

    createMutation.mutate(payload, {
      onSuccess: () => {
        if (onSuccess) onSuccess();
        onClose();
      },
      onError: (err: any) => setError(err?.message || 'Failed to save quick note.')
    });
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-900 bg-opacity-50 backdrop-blur-sm">
      <div className="bg-white rounded-xl shadow-2xl w-full max-w-lg overflow-hidden animate-in zoom-in-95">
        <div className="px-6 py-4 border-b border-gray-100 flex justify-between items-center bg-gray-50">
          <h3 className="text-lg font-bold text-gray-900 flex items-center gap-2">
            <FilePlus2 className="w-5 h-5 text-indigo-600" />
            Quick Add Note
          </h3>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSave} className="p-6 space-y-4">
          {error && (
            <div className="p-3 bg-red-50 text-red-700 text-sm rounded flex items-start gap-2">
              <AlertCircle className="w-4 h-4 mt-0.5 flex-shrink-0" />
              {error}
            </div>
          )}
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Phone call follow-up"
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Note Content</label>
            <textarea
              value={content}
              onChange={(e) => setContent(e.target.value)}
              rows={5}
              placeholder="Type your quick note here..."
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
            />
          </div>

          <div className="pt-4 border-t border-gray-100 flex justify-end gap-3">
            <button type="button" onClick={onClose} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">
              Cancel
            </button>
            <button type="submit" disabled={createMutation.isPending} className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50">
              {createMutation.isPending ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Note
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default QuickAddNoteWidget;