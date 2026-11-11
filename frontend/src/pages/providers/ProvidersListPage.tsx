import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Stethoscope,
  Search,
  Plus,
  Eye,
  Edit2,
  Trash2,
  ChevronLeft,
  ChevronRight,
  Filter,
  AlertTriangle,
  Loader2,
  Mail,
  Phone,
  Building2,
  FileDown,
  CheckCircle2,
  XCircle
} from 'lucide-react';
import { useProviders, useDeleteProvider } from '@/hooks/use-providers';
import { SPECIALTIES } from '@/lib/constants';

const ProvidersListPage = () => {
  const navigate = useNavigate();
  const [page, setPage] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [specialtyFilter, setSpecialtyFilter] = useState('ALL');
  const [statusFilter, setStatusFilter] = useState('ALL');
  const [isDeleteModalOpen, setIsDeleteModalOpen] = useState(false);
  const [providerToDelete, setProviderToDelete] = useState<any>(null);

  const { data, isLoading, isError, error } = useProviders({
    page,
    size: 10,
    search: searchQuery,
    specialty: specialtyFilter !== 'ALL' ? specialtyFilter : '',
    status: statusFilter !== 'ALL' ? statusFilter : '',
  });

  const deleteMutation = useDeleteProvider();

  const confirmDelete = () => {
    if (!providerToDelete) return;
    deleteMutation.mutate(providerToDelete.id, {
      onSuccess: () => {
        setIsDeleteModalOpen(false);
        setProviderToDelete(null);
      },
    });
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-8">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Stethoscope className="w-6 h-6 text-indigo-600" />
              Provider Directory
            </h1>
            <p className="mt-1 text-sm text-gray-500">Manage doctors, nurses, and specialists across the platform.</p>
          </div>
          <div className="mt-4 sm:mt-0 flex gap-3">
            <button className="inline-flex items-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50">
              <FileDown className="w-4 h-4 mr-2" /> Export
            </button>
            <button onClick={() => navigate('/providers/create')} className="inline-flex items-center justify-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
              <Plus className="w-4 h-4 mr-2" /> New Provider
            </button>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="max-w-7xl mx-auto w-full px-6 py-6 flex flex-col sm:flex-row gap-4">
        <div className="relative flex-1">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400" />
          <input
            type="text"
            placeholder="Search by name, NPI, or email..."
            value={searchQuery}
            onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
            className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
          />
        </div>
        <select
          value={specialtyFilter}
          onChange={(e) => { setSpecialtyFilter(e.target.value); setPage(0); }}
          className="block w-full sm:w-48 pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="ALL">All Specialties</option>
          {SPECIALTIES.map((specialty) => <option key={specialty} value={specialty}>{specialty.replace('_', ' ')}</option>)}
        </select>
        <select
          value={statusFilter}
          onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
          className="block w-full sm:w-36 pl-3 pr-10 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm"
        >
          <option value="ALL">All Statuses</option>
          <option value="ACTIVE">Active</option>
          <option value="INACTIVE">Inactive</option>
        </select>
      </div>

      {/* Table */}
      <div className="max-w-7xl mx-auto w-full px-6 pb-12 flex-1">
        <div className="bg-white rounded-lg shadow overflow-hidden border border-gray-200">
          {isLoading ? (
            <div className="p-12 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
          ) : isError ? (
            <div className="p-12 text-center">
              <AlertTriangle className="w-12 h-12 text-red-500 mx-auto mb-4" />
              <p className="text-gray-700">{(error as any)?.message || 'Error loading providers.'}</p>
            </div>
          ) : !data?.content || data.content.length === 0 ? (
            <div className="p-12 text-center">
              <Stethoscope className="w-12 h-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-medium text-gray-900">No providers found</h3>
              <p className="mt-1 text-sm text-gray-500">Add your first provider to get started.</p>
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Specialty</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Contact</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="relative px-6 py-3"><span className="sr-only">Actions</span></th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {data.content.map((provider: any) => (
                    <tr key={provider.id} className="hover:bg-gray-50 transition-colors">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 bg-indigo-100 rounded-full flex items-center justify-center text-indigo-700 font-bold">
                            {provider.firstName?.charAt(0)}{provider.lastName?.charAt(0)}
                          </div>
                          <div>
                            <div className="text-sm font-bold text-gray-900">Dr. {provider.firstName} {provider.lastName}</div>
                            <div className="text-xs text-gray-500 font-mono mt-0.5">NPI: {provider.npi || 'N/A'}</div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-50 text-blue-700 border border-blue-100">
                          <Stethoscope className="w-3 h-3" /> {provider.specialty || 'General'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex flex-col gap-1 text-sm text-gray-600">
                          <span className="flex items-center gap-1.5"><Mail className="w-3.5 h-3.5 text-gray-400" /> {provider.email}</span>
                          <span className="flex items-center gap-1.5"><Phone className="w-3.5 h-3.5 text-gray-400" /> {provider.phoneNumber || 'No phone'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          provider.active ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-800'
                        }`}>
                          {provider.active ? <CheckCircle2 className="w-3 h-3" /> : <XCircle className="w-3 h-3" />}
                          {provider.active ? 'ACTIVE' : 'INACTIVE'}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-3">
                          <button onClick={() => navigate(`/providers/${provider.id}`)} className="text-gray-400 hover:text-indigo-600" title="View Profile"><Eye className="w-5 h-5" /></button>
                          <button onClick={() => navigate(`/providers/${provider.id}/edit`)} className="text-gray-400 hover:text-blue-600" title="Edit"><Edit2 className="w-5 h-5" /></button>
                          <button onClick={() => { setProviderToDelete(provider); setIsDeleteModalOpen(true); }} className="text-gray-400 hover:text-red-600" title="Delete"><Trash2 className="w-5 h-5" /></button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>

        {/* Pagination */}
        {!isLoading && !isError && data?.content && data.content.length > 0 && (
          <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 mt-4 rounded-lg shadow-sm border">
            <p className="text-sm text-gray-700">Page <span className="font-medium">{page + 1}</span> of <span className="font-medium">{data.totalPages || 1}</span></p>
            <div className="flex gap-2">
              <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="px-2 py-2 border border-gray-300 rounded-md bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50"><ChevronLeft className="h-5 w-5" /></button>
              <button onClick={() => setPage(p => Math.min((data.totalPages || 1) - 1, p + 1))} disabled={page >= (data.totalPages || 1) - 1} className="px-2 py-2 border border-gray-300 rounded-md bg-white text-gray-500 hover:bg-gray-50 disabled:opacity-50"><ChevronRight className="h-5 w-5" /></button>
            </div>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {isDeleteModalOpen && (
        <div className="fixed z-10 inset-0 overflow-y-auto">
          <div className="flex items-end justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
            <div className="fixed inset-0 bg-gray-500 bg-opacity-75" onClick={() => setIsDeleteModalOpen(false)}></div>
            <span className="hidden sm:inline-block sm:align-middle sm:h-screen">&#8203;</span>
            <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-lg sm:w-full sm:p-6">
              <div className="sm:flex sm:items-start">
                <div className="mx-auto flex-shrink-0 flex items-center justify-center h-12 w-12 rounded-full bg-red-100 sm:mx-0 sm:h-10 sm:w-10"><Trash2 className="h-6 w-6 text-red-600" /></div>
                <div className="mt-3 text-center sm:mt-0 sm:ml-4 sm:text-left">
                  <h3 className="text-lg leading-6 font-medium text-gray-900">Delete Provider</h3>
                  <p className="mt-2 text-sm text-gray-500">Are you sure you want to remove Dr. {providerToDelete?.firstName} {providerToDelete?.lastName}? This will deactivate their access.</p>
                </div>
              </div>
              <div className="mt-5 sm:mt-4 sm:flex sm:flex-row-reverse">
                <button onClick={confirmDelete} disabled={deleteMutation.isPending} className="w-full inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-red-600 text-base font-medium text-white hover:bg-red-700 sm:ml-3 sm:w-auto sm:text-sm disabled:opacity-50">
                  {deleteMutation.isPending ? <Loader2 className="w-5 h-5 animate-spin" /> : 'Delete'}
                </button>
                <button onClick={() => setIsDeleteModalOpen(false)} className="mt-3 w-full inline-flex justify-center rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-base font-medium text-gray-700 hover:bg-gray-50 sm:mt-0 sm:w-auto sm:text-sm">Cancel</button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProvidersListPage;