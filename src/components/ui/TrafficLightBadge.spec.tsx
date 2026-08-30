import { describe, it, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { TrafficLightBadge } from './TrafficLightBadge';

describe('TrafficLightBadge', () => {
  it('renders green On Track badge without ping animation', () => {
    render(<TrafficLightBadge status="green" />);

    expect(screen.getByText('On Track')).toBeInTheDocument();
  });

  it('renders amber At Risk badge and opens popover on click with reasons', () => {
    const reasons = [
      'Required work item "Verify Passport" in step "ID & AML" is at risk of delay.',
    ];
    render(<TrafficLightBadge status="amber" reasons={reasons} />);

    const badgeBtn = screen.getByRole('button', { name: /At Risk/i });
    expect(badgeBtn).toBeInTheDocument();

    fireEvent.click(badgeBtn);

    expect(screen.getByText(/At Risk Status/i)).toBeInTheDocument();
    expect(screen.getByText(/Verify Passport/i)).toBeInTheDocument();
  });

  it('renders red Action Required badge and opens popover on hover', () => {
    const reasons = ['Case is currently placed OnHold.'];
    render(<TrafficLightBadge status="red" reasons={reasons} />);

    const badgeBtn = screen.getByRole('button', { name: /Action Required/i });
    expect(badgeBtn).toBeInTheDocument();

    fireEvent.mouseEnter(badgeBtn);

    expect(screen.getByText(/Action Required Status/i)).toBeInTheDocument();
    expect(screen.getByText(/Case is currently placed OnHold/i)).toBeInTheDocument();
  });
});
