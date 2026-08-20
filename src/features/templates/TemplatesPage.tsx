import React, { useState } from 'react';
import {
  FileCode,
  Plus,
  GitBranch,
  CheckCircle,
  Layers,
  ArrowRight,
} from 'lucide-react';
import { Card } from '../../components/ui/Card';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import { Input } from '../../components/ui/Input';
import { Modal } from '../../components/ui/Modal';
import type { CaseType } from '../../types/api';

const mockCaseTypes: CaseType[] = [
  {
    id: 'ct-1',
    companyId: 'comp-1001',
    name: 'UK Residential Sales Progression',
    description:
      'Standard England & Wales conveyance and sales progression workflow with AML, mortgage verification, and exchange.',
    publishedVersionCount: 3,
    activeDraftId: 'draft-101',
    createdAt: '2026-08-01T10:00:00Z',
    updatedAt: '2026-08-20T12:00:00Z',
  },
  {
    id: 'ct-2',
    companyId: 'comp-1001',
    name: 'Market Appraisal & Valuation',
    description:
      'Lead qualification, desktop valuation, in-person inspection, and proposal generation flow.',
    publishedVersionCount: 1,
    activeDraftId: null,
    createdAt: '2026-08-10T14:30:00Z',
    updatedAt: '2026-08-15T09:45:00Z',
  },
];

export const TemplatesPage: React.FC = () => {
  const [caseTypes, setCaseTypes] = useState<CaseType[]>(mockCaseTypes);
  const [isCreateModalOpen, setIsCreateModalOpen] = useState(false);
  const [newTypeName, setNewTypeName] = useState('');
  const [newTypeDescription, setNewTypeDescription] = useState('');

  const handleCreateCaseType = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newTypeName.trim()) return;

    const newType: CaseType = {
      id: `ct-${Date.now()}`,
      companyId: 'comp-1001',
      name: newTypeName,
      description: newTypeDescription,
      publishedVersionCount: 0,
      activeDraftId: `draft-${Date.now()}`,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    setCaseTypes([newType, ...caseTypes]);
    setNewTypeName('');
    setNewTypeDescription('');
    setIsCreateModalOpen(false);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-2xl font-extrabold text-white tracking-tight flex items-center gap-3">
            <FileCode className="w-7 h-7 text-indigo-400" />
            Template Engine & Case Types
          </h1>
          <p className="text-sm text-slate-400 mt-1">
            Configure DAG-based progression stages, required milestones, roles,
            and immutable version releases.
          </p>
        </div>
        <Button
          variant="primary"
          size="md"
          leftIcon={<Plus className="w-4 h-4" />}
          onClick={() => setIsCreateModalOpen(true)}
        >
          Create Case Type
        </Button>
      </div>

      {/* Case Types Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {caseTypes.map((ct) => (
          <Card key={ct.id} className="flex flex-col justify-between space-y-4">
            <div className="space-y-2">
              <div className="flex items-start justify-between gap-3">
                <div className="flex items-center gap-2">
                  <div className="w-8 h-8 rounded-lg bg-indigo-500/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
                    <Layers className="w-4 h-4" />
                  </div>
                  <h3 className="text-base font-bold text-white">{ct.name}</h3>
                </div>
                <Badge variant={ct.activeDraftId ? 'warning' : 'success'}>
                  {ct.activeDraftId ? 'Draft in Progress' : 'Published'}
                </Badge>
              </div>
              <p className="text-xs text-slate-400 leading-relaxed">
                {ct.description || 'No description provided.'}
              </p>
            </div>

            <div className="pt-4 border-t border-slate-800/80 flex items-center justify-between">
              <div className="flex items-center gap-4 text-xs text-slate-400">
                <span className="flex items-center gap-1.5 font-mono">
                  <GitBranch className="w-3.5 h-3.5 text-indigo-400" />v
                  {ct.publishedVersionCount}.0
                </span>
                <span className="flex items-center gap-1.5">
                  <CheckCircle className="w-3.5 h-3.5 text-emerald-400" />
                  Immutable Versions: {ct.publishedVersionCount}
                </span>
              </div>

              <Button
                variant="secondary"
                size="sm"
                rightIcon={<ArrowRight className="w-3.5 h-3.5" />}
              >
                Edit Steps & DAG
              </Button>
            </div>
          </Card>
        ))}
      </div>

      {/* Create Case Type Modal */}
      <Modal
        isOpen={isCreateModalOpen}
        onClose={() => setIsCreateModalOpen(false)}
        title="Create New Case Type"
        footer={
          <>
            <Button
              variant="ghost"
              size="sm"
              onClick={() => setIsCreateModalOpen(false)}
            >
              Cancel
            </Button>
            <Button
              variant="primary"
              size="sm"
              onClick={handleCreateCaseType}
              disabled={!newTypeName.trim()}
            >
              Create Draft
            </Button>
          </>
        }
      >
        <form onSubmit={handleCreateCaseType} className="space-y-4">
          <Input
            label="Case Type Name"
            placeholder="e.g. Commercial Conveyancing Flow"
            value={newTypeName}
            onChange={(e) => setNewTypeName(e.target.value)}
            required
          />
          <div className="space-y-1.5">
            <label className="block text-xs font-medium text-slate-300">
              Description
            </label>
            <textarea
              className="w-full rounded-lg bg-slate-900/80 border border-slate-800 px-3.5 py-2 text-sm text-slate-100 placeholder:text-slate-500 transition-colors focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
              rows={3}
              placeholder="Explain the process, required checks, and target use case..."
              value={newTypeDescription}
              onChange={(e) => setNewTypeDescription(e.target.value)}
            />
          </div>
        </form>
      </Modal>
    </div>
  );
};
