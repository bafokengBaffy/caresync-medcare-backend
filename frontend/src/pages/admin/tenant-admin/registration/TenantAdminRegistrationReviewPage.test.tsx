import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Route, Routes } from 'react-router-dom';
import { useAuthStore } from '@/stores/auth-store';
import TenantAdminRegistrationReviewPage from './TenantAdminRegistrationReviewPage';

vi.mock('./RegistrationReviewPage', () => ({
  default: ({ title, tenantId }: { title: string; tenantId?: string }) => (
    <div>{title}: {tenantId ?? 'no tenant'}</div>
  ),
}));

describe('TenantAdminRegistrationReviewPage', () => {
  beforeEach(() => {
    useAuthStore.setState({
      user: {
        uid: 'tenant-admin',
        email: 'tenant-admin@example.com',
        displayName: 'Tenant Admin',
        role: 'TENANT_ADMIN',
        tenantId: 'tenant-from-auth-claim',
      },
    });
  });

  it('passes only the authenticated tenant id to the review page', () => {
    render(
      <MemoryRouter>
        <TenantAdminRegistrationReviewPage title="Registration requests" />
      </MemoryRouter>,
    );

    expect(screen.getByText('Registration requests: tenant-from-auth-claim')).toBeInTheDocument();
  });

  it('denies users without the tenant-admin role', () => {
    useAuthStore.setState({
      user: {
        uid: 'patient',
        email: 'patient@example.com',
        displayName: 'Patient',
        role: 'PATIENT',
        tenantId: 'tenant-from-auth-claim',
      },
    });

    render(
      <MemoryRouter initialEntries={['/registration']}>
        <Routes>
          <Route path="/registration" element={<TenantAdminRegistrationReviewPage title="Registration requests" />} />
          <Route path="/not-found" element={<div>Access denied</div>} />
        </Routes>
      </MemoryRouter>,
    );

    expect(screen.getByText('Access denied')).toBeInTheDocument();
  });
});
