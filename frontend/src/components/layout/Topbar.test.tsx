import { fireEvent, screen } from '@testing-library/react';
import { useLocation } from 'react-router-dom';
import { describe, expect, it, vi } from 'vitest';
import { renderWithProviders } from '@/test/utils';
import { Topbar } from './Topbar';

vi.mock('@/hooks/use-auth', () => ({
  useAuth: () => ({ user: null, logout: vi.fn() }),
}));

vi.mock('@/hooks/use-profile', () => ({
  useProfile: () => ({ data: undefined }),
}));

vi.mock('./TenantContextSelector', () => ({
  TenantContextSelector: () => null,
}));

function CurrentPath() {
  const location = useLocation();
  return <output data-testid="current-path">{location.pathname}</output>;
}

describe('Topbar profile navigation', () => {
  it('navigates to the registered shared profile route', () => {
    renderWithProviders(
      <>
        <Topbar />
        <CurrentPath />
      </>,
      { route: '/shared/settings' },
    );

    fireEvent.click(screen.getByRole('button', { name: 'Profile' }));

    expect(screen.getByTestId('current-path')).toHaveTextContent('/shared/profile');
  });
});
