import { render, screen, fireEvent } from '@testing-library/react';
import { describe, it, expect, vi } from 'vitest';
import { Button } from './Button';

describe('Button Component', () => {
  it('renders button with label and responds to clicks', () => {
    const handleClick = vi.fn();
    render(<Button onClick={handleClick}>Click Me</Button>);

    const button = screen.getByRole('button', { name: /click me/i });
    expect(button).toBeInTheDocument();

    fireEvent.click(button);
    expect(handleClick).toHaveBeenCalledTimes(1);
  });

  it('disables button when isLoading is true', () => {
    render(<Button isLoading>Loading State</Button>);

    const button = screen.getByRole('button');
    expect(button).toBeDisabled();
  });

  it('applies variant classes properly', () => {
    render(<Button variant="danger">Delete</Button>);

    const button = screen.getByRole('button', { name: /delete/i });
    expect(button.className).toContain('bg-rose-600');
  });
});
