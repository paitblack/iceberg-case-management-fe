import React, { useState } from 'react';
import {
  Sparkles,
  Bot,
  Target,
  ListChecks,
  CheckCircle2,
  Clock,
  ChevronDown,
  ChevronUp,
  Copy,
  Check,
  FileText,
} from 'lucide-react';
import type { CaseLifecycleStatus } from '../../../types/api';

interface AiCaseSummaryCardProps {
  status: CaseLifecycleStatus | 'Open' | 'OnHold' | 'Completed' | 'Cancelled';
  aiSummary?: string | null;
  isLoading?: boolean;
}

interface ParsedSection {
  title: string;
  items: Array<{
    type: 'bullet' | 'paragraph';
    text: string;
  }>;
}

function parseMarkdownSummary(markdown: string): ParsedSection[] {
  const lines = markdown.split('\n');
  const sections: ParsedSection[] = [];
  let currentSection: ParsedSection | null = null;

  for (const rawLine of lines) {
    const line = rawLine.trim();
    if (!line) continue;

    // Check for Markdown headings (e.g. ### Case Purpose)
    const headingMatch = line.match(/^#{1,4}\s+(.+)$/);
    if (headingMatch) {
      if (currentSection) {
        sections.push(currentSection);
      }
      currentSection = {
        title: headingMatch[1].trim(),
        items: [],
      };
      continue;
    }

    // If no heading encountered yet, create a default Overview section
    if (!currentSection) {
      currentSection = {
        title: 'Overview',
        items: [],
      };
    }

    // Check for bullet items (e.g. - item or * item)
    const bulletMatch = line.match(/^[-*]\s+(.+)$/);
    if (bulletMatch) {
      currentSection.items.push({
        type: 'bullet',
        text: bulletMatch[1].trim(),
      });
    } else {
      currentSection.items.push({
        type: 'paragraph',
        text: line,
      });
    }
  }

  if (currentSection) {
    sections.push(currentSection);
  }

  return sections;
}

function renderFormattedText(text: string): React.ReactNode {
  // Support inline bold **text**
  const parts = text.split(/(\*\*[^*]+\*\*)/g);
  return parts.map((part, idx) => {
    if (part.startsWith('**') && part.endsWith('**')) {
      return (
        <strong key={idx} className="font-semibold text-slate-900">
          {part.slice(2, -2)}
        </strong>
      );
    }
    return <span key={idx}>{part}</span>;
  });
}

function getSectionIcon(title: string): React.ReactNode {
  const normalized = title.toLowerCase();
  if (normalized.includes('purpose')) {
    return <Target className="w-4 h-4 text-indigo-600 shrink-0" />;
  }
  if (normalized.includes('process') || normalized.includes('event')) {
    return <ListChecks className="w-4 h-4 text-blue-600 shrink-0" />;
  }
  if (normalized.includes('outcome') || normalized.includes('role')) {
    return <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0" />;
  }
  return <FileText className="w-4 h-4 text-slate-600 shrink-0" />;
}

export const AiCaseSummaryCard: React.FC<AiCaseSummaryCardProps> = ({
  status,
  aiSummary,
  isLoading = false,
}) => {
  const [isCollapsed, setIsCollapsed] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);

  // Render only for Completed or Cancelled cases
  const isClosed = status === 'Completed' || status === 'Cancelled';
  if (!isClosed) {
    return null;
  }

  const handleCopy = async () => {
    if (!aiSummary) return;
    try {
      await navigator.clipboard.writeText(aiSummary);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // Ignore clipboard error
    }
  };

  const sections = aiSummary ? parseMarkdownSummary(aiSummary) : [];

  return (
    <section
      aria-label="AI Case Resolution Summary"
      className="rounded-2xl bg-gradient-to-br from-indigo-50/40 via-white to-slate-50/60 border border-indigo-100 shadow-xs p-5 md:p-6 transition-all space-y-4"
    >
      {/* Header Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-indigo-100/70 border border-indigo-200/80 flex items-center justify-center text-indigo-600 shrink-0 shadow-2xs">
            <Sparkles className="w-4 h-4" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-sm font-bold text-slate-900 tracking-tight">
                Case Resolution Summary
              </h3>
              <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-bold bg-indigo-100/80 text-indigo-700 border border-indigo-200/70">
                <Bot className="w-3 h-3 text-indigo-600" />
                AI Generated
              </span>
            </div>
            <p className="text-xs text-slate-500 mt-0.5">
              Structured summary of case purpose, timeline milestones, and final resolution.
            </p>
          </div>
        </div>

        {/* Action Controls */}
        <div className="flex items-center gap-2 self-end sm:self-auto">
          {aiSummary && (
            <button
              type="button"
              onClick={handleCopy}
              className="inline-flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
              title="Copy Summary to Clipboard"
            >
              {copied ? (
                <>
                  <Check className="w-3.5 h-3.5 text-emerald-600" />
                  <span className="text-emerald-700">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3.5 h-3.5 text-slate-400" />
                  <span>Copy</span>
                </>
              )}
            </button>
          )}

          <button
            type="button"
            onClick={() => setIsCollapsed(!isCollapsed)}
            className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-slate-600 hover:text-slate-900 bg-white border border-slate-200 hover:bg-slate-50 transition-colors shadow-2xs cursor-pointer"
            aria-expanded={!isCollapsed}
          >
            <span>{isCollapsed ? 'Show Details' : 'Hide'}</span>
            {isCollapsed ? (
              <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
            ) : (
              <ChevronUp className="w-3.5 h-3.5 text-slate-400" />
            )}
          </button>
        </div>
      </div>

      {/* Body Content */}
      {!isCollapsed && (
        <div className="space-y-4 pt-1">
          {isLoading || !aiSummary ? (
            /* Pending / Asynchronous Generation State */
            <div className="space-y-3">
              <div className="p-4 rounded-xl bg-indigo-50/70 border border-indigo-100 flex items-start gap-3 text-xs">
                <Clock className="w-4 h-4 text-indigo-600 shrink-0 mt-0.5 animate-pulse" />
                <div className="space-y-0.5">
                  <p className="font-semibold text-indigo-900">
                    AI summary is being generated for this case...
                  </p>
                  <p className="text-indigo-700 text-[11px] leading-relaxed">
                    The background worker analyzes key milestones, notes, and activity history to produce a natural language summary. This will update automatically upon completion.
                  </p>
                </div>
              </div>

              {/* Skeleton place-holders */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3">
                {[1, 2, 3].map((idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-xl bg-white/80 border border-slate-200/80 space-y-2.5 animate-pulse"
                  >
                    <div className="h-3.5 bg-slate-200 rounded w-2/3" />
                    <div className="space-y-1.5">
                      <div className="h-2.5 bg-slate-100 rounded w-full" />
                      <div className="h-2.5 bg-slate-100 rounded w-5/6" />
                      <div className="h-2.5 bg-slate-100 rounded w-4/6" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ) : sections.length > 0 ? (
            /* Structured 3-Section Cards Grid */
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-4 items-stretch">
              {sections.map((section, sIdx) => (
                <div
                  key={sIdx}
                  className="rounded-xl bg-white/90 border border-slate-200/90 p-4 space-y-3 shadow-2xs flex flex-col justify-between"
                >
                  <div className="space-y-2.5">
                    {/* Section Header */}
                    <div className="flex items-center gap-2 border-b border-slate-100 pb-2">
                      {getSectionIcon(section.title)}
                      <h4 className="text-xs font-bold text-slate-800 tracking-wide">
                        {section.title}
                      </h4>
                    </div>

                    {/* Section Items */}
                    <div className="space-y-2">
                      {section.items.map((item, iIdx) =>
                        item.type === 'bullet' ? (
                          <div key={iIdx} className="flex items-start gap-2 text-xs text-slate-600 leading-relaxed">
                            <span className="w-1.5 h-1.5 rounded-full bg-indigo-500 mt-1.5 shrink-0" />
                            <div className="flex-1 min-w-0">{renderFormattedText(item.text)}</div>
                          </div>
                        ) : (
                          <p key={iIdx} className="text-xs text-slate-600 leading-relaxed">
                            {renderFormattedText(item.text)}
                          </p>
                        ),
                      )}
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            /* Fallback Graceful Render */
            <div className="p-4 rounded-xl bg-white border border-slate-200 text-xs text-slate-600 leading-relaxed">
              {renderFormattedText(aiSummary)}
            </div>
          )}
        </div>
      )}
    </section>
  );
};
