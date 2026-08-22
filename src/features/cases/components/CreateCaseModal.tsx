import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import {
  Layers,
  Sparkles,
  Home,
  PoundSterling,
  AlertCircle,
} from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';
import { Input } from '../../../components/ui/Input';
import { Badge } from '../../../components/ui/Badge';
import {
  createCase,
  fetchPublishedTemplates,
  ApiError,
} from '../../../lib/api-client';
import type { PublishedTemplateItem } from '../../../types/api';

interface CreateCaseModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: (newCaseId: string) => void;
}

export const CreateCaseModal: React.FC<CreateCaseModalProps> = ({
  isOpen,
  onClose,
  onSuccess,
}) => {
  const navigate = useNavigate();

  // Form state
  const [title, setTitle] = useState<string>('');
  const [templateVersionId, setTemplateVersionId] = useState<string>('');
  const [propertyAddress, setPropertyAddress] = useState<string>('');
  const [agreedPrice, setAgreedPrice] = useState<string>('');

  // Templates state
  const [templates, setTemplates] = useState<PublishedTemplateItem[]>([]);
  const [isLoadingTemplates, setIsLoadingTemplates] = useState<boolean>(false);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Load published templates on modal open
  useEffect(() => {
    if (isOpen) {
      setIsLoadingTemplates(true);
      setErrorMessage(null);
      fetchPublishedTemplates()
        .then((res) => {
          if (res && res.length > 0) {
            setTemplates(res);
            setTemplateVersionId(res[0].id);
          } else {
            setTemplates([]);
            setTemplateVersionId('');
          }
        })
        .catch(() => {
          setTemplates([]);
          setTemplateVersionId('');
        })
        .finally(() => {
          setIsLoadingTemplates(false);
        });
    }
  }, [isOpen]);

  const selectedTemplate = templates.find((t) => t.id === templateVersionId);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) {
      setErrorMessage('Please enter a descriptive case title.');
      return;
    }
    if (!templateVersionId) {
      setErrorMessage('Please select a workflow template version.');
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    try {
      const targetCaseTypeId =
        selectedTemplate?.caseTypeId || selectedTemplate?.id;

      const payload = {
        title: title.trim(),
        caseTypeId: targetCaseTypeId,
        propertyAddress: propertyAddress.trim() || undefined,
        agreedPrice: agreedPrice
          ? Number(agreedPrice.replace(/[^0-9.]/g, ''))
          : undefined,
      };

      const res = await createCase(payload);
      const newCaseId = res.id;

      onClose();
      if (onSuccess) {
        onSuccess(newCaseId);
      } else {
        navigate(`/cases/${newCaseId}`);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setErrorMessage(err.problem.detail || err.message);
      } else if (err instanceof Error) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to create case in backend database.');
      }
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title="Start New Case Workflow"
      footer={
        <>
          <Button
            variant="ghost"
            size="sm"
            onClick={onClose}
            disabled={isSubmitting}
          >
            Cancel
          </Button>
          <Button
            variant="primary"
            size="sm"
            isLoading={isSubmitting}
            onClick={handleSubmit}
            disabled={templates.length === 0}
            leftIcon={<Sparkles className="w-3.5 h-3.5" />}
          >
            Launch Case Workflow
          </Button>
        </>
      }
    >
      <form onSubmit={handleSubmit} className="space-y-4 text-xs text-slate-700">
        {errorMessage && (
          <div className="p-3.5 rounded-xl bg-rose-50 border border-rose-200 text-rose-800 flex items-start gap-2.5 shadow-2xs">
            <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />
            <div className="space-y-0.5 flex-1 min-w-0">
              <p className="font-bold">Cannot Create Case</p>
              <p className="text-[11px] leading-relaxed break-words">
                {errorMessage}
              </p>
            </div>
          </div>
        )}

        {/* Title Input */}
        <div className="space-y-1">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Case Title <span className="text-[#E1007A]">*</span>
          </label>
          <Input
            placeholder="e.g. 42 Woodstock Road Sale Progression"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            autoFocus
            className="text-xs"
          />
          <p className="text-[10px] text-slate-400">
            A clear title identifying the property or conveyancing transaction.
          </p>
        </div>

        {/* Template Selector */}
        <div className="space-y-1.5">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500 flex items-center justify-between">
            <span>
              Workflow Template Package <span className="text-[#E1007A]">*</span>
            </span>
            {isLoadingTemplates && (
              <span className="text-[10px] text-slate-400 font-normal animate-pulse">
                Fetching published versions...
              </span>
            )}
          </label>

          {templates.length === 0 && !isLoadingTemplates ? (
            <div className="p-4 rounded-xl bg-amber-50 border border-amber-200 text-amber-800 text-xs space-y-1">
              <p className="font-bold">No Published Templates Found</p>
              <p className="text-[11px]">
                Please publish a workflow template in the Template Studio first to launch new cases.
              </p>
            </div>
          ) : (
            <div className="space-y-2 max-h-56 overflow-y-auto pr-1">
              {templates.map((tpl) => {
                const isSelected = tpl.id === templateVersionId;
                return (
                  <div
                    key={tpl.id}
                    onClick={() => setTemplateVersionId(tpl.id)}
                    className={`p-3 rounded-xl border transition-all cursor-pointer space-y-1 ${
                      isSelected
                        ? 'border-[#E1007A] bg-pink-50/50 ring-2 ring-[#E1007A]/10 shadow-2xs'
                        : 'border-slate-200 bg-white hover:border-slate-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div
                          className={`w-5 h-5 rounded-lg flex items-center justify-center ${
                            isSelected
                              ? 'bg-[#E1007A] text-white'
                              : 'bg-slate-100 text-slate-500'
                          }`}
                        >
                          <Layers className="w-3 h-3" />
                        </div>
                        <span className="font-bold text-slate-900 text-xs">
                          {tpl.name}
                        </span>
                      </div>
                      <Badge
                        variant={isSelected ? 'required' : 'default'}
                        size="xs"
                      >
                        v{tpl.versionNumber}.0
                      </Badge>
                    </div>

                    <p className="text-[11px] text-slate-500 line-clamp-2 pl-7">
                      {tpl.description}
                    </p>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Property Address */}
        <div className="space-y-1">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Property Address (Optional)
          </label>
          <div className="relative">
            <Home className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <Input
              placeholder="e.g. 42 Woodstock Road, Oxford"
              value={propertyAddress}
              onChange={(e) => setPropertyAddress(e.target.value)}
              className="pl-8 text-xs"
            />
          </div>
        </div>

        {/* Agreed Sale Price */}
        <div className="space-y-1">
          <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
            Agreed Transaction Price (Optional)
          </label>
          <div className="relative">
            <PoundSterling className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-3" />
            <Input
              placeholder="e.g. 475000"
              value={agreedPrice}
              onChange={(e) => setAgreedPrice(e.target.value)}
              className="pl-8 text-xs font-mono"
            />
          </div>
        </div>
      </form>
    </Modal>
  );
};
