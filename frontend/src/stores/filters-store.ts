import { create } from 'zustand';

interface FiltersState {
  patientSearch: string;
  setPatientSearch: (q: string) => void;
  invoiceStatus: string;
  setInvoiceStatus: (s: string) => void;
}

export const useFiltersStore = create<FiltersState>((set) => ({
  patientSearch: '',
  setPatientSearch: (q) => set({ patientSearch: q }),
  invoiceStatus: '',
  setInvoiceStatus: (s) => set({ invoiceStatus: s }),
}));
