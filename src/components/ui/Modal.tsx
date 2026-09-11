import React, { useEffect } from 'react';
import { X } from 'lucide-react';
import { cn } from '../../lib/utils';

export interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: React.ReactNode;
  subtitle?: string;
  children: React.ReactNode;
  footer?: React.ReactNode;
  maxWidth?:
    | 'sm'
    | 'md'
    | 'lg'
    | 'xl'
    | '2xl'
    | '3xl'
    | '4xl'
    | '5xl'
    | '6xl'
    | '7xl';
  theme?: 'light' | 'dark';
}

export const Modal: React.FC<ModalProps> = ({
  isOpen,
  onClose,
  title,
  subtitle,
  children,
  footer,
  maxWidth = 'md',
  theme = 'light',
}) => {
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose();
    };
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      window.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.body.style.overflow = 'unset';
      window.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  const maxWidthStyles: Record<string, string> = {
    sm: 'max-w-sm',
    md: 'max-w-md',
    lg: 'max-w-lg',
    xl: 'max-w-xl',
    '2xl': 'max-w-2xl',
    '3xl': 'max-w-3xl',
    '4xl': 'max-w-4xl',
    '5xl': 'max-w-5xl',
    '6xl': 'max-w-6xl',
    '7xl': 'max-w-7xl',
  };

  const isLight = theme === 'light';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 sm:p-6 overflow-y-auto">
      <div
        className="fixed inset-0 bg-slate-950/60 backdrop-blur-sm transition-opacity"
        onClick={onClose}
      />
      <div
        className={cn(
          'relative w-full rounded-3xl shadow-2xl border z-10 animate-in fade-in zoom-in-95 duration-150 my-auto',
          isLight
            ? 'bg-white p-6 sm:p-7 border-slate-200/90 text-slate-800'
            : 'bg-[#14161F] p-6 border-slate-700/60 text-slate-300',
          maxWidthStyles[maxWidth],
        )}
      >
        <div
          className={cn(
            'flex items-start justify-between pb-4 border-b',
            isLight ? 'border-slate-100' : 'border-slate-800',
          )}
        >
          <div>
            <h3
              className={cn(
                'text-lg sm:text-xl font-extrabold tracking-tight',
                isLight ? 'text-slate-900' : 'text-white',
              )}
            >
              {title}
            </h3>
            {subtitle && (
              <p
                className={cn(
                  'text-xs mt-0.5',
                  isLight ? 'text-slate-500' : 'text-slate-400',
                )}
              >
                {subtitle}
              </p>
            )}
          </div>
          <button
            onClick={onClose}
            className={cn(
              'p-1.5 rounded-xl transition-colors cursor-pointer',
              isLight
                ? 'text-slate-400 hover:text-slate-700 hover:bg-slate-100'
                : 'text-slate-400 hover:text-white hover:bg-slate-800/60',
            )}
            title="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>
        <div className="py-4">{children}</div>
        {footer && (
          <div
            className={cn(
              'pt-4 border-t flex justify-end gap-3',
              isLight ? 'border-slate-100' : 'border-slate-800',
            )}
          >
            {footer}
          </div>
        )}
      </div>
    </div>
  );
};
