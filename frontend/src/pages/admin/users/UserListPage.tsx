import { useState, useEffect, useCallback } from 'react';
import {
  Users,
  Search,
  Shield,
  ShieldAlert,
  ShieldCheck,
  Ban,
  CheckCircle,
  Mail,
  Building,
  Loader2,
  AlertCircle
} from 'lucide-react';

// Types
interface User {
  id: string;
  email: string;
  name: string;
  role: 'SUPER_ADMIN' | 'TENANT_ADMIN' | 'PROVIDER' | 'PATIENT';
  status: 'ACTIVE' | 'SUSPENDED' | 'PENDING';
  tenantId?: string;
  tenantName?: string;
  lastLogin?: string;
  createdAt: string;
}

const UserListPage = () => {
  const [users, setUsers] = useState<User[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters & Pagination
  const [page, setPage] = useState(0);
  const [totalPages, setTotalPages] = useState(0);
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<string>('ALL');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');

  // Modal State
  const [selectedUser, setSelectedUser] = useState<User | null>(null);
  const [actionType, setActionType] = useState<'ROLE' | 'STATUS' | null>(null);
  const [newRole, setNewRole] = useState<string>('');
  const [isUpdating, setIsUpdating] = useState(false);

  const fetchUsers = useCallback(async () => {
    setIsLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams({
        page: page.toString(),
        size: '15',
        ...(searchQuery && { search: searchQuery }),
        ...(roleFilter !== 'ALL' && { role: roleFilter }),
        ...(statusFilter !== 'ALL' && { status: statusFilter }),
      });

      const response = await fetch(`/api/v1/admin/users?${params.toString()}`, {
        headers: { 'Content-Type': 'application/json' },
      });

      if (!response.ok) throw new Error('Failed to fetch users');
      const data = await response.json();
      
      setUsers(data.content || []);
      setTotalPages(data.totalPages || 0);
    } catch (err: any) {
      setError(err.message || 'Error loading users');
    } finally {
      setIsLoading(false);
    }
  }, [page, searchQuery, roleFilter, statusFilter]);

  useEffect(() => {
    const debounce = setTimeout(() => fetchUsers(), 300);
    return () => clearTimeout(debounce);
  }, [fetchUsers]);

  const handleRoleChangeSubmit = async () => {
    if (!selectedUser || !newRole) return;
    setIsUpdating(true);
    try {
      const response = await fetch(`/api/v1/admin/users/${selectedUser.id}/role`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ role: newRole }),
      });
      if (!response.ok) throw new Error('Failed to update role');
      
      setUsers(users.map(u => u.id === selectedUser.id ? { ...u, role: newRole as any } : u));
      setActionType(null);
      setSelectedUser(null);
    } catch (err: any) {
      alert(err.message);
    } finally {
      setIsUpdating(false);
    }
  };

  const toggleUserStatus = async (user: User) => {
    const newStatus = user.status === 'ACTIVE' ? 'SUSPENDED' : 'ACTIVE';
    if (!confirm(`Are you sure you want to mark ${user.name} as ${newStatus}?`)) return;

    try {
      const response = await fetch(`/api/v1/admin/users/${user.id}/status`, {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ status: newStatus }),
      });
      if (!response.ok) throw new Error('Failed to update status');
      
      setUsers(users.map(u => u.id === user.id ? { ...u, status: newStatus as any } : u));
    } catch (err: any) {
      alert(err.message);
    }
  };

  const getRoleIcon = (role: string) => {
    switch (role) {
      case 'SUPER_ADMIN': return <ShieldAlert className="w-4 h-4 text-purple-600" />;
      case 'TENANT_ADMIN': return <ShieldCheck className="w-4 h-4 text-blue-600" />;
      case 'PROVIDER': return <Shield className="w-4 h-4 text-emerald-600" />;
      default: return <Users className="w-4 h-4 text-gray-500" />;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Users className="w-6 h-6 text-indigo-600" />
              Global User Directory
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Manage user identities, enforce RBAC, and handle account suspensions.
            </p>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-6 py-6 flex-1 flex flex-col gap-4">
        {/* Filters Toolbar */}
        <div className="bg-white p-3 rounded-lg shadow-sm border border-gray-200 flex flex-col sm:flex-row gap-3">
          <div className="relative flex-1">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-gray-400" />
            <input
              type="text"
              placeholder="Search users by name or email..."
              value={searchQuery}
              onChange={(e) => { setSearchQuery(e.target.value); setPage(0); }}
              className="w-full pl-9 pr-3 py-2 border border-gray-300 rounded-md text-sm focus:ring-indigo-500 focus:border-indigo-500"
            />
          </div>
          <div className="flex gap-3">
            <select
              value={roleFilter}
              onChange={(e) => { setRoleFilter(e.target.value); setPage(0); }}
              className="rounded-md border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500 py-2 pl-3 pr-8 border"
            >
              <option value="ALL">All Roles</option>
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="TENANT_ADMIN">Tenant Admin</option>
              <option value="PROVIDER">Provider</option>
              <option value="PATIENT">Patient</option>
            </select>
            <select
              value={statusFilter}
              onChange={(e) => { setStatusFilter(e.target.value); setPage(0); }}
              className="rounded-md border-gray-300 text-sm focus:ring-indigo-500 focus:border-indigo-500 py-2 pl-3 pr-8 border"
            >
              <option value="ALL">All Statuses</option>
              <option value="ACTIVE">Active</option>
              <option value="SUSPENDED">Suspended</option>
              <option value="PENDING">Pending</option>
            </select>
          </div>
        </div>

        {/* Table */}
        <div className="bg-white rounded-lg shadow border border-gray-200 flex-1">
          {isLoading ? (
            <div className="p-16 flex justify-center"><Loader2 className="w-8 h-8 animate-spin text-indigo-600" /></div>
          ) : error ? (
            <div className="p-16 text-center text-red-500"><AlertCircle className="mx-auto w-8 h-8 mb-2" />{error}</div>
          ) : (
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">User Profile</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Role & Access</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Tenant</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {users.map((user) => (
                    <tr key={user.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <div className="h-10 w-10 flex-shrink-0 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                            {user.name.charAt(0).toUpperCase()}
                          </div>
                          <div className="ml-4">
                            <div className="text-sm font-medium text-gray-900">{user.name}</div>
                            <div className="text-sm text-gray-500 flex items-center gap-1">
                              <Mail className="w-3 h-3" /> {user.email}
                            </div>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center gap-2 text-sm text-gray-900 font-medium">
                          {getRoleIcon(user.role)}
                          {user.role.replace('_', ' ')}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                        {user.tenantName ? (
                          <span className="flex items-center gap-1">
                            <Building className="w-3 h-3" /> {user.tenantName}
                          </span>
                        ) : (
                          <span className="text-gray-400 italic">System Level</span>
                        )}
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.status === 'ACTIVE' ? 'bg-emerald-100 text-emerald-800' :
                          user.status === 'SUSPENDED' ? 'bg-red-100 text-red-800' : 'bg-amber-100 text-amber-800'
                        }`}>
                          {user.status}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                        <div className="flex items-center justify-end gap-2">
                          <button
                            onClick={() => { setSelectedUser(user); setActionType('ROLE'); setNewRole(user.role); }}
                            className="text-gray-400 hover:text-blue-600 p-1"
                            title="Change Role"
                          >
                            <Shield className="w-5 h-5" />
                          </button>
                          <button
                            onClick={() => toggleUserStatus(user)}
                            className={`p-1 ${user.status === 'ACTIVE' ? 'text-gray-400 hover:text-red-600' : 'text-gray-400 hover:text-emerald-600'}`}
                            title={user.status === 'ACTIVE' ? 'Suspend User' : 'Activate User'}
                          >
                            {user.status === 'ACTIVE' ? <Ban className="w-5 h-5" /> : <CheckCircle className="w-5 h-5" />}
                          </button>
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
        {!isLoading && !error && users.length > 0 && (
           <div className="bg-white px-4 py-3 flex items-center justify-between border-t border-gray-200 sm:px-6 rounded-lg shadow-sm border">
           <p className="text-sm text-gray-700">Page <span className="font-medium">{page + 1}</span> of <span className="font-medium">{totalPages || 1}</span></p>
           <div className="flex gap-2">
             <button onClick={() => setPage(p => Math.max(0, p - 1))} disabled={page === 0} className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50">Previous</button>
             <button onClick={() => setPage(p => Math.min(totalPages - 1, p + 1))} disabled={page >= totalPages - 1} className="px-3 py-1 border rounded hover:bg-gray-50 disabled:opacity-50">Next</button>
           </div>
         </div>
        )}
      </div>

      {/* Role Change Modal */}
      {actionType === 'ROLE' && selectedUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-gray-500 bg-opacity-75">
          <div className="bg-white rounded-lg max-w-md w-full p-6 shadow-xl">
            <h3 className="text-lg font-medium text-gray-900 mb-4">Change User Role</h3>
            <p className="text-sm text-gray-500 mb-4">
              Updating role for <strong>{selectedUser.name}</strong>. This will immediately alter their access permissions across the platform.
            </p>
            <select
              value={newRole}
              onChange={(e) => setNewRole(e.target.value)}
              className="w-full border-gray-300 rounded-md shadow-sm focus:border-indigo-500 focus:ring-indigo-500 sm:text-sm p-2 border mb-6"
            >
              <option value="SUPER_ADMIN">Super Admin</option>
              <option value="TENANT_ADMIN">Tenant Admin</option>
              <option value="PROVIDER">Provider</option>
              <option value="PATIENT">Patient</option>
            </select>
            <div className="flex justify-end gap-3">
              <button onClick={() => setActionType(null)} className="px-4 py-2 text-sm font-medium text-gray-700 bg-white border border-gray-300 rounded-md hover:bg-gray-50">Cancel</button>
              <button onClick={handleRoleChangeSubmit} disabled={isUpdating} className="px-4 py-2 text-sm font-medium text-white bg-indigo-600 rounded-md hover:bg-indigo-700 flex items-center">
                {isUpdating && <Loader2 className="w-4 h-4 mr-2 animate-spin" />} Save Changes
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserListPage;