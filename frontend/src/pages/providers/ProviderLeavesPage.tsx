import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  ArrowLeft,
  Plus,
  Calendar,
  CheckCircle2,
  XCircle,
  Clock,
  Loader2,
  Plane,
  User,
  AlertTriangle
} from 'lucide-react';
import { format } from 'date-fns';

const ProviderLeavesPage = () => {
  const navigate = useNavigate();
  const [leaves, setLeaves] = useState([
    { id: '1', providerName: 'Dr. Sarah Lee', type: 'VACATION', startDate: '2024-01-15', endDate: '2024-01-22', status: 'APPROVED', reason: 'Annual family vacation' },
    { id: '2', providerName: 'Dr. Michael Chen', type: 'SICK_LEAVE', startDate: '2024-01-10', endDate: '2024-01-11', status: 'PENDING', reason: 'Flu recovery' },
    { id: '3', providerName: 'Dr. Emily Rodriguez', type: 'CONFERENCE', startDate: '2024-02-05', endDate: '2024-02-08', status: 'APPROVED', reason: 'Medical conference attendance' },
    { id: '4', providerName: 'Dr. James Wilson', type: 'VACATION', startDate: '2024-03-01', endDate: '2024-03-10', status: 'REJECTED', reason: 'Peak season coverage required' },
  ]);

  const handleApprove = (id: string) => {
    setLeaves(prev => prev.map(l => l.id === id ? { ...l, status: 'APPROVED' } : l));
  };

  const handleReject = (id: string) => {
    setLeaves(prev => prev.map(l => l.id === id ? { ...l, status: 'REJECTED' } : l));
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'APPROVED': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-emerald-100 text-emerald-800"><CheckCircle2 className="w-3 h-3" /> Approved</span>;
      case 'PENDING': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-amber-100 text-amber-800"><Clock className="w-3 h-3" /> Pending</span>;
      case 'REJECTED': return <span className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium bg-red-100 text-red-800"><XCircle className="w-3 h-3" /> Rejected</span>;
      default: return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 pb-12">
      <div className="bg-white border-b border-gray-200 px-6 py-6 sticky top-0 z-10">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div className="flex items-center gap-4">
            <button onClick={() => navigate('/providers')} className="p-2 hover:bg-gray-100 rounded-full text-gray-500"><ArrowLeft className="w-5 h-5" /></button>
            <div>
              <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
                <Plane className="w-6 h-6 text-indigo-600" />
                Provider Leaves
              </h1>
              <p className="text-sm text-gray-500 mt-1">Review and manage time-off requests.</p>
            </div>
          </div>
          <button className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700">
            <Plus className="w-4 h-4 mr-2" /> New Request
          </button>
        </div>
      </div>

      <div className="max-w-7xl mx-auto px-6 py-8">
        {/* Stats */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500 uppercase">Pending Requests</p>
            <p className="text-3xl font-bold text-amber-600 mt-2">{leaves.filter(l => l.status === 'PENDING').length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500 uppercase">Approved This Month</p>
            <p className="text-3xl font-bold text-emerald-600 mt-2">{leaves.filter(l => l.status === 'APPROVED').length}</p>
          </div>
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-4">
            <p className="text-xs font-medium text-gray-500 uppercase">Providers on Leave</p>
            <p className="text-3xl font-bold text-indigo-600 mt-2">2</p>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Provider</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Type</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reason</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {leaves.map(leave => (
                <tr key={leave.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center gap-2">
                      <User className="w-4 h-4 text-gray-400" />
                      <span className="text-sm font-medium text-gray-900">{leave.providerName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-xs font-medium uppercase text-gray-600 bg-gray-100 px-2 py-0.5 rounded">{leave.type.replace('_', ' ')}</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    <div className="flex items-center gap-1.5">
                      <Calendar className="w-4 h-4 text-gray-400" />
                      {format(new Date(leave.startDate), 'MMM d')} - {format(new Date(leave.endDate), 'MMM d, yyyy')}
                    </div>
                  </td>
                  <td className="px-6 py-4 text-sm text-gray-600 max-w-xs truncate">{leave.reason}</td>
                  <td className="px-6 py-4 whitespace-nowrap">{getStatusBadge(leave.status)}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm">
                    {leave.status === 'PENDING' && (
                      <div className="flex justify-end gap-2">
                        <button onClick={() => handleApprove(leave.id)} className="px-2 py-1 text-xs font-medium text-emerald-700 bg-emerald-50 rounded hover:bg-emerald-100">Approve</button>
                        <button onClick={() => handleReject(leave.id)} className="px-2 py-1 text-xs font-medium text-red-700 bg-red-50 rounded hover:bg-red-100">Reject</button>
                      </div>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default ProviderLeavesPage;