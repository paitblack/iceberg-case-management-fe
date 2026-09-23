import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { AiCaseSummaryCard } from './AiCaseSummaryCard';
import * as apiClient from '../../../lib/api-client';

vi.mock('../../../lib/api-client', () => ({
  generateCaseSummary: vi.fn(),
}));

describe('AiCaseSummaryCard', () => {
  const sampleMarkdown = `### Case Purpose
Sale of residential freehold property at 14 Elm Road.

### Process and Key Events
- Draft contract pack dispatched to buyer solicitor.
- Local authority searches received with no adverse entries.
- Exchange of contracts completed on **15 Aug 2026**.

### Outcome and Participant Roles
The transaction completed successfully on 28 Aug 2026. David Vance (Buyer Solicitor) and Sarah Jenkins (Estate Agent) finalized all completion statements.`;

  beforeEach(() => {
    vi.restoreAllMocks();
  });

  it('does not render anything when case status is Open or OnHold', () => {
    const { container: containerOpen } = render(
      <AiCaseSummaryCard status="Open" aiSummary={sampleMarkdown} />,
    );
    expect(containerOpen).toBeEmptyDOMElement();

    const { container: containerOnHold } = render(
      <AiCaseSummaryCard status="OnHold" aiSummary={sampleMarkdown} />,
    );
    expect(containerOnHold).toBeEmptyDOMElement();
  });

  it('renders pending status banner and skeleton placeholders when Completed but summary is pending', () => {
    render(<AiCaseSummaryCard status="Completed" aiSummary={null} />);

    expect(screen.getByText('Case Resolution Summary')).toBeInTheDocument();
    expect(screen.getByText('AI Generated')).toBeInTheDocument();
    expect(
      screen.getByText(/AI summary is being generated for this case.../i),
    ).toBeInTheDocument();
  });

  it('renders pending status banner when Cancelled but summary is pending', () => {
    render(<AiCaseSummaryCard status="Cancelled" aiSummary={undefined} />);

    expect(screen.getByText('Case Resolution Summary')).toBeInTheDocument();
    expect(
      screen.getByText(/AI summary is being generated for this case.../i),
    ).toBeInTheDocument();
  });

  it('renders the 3 structured sections cleanly with headings, bullets, and bold text', () => {
    render(
      <AiCaseSummaryCard status="Completed" aiSummary={sampleMarkdown} />,
    );

    expect(screen.getByText('Case Resolution Summary')).toBeInTheDocument();
    expect(screen.getByText('AI Generated')).toBeInTheDocument();

    // Section titles
    expect(screen.getByText('Case Purpose')).toBeInTheDocument();
    expect(screen.getByText('Process and Key Events')).toBeInTheDocument();
    expect(screen.getByText('Outcome and Participant Roles')).toBeInTheDocument();

    // Section body content
    expect(
      screen.getByText(/Sale of residential freehold property at 14 Elm Road/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/Draft contract pack dispatched to buyer solicitor/i),
    ).toBeInTheDocument();
    expect(
      screen.getByText(/The transaction completed successfully on 28 Aug 2026/i),
    ).toBeInTheDocument();

    // Bold text
    expect(screen.getByText('15 Aug 2026')).toBeInTheDocument();
  });

  it('toggles collapse and expand when Hide/Show Details button is clicked', () => {
    render(
      <AiCaseSummaryCard status="Completed" aiSummary={sampleMarkdown} />,
    );

    const toggleBtn = screen.getByRole('button', { name: /Hide/i });
    expect(screen.getByText('Case Purpose')).toBeInTheDocument();

    // Click Hide
    fireEvent.click(toggleBtn);
    expect(screen.queryByText('Case Purpose')).not.toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Show Details/i })).toBeInTheDocument();

    // Click Show Details
    fireEvent.click(screen.getByRole('button', { name: /Show Details/i }));
    expect(screen.getByText('Case Purpose')).toBeInTheDocument();
  });

  it('copies markdown summary to clipboard when Copy button is clicked', async () => {
    const writeTextMock = vi.fn().mockResolvedValue(undefined);
    Object.assign(navigator, {
      clipboard: {
        writeText: writeTextMock,
      },
    });

    render(
      <AiCaseSummaryCard status="Completed" aiSummary={sampleMarkdown} />,
    );

    const copyBtn = screen.getByRole('button', { name: /Copy/i });
    fireEvent.click(copyBtn);

    expect(writeTextMock).toHaveBeenCalledWith(sampleMarkdown);
    expect(await screen.findByText(/Copied/i)).toBeInTheDocument();
  });

  it('renders un-sectioned plain markdown gracefully', () => {
    const plainText = 'Case was resolved after amicable agreement between all parties.';
    render(
      <AiCaseSummaryCard status="Completed" aiSummary={plainText} />,
    );

    expect(screen.getByText('Case Resolution Summary')).toBeInTheDocument();
    expect(screen.getByText(plainText)).toBeInTheDocument();
  });

  it('automatically triggers generateCaseSummary when completed case has no aiSummary', async () => {
    vi.mocked(apiClient.generateCaseSummary).mockResolvedValueOnce({
      success: true,
      aiSummary: '### Case Purpose\nAuto-generated summary content.',
    });

    render(
      <AiCaseSummaryCard
        status="Completed"
        aiSummary={null}
        caseId="case-auto-1"
      />,
    );

    await waitFor(() => {
      expect(apiClient.generateCaseSummary).toHaveBeenCalledWith('case-auto-1');
    });
    expect(
      await screen.findByText('Auto-generated summary content.'),
    ).toBeInTheDocument();
  });

  it('manually triggers generateCaseSummary when Refresh Summary button is clicked', async () => {
    vi.mocked(apiClient.generateCaseSummary).mockResolvedValueOnce({
      success: true,
      aiSummary: '### Case Purpose\nRefreshed summary content.',
    });
    const onRefreshMock = vi.fn();

    render(
      <AiCaseSummaryCard
        status="Completed"
        aiSummary="Initial summary"
        caseId="case-refresh-1"
        onRefresh={onRefreshMock}
      />,
    );

    const refreshBtn = screen.getByRole('button', { name: /Refresh Summary/i });
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(apiClient.generateCaseSummary).toHaveBeenCalledWith(
        'case-refresh-1',
      );
    });
    expect(onRefreshMock).toHaveBeenCalled();
  });

  it('does not violate React rules of hooks when transitioning status between Open and Completed', () => {
    const { rerender } = render(
      <AiCaseSummaryCard status="Open" aiSummary={null} />,
    );
    expect(
      screen.queryByText('Case Resolution Summary'),
    ).not.toBeInTheDocument();

    // Transition to Completed (previously caused "Rendered fewer hooks than expected" error)
    rerender(
      <AiCaseSummaryCard
        status="Completed"
        aiSummary="### Case Purpose\nCompleted content"
      />,
    );
    expect(screen.getByText('Case Resolution Summary')).toBeInTheDocument();

    // Reopen to Open
    rerender(<AiCaseSummaryCard status="Open" aiSummary={null} />);
    expect(
      screen.queryByText('Case Resolution Summary'),
    ).not.toBeInTheDocument();
  });
});
