import { useState } from 'react';
import {
  ShieldCheck,
  Download,
  FileText,
  Trash2,
  AlertTriangle,
  Lock,
  Loader2,
  CheckCircle2
} from 'lucide-react';

const CompliancePage = () => {
  const [isExporting, setIsExporting] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deleteConfirmText, setDeleteConfirmText] = useState('');
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);

  const handleExportData = async () => {
    setIsExporting(true);
    await new Promise(r => setTimeout(r, 2000));
    setIsExporting(false);
    alert('Data export initiated. You will receive an email with a secure download link shortly.');
  };

  const handleDeleteAccount = () => {
    if (deleteConfirmText !== 'DELETE') return;
    setIsDeleting(true);
    setTimeout(() => {
      setIsDeleting(false);
      alert('Account deletion request submitted. Under HIPAA/GDPR, data will be permanently erased in 30 days.');
      setShowDeleteConfirm(false);
    }, 1500);
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-4xl mx-auto space-y-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
            <ShieldCheck className="w-6 h-6 text-indigo-600" />
            Compliance & Privacy
          </h1>
          <p className="mt-1 text-sm text-gray-500">Manage your data rights (GDPR) and HIPAA audit exports.</p>
        </div>

        {/* Data Export */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-blue-50 rounded-lg"><Download className="w-6 h-6 text-blue-600" /></div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">Export My Data</h2>
              <p className="text-sm text-gray-500 mt-1">Download a copy of all your personal data, audit logs, and account metadata in JSON format (GDPR Article 20).</p>
              <button onClick={handleExportData} disabled={isExporting} className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 disabled:opacity-50">
                {isExporting ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Download className="w-4 h-4 mr-2" />}
                Request Data Export
              </button>
            </div>
          </div>
        </div>

        {/* HIPAA Audit Report */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <div className="flex items-start gap-4">
            <div className="p-3 bg-indigo-50 rounded-lg"><FileText className="w-6 h-6 text-indigo-600" /></div>
            <div className="flex-1">
              <h2 className="text-lg font-semibold text-gray-900">HIPAA Access Report</h2>
              <p className="text-sm text-gray-500 mt-1">Generate a report of all system access logs related to your account for compliance auditing.</p>
              <button className="mt-4 inline-flex items-center px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
                <FileText className="w-4 h-4 mr-2" /> Generate HIPAA Report
              </button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-white rounded-xl shadow-sm border border-red-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-red-200 bg-red-50 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-red-600" />
            <h2 className="text-lg font-bold text-red-900">Danger Zone</h2>
          </div>
          <div className="p-6">
            <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
              <div>
                <h3 className="text-sm font-bold text-gray-900">Delete Account (Right to be Forgotten)</h3>
                <p className="text-xs text-gray-500 mt-1 max-w-lg">Permanently delete your account and all associated personal data. Under HIPAA, clinical records are retained for the legally required 7 years (anonymized).</p>
              </div>
              <button onClick={() => setShowDeleteConfirm(true)} className="px-4 py-2 bg-red-600 text-white rounded-md text-sm font-medium hover:bg-red-700 whitespace-nowrap flex items-center gap-2">
                <Trash2 className="w-4 h-4" /> Delete Account
              </button>
            </div>
            
            {showDeleteConfirm && (
              <div className="mt-4 p-4 bg-red-50 rounded-lg border border-red-100 animate-in slide-in-from-top-2">
                <p className="text-sm font-medium text-red-800 mb-2">Type <strong className="font-mono bg-white px-1 rounded">DELETE</strong> to confirm:</p>
                <input type="text" value={deleteConfirmText} onChange={e => setDeleteConfirmText(e.target.value)} className="w-full px-3 py-2 border border-red-300 rounded-md focus:ring-red-500 focus:border-red-500 sm:text-sm mb-3" placeholder="DELETE" />
                <div className="flex justify-end gap-2">
                  <button onClick={() => setShowDeleteConfirm(false)} className="px-3 py-1.5 text-sm font-medium text-gray-600 bg-white border border-gray-300 rounded hover:bg-gray-50">Cancel</button>
                  <button onClick={handleDeleteAccount} disabled={deleteConfirmText !== 'DELETE' || isDeleting} className="inline-flex items-center px-3 py-1.5 text-sm font-medium text-white bg-red-600 rounded hover:bg-red-700 disabled:opacity-50">
                    {isDeleting ? <Loader2 className="w-4 h-4 mr-1 animate-spin" /> : null} Confirm Deletion
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>

      </div>
    </div>
  );
};

export default CompliancePage;