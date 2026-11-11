import { useRef, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { ChangeEvent } from 'react';
import {
  ArrowLeft,
  UploadCloud,
  File,
  FileText,
  Image as ImageIcon,
  Download,
  Trash2,
  Lock,
  Search,
  AlertTriangle,
  Loader2,
  Eye,
  Files,
} from 'lucide-react';
import { format } from 'date-fns';
import { toast } from 'sonner';
import { patientDocumentsApi } from '@/api/patient-documents';
import {
  useDeletePatientDocument,
  usePatientDocuments,
  useUploadPatientDocument,
} from '@/hooks/use-patient-documents';
import type { PatientDocument } from '@/types/patient-document';

const PatientDocumentsPage = () => {
  const { patientId } = useParams<{ patientId: string }>();
  const navigate = useNavigate();
  const fileInput = useRef<HTMLInputElement>(null);
  const [search, setSearch] = useState('');
  const [activeDocumentId, setActiveDocumentId] = useState<string>();
  const { data: documents = [], isLoading, isError } = usePatientDocuments(patientId ?? '');
  const uploadDocument = useUploadPatientDocument(patientId ?? '');
  const deleteDocument = useDeletePatientDocument(patientId ?? '');

  const getFileIcon = (contentType: string) => {
    if (contentType === 'application/pdf')
      return <FileText className="h-8 w-8 text-red-500" aria-hidden="true" />;
    if (contentType.startsWith('image/'))
      return <ImageIcon className="h-8 w-8 text-blue-500" aria-hidden="true" />;
    return <File className="w-8 h-8 text-gray-500" />;
  };

  const isPreviewable = (contentType: string) =>
    [
      'application/pdf',
      'image/jpeg',
      'image/png',
      'image/gif',
      'image/webp',
      'image/avif',
    ].includes(contentType.toLowerCase());

  const filteredDocuments = documents.filter((document) =>
    `${document.fileName} ${document.contentType}`.toLowerCase().includes(search.toLowerCase()),
  );

  const handleFileSelection = (event: ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    event.target.value = '';
    if (!file || !patientId) return;
    if (file.size > 10 * 1024 * 1024) {
      toast.error('Choose a document no larger than 10 MiB.');
      return;
    }
    uploadDocument.mutate(file);
  };

  const handleOpenDocument = async (document: PatientDocument, download: boolean) => {
    const previewWindow = download ? null : window.open('about:blank', '_blank');
    if (!download && !previewWindow) {
      toast.error('Allow pop-ups to preview this document.');
      return;
    }
    if (previewWindow) previewWindow.opener = null;
    setActiveDocumentId(document.id);
    try {
      const blob = await patientDocumentsApi.download(document.mediaUrl);
      const objectUrl = URL.createObjectURL(blob);
      if (download) {
        const anchor = window.document.createElement('a');
        anchor.href = objectUrl;
        anchor.download = document.fileName;
        anchor.click();
      } else {
        if (previewWindow) previewWindow.location.href = objectUrl;
      }
      window.setTimeout(() => URL.revokeObjectURL(objectUrl), 60_000);
    } catch {
      previewWindow?.close();
      toast.error('The document could not be opened.');
    } finally {
      setActiveDocumentId(undefined);
    }
  };

  const handleDeleteDocument = (document: PatientDocument) => {
    if (!patientId || !window.confirm(`Delete ${document.fileName}? This cannot be undone.`))
      return;
    deleteDocument.mutate(document.id);
  };

  const formatBytes = (sizeBytes: number) => {
    if (sizeBytes < 1024) return `${sizeBytes} B`;
    if (sizeBytes < 1024 * 1024) return `${(sizeBytes / 1024).toFixed(1)} KB`;
    return `${(sizeBytes / (1024 * 1024)).toFixed(1)} MB`;
  };

  return (
    <div className="min-h-full bg-gray-50 pb-12">
      <div className="bg-white border-b border-gray-200 px-6 py-6 sticky top-0 z-10">
        <div className="max-w-5xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button
              type="button"
              onClick={() => navigate(`/patients/${patientId}`)}
              aria-label="Back to patient"
              className="p-2 hover:bg-gray-100 rounded-full text-gray-500"
            >
              <ArrowLeft className="h-5 w-5" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Lock className="h-6 w-6 text-indigo-600" aria-hidden="true" />
                Patient Documents
              </h1>
              <p className="text-sm text-gray-500 mt-1">
                Manage documents stored securely in Supabase Storage.
              </p>
            </div>
          </div>
          <div>
            <input
              ref={fileInput}
              type="file"
              className="hidden"
              onChange={handleFileSelection}
              aria-label="Select patient document"
            />
            <button
              type="button"
              onClick={() => fileInput.current?.click()}
              disabled={uploadDocument.isPending || !patientId}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50"
            >
              {uploadDocument.isPending ? (
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              ) : (
                <UploadCloud className="mr-2 h-4 w-4" />
              )}
              Upload Document
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-5xl mx-auto px-6 py-8 space-y-6">
        <div className="p-4 bg-indigo-50 border border-indigo-200 rounded-lg flex items-start gap-3">
          <Lock className="mt-0.5 h-5 w-5 flex-shrink-0 text-indigo-600" aria-hidden="true" />
          <p className="text-sm text-indigo-900">
            Document files are stored in Supabase Storage. CareSync stores their metadata and
            protected media URLs in Postgres; access is tenant-scoped and requires an authorized
            session.
          </p>
        </div>

        <div className="relative">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400"
            aria-hidden="true"
          />
          <input
            type="search"
            value={search}
            onChange={(event) => setSearch(event.target.value)}
            placeholder="Search documents by name or file type..."
            aria-label="Search patient documents"
            className="w-full rounded-md border border-gray-300 bg-white py-2 pl-9 pr-3 text-sm shadow-sm focus:border-indigo-500 focus:ring-indigo-500"
          />
        </div>

        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          {isLoading ? (
            <div
              className="flex items-center justify-center gap-3 p-12 text-sm text-gray-600"
              role="status"
            >
              <Loader2 className="h-5 w-5 animate-spin text-indigo-600" />
              Loading patient documents...
            </div>
          ) : isError ? (
            <div
              className="flex items-center justify-center gap-3 p-12 text-sm text-red-700"
              role="alert"
            >
              <AlertTriangle className="h-5 w-5" />
              Documents could not be loaded. Please try again.
            </div>
          ) : filteredDocuments.length === 0 ? (
            <div className="flex flex-col items-center p-12 text-center">
              <Files className="mb-3 h-10 w-10 text-gray-400" aria-hidden="true" />
              <p className="font-medium text-gray-900">
                {search ? 'No matching documents' : 'No documents yet'}
              </p>
              <p className="mt-1 text-sm text-gray-500">
                {search
                  ? 'Try another search.'
                  : 'Upload a document to add it to this patient record.'}
              </p>
            </div>
          ) : (
            <ul className="divide-y divide-gray-200">
              {filteredDocuments.map((document) => (
                <li
                  key={document.id}
                  className="flex flex-col items-start justify-between gap-4 p-4 transition-colors hover:bg-gray-50 sm:flex-row sm:items-center sm:p-6"
                >
                  <div className="flex min-w-0 items-center gap-4">
                    <div className="rounded-lg border border-gray-100 bg-gray-50 p-2">
                      {getFileIcon(document.contentType)}
                    </div>
                    <div className="min-w-0">
                      <h3 className="truncate text-sm font-bold text-gray-900">
                        {document.fileName}
                      </h3>
                      <div className="mt-1 flex flex-wrap items-center gap-x-4 gap-y-1 text-xs text-gray-500">
                        <span>{formatBytes(document.sizeBytes)}</span>
                        <span>{format(new Date(document.uploadedAt), 'MMM d, yyyy')}</span>
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-2 self-end sm:self-auto">
                    {isPreviewable(document.contentType) && (
                      <button
                        type="button"
                        onClick={() => void handleOpenDocument(document, false)}
                        disabled={activeDocumentId === document.id}
                        aria-label={`Preview ${document.fileName}`}
                        className="rounded-md border border-transparent bg-white p-2 text-gray-500 transition-colors hover:border-indigo-100 hover:bg-indigo-50 hover:text-indigo-600 disabled:opacity-50"
                      >
                        {activeDocumentId === document.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Eye className="h-4 w-4" />
                        )}
                      </button>
                    )}
                    <button
                      type="button"
                      onClick={() => void handleOpenDocument(document, true)}
                      disabled={activeDocumentId === document.id}
                      aria-label={`Download ${document.fileName}`}
                      className="rounded-md border border-transparent bg-white p-2 text-gray-500 transition-colors hover:border-emerald-100 hover:bg-emerald-50 hover:text-emerald-600 disabled:opacity-50"
                    >
                      <Download className="h-4 w-4" />
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleDeleteDocument(document)}
                      disabled={deleteDocument.isPending}
                      aria-label={`Delete ${document.fileName}`}
                      className="rounded-md border border-transparent bg-white p-2 text-gray-500 transition-colors hover:border-red-100 hover:bg-red-50 hover:text-red-600 disabled:opacity-50"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>
    </div>
  );
};

export default PatientDocumentsPage;
