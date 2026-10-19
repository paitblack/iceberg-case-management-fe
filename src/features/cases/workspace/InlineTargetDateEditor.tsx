import React, { useState, useRef, useEffect, useLayoutEffect } from 'react';
import { Calendar, Check, X, Trash2, Clock } from 'lucide-react';
import { Button } from '../../../components/ui/Button';

interface InlineTargetDateEditorProps {
  targetDate?: string;
  onUpdateTargetDate: (targetDate: string | null) => Promise<void>;
  title?: string;
  isReadOnly?: boolean;
  size?: 'xs' | 'sm';
}

export const InlineTargetDateEditor: React.FC<InlineTargetDateEditorProps> = ({
  targetDate,
  onUpdateTargetDate,
  title = 'Target Date',
  isReadOnly = false,
  size = 'xs',
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [placement, setPlacement] = useState<'bottom' | 'top'>('bottom');
  const popoverRef = useRef<HTMLDivElement>(null);

  // Initialize selectedDate from targetDate
  useEffect(() => {
    if (targetDate) {
      const d = new Date(targetDate);
      if (!isNaN(d.getTime())) {
        setSelectedDate(d.toISOString().split('T')[0] ?? '');
      } else {
        setSelectedDate('');
      }
    } else {
      setSelectedDate('');
    }
  }, [targetDate]);

  // Smart placement calculation on open
  useLayoutEffect(() => {
    if (!isOpen || !popoverRef.current) return;
    const rect = popoverRef.current.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const spaceAbove = rect.top;

    // If space below is less than 240px and there is more space above, open upward
    if (spaceBelow < 240 && spaceAbove > 240) {
      setPlacement('top');
    } else {
      setPlacement('bottom');
    }
  }, [isOpen]);

  useEffect(() => {
    if (!isOpen) return;
    const handleClickOutside = (event: MouseEvent) => {
      if (
        popoverRef.current &&
        !popoverRef.current.contains(event.target as Node)
      ) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isOpen]);

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedDate) {
      await handleClear();
      return;
    }
    setIsSubmitting(true);
    try {
      const isoDate = new Date(`${selectedDate}T18:00:00.000Z`).toISOString();
      await onUpdateTargetDate(isoDate);
      setIsOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleClear = async () => {
    setIsSubmitting(true);
    try {
      await onUpdateTargetDate(null);
      setSelectedDate('');
      setIsOpen(false);
    } finally {
      setIsSubmitting(false);
    }
  };

  const formatDisplayDate = (dateStr?: string) => {
    if (!dateStr) return null;
    const d = new Date(dateStr);
    if (isNaN(d.getTime())) return null;
    return d.toLocaleDateString('en-GB', {
      day: 'numeric',
      month: 'short',
      year: 'numeric',
    });
  };

  const formatted = formatDisplayDate(targetDate);

  const sizeClasses = {
    xs: 'px-2 py-0.5 text-[10px]',
    sm: 'px-2.5 py-1 text-xs',
  }[size];

  return (
    <div
      ref={popoverRef}
      className={`relative inline-flex items-center ${isOpen ? 'z-[9999]' : 'z-10'}`}
    >
      <button
        type="button"
        disabled={isReadOnly}
        onClick={(e) => {
          e.stopPropagation();
          if (!isReadOnly) setIsOpen(!isOpen);
        }}
        className={`inline-flex items-center gap-1.5 font-medium rounded-lg border transition-all cursor-pointer select-none ${
          formatted
            ? 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200 shadow-2xs'
            : 'bg-white hover:bg-pink-50 text-slate-400 hover:text-[#E1007A] border-dashed border-slate-300 hover:border-[#E1007A]/40'
        } ${sizeClasses} ${isReadOnly ? 'opacity-70 cursor-default' : ''}`}
        title={isReadOnly ? undefined : 'Click to set or modify SLA target date'}
      >
        <Calendar
          className={`w-3 h-3 ${formatted ? 'text-slate-500' : 'text-slate-400'}`}
        />
        <span>{formatted ? `Target: ${formatted}` : 'Set Target Date'}</span>
      </button>

      {/* Popover Form with Smart Viewport Placement */}
      {isOpen && !isReadOnly && (
        <div
          onClick={(e) => e.stopPropagation()}
          className={`absolute z-[9999] left-0 w-72 rounded-2xl bg-white border border-slate-200 shadow-2xl p-3.5 space-y-3 text-xs animate-in fade-in zoom-in-95 duration-150 ring-1 ring-black/10 ${
            placement === 'top' ? 'bottom-full mb-2' : 'top-full mt-2'
          }`}
          style={{ backgroundColor: '#ffffff' }}
        >
          <div className="flex items-center justify-between border-b border-slate-100 pb-2">
            <div className="flex items-center gap-1.5 font-bold text-slate-800">
              <Clock className="w-3.5 h-3.5 text-[#E1007A]" />
              <span>{title}</span>
            </div>
            <button
              type="button"
              onClick={() => setIsOpen(false)}
              className="text-slate-400 hover:text-slate-600 p-0.5 rounded-md hover:bg-slate-100 transition-colors"
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </div>

          <form onSubmit={handleSave} className="space-y-3">
            <div className="space-y-1">
              <label
                htmlFor="target-date-input"
                className="text-[11px] font-semibold text-slate-500 block"
              >
                Milestone Deadline
              </label>
              <input
                id="target-date-input"
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="w-full px-2.5 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono font-bold text-slate-800 focus:outline-none focus:ring-2 focus:ring-[#E1007A]/20 focus:border-[#E1007A] transition-all"
              />
            </div>

            <div className="flex items-center justify-between gap-2 pt-1">
              {targetDate ? (
                <button
                  type="button"
                  onClick={handleClear}
                  disabled={isSubmitting}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-rose-600 hover:text-rose-700 hover:bg-rose-50 px-2 py-1 rounded-lg transition-colors cursor-pointer"
                >
                  <Trash2 className="w-3 h-3" />
                  <span>Clear</span>
                </button>
              ) : (
                <div />
              )}

              <div className="flex items-center gap-1.5">
                <Button
                  type="button"
                  variant="ghost"
                  size="xs"
                  onClick={() => setIsOpen(false)}
                  disabled={isSubmitting}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  variant="primary"
                  size="xs"
                  isLoading={isSubmitting}
                  leftIcon={<Check className="w-3 h-3" />}
                >
                  Save Date
                </Button>
              </div>
            </div>
          </form>
        </div>
      )}
    </div>
  );
};
