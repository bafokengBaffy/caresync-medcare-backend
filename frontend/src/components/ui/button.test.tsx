import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { Button } from './button';

describe('Button', () => {
  it('renders children', () => { render(<Button>Click</Button>); expect(screen.getByText('Click')).toBeInTheDocument(); });
  it('applies variant class', () => { const { container } = render(<Button variant="destructive">X</Button>); expect(container.firstChild).toHaveClass('bg-destructive'); });
});
