import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { DevPersonaSwitcher } from './DevPersonaSwitcher';
import { AuthProvider } from '../../features/auth/AuthContext';

describe('DevPersonaSwitcher', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders current persona in header button', () => {
    render(
      <AuthProvider>
        <DevPersonaSwitcher />
      </AuthProvider>,
    );

    expect(screen.getByText('Sarah Jenkins')).toBeDefined();
    expect(screen.getByText('SJ')).toBeDefined();
  });

  it('opens persona dropdown and switches persona on selection', () => {
    render(
      <AuthProvider>
        <DevPersonaSwitcher />
      </AuthProvider>,
    );

    const trigger = screen.getByTitle('Switch Development User Persona');
    act(() => {
      fireEvent.click(trigger);
    });

    // Check all 5 personas are listed
    expect(screen.getByText('Simulate User Persona (RBAC)')).toBeDefined();
    expect(screen.getByText('Marcus Cole')).toBeDefined();
    expect(screen.getByText('David Vance')).toBeDefined();
    expect(screen.getByText('Rachel Sterling')).toBeDefined();
    expect(screen.getByText('Emily & John Smith')).toBeDefined();

    // Click on Marcus Cole (Estate Agent)
    act(() => {
      fireEvent.click(screen.getByText('Marcus Cole'));
    });

    // Verify active persona changed in the trigger
    expect(screen.getByText('Marcus Cole')).toBeDefined();
    expect(screen.getByText('MC')).toBeDefined();
  });
});
