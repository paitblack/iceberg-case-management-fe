import { describe, expect, it, vi, beforeEach } from 'vitest';
import React from 'react';
import { render, screen, act, fireEvent } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

const TestAuthConsumer: React.FC = () => {
  const { user, switchPersona, isSuperUser, roles } = useAuth();
  return (
    <div>
      <div data-testid="user-name">{user.name}</div>
      <div data-testid="user-role">{roles.join(', ')}</div>
      <div data-testid="is-super-user">{isSuperUser ? 'YES' : 'NO'}</div>
      <button
        onClick={() => switchPersona('usr_buyer_sol_3')}
        data-testid="switch-to-buyer-solicitor"
      >
        Switch to Buyer Solicitor
      </button>
      <button
        onClick={() => switchPersona('usr_1')}
        data-testid="switch-to-progressor"
      >
        Switch to Progressor
      </button>
    </div>
  );
};

describe('AuthContext & AuthProvider', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('initializes with default Super-User persona (Sarah Jenkins)', () => {
    render(
      <AuthProvider>
        <TestAuthConsumer />
      </AuthProvider>,
    );

    expect(screen.getByTestId('user-name').textContent).toBe('Sarah Jenkins');
    expect(screen.getByTestId('is-super-user').textContent).toBe('YES');
  });

  it('switches persona and updates localStorage + auth state', () => {
    const dispatchSpy = vi.spyOn(window, 'dispatchEvent');

    render(
      <AuthProvider>
        <TestAuthConsumer />
      </AuthProvider>,
    );

    act(() => {
      fireEvent.click(screen.getByTestId('switch-to-buyer-solicitor'));
    });

    expect(screen.getByTestId('user-name').textContent).toBe('David Vance');
    expect(screen.getByTestId('is-super-user').textContent).toBe('NO');
    expect(localStorage.getItem('iceberg_active_persona_id')).toBe('usr_buyer_sol_3');
    expect(localStorage.getItem('lifesycle_actor_id')).toBe('usr_buyer_sol_3');
    expect(localStorage.getItem('lifesycle_user_roles')).toContain('Buyer Solicitor');

    expect(dispatchSpy).toHaveBeenCalledWith(
      expect.objectContaining({ type: 'auth:persona-changed' }),
    );
  });
});
