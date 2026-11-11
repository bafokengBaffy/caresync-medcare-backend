import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  UploadCloud,
  FileSpreadsheet,
  CheckCircle2,
  AlertTriangle,
  Download,
  Loader2,
  X
} from 'lucide-react';

const PatientImportPage = () => {
  const navigate = useNavigate();
  const [isDragging, setIsDragging] = useState(false);
  const [file, setFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [importStep, setImportStep] = useState<'upload' | 'preview' | 'success'>('upload');

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      setFile(e.dataTransfer.files[0]);
    }
  };

  const handleUpload = () => {
    setIsUploading(true);
    // Simulate upload & parsing delay
    setTimeout(() => {
      setIsUploading(false);
      setImportStep('preview');
    }, 1500);
  };

  const handleConfirmImport = () => {
    setIsUploading(true);
    setTimeout(() => {
      setIsUploading(false);
      setImportStep('success');
    }, 2000);
  };

  const downloadTemplate = () => {
    alert('Downloading CSV template...');
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-3xl mx-auto">
        <div className="mb-8 flex items-center gap-4">
          <button onClick={() => navigate('/patients')} className="p-2 hover:bg-gray-200 rounded-full transition-colors">
            <ArrowLeft className="w-5 h-5 text-gray-600" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <UploadCloud className="w-6 h-6 text-indigo-600" />
              Bulk Import Patients
            </h1>
            <p className="text-sm text-gray-500 mt-1">Upload a CSV file to register multiple patients at once.</p>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {importStep === 'upload' && (
            <div className="p-8 space-y-6">
              <div 
                onDragOver={(e) => { e.preventDefault(); setIsDragging(true); }}
                onDragLeave={() => setIsDragging(false)}
                onDrop={handleDrop}
                className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                  isDragging ? 'border-indigo-500 bg-indigo-50' : 'border-gray-300 hover:border-gray-400 bg-gray-50'
                }`}
              >
                <FileSpreadsheet className="mx-auto h-12 w-12 text-gray-400 mb-4" />
                <p className="text-sm font-medium text-gray-900 mb-1">Drag and drop your CSV file here</p>
                <p className="text-xs text-gray-500 mb-4">or click to browse from your computer</p>
                <input type="file" accept=".csv" className="hidden" id="csv-upload" onChange={(e) => e.target.files && setFile(e.target.files[0])} />
                <label htmlFor="csv-upload" className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer">
                  Select File
                </label>
              </div>

              {file && (
                <div className="flex items-center justify-between p-4 bg-indigo-50 border border-indigo-100 rounded-lg">
                  <div className="flex items-center gap-3">
                    <FileSpreadsheet className="w-6 h-6 text-indigo-600" />
                    <div>
                      <p className="text-sm font-medium text-gray-900">{file.name}</p>
                      <p className="text-xs text-gray-500">{(file.size / 1024).toFixed(1)} KB</p>
                    </div>
                  </div>
                  <button onClick={() => setFile(null)} className="text-gray-400 hover:text-red-500"><X className="w-5 h-5" /></button>
                </div>
              )}

              <div className="flex items-center justify-between pt-6 border-t border-gray-200">
                <button onClick={downloadTemplate} className="text-sm font-medium text-indigo-600 hover:text-indigo-800 flex items-center gap-1">
                  <Download className="w-4 h-4" /> Download CSV Template
                </button>
                <button 
                  onClick={handleUpload} 
                  disabled={!file || isUploading}
                  className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
                >
                  {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  {isUploading ? 'Processing...' : 'Upload & Preview'}
                </button>
              </div>
            </div>
          )}

          {importStep === 'preview' && (
            <div className="p-8 space-y-6">
              <div className="p-4 bg-amber-50 border border-amber-200 rounded-lg flex items-start gap-3">
                <AlertTriangle className="w-5 h-5 text-amber-600 flex-shrink-0 mt-0.5" />
                <div>
                  <h3 className="text-sm font-medium text-amber-800">Review before importing</h3>
                  <p className="text-xs text-amber-700 mt-1">We found 15 valid rows and 2 rows with missing required fields (highlighted in red).</p>
                </div>
              </div>

              <div className="border border-gray-200 rounded-lg overflow-hidden max-h-64 overflow-y-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Status</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">First Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">Last Name</th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500">DOB</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200 text-sm">
                    <tr><td className="px-4 py-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /></td><td className="px-4 py-2">John</td><td className="px-4 py-2">Doe</td><td className="px-4 py-2">1980-01-01</td></tr>
                    <tr className="bg-red-50"><td className="px-4 py-2"><AlertTriangle className="w-4 h-4 text-red-500" /></td><td className="px-4 py-2 text-red-700">Jane</td><td className="px-4 py-2 text-red-700">Smith</td><td className="px-4 py-2 text-red-700">Missing</td></tr>
                    <tr><td className="px-4 py-2"><CheckCircle2 className="w-4 h-4 text-emerald-500" /></td><td className="px-4 py-2">Alice</td><td className="px-4 py-2">Johnson</td><td className="px-4 py-2">1992-05-14</td></tr>
                  </tbody>
                </table>
              </div>

              <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
                <button onClick={() => setImportStep('upload')} className="px-4 py-2 border border-gray-300 rounded-md text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">Back</button>
                <button onClick={handleConfirmImport} disabled={isUploading} className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50">
                  {isUploading ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : null}
                  Confirm Import (15 records)
                </button>
              </div>
            </div>
          )}

          {importStep === 'success' && (
            <div className="p-12 text-center space-y-4">
              <div className="mx-auto h-16 w-16 bg-emerald-100 rounded-full flex items-center justify-center">
                <CheckCircle2 className="h-8 w-8 text-emerald-600" />
              </div>
              <h2 className="text-2xl font-bold text-gray-900">Import Successful</h2>
              <p className="text-sm text-gray-500">Successfully imported 15 patient records into the system.</p>
              <div className="pt-6">
                <button onClick={() => navigate('/patients')} className="inline-flex items-center px-6 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
                  Return to Patient Directory
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientImportPage;