export interface AdminUser {
  firebaseUid: string;
  email: string;
  fullName: string;
  phone?: string | null;
  profileImageUrl?: string | null;
  tenantId: string | null;
  role: string;
  status: 'ACTIVE' | 'SUSPENDED' | 'DELETED';
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

export interface ProvisionAdminUserPayload {
  firebaseUid?: string;
  email: string;
  role: string;
  tenantId: string | null;
  fullName: string;
  phone?: string;
  specialty?: string;
  permissions?: string[];
}

export interface FirebaseAccountLookup {
  firebaseUid: string;
  email: string;
  displayName: string | null;
}
