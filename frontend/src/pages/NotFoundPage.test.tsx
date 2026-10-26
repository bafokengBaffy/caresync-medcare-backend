import { describe, it, expect } from 'vitest';
import { screen } from '@testing-library/react';
import { renderWithProviders } from '@/test/utils';
import { NotFoundPage } from './NotFoundPage';

describe('NotFoundPage', () => {
  it('shows 404', () => { renderWithProviders(<NotFoundPage />); expect(screen.getByText('404')).toBeInTheDocument(); });
});
