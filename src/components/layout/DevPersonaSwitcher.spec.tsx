import { describe, expect, it, beforeEach, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { DevPersonaSwitcher } from './DevPersonaSwitcher';
import { AuthProvider } from '../../features/auth/AuthContext';

describe('DevPersonaSwitcher', () => {
  let queryClient: QueryClient;

  beforeEach(() => {
    localStorage.clear();
    queryClient = new QueryClient({
      defaultOptions: {
        queries: { retry: false },
      },
    });
  });

  const renderComponent = () =>
    render(
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <DevPersonaSwitcher />
        </AuthProvider>
      </QueryClientProvider>,
    );

  it('renders current persona in header button', () => {
    renderComponent();

    expect(screen.getByText('Sarah Jenkins')).toBeDefined();
    expect(screen.getByText('SJ')).toBeDefined();
  });

  it('opens persona dropdown and switches persona on selection with cache invalidation', () => {
    const invalidateSpy = vi.spyOn(queryClient, 'invalidateQueries');
    renderComponent();

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

    // Verify React Query caches were invalidated
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['cases'] });
    expect(invalidateSpy).toHaveBeenCalledWith({ queryKey: ['case-workspace'] });
  });
});

