import React from 'react';
import { Trash2 } from 'lucide-react';
import { Modal } from '../../../components/ui/Modal';
import { Button } from '../../../components/ui/Button';

interface ConfirmDeleteModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: () => Promise<void>;
  title: string;
  description: string;
  confirmButtonText?: string;
  isDeleting?: boolean;
  warningText?: string;
}

export const ConfirmDeleteModal: React.FC<ConfirmDeleteModalProps> = ({
  isOpen,
  onClose,
  onConfirm,
  title,
  description,
  confirmButtonText = 'Delete',
  isDeleting = false,
  warningText = 'This action cannot be undone. Custom workflow components will be permanently removed from this case.',
}) => {
  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={
        <div className="flex items-center gap-2.5 text-rose-600">
          <Trash2 className="w-5 h-5 shrink-0" />
          <span>{title}</span>
        </div>
      }
      maxWidth="md"
      footer={
        <>
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            disabled={isDeleting}
          >
            Cancel
          </Button>
          <Button
            type="button"
            variant="danger"
            isLoading={isDeleting}
            onClick={onConfirm}
            leftIcon={<Trash2 className="w-4 h-4" />}
          >
            {confirmButtonText}
          </Button>
        </>
      }
    >
      <div className="py-2 space-y-3">
        <p className="text-sm text-slate-600 leading-relaxed">{description}</p>
        <div className="p-3 bg-rose-50/80 border border-rose-200/80 rounded-xl text-xs text-rose-800 font-medium leading-relaxed">
          {warningText}
        </div>
      </div>
    </Modal>
  );
};
