import { describe, it, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { InlineTargetDateEditor } from './InlineTargetDateEditor';

describe('InlineTargetDateEditor', () => {
  it('renders Set Target Date button when no date is assigned', () => {
    render(
      <InlineTargetDateEditor
        onUpdateTargetDate={vi.fn()}
      />,
    );

    expect(screen.getByText('Set Target Date')).toBeInTheDocument();
  });

  it('renders formatted target date when targetDate prop is provided', () => {
    render(
      <InlineTargetDateEditor
        targetDate="2026-09-15T18:00:00.000Z"
        onUpdateTargetDate={vi.fn()}
      />,
    );

    expect(screen.getByText(/Target: 15 Sep/i)).toBeInTheDocument();
  });

  it('opens date picker popover and submits new target date', async () => {
    const handleUpdate = vi.fn().mockResolvedValue(undefined);
    render(
      <InlineTargetDateEditor
        onUpdateTargetDate={handleUpdate}
      />,
    );

    const triggerBtn = screen.getByRole('button', { name: /Set Target Date/i });
    fireEvent.click(triggerBtn);

    expect(screen.getByText('Target Date')).toBeInTheDocument();

    const dateInput = screen.getByLabelText(/Milestone Deadline/i);
    fireEvent.change(dateInput, { target: { value: '2026-09-20' } });

    const saveBtn = screen.getByRole('button', { name: /Save Date/i });
    fireEvent.click(saveBtn);

    expect(handleUpdate).toHaveBeenCalledWith(
      expect.stringContaining('2026-09-20'),
    );
  });
});
