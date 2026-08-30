import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { RecentActivitiesFeed } from './RecentActivitiesFeed';
import type { BffCaseActivityItem } from '../../../types/api';

const mockRecentActivities: BffCaseActivityItem[] = [
  {
    id: 'log-1',
    caseId: 'case-100',
    category: 'WORK_ITEM',
    action: 'COMPLETE',
    title: 'Work Item Completed',
    description: 'Work item "Verify Passport" was completed.',
    actor: {
      name: 'Sarah Jenkins',
      role: 'Estate Agent',
    },
    createdAt: new Date().toISOString(),
  },
  {
    id: 'log-2',
    caseId: 'case-100',
    category: 'STEP',
    action: 'UPDATE',
    title: 'Step Target Date Updated',
    description: 'Target date set to 15 Sep 2026.',
    actor: {
      name: 'David Reynolds',
    },
    createdAt: new Date(Date.now() - 3600000).toISOString(),
  },
];

describe('RecentActivitiesFeed', () => {
  it('renders recent activities and actor information', () => {
    render(
      <RecentActivitiesFeed
        activities={mockRecentActivities}
        onViewFullTimeline={vi.fn()}
      />,
    );

    expect(screen.getByText('Recent Activity Stream')).toBeInTheDocument();
    expect(screen.getByText('Work Item Completed')).toBeInTheDocument();
    expect(screen.getByText('Step Target Date Updated')).toBeInTheDocument();
    expect(screen.getByText('Sarah Jenkins')).toBeInTheDocument();
  });

  it('calls onViewFullTimeline when clicking View All or View Full Audit Trail', () => {
    const onTimelineSpy = vi.fn();
    render(
      <RecentActivitiesFeed
        activities={mockRecentActivities}
        onViewFullTimeline={onTimelineSpy}
      />,
    );

    const viewAllBtn = screen.getByRole('button', { name: /View All/i });
    fireEvent.click(viewAllBtn);
    expect(onTimelineSpy).toHaveBeenCalledTimes(1);

    const auditTrailBtn = screen.getByRole('button', {
      name: /View Full Audit Trail/i,
    });
    fireEvent.click(auditTrailBtn);
    expect(onTimelineSpy).toHaveBeenCalledTimes(2);
  });

  it('renders empty message when no activities are provided', () => {
    render(
      <RecentActivitiesFeed
        activities={[]}
        onViewFullTimeline={vi.fn()}
      />,
    );

    expect(
      screen.getByText('No recent events recorded'),
    ).toBeInTheDocument();
  });
});
