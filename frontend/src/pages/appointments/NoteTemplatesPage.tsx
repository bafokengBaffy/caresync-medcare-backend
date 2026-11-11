import { useState } from 'react';
import {
  FileText,
  Plus,
  Save,
  Trash2,
  Loader2,
  Copy,
  Globe,
  Building2,
  CheckCircle2,
  AlertCircle
} from 'lucide-react';

interface Template {
  id: string;
  name: string;
  scope: 'GLOBAL' | 'TENANT';
  content: {
    subjective: string;
    objective: string;
    assessment: string;
    plan: string;
  };
}

const initialTemplates: Template[] = [
  {
    id: '1', name: 'Standard Annual Physical', scope: 'GLOBAL',
    content: {
      subjective: 'Patient presents for annual physical. No acute complaints.',
      objective: 'Vitals:\nBP: \nHR: \nTemp: \nWeight: ',
      assessment: 'Healthy adult, routine care.',
      plan: 'Routine labs, follow up in 1 year.'
    }
  },
  {
    id: '2', name: 'Urgent Care - Respiratory', scope: 'TENANT',
    content: {
      subjective: 'Patient reports cough, congestion, and shortness of breath.',
      objective: 'Lungs clear to auscultation, slight wheeze. O2 sat 96%.',
      assessment: 'Acute bronchitis.',
      plan: 'Rest, hydration, albuterol inhaler PRN.'
    }
  }
];

const NoteTemplatesPage = () => {
  const [templates, setTemplates] = useState<Template[]>(initialTemplates);
  const [selectedId, setSelectedId] = useState<string>(initialTemplates[0].id);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);

  const selectedTemplate = templates.find(t => t.id === selectedId);

  const handleUpdate = (field: keyof Template['content'], value: string) => {
    setTemplates(prev => prev.map(t => 
      t.id === selectedId ? { ...t, content: { ...t.content, [field]: value } } : t
    ));
    setSaveSuccess(false);
  };

  const handleNameChange = (name: string) => {
    setTemplates(prev => prev.map(t => t.id === selectedId ? { ...t, name } : t));
    setSaveSuccess(false);
  };

  const addTemplate = () => {
    const newTemplate: Template = {
      id: Math.random().toString(36).substr(2, 9),
      name: 'New Template',
      scope: 'TENANT',
      content: { subjective: '', objective: '', assessment: '', plan: '' }
    };
    setTemplates([...templates, newTemplate]);
    setSelectedId(newTemplate.id);
    setSaveSuccess(false);
  };

  const deleteTemplate = (id: string) => {
    if (!confirm('Delete this template?')) return;
    const filtered = templates.filter(t => t.id !== id);
    setTemplates(filtered);
    if (filtered.length > 0) setSelectedId(filtered[0].id);
  };

  const handleSave = async () => {
    setIsSaving(true);
    await new Promise(res => setTimeout(res, 800));
    setSaveSuccess(true);
    setIsSaving(false);
    setTimeout(() => setSaveSuccess(false), 3000);
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Copy className="w-6 h-6 text-indigo-600" />
              SOAP Note Templates
            </h1>
            <p className="mt-1 text-sm text-gray-500">Standardize documentation with reusable clinical templates.</p>
          </div>
          <div className="flex items-center gap-4">
            {saveSuccess && <span className="text-sm font-medium text-emerald-600 flex items-center gap-1"><CheckCircle2 className="w-4 h-4" /> Saved</span>}
            <button onClick={handleSave} disabled={isSaving || !selectedTemplate} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />} Save Template
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-6 py-8 flex-1 flex gap-6">
        {/* Sidebar List */}
        <div className="w-72 flex-shrink-0 flex flex-col gap-3">
          <button onClick={addTemplate} className="w-full flex items-center justify-center gap-2 py-2 border-2 border-dashed border-gray-300 rounded-lg text-sm font-medium text-gray-600 hover:border-indigo-400 hover:text-indigo-600 transition-colors bg-white">
            <Plus className="w-4 h-4" /> New Template
          </button>
          
          <div className="space-y-2 overflow-y-auto flex-1">
            {templates.map(t => (
              <div 
                key={t.id}
                onClick={() => setSelectedId(t.id)}
                className={`p-3 rounded-lg border cursor-pointer transition-all flex items-start justify-between group ${
                  selectedId === t.id ? 'bg-indigo-50 border-indigo-200' : 'bg-white border-gray-200 hover:border-gray-300'
                }`}
              >
                <div>
                  <p className={`text-sm font-medium ${selectedId === t.id ? 'text-indigo-900' : 'text-gray-900'}`}>{t.name}</p>
                  <span className={`inline-flex items-center gap-1 text-[10px] uppercase font-bold mt-1 px-1.5 py-0.5 rounded ${
                    t.scope === 'GLOBAL' ? 'bg-purple-100 text-purple-700' : 'bg-gray-100 text-gray-600'
                  }`}>
                    {t.scope === 'GLOBAL' ? <Globe className="w-2.5 h-2.5" /> : <Building2 className="w-2.5 h-2.5" />} {t.scope}
                  </span>
                </div>
                <button onClick={(e) => { e.stopPropagation(); deleteTemplate(t.id); }} className="text-gray-300 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity">
                  <Trash2 className="w-4 h-4" />
                </button>
              </div>
            ))}
          </div>
        </div>

        {/* Editor Panel */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200 flex flex-col">
          {selectedTemplate ? (
            <>
              <div className="p-6 border-b border-gray-200">
                <label className="block text-xs font-medium text-gray-500 uppercase tracking-wide mb-1">Template Name</label>
                <input 
                  type="text" 
                  value={selectedTemplate.name} 
                  onChange={(e) => handleNameChange(e.target.value)}
                  className="w-full text-lg font-bold text-gray-900 border-none p-0 focus:ring-0 focus:outline-none placeholder-gray-300"
                  placeholder="e.g. New Patient Intake"
                />
              </div>
              <div className="p-6 space-y-6 flex-1 overflow-y-auto">
                {(['subjective', 'objective', 'assessment', 'plan'] as const).map(field => (
                  <div key={field}>
                    <label className="block text-sm font-semibold text-gray-700 capitalize mb-1">{field} Template</label>
                    <textarea 
                      value={selectedTemplate.content[field]} 
                      onChange={(e) => handleUpdate(field, e.target.value)}
                      rows={4}
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm font-mono text-gray-700 bg-gray-50"
                      placeholder={`Enter standard ${field} text...`}
                    />
                  </div>
                ))}
              </div>
            </>
          ) : (
            <div className="flex-1 flex flex-col items-center justify-center text-gray-400">
              <FileText className="w-12 h-12 mb-4" />
              <p>Select a template to edit</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default NoteTemplatesPage;