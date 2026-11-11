export interface AdminUser {
  firebaseUid: string;
  email: string;
  fullName: string;
  phone?: string | null;
  profileImageUrl?: string | null;
  tenantId: string | null;
  role: string;
  status: 'ACTIVE' | 'SUSPENDED';
  providerId?: string | null;
  permissions: string[];
  createdAt: string;
}

export interface AdminUserPage {
  content: AdminUser[];
  page: number;
  size: number;
  total: number;
}

export interface ProvisionTenantAdminPayload {
  firebaseUid: string;
  email: string;
  role: 'TENANT_ADMIN';
  tenantId: string;
  fullName: string;
  phone?: string;
}
