import { beforeEach, describe, expect, it, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { useAuthStore } from '@/stores/auth-store';
import { useTenantContextStore } from '@/stores/tenant-context-store';
import { useUiStore } from '@/stores/ui-store';

vi.mock('@/hooks/use-profile', () => ({
  useProfile: () => ({ data: undefined }),
}));

describe('Sidebar', () => {
  beforeEach(() => {
    useTenantContextStore.setState({ selectedTenantId: null, selectedForUid: null });
    useUiStore.setState({ sidebarCollapsed: false, language: 'en' });
  });

  it('shows all primary super-admin sections', () => {
    useAuthStore.setState({
      user: {
        uid: 'super-admin',
        email: 'admin@example.com',
        displayName: 'Platform Admin',
        role: 'SUPER_ADMIN',
      },
    });

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );

    for (const label of [
      'Platform dashboard',
      'Tenants',
      'Users',
      'Role management',
      'Registration requests',
      'Pending activations',
      'Provision staff',
      'Registration settings',
      'Revenue',
      'Subscriptions',
      'Audit log',
      'Platform activity',
      'Global settings',
      'Integrations',
    ]) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    }
  });

  it('shows tenant-admin user, registration, role, settings, and audit pages', () => {
    useAuthStore.setState({
      user: {
        uid: 'tenant-admin',
        email: 'tenant-admin@example.com',
        displayName: 'Tenant Admin',
        role: 'TENANT_ADMIN',
      },
    });

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );

    for (const label of [
      'Tenant dashboard',
      'Users',
      'Staff',
      'Patient registrations',
      'Pending approvals',
      'Staff provisioning',
      'Role management',
      'Tenant settings',
      'Audit log',
    ]) {
      expect(screen.getByRole('link', { name: label })).toBeInTheDocument();
    }

    expect(screen.getByRole('link', { name: 'Tenant dashboard' })).toHaveAttribute('href', '/admin/tenant');
    expect(screen.queryByRole('link', { name: 'Patients' })).not.toBeInTheDocument();
    expect(screen.queryByRole('link', { name: 'Financial reports' })).not.toBeInTheDocument();
  });

  it('shows only clinical navigation for providers', () => {
    useAuthStore.setState({
      user: {
        uid: 'provider',
        email: 'provider@example.com',
        displayName: 'Provider',
        role: 'PROVIDER',
      },
    });

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Clinical dashboard' })).toHaveAttribute('href', '/clinical/dashboard');
    expect(screen.getByRole('link', { name: 'Dental charts' })).toHaveAttribute('href', '/clinical/dental-charts');
    expect(screen.queryByRole('link', { name: 'Invoices' })).not.toBeInTheDocument();
  });

  it('shows only reception navigation for receptionists', () => {
    useAuthStore.setState({
      user: {
        uid: 'receptionist',
        email: 'reception@example.com',
        displayName: 'Receptionist',
        role: 'RECEPTIONIST',
      },
    });

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Reception dashboard' })).toHaveAttribute('href', '/reception/dashboard');
    expect(screen.getByRole('link', { name: 'Invoices' })).toHaveAttribute('href', '/reception/billing/invoices');
    expect(screen.queryByRole('link', { name: 'Patients' })).not.toBeInTheDocument();
  });

  it('shows only finance navigation for finance users', () => {
    useAuthStore.setState({
      user: {
        uid: 'finance',
        email: 'finance@example.com',
        displayName: 'Finance',
        role: 'FINANCE',
      },
    });

    render(
      <MemoryRouter>
        <Sidebar />
      </MemoryRouter>,
    );

    expect(screen.getByRole('link', { name: 'Finance dashboard' })).toHaveAttribute('href', '/finance/dashboard');
    expect(screen.getByRole('link', { name: 'Payments' })).toHaveAttribute('href', '/finance/payments');
    expect(screen.queryByRole('link', { name: 'Invoices' })).not.toBeInTheDocument();
  });
});
