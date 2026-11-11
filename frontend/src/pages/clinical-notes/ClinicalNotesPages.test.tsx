import { beforeEach, describe, expect, it, vi } from 'vitest';
import { screen } from '@testing-library/react';
import { Route, Routes } from 'react-router-dom';
import { renderWithProviders } from '@/test/utils';
import { notesApi } from '@/api/notes';
import type { ClinicalNote, ClinicalNoteSummary } from '@/types/clinical-note';
import NotesListPage from './NotesListPage';
import NoteDetailPage from './NoteDetailPage';

vi.mock('@/api/notes', () => ({
  notesApi: {
    get: vi.fn(),
    list: vi.fn(),
    create: vi.fn(),
  },
}));

const noteSummary: ClinicalNoteSummary = {
  id: 'note-1',
  patientId: 'patient-1',
  providerId: 'provider-1',
  appointmentId: 'appointment-1',
  specialty: 'DENTAL',
  noteType: 'SOAP_NOTE',
  status: 'DRAFT',
  createdAt: '2026-10-26T00:00:00Z',
};

const note: ClinicalNote = {
  ...noteSummary,
  soapData: {
    subjective: 'Patient reports tooth pain.',
    objective: 'Tenderness on examination.',
    assessment: 'Dental pain.',
    plan: 'Follow up in one week.',
  },
};

describe('clinical notes pages', () => {
  beforeEach(() => {
    vi.mocked(notesApi.list).mockResolvedValue({
      content: [noteSummary],
      page: 0,
      size: 10,
      total: 1,
    });
    vi.mocked(notesApi.get).mockResolvedValue(note);
  });

  it('renders a note from the API list and links to its matching route', async () => {
    renderWithProviders(<NotesListPage />);

    expect(await screen.findByText('SOAP NOTE')).toBeInTheDocument();
    expect(screen.getByText('Patient patient-1')).toBeInTheDocument();
    expect(screen.getByRole('link', { name: 'View note note-1' })).toHaveAttribute('href', '/notes/note-1');
  });

  it('renders the SOAP data returned by the detail API', async () => {
    renderWithProviders(
      <Routes>
        <Route path="/notes/:id" element={<NoteDetailPage />} />
      </Routes>,
      { route: '/notes/note-1' },
    );

    expect(await screen.findByText('Patient reports tooth pain.')).toBeInTheDocument();
    expect(screen.getByText('Tenderness on examination.')).toBeInTheDocument();
    expect(screen.getByText('Dental pain.')).toBeInTheDocument();
    expect(screen.getByText('Follow up in one week.')).toBeInTheDocument();
    expect(notesApi.get).toHaveBeenCalledWith('note-1');
  });
});
