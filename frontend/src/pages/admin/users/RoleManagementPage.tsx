import { useState } from 'react';
import {
  ShieldCheck,
  Save,
  Loader2,
  Lock,
  FileText,
  UserCheck,
  CreditCard,
  AlertTriangle
} from 'lucide-react';

// Types
type Permission = 
  | 'VIEW_PATIENTS' | 'EDIT_PATIENTS' | 'DELETE_PATIENTS'
  | 'VIEW_BILLING' | 'MANAGE_BILLING' 
  | 'VIEW_AUDIT' | 'MANAGE_USERS' 
  | 'MANAGE_TENANTS';

interface RoleConfig {
  id: string;
  name: string;
  description: string;
  isSystem: boolean;
  permissions: Record<Permission, boolean>;
}

const initialRoles: RoleConfig[] = [
  {
    id: '1', name: 'SUPER_ADMIN', description: 'Full system access across all tenants.', isSystem: true,
    permissions: { VIEW_PATIENTS: true, EDIT_PATIENTS: true, DELETE_PATIENTS: true, VIEW_BILLING: true, MANAGE_BILLING: true, VIEW_AUDIT: true, MANAGE_USERS: true, MANAGE_TENANTS: true }
  },
  {
    id: '2', name: 'TENANT_ADMIN', description: 'Admin access restricted to their specific tenant.', isSystem: true,
    permissions: { VIEW_PATIENTS: true, EDIT_PATIENTS: true, DELETE_PATIENTS: true, VIEW_BILLING: true, MANAGE_BILLING: true, VIEW_AUDIT: true, MANAGE_USERS: true, MANAGE_TENANTS: false }
  },
  {
    id: '3', name: 'PROVIDER', description: 'Clinical staff access to patient and appointment data.', isSystem: true,
    permissions: { VIEW_PATIENTS: true, EDIT_PATIENTS: true, DELETE_PATIENTS: false, VIEW_BILLING: false, MANAGE_BILLING: false, VIEW_AUDIT: false, MANAGE_USERS: false, MANAGE_TENANTS: false }
  },
  {
    id: '4', name: 'PATIENT', description: 'Standard user, restricted to own data.', isSystem: true,
    permissions: { VIEW_PATIENTS: false, EDIT_PATIENTS: false, DELETE_PATIENTS: false, VIEW_BILLING: true, MANAGE_BILLING: false, VIEW_AUDIT: false, MANAGE_USERS: false, MANAGE_TENANTS: false }
  }
];

const permissionGroups = [
  { title: 'Patient Data', icon: FileText, perms: ['VIEW_PATIENTS', 'EDIT_PATIENTS', 'DELETE_PATIENTS'] },
  { title: 'Billing & Finance', icon: CreditCard, perms: ['VIEW_BILLING', 'MANAGE_BILLING'] },
  { title: 'System Admin', icon: ShieldCheck, perms: ['VIEW_AUDIT', 'MANAGE_USERS', 'MANAGE_TENANTS'] },
];

const RoleManagementPage = () => {
  const [roles, setRoles] = useState<RoleConfig[]>(initialRoles);
  const [isSaving, setIsSaving] = useState(false);
  const [activeRoleId, setActiveRoleId] = useState<string>(initialRoles[0].id);

  const activeRole = roles.find(r => r.id === activeRoleId)!;

  const handleToggle = (permission: Permission) => {
    setRoles(prev => prev.map(role => {
      if (role.id === activeRoleId) {
        if (role.isSystem && role.name === 'SUPER_ADMIN') return role; // Prevent altering Super Admin
        return { ...role, permissions: { ...role.permissions, [permission]: !role.permissions[permission] } };
      }
      return role;
    }));
  };

  const handleSave = async () => {
    setIsSaving(true);
    try {
      // Mock API call
      await new Promise(resolve => setTimeout(resolve, 800));
      alert('Role permissions updated successfully.');
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      {/* Header */}
      <div className="bg-white border-b border-gray-200 px-6 py-6">
        <div className="max-w-7xl mx-auto flex flex-col sm:flex-row sm:items-center sm:justify-between">
          <div>
            <h1 className="text-2xl font-bold text-gray-900 flex items-center gap-2">
              <Lock className="w-6 h-6 text-indigo-600" />
              Role & Permission Management
            </h1>
            <p className="mt-1 text-sm text-gray-500">
              Define system roles and configure strict RBAC (Role-Based Access Control) policies.
            </p>
          </div>
          <div className="mt-4 sm:mt-0">
            <button
              onClick={handleSave}
              disabled={isSaving || activeRole.name === 'SUPER_ADMIN'}
              className="inline-flex items-center px-4 py-2 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-indigo-600 hover:bg-indigo-700 disabled:opacity-50 transition-colors"
            >
              {isSaving ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <Save className="w-4 h-4 mr-2" />}
              Save Changes
            </button>
          </div>
        </div>
      </div>

      <div className="max-w-7xl mx-auto w-full px-6 py-8 flex-1 flex flex-col md:flex-row gap-8">
        {/* Sidebar - Roles List */}
        <div className="w-full md:w-64 flex-shrink-0 space-y-2">
          <h2 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-4">Defined Roles</h2>
          {roles.map(role => (
            <button
              key={role.id}
              onClick={() => setActiveRoleId(role.id)}
              className={`w-full text-left px-4 py-3 rounded-lg flex items-center justify-between transition-colors ${
                activeRoleId === role.id 
                  ? 'bg-indigo-50 border border-indigo-200 text-indigo-700 font-medium' 
                  : 'hover:bg-gray-100 border border-transparent text-gray-700'
              }`}
            >
              <span className="flex items-center gap-2">
                <UserCheck className={`w-4 h-4 ${activeRoleId === role.id ? 'text-indigo-600' : 'text-gray-400'}`} />
                {role.name}
              </span>
              {role.isSystem && <Lock className="w-3 h-3 text-gray-400" aria-label="System role" />}
            </button>
          ))}
        </div>

        {/* Main Content - Permissions Matrix */}
        <div className="flex-1 bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-5 border-b border-gray-200">
            <h2 className="text-lg font-semibold text-gray-900 flex items-center gap-2">
              Configuring: {activeRole.name}
            </h2>
            <p className="text-sm text-gray-500 mt-1">{activeRole.description}</p>
            {activeRole.name === 'SUPER_ADMIN' && (
              <div className="mt-4 p-3 bg-amber-50 border border-amber-200 rounded-md flex gap-3 text-amber-800 text-sm">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 text-amber-600" />
                <p>SUPER_ADMIN permissions are immutable for security reasons and cannot be modified.</p>
              </div>
            )}
          </div>

          <div className="p-6 space-y-8">
            {permissionGroups.map(group => (
              <div key={group.title}>
                <h3 className="text-sm font-medium text-gray-900 flex items-center gap-2 mb-4">
                  <group.icon className="w-4 h-4 text-indigo-500" />
                  {group.title}
                </h3>
                <div className="space-y-3 pl-6 border-l-2 border-gray-100">
                  {group.perms.map(perm => (
                    <label key={perm} className="flex items-center justify-between p-3 hover:bg-gray-50 rounded-lg cursor-pointer transition-colors">
                      <div className="flex flex-col">
                        <span className="text-sm font-medium text-gray-700">{perm.replace('_', ' ')}</span>
                        <span className="text-xs text-gray-500">Allow users with this role to {perm.toLowerCase().replace('_', ' ')}.</span>
                      </div>
                      <div className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer"
                          checked={activeRole.permissions[perm as Permission]}
                          onChange={() => handleToggle(perm as Permission)}
                          disabled={activeRole.name === 'SUPER_ADMIN'}
                        />
                        <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-indigo-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-indigo-600 disabled:opacity-50"></div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
};

export default RoleManagementPage;