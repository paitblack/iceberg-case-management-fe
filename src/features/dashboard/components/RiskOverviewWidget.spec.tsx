import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { RiskOverviewWidget } from './RiskOverviewWidget';

describe('RiskOverviewWidget', () => {
  it('renders green, amber, red counts and distribution', () => {
    render(
      <MemoryRouter>
        <RiskOverviewWidget
          riskOverview={{ greenCases: 8, amberCases: 3, redCases: 1 }}
          totalActiveCases={12}
        />
      </MemoryRouter>,
    );

    expect(
      screen.getByText(/Portfolio SLA Health & Traffic Light Risk/i),
    ).toBeInTheDocument();
    expect(screen.getByText('8')).toBeInTheDocument();
    expect(screen.getByText('3')).toBeInTheDocument();
    expect(screen.getByText('1')).toBeInTheDocument();
    expect(screen.getByText(/12 Active Workflows/i)).toBeInTheDocument();
  });
});
