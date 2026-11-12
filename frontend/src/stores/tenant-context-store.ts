import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface TenantContextState {
  selectedTenantId: string | null;
  selectedTenantName: string | null;
  selectedForUid: string | null;
  selectTenant: (tenantId: string, tenantName: string, uid: string) => void;
  clearTenant: () => void;
}

export const useTenantContextStore = create<TenantContextState>()(
  persist(
    (set) => ({
      selectedTenantId: null,
      selectedTenantName: null,
      selectedForUid: null,
      selectTenant: (selectedTenantId, selectedTenantName, selectedForUid) =>
        set({ selectedTenantId, selectedTenantName, selectedForUid }),
      clearTenant: () =>
        set({ selectedTenantId: null, selectedTenantName: null, selectedForUid: null }),
    }),
    { name: 'caresync.tenant-context' },
  ),
);
