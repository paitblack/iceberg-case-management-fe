import { describe, expect, it, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter, Routes, Route } from 'react-router-dom';
import { ProtectedRoute } from './ProtectedRoute';
import { AuthProvider } from '../../features/auth/AuthContext';

describe('ProtectedRoute', () => {
  beforeEach(() => {
    localStorage.clear();
  });

  it('renders children when user is a super user and requiresSuperUser is true', () => {
    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/templates']}>
          <Routes>
            <Route
              path="/templates"
              element={
                <ProtectedRoute requiresSuperUser>
                  <div data-testid="protected-content">Template Studio Content</div>
                </ProtectedRoute>
              }
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    );

    expect(screen.getByTestId('protected-content').textContent).toBe(
      'Template Studio Content',
    );
  });

  it('redirects to fallback route when non-super-user accesses restricted route', () => {
    // Set active persona to Buyer Solicitor (non-super-user)
    localStorage.setItem('iceberg_active_persona_id', 'usr_buyer_sol_3');

    render(
      <AuthProvider>
        <MemoryRouter initialEntries={['/templates']}>
          <Routes>
            <Route
              path="/templates"
              element={
                <ProtectedRoute requiresSuperUser redirectTo="/cases">
                  <div data-testid="protected-content">Template Studio Content</div>
                </ProtectedRoute>
              }
            />
            <Route
              path="/cases"
              element={<div data-testid="cases-page">Cases Directory Page</div>}
            />
          </Routes>
        </MemoryRouter>
      </AuthProvider>,
    );

    expect(screen.queryByTestId('protected-content')).toBeNull();
    expect(screen.getByTestId('cases-page').textContent).toBe(
      'Cases Directory Page',
    );
  });
});
