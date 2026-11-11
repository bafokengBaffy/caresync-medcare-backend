import { useState } from 'react';
import {
  Link as LinkIcon,
  Database,
  Server,
  Activity,
  CheckCircle2,
  XCircle,
  Settings2,
  RefreshCw,
  Shield,
  Key,
  AlertTriangle,
  Loader2
} from 'lucide-react';

interface Integration {
  id: string;
  name: string;
  description: string;
  status: 'CONNECTED' | 'DISCONNECTED' | 'ERROR';
  provider: 'Firebase' | 'Supabase' | 'Render' | 'Upstash';
  lastChecked: string;
  docsUrl: string;
}

const initialIntegrations: Integration[] = [
  {
    id: '1', name: 'Firebase Auth', description: 'Identity and access management for all users.', status: 'CONNECTED', provider: 'Firebase', lastChecked: 'Just now', docsUrl: '#'
  },
  {
    id: '2', name: 'Firestore DB', description: 'NoSQL document storage for clinical notes.', status: 'CONNECTED', provider: 'Firebase', lastChecked: '2 mins ago', docsUrl: '#'
  },
  {
    id: '3', name: 'Supabase PostgreSQL', description: 'Relational database for tenants and patients.', status: 'CONNECTED', provider: 'Supabase', lastChecked: 'Just now', docsUrl: '#'
  },
  {
    id: '4', name: 'Render Web Services', description: 'Hosting for the API Gateway and Microservices.', status: 'CONNECTED', provider: 'Render', lastChecked: '5 mins ago', docsUrl: '#'
  },
  {
    id: '5', name: 'Upstash Redis', description: 'Distributed caching and rate limiting.', status: 'CONNECTED', provider: 'Upstash', lastChecked: 'Just now', docsUrl: '#'
  }
];

const IntegrationsPage = () => {
  const [integrations, setIntegrations] = useState<Integration[]>(initialIntegrations);
  const [isTesting, setIsTesting] = useState<string | null>(null);
  const [selectedIntegration, setSelectedIntegration] = useState<Integration | null>(null);

  const testConnection = async (id: string) => {
    setIsTesting(id);
    try {
      // Simulate API ping
      await new Promise(resolve => setTimeout(resolve, 1500));
      setIntegrations(prev => prev.map(int => 
        int.id === id ? { ...int, status: 'CONNECTED', lastChecked: 'Just now' } : int
      ));
    } finally {
      setIsTesting(null);
    }
  };

  const getProviderIcon = (provider: string) => {
    switch (provider) {
      case 'Firebase': return <Activity className="w-6 h-6 text-amber-500" />;
      case 'Supabase': return <Database className="w-6 h-6 text-emerald-500" />;
      case 'Render': return <Server className="w-6 h-6 text-indigo-500" />;
      case 'Upstash': return <Shield className="w-6 h-6 text-red-500" />;
      default: return <LinkIcon className="w-6 h-6 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <LinkIcon className="w-6 h-6 text-indigo-600" />
              System Integrations
            </h1>
            <p className="mt-1 text-sm text-gray-500">Monitor and configure external infrastructure and service connections.</p>
          </div>
          <button className="mt-4 sm:mt-0 inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
            Add Integration
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-6 py-8 flex-1">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {integrations.map((int) => (
            <div key={int.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 flex flex-col transition-all hover:shadow-md">
              <div className="flex items-start justify-between mb-4">
                <div className="flex items-center gap-4">
                  <div className="p-3 bg-gray-50 rounded-xl border border-gray-100">
                    {getProviderIcon(int.provider)}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900">{int.name}</h3>
                    <p className="text-xs text-gray-500 font-medium uppercase tracking-wider">{int.provider}</p>
                  </div>
                </div>
                <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium ${
                  int.status === 'CONNECTED' ? 'bg-emerald-100 text-emerald-800' : 
                  int.status === 'ERROR' ? 'bg-red-100 text-red-800' : 'bg-gray-100 text-gray-800'
                }`}>
                  {int.status === 'CONNECTED' ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                  {int.status}
                </span>
              </div>
              
              <p className="text-sm text-gray-600 mb-6 flex-1">{int.description}</p>
              
              <div className="pt-4 border-t border-gray-100 flex items-center justify-between mt-auto">
                <div className="text-xs text-gray-500 flex items-center gap-1">
                  <RefreshCw className="w-3 h-3" /> Checked: {int.lastChecked}
                </div>
                <div className="flex gap-2">
                  <button 
                    onClick={() => testConnection(int.id)}
                    disabled={isTesting === int.id}
                    className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50"
                  >
                    {isTesting === int.id ? <Loader2 className="w-3 h-3 mr-1 animate-spin" /> : <RefreshCw className="w-3 h-3 mr-1" />}
                    Test
                  </button>
                  <button onClick={() => setSelectedIntegration(int)} className="inline-flex items-center px-3 py-1.5 border border-gray-300 rounded-md text-xs font-medium text-gray-700 bg-white hover:bg-gray-50">
                    <Settings2 className="w-3 h-3 mr-1" /> Config
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Configuration Modal */}
      {selectedIntegration && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-500 bg-opacity-75">
          <div className="bg-white rounded-xl max-w-lg w-full shadow-xl overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200 bg-gray-50 flex justify-between items-center">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
                <Settings2 className="w-5 h-5 text-indigo-600" /> Configure {selectedIntegration.name}
              </h3>
              <button onClick={() => setSelectedIntegration(null)} className="text-gray-400 hover:text-gray-500">
                <XCircle className="w-5 h-5" />
              </button>
            </div>
            <div className="p-6 space-y-4">
              <div className="p-4 bg-amber-50 rounded-lg border border-amber-200 flex gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0" />
                <p className="text-sm text-amber-800">
                  Rotating API keys will immediately invalidate current connections. Ensure you have updated your deployment environment variables.
                </p>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">API Key / Secret</label>
                <div className="flex gap-2">
                  <div className="relative flex-1">
                    <Key className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <input type="password" value="••••••••••••••••••••••••" readOnly className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md bg-gray-50 sm:text-sm" />
                  </div>
                  <button className="px-3 py-2 bg-white border border-gray-300 rounded-md text-sm font-medium text-gray-700 hover:bg-gray-50">Rotate</button>
                </div>
              </div>
            </div>
            <div className="px-6 py-4 border-t border-gray-200 bg-gray-50 flex justify-end gap-3">
              <button onClick={() => setSelectedIntegration(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
              <button onClick={() => setSelectedIntegration(null)} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700">Save Configuration</button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default IntegrationsPage;