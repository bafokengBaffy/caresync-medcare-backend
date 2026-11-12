import { useState } from 'react';
import {
  Key,
  Plus,
  Trash2,
  Copy,
  Eye,
  EyeOff,
  AlertTriangle,
  CheckCircle2,
  ShieldCheck,
  RotateCcw,
  Loader2,
} from 'lucide-react';
import { format } from 'date-fns';

interface ApiKey {
  id: string;
  name: string;
  key: string;
  createdAt: string;
  lastUsed: string;
  scope: string[];
}

const ApiKeysPage = () => {
  const [keys, setKeys] = useState<ApiKey[]>([
    { id: '1', name: 'Production Integration', key: 'sk_live_51Hx...4AbC', createdAt: '2023-09-15T10:00:00Z', lastUsed: '2 hours ago', scope: ['READ_PATIENTS', 'READ_APPOINTMENTS'] },
    { id: '2', name: 'Mobile App (Staging)', key: 'sk_test_74Yz...9XyZ', createdAt: '2023-10-01T14:30:00Z', lastUsed: 'Yesterday', scope: ['FULL_ACCESS'] },
  ]);

  const [isGenerating, setIsGenerating] = useState(false);
  const [newKeyName, setNewKeyName] = useState('');
  const [showNewKeyModal, setShowNewKeyModal] = useState(false);
  const [revealedKeys, setRevealedKeys] = useState<Record<string, boolean>>({});
  const [copiedId, setCopiedId] = useState<string | null>(null);

  const toggleReveal = (id: string) => {
    setRevealedKeys(prev => ({ ...prev, [id]: !prev[id] }));
  };

  const handleCopy = (id: string, key: string) => {
    navigator.clipboard.writeText(key);
    setCopiedId(id);
    setTimeout(() => setCopiedId(null), 2000);
  };

  const handleGenerate = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newKeyName) return;
    setIsGenerating(true);
    await new Promise(r => setTimeout(r, 1000));

    const newKey: ApiKey = {
      id: Math.random().toString(),
      name: newKeyName,
      key: `sk_live_${Math.random().toString(36).substring(2, 10)}...${Math.random().toString(36).substring(2, 6)}`,
      createdAt: new Date().toISOString(),
      lastUsed: 'Never',
      scope: ['FULL_ACCESS']
    };

    setKeys([...keys, newKey]);
    setIsGenerating(false);
    setShowNewKeyModal(false);
    setNewKeyName('');
  };

  const handleRevoke = (id: string) => {
    if (!confirm('Are you sure you want to revoke this API key? Any integrations using it will stop working immediately.')) return;
    setKeys(prev => prev.filter(k => k.id !== id));
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Key className="w-6 h-6 text-indigo-600" />
              API Keys
            </h1>
            <p className="mt-1 text-sm text-gray-500">Manage programmatic access to your CareSync data.</p>
          </div>
          <button onClick={() => setShowNewKeyModal(true)} className="inline-flex items-center px-4 py-2 bg-indigo-600 text-white rounded-md text-sm font-medium hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" /> Generate New Key
          </button>
        </div>

        <div className="p-4 bg-amber-50 border border-amber-200 rounded-xl flex items-start gap-3">
          <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
          <div>
            <h3 className="text-sm font-bold text-amber-900">Security Notice (OWASP A02)</h3>
            <p className="text-sm text-amber-800 mt-1">Treat API keys like passwords. Never commit them to version control or expose them in frontend code. Rotate keys immediately if you suspect a leak.</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <ul className="divide-y divide-gray-200">
            {keys.map(key => (
              <li key={key.id} className="p-6">
                <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-base font-bold text-gray-900">{key.name}</h3>
                      <span className="text-[10px] uppercase font-bold bg-indigo-50 text-indigo-700 px-2 py-0.5 rounded border border-indigo-100 flex items-center gap-1"><ShieldCheck className="w-3 h-3" /> {key.scope[0]?.replace('_', ' ') ?? 'Access'}</span>
                    </div>
                    <div className="flex flex-wrap items-center gap-x-4 gap-y-1 mt-1 text-xs text-gray-500">
                      <span>Created: {format(new Date(key.createdAt), 'MMM d, yyyy')}</span>
                      <span>Last used: {key.lastUsed}</span>
                    </div>
                    <div className="mt-3 flex items-center gap-2 max-w-lg">
                      <code className="flex-1 px-3 py-1.5 bg-gray-900 text-gray-300 rounded font-mono text-xs truncate">
                        {revealedKeys[key.id] ? key.key : '••••••••••••••••••••••••••••••••'}
                      </code>
                      <button onClick={() => toggleReveal(key.id)} className="p-1.5 text-gray-400 hover:text-gray-600 rounded hover:bg-gray-100" title="Reveal">
                        {revealedKeys[key.id] ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                      </button>
                      <button onClick={() => handleCopy(key.id, key.key)} className="p-1.5 text-gray-400 hover:text-indigo-600 rounded hover:bg-indigo-50" title="Copy">
                        {copiedId === key.id ? <CheckCircle2 className="w-4 h-4 text-emerald-600" /> : <Copy className="w-4 h-4" />}
                      </button>
                    </div>
                  </div>
                  <div className="flex gap-2 self-end sm:self-center">
                    <button className="p-2 text-gray-400 hover:text-amber-600 hover:bg-amber-50 rounded transition-colors" title="Rotate Key"><RotateCcw className="w-5 h-5" /></button>
                    <button onClick={() => handleRevoke(key.id)} className="p-2 text-gray-400 hover:text-red-600 hover:bg-red-50 rounded transition-colors" title="Revoke Key"><Trash2 className="w-5 h-5" /></button>
                  </div>
                </div>
              </li>
            ))}
            {keys.length === 0 && (
              <li className="p-12 text-center text-gray-500">
                <Key className="w-12 h-12 mx-auto mb-3 text-gray-300" />
                <p>No API keys yet. Generate one to get started.</p>
              </li>
            )}
          </ul>
        </div>
      </div>

      {showNewKeyModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-500 bg-opacity-75">
          <div className="bg-white rounded-xl max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-bold text-gray-900 mb-2">Generate New API Key</h3>
            <p className="text-sm text-gray-500 mb-4">Give your key a descriptive name (e.g., "Production Backend").</p>
            <form onSubmit={handleGenerate}>
              <input type="text" value={newKeyName} onChange={(e) => setNewKeyName(e.target.value)} placeholder="e.g. Zapier Integration" required className="w-full px-3 py-2 border border-gray-300 rounded-lg sm:text-sm mb-4" />
              <div className="flex justify-end gap-3">
                <button type="button" onClick={() => setShowNewKeyModal(false)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
                <button type="submit" disabled={isGenerating} className="inline-flex items-center px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 disabled:opacity-50">
                  {isGenerating ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null} Generate Key
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default ApiKeysPage;
