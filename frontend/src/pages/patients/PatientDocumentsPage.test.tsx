import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders } from '@/test/utils';
import { patientDocumentsApi } from '@/api/patient-documents';
import PatientDocumentsPage from './PatientDocumentsPage';

vi.mock('@/api/patient-documents', () => ({
  patientDocumentsApi: {
    list: vi.fn(),
    upload: vi.fn(),
    download: vi.fn(),
    remove: vi.fn(),
  },
}));

describe('patient documents page', () => {
  beforeEach(() => {
    vi.mocked(patientDocumentsApi.list).mockResolvedValue([
      {
        id: 'document-1',
        fileName: 'recent-lab-results.pdf',
        contentType: 'application/pdf',
        sizeBytes: 1200,
        uploadedAt: '2026-10-25T10:30:00Z',
        mediaUrl: '/api/v1/patients/patient-1/documents/document-1/content',
      },
    ]);
  });

  it('renders documents returned by the patient documents API', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/patients/:patientId/documents" element={<PatientDocumentsPage />} />
      </Routes>,
      { route: '/patients/patient-1/documents' },
    );

    expect(await screen.findByText('recent-lab-results.pdf')).toBeInTheDocument();
    expect(screen.queryByText('Blood_Test_Results_Oct2023.pdf')).not.toBeInTheDocument();
    expect(patientDocumentsApi.list).toHaveBeenCalledWith('patient-1');
  });
});
