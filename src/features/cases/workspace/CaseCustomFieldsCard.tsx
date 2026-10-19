import React, { useState, useEffect } from 'react';
import {
  SlidersHorizontal,
  Save,
  RotateCcw,
  CheckCircle2,
  AlertCircle,
  Sparkles,
} from 'lucide-react';
import { Button } from '../../../components/ui/Button';
import type { CustomFieldDefinitionItem } from '../../../types/api';

export type { CustomFieldDefinitionItem };

export interface CaseCustomFieldsCardProps {
  customFields?: CustomFieldDefinitionItem[];
  fieldValues?: Record<string, unknown>;
  isReadOnly?: boolean;
  onSave: (values: Record<string, unknown>) => Promise<void>;
  className?: string;
}

/**
 * Converts camelCase or snake_case into human-readable Title Case
 */
function humanizeFieldName(name: string): string {
  return name
    .replace(/([A-Z])/g, ' $1')
    .replace(/_/g, ' ')
    .replace(/^\w/, (c) => c.toUpperCase())
    .trim();
}

export const CaseCustomFieldsCard: React.FC<CaseCustomFieldsCardProps> = ({
  customFields = [],
  fieldValues = {},
  isReadOnly = false,
  onSave,
  className = '',
}) => {
  const [formData, setFormData] = useState<Record<string, unknown>>({});
  const [isSaving, setIsSaving] = useState<boolean>(false);
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  useEffect(() => {
    const initial: Record<string, unknown> = {};
    for (const field of customFields) {
      if (fieldValues && field.name in fieldValues) {
        initial[field.name] = fieldValues[field.name];
      } else {
        initial[field.name] =
          field.fieldType === 'boolean'
            ? false
            : field.fieldType === 'number'
              ? null
              : '';
      }
    }
    setFormData(initial);
  }, [customFields, fieldValues]);

  const handleChange = (name: string, value: unknown) => {
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
    setSaveSuccess(false);
    setErrorMessage(null);
  };

  const handleReset = () => {
    const initial: Record<string, unknown> = {};
    for (const field of customFields) {
      if (fieldValues && field.name in fieldValues) {
        initial[field.name] = fieldValues[field.name];
      } else {
        initial[field.name] =
          field.fieldType === 'boolean'
            ? false
            : field.fieldType === 'number'
              ? null
              : '';
      }
    }
    setFormData(initial);
    setErrorMessage(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSaving(true);
    setErrorMessage(null);
    setSaveSuccess(false);

    try {
      const payload: Record<string, unknown> = {};
      for (const field of customFields) {
        const val = formData[field.name];
        if (field.fieldType === 'number') {
          payload[field.name] =
            val !== '' && val !== null && val !== undefined
              ? Number(val)
              : null;
        } else if (field.fieldType === 'date') {
          payload[field.name] = val ? String(val) : null;
        } else if (field.fieldType === 'boolean') {
          payload[field.name] = Boolean(val);
        } else {
          payload[field.name] = val !== undefined ? val : null;
        }
      }

      await onSave(payload);
      setSaveSuccess(true);
      setTimeout(() => setSaveSuccess(false), 4000);
    } catch (err: unknown) {
      const message =
        err instanceof Error
          ? err.message
          : 'Failed to update case criteria. Please verify input values.';
      setErrorMessage(message);
    } finally {
      setIsSaving(false);
    }
  };

  if (customFields.length === 0) {
    return (
      <div
        className={`bg-white rounded-2xl border border-slate-200/80 p-6 shadow-2xs text-center ${className}`}
      >
        <div className="w-12 h-12 rounded-full bg-slate-100 text-slate-400 mx-auto flex items-center justify-center mb-3">
          <SlidersHorizontal className="w-6 h-6" />
        </div>
        <h4 className="text-sm font-bold text-slate-900 mb-1">
          No custom criteria configured for this template
        </h4>
        <p className="text-xs text-slate-500 max-w-md mx-auto">
          This case template operates using standard milestone dates and participant evidence without conditional custom fields.
        </p>
      </div>
    );
  }

  return (
    <div
      className={`bg-white rounded-2xl border border-slate-200/80 shadow-2xs overflow-hidden ${className}`}
    >
      {/* Header */}
      <div className="px-6 py-4 border-b border-slate-100 flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-slate-50/50">
        <div className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl bg-purple-100 text-purple-700 flex items-center justify-center shadow-xs">
            <SlidersHorizontal className="w-5 h-5" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold text-slate-900 flex items-center gap-2">
              <span>Case Criteria & Custom Fields</span>
              <span className="text-[10px] font-semibold text-purple-700 bg-purple-50 border border-purple-200/80 px-2 py-0.5 rounded-full">
                {customFields.length} Defined
              </span>
            </h3>
            <p className="text-xs text-slate-500">
              Transaction attributes that determine requirements and conditional progression tasks.
            </p>
          </div>
        </div>

        {saveSuccess && (
          <div className="flex items-center gap-1.5 text-xs font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200/80 px-3 py-1.5 rounded-lg animate-in fade-in">
            <CheckCircle2 className="w-4 h-4 text-emerald-600" />
            <span>Criteria saved & conditions evaluated</span>
          </div>
        )}
      </div>

      {/* Form Body */}
      <form onSubmit={handleSubmit} className="p-6 space-y-6">
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 flex items-start gap-2.5 text-xs text-rose-800">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <span>{errorMessage}</span>
          </div>
        )}

        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {customFields.map((field) => {
            const rawVal = formData[field.name];
            const label = humanizeFieldName(field.name);
            const inputId = `field-${field.id}`;

            return (
              <div
                key={field.id}
                className="space-y-1.5 p-3.5 rounded-xl bg-slate-50/60 border border-slate-200/70 hover:border-slate-300 transition-colors"
              >
                <div className="flex items-center justify-between gap-2">
                  <label
                    htmlFor={inputId}
                    className="text-xs font-bold text-slate-800 flex items-center gap-1.5"
                  >
                    <span>{label}</span>
                    {field.required ? (
                      <span className="text-[10px] font-semibold text-rose-600">
                        *
                      </span>
                    ) : (
                      <span className="text-[10px] font-medium text-slate-600">
                        (optional)
                      </span>
                    )}
                  </label>

                  <span className="text-[10px] uppercase font-bold tracking-wider text-slate-600 bg-white border border-slate-200/80 px-1.5 py-0.5 rounded">
                    {field.fieldType}
                  </span>
                </div>

                {/* Boolean Field: Switch Toggle */}
                {field.fieldType === 'boolean' && (
                  <div className="pt-1 flex items-center justify-between">
                    <span className="text-xs font-medium text-slate-600">
                      {rawVal ? 'Yes / Applicable' : 'No / Not Required'}
                    </span>
                    <label className="relative inline-flex items-center cursor-pointer">
                      <input
                        id={inputId}
                        type="checkbox"
                        aria-label={label}
                        checked={Boolean(rawVal)}
                        disabled={isReadOnly}
                        onChange={(e) =>
                          handleChange(field.name, e.target.checked)
                        }
                        className="sr-only peer"
                      />
                      <div className="w-11 h-6 bg-slate-200 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-slate-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-[#E1007A]" />
                    </label>
                  </div>
                )}

                {/* Select Field */}
                {field.fieldType === 'select' && (
                  <select
                    id={inputId}
                    aria-label={label}
                    value={rawVal ? String(rawVal) : ''}
                    disabled={isReadOnly}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E1007A]/20 focus:border-[#E1007A] disabled:bg-slate-100 disabled:text-slate-400"
                  >
                    <option value="">Select option...</option>
                    {(field.options || []).map((opt) => (
                      <option key={opt} value={opt}>
                        {opt}
                      </option>
                    ))}
                  </select>
                )}

                {/* Number Field */}
                {field.fieldType === 'number' && (
                  <input
                    id={inputId}
                    type="number"
                    aria-label={label}
                    value={
                      rawVal !== null && rawVal !== undefined
                        ? String(rawVal)
                        : ''
                    }
                    disabled={isReadOnly}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    placeholder="Enter number..."
                    className="w-full px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E1007A]/20 focus:border-[#E1007A] disabled:bg-slate-100 disabled:text-slate-400"
                  />
                )}

                {/* Date Field */}
                {field.fieldType === 'date' && (
                  <input
                    id={inputId}
                    type="date"
                    aria-label={label}
                    value={rawVal ? String(rawVal).slice(0, 10) : ''}
                    disabled={isReadOnly}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    className="w-full px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E1007A]/20 focus:border-[#E1007A] disabled:bg-slate-100 disabled:text-slate-400"
                  />
                )}

                {/* Text Field & Multi-Select fallback */}
                {(field.fieldType === 'text' ||
                  field.fieldType === 'multi-select') && (
                  <input
                    id={inputId}
                    type="text"
                    aria-label={label}
                    value={rawVal ? String(rawVal) : ''}
                    disabled={isReadOnly}
                    onChange={(e) => handleChange(field.name, e.target.value)}
                    placeholder="Enter value..."
                    className="w-full px-3 py-2 text-xs font-medium bg-white border border-slate-200 rounded-lg text-slate-900 focus:outline-none focus:ring-2 focus:ring-[#E1007A]/20 focus:border-[#E1007A] disabled:bg-slate-100 disabled:text-slate-400"
                  />
                )}
              </div>
            );
          })}
        </div>

        {/* Workflow Information Helper Callout */}
        <div className="flex items-start gap-2.5 p-3.5 bg-purple-50/60 rounded-xl border border-purple-200/80 text-xs text-purple-900">
          <Sparkles className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
          <p>
            <strong>Dynamic Workflow Progression:</strong> Saving these criteria will immediately re-evaluate rule conditions across milestone steps. Conditional work items (such as mortgage valuations or special title inquiries) will automatically waive or re-activate.
          </p>
        </div>

        {/* Form Actions Footer */}
        {!isReadOnly && (
          <div className="flex items-center justify-end gap-3 pt-2 border-t border-slate-100">
            <Button
              type="button"
              variant="secondary"
              size="sm"
              disabled={isSaving}
              onClick={handleReset}
              leftIcon={<RotateCcw className="w-3.5 h-3.5" />}
            >
              Reset
            </Button>
            <Button
              type="submit"
              variant="primary"
              size="sm"
              isLoading={isSaving}
              leftIcon={<Save className="w-3.5 h-3.5" />}
            >
              Save Case Criteria
            </Button>
          </div>
        )}
      </form>
    </div>
  );
};
