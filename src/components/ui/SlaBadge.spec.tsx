import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { SlaBadge } from './SlaBadge';

describe('SlaBadge', () => {
  it('renders Overdue badge when SLA is OVERDUE', () => {
    render(<SlaBadge slaStatus="OVERDUE" targetDate="2026-08-25T12:00:00.000Z" />);

    expect(screen.getByText('Overdue')).toBeInTheDocument();
  });

  it('renders Due Soon badge when SLA is AT_RISK', () => {
    render(<SlaBadge slaStatus="AT_RISK" targetDate="2026-08-31T12:00:00.000Z" />);

    expect(screen.getByText('Due Soon (<= 3d)')).toBeInTheDocument();
  });

  it('renders On Track badge when SLA is ON_TRACK', () => {
    render(<SlaBadge slaStatus="ON_TRACK" targetDate="2026-09-15T12:00:00.000Z" />);

    expect(screen.getByText('On Track')).toBeInTheDocument();
  });

  it('renders Completed on Time badge when SLA is COMPLETED_ON_TIME', () => {
    render(<SlaBadge slaStatus="COMPLETED_ON_TIME" />);

    expect(screen.getByText('Completed On Time')).toBeInTheDocument();
  });

  it('renders fallback target date when SLA status is NONE but date exists', () => {
    render(<SlaBadge slaStatus="NONE" targetDate="2026-09-01T12:00:00.000Z" />);

    expect(screen.getByText(/Target:/i)).toBeInTheDocument();
  });
});
