import React, { useState } from 'react';
import {
  GripVertical,
  CheckCircle2,
  ArrowRight,
  AlertTriangle,
  Plus,
  ChevronRight,
  Eye,
  FileText,
  Zap,
  Edit3,
  Send,
} from 'lucide-react';
import { Badge } from '../../components/ui/Badge';
import { Button } from '../../components/ui/Button';
import type { StepStatus, WorkItemTag, WorkItemRequirement } from '../../types/api';

interface MilestoneStage {
  id: string;
  number: number;
  name: string;
  status: StepStatus;
  completedTasks: number;
  totalTasks: number;
  requirement: WorkItemRequirement;
  description: string;
  ownerRole: string;
  dueRule: string;
  tasks: StageTask[];
}

interface StageTask {
  id: string;
  title: string;
  tag: WorkItemTag;
  requirement: WorkItemRequirement;
  role: string;
  isCompleted: boolean;
}

const initialStages: MilestoneStage[] = [
  {
    id: 'stage-1',
    number: 1,
    name: 'Offer Accepted',
    status: 'Completed',
    completedTasks: 2,
    totalTasks: 2,
    requirement: 'required',
    description: 'Record confirmed offer terms, buyer qualification, and vendor acceptance.',
    ownerRole: 'Listing Agent',
    dueRule: 'Day 0 of Case Creation',
    tasks: [
      { id: 't1-1', title: 'Confirm agreed offer price & deposit amount', tag: 'Manual', requirement: 'required', role: 'Listing Agent', isCompleted: true },
      { id: 't1-2', title: 'Verify buyer chain & financial qualification', tag: 'Manual', requirement: 'required', role: 'Listing Agent', isCompleted: true },
    ],
  },
  {
    id: 'stage-2',
    number: 2,
    name: 'Memorandum of Sale Sent',
    status: 'Completed',
    completedTasks: 2,
    totalTasks: 2,
    requirement: 'required',
    description: 'Generate and distribute formal Memorandum of Sale to all conveyancers.',
    ownerRole: 'Sales Progressor',
    dueRule: '1 day after Offer Accepted',
    tasks: [
      { id: 't2-1', title: 'Issue formal Memorandum of Sale document', tag: 'Document Upload', requirement: 'required', role: 'Sales Progressor', isCompleted: true },
      { id: 't2-2', title: 'Distribute Memo to buyer & seller solicitors', tag: 'Email', requirement: 'required', role: 'Sales Progressor', isCompleted: true },
    ],
  },
  {
    id: 'stage-3',
    number: 3,
    name: 'Buyer Solicitor Instructed',
    status: 'In progress',
    completedTasks: 3,
    totalTasks: 5,
    requirement: 'required',
    description: "Confirm the buyer's solicitor details and instruction status before the case progresses.",
    ownerRole: 'Sales Progressor',
    dueRule: '3 days after Memorandum of Sale Sent',
    tasks: [
      { id: 't3-1', title: 'Add buyer solicitor details', tag: 'Manual', requirement: 'required', role: 'Sales Progressor', isCompleted: true },
      { id: 't3-2', title: 'Confirm buyer has instructed solicitor', tag: 'Manual', requirement: 'required', role: 'Sales Progressor', isCompleted: true },
      { id: 't3-3', title: 'Add buyer solicitor instruction date', tag: 'Key Date', requirement: 'required', role: 'Sales Progressor', isCompleted: true },
      { id: 't3-4', title: 'Send instruction confirmation to buyer solicitor', tag: 'Email', requirement: 'required', role: 'Sales Progressor', isCompleted: false },
      { id: 't3-5', title: 'Add public update to portal', tag: 'Public Update', requirement: 'optional', role: 'Sales Progressor', isCompleted: false },
    ],
  },
  {
    id: 'stage-4',
    number: 4,
    name: 'Seller Solicitor Instructed',
    status: 'Waiting',
    completedTasks: 0,
    totalTasks: 2,
    requirement: 'required',
    description: "Verify seller solicitor instruction pack and title deed retrieval.",
    ownerRole: 'Sales Progressor',
    dueRule: '3 days after Memorandum of Sale Sent',
    tasks: [
      { id: 't4-1', title: 'Add seller solicitor details', tag: 'Manual', requirement: 'required', role: 'Sales Progressor', isCompleted: false },
      { id: 't4-2', title: 'Confirm seller draft contract pack sent', tag: 'Document Upload', requirement: 'required', role: 'Sales Progressor', isCompleted: false },
    ],
  },
  {
    id: 'stage-5',
    number: 5,
    name: 'Searches Ordered',
    status: 'Not started',
    completedTasks: 0,
    totalTasks: 2,
    requirement: 'required',
    description: 'Ensure local authority, water, environmental, and drainage searches are paid and ordered.',
    ownerRole: 'Sales Progressor',
    dueRule: '5 days after Solicitor Instruction',
    tasks: [
      { id: 't5-1', title: 'Confirm search fees received from buyer', tag: 'Manual', requirement: 'required', role: 'Sales Progressor', isCompleted: false },
      { id: 't5-2', title: 'Record search submission date', tag: 'Key Date', requirement: 'required', role: 'Sales Progressor', isCompleted: false },
    ],
  },
  {
    id: 'stage-6',
    number: 6,
    name: 'Survey Instructed',
    status: 'Not started',
    completedTasks: 0,
    totalTasks: 2,
    requirement: 'conditional',
    description: 'Track RICS Homebuyer or Building Survey booking and specialist quote follow-ups.',
    ownerRole: 'Sales Progressor',
    dueRule: '7 days after Offer Accepted',
    tasks: [
      { id: 't6-1', title: 'Confirm survey access appointment', tag: 'Key Date', requirement: 'required', role: 'Sales Progressor', isCompleted: false },
      { id: 't6-2', title: 'Review survey outcome and any valuation retentions', tag: 'Manual', requirement: 'required', role: 'Sales Progressor', isCompleted: false },
    ],
  },
  {
    id: 'stage-7',
    number: 7,
    name: 'Mortgage Offer Received',
    status: 'Not started',
    completedTasks: 0,
    totalTasks: 2,
    requirement: 'conditional',
    description: 'Lender valuation inspection and formal mortgage offer document verification.',
    ownerRole: 'Sales Progressor',
    dueRule: '14 days after Mortgage Application',
    tasks: [
      { id: 't7-1', title: 'Confirm physical lender valuation completed', tag: 'Manual', requirement: 'required', role: 'Sales Progressor', isCompleted: false },
      { id: 't7-2', title: 'Verify formal written mortgage offer issued', tag: 'Document Upload', requirement: 'required', role: 'Sales Progressor', isCompleted: false },
    ],
  },
  {
    id: 'stage-8',
    number: 8,
    name: 'Searches Returned',
    status: 'Not started',
    completedTasks: 0,
    totalTasks: 2,
    requirement: 'required',
    description: 'Review local council, drainage, and environmental search results for advisory notes.',
    ownerRole: 'Sales Progressor',
    dueRule: '10 days after Searches Ordered',
    tasks: [
      { id: 't8-1', title: 'Log search return date', tag: 'Key Date', requirement: 'required', role: 'Sales Progressor', isCompleted: false },
      { id: 't8-2', title: 'Check for any planning or tree preservation restrictions', tag: 'Manual', requirement: 'required', role: 'Sales Progressor', isCompleted: false },
    ],
  },
  {
    id: 'stage-9',
    number: 9,
    name: 'Enquiries Raised',
    status: 'Not started',
    completedTasks: 0,
    totalTasks: 2,
    requirement: 'required',
    description: 'Buyer solicitor raises legal and property enquiries based on draft contract pack.',
    ownerRole: 'Sales Progressor',
    dueRule: '5 days after Searches Returned',
    tasks: [
      { id: 't9-1', title: 'Confirm buyer solicitor enquiries sent to seller solicitor', tag: 'Manual', requirement: 'required', role: 'Sales Progressor', isCompleted: false },
      { id: 't9-2', title: 'Follow up on seller responses timeline', tag: 'Email', requirement: 'required', role: 'Sales Progressor', isCompleted: false },
    ],
  },
  {
    id: 'stage-10',
    number: 10,
    name: 'All Enquiries Answered',
    status: 'Not started',
    completedTasks: 0,
    totalTasks: 2,
    requirement: 'required',
    description: 'All title, leasehold, and planning enquiries satisfied by seller solicitors.',
    ownerRole: 'Sales Progressor',
    dueRule: '7 days after Enquiries Raised',
    tasks: [
      { id: 't10-1', title: 'Verify all legal enquiries cleared with buyer conveyancer', tag: 'Manual', requirement: 'required', role: 'Sales Progressor', isCompleted: false },
      { id: 't10-2', title: 'Confirm final contract approval for signature', tag: 'Manual', requirement: 'required', role: 'Sales Progressor', isCompleted: false },
    ],
  },
  {
    id: 'stage-11',
    number: 11,
    name: 'Exchange Contracts',
    status: 'Not started',
    completedTasks: 0,
    totalTasks: 2,
    requirement: 'required',
    description: 'Contracts exchanged legally binding the sale; deposit held and completion date fixed.',
    ownerRole: 'Sales Progressor',
    dueRule: 'Agreed Target Exchange Date',
    tasks: [
      { id: 't11-1', title: 'Confirm 10% exchange deposit cleared in solicitor client account', tag: 'Key Date', requirement: 'required', role: 'Sales Progressor', isCompleted: false },
      { id: 't11-2', title: 'Confirm formal legal exchange of contracts time and date', tag: 'Key Date', requirement: 'required', role: 'Sales Progressor', isCompleted: false },
    ],
  },
  {
    id: 'stage-12',
    number: 12,
    name: 'Completion',
    status: 'Not started',
    completedTasks: 0,
    totalTasks: 2,
    requirement: 'required',
    description: 'Balance of purchase funds transferred, legal completion confirmed, keys released.',
    ownerRole: 'Sales Progressor',
    dueRule: 'Fixed Completion Date',
    tasks: [
      { id: 't12-1', title: 'Confirm solicitor funds transferred and completion confirmed', tag: 'Key Date', requirement: 'required', role: 'Sales Progressor', isCompleted: false },
      { id: 't12-2', title: 'Authorize branch key release to buyer', tag: 'Manual', requirement: 'required', role: 'Listing Agent', isCompleted: false },
    ],
  },
];

export const TemplatesPage: React.FC = () => {
  const [stages, setStages] = useState<MilestoneStage[]>(initialStages);
  const [selectedStageId, setSelectedStageId] = useState('stage-3');

  // Form State
  const selectedStage = stages.find((s) => s.id === selectedStageId) || stages[2];
  const [stageName, setStageName] = useState(selectedStage.name);
  const [stageDescription, setStageDescription] = useState(selectedStage.description);
  const [ownerRole, setOwnerRole] = useState(selectedStage.ownerRole);
  const [dueRule, setDueRule] = useState(selectedStage.dueRule);
  const [stageType, setStageType] = useState<WorkItemRequirement>(selectedStage.requirement);

  // Inspector Toggles
  const [buyerVisible, setBuyerVisible] = useState(true);
  const [sellerVisible, setSellerVisible] = useState(true);
  const [solicitorVisible, setSolicitorVisible] = useState(false);
  const [publicUpdatesAllowed, setPublicUpdatesAllowed] = useState(true);
  const [privateNotesAllowed, setPrivateNotesAllowed] = useState(true);

  const handleSelectStage = (stage: MilestoneStage) => {
    setSelectedStageId(stage.id);
    setStageName(stage.name);
    setStageDescription(stage.description);
    setOwnerRole(stage.ownerRole);
    setDueRule(stage.dueRule);
    setStageType(stage.requirement);
  };

  const handleToggleTask = (taskId: string) => {
    setStages((prevStages) =>
      prevStages.map((s) => {
        if (s.id !== selectedStage.id) return s;
        const updatedTasks = s.tasks.map((t) =>
          t.id === taskId ? { ...t, isCompleted: !t.isCompleted } : t,
        );
        const completedCount = updatedTasks.filter((t) => t.isCompleted).length;
        return {
          ...s,
          tasks: updatedTasks,
          completedTasks: completedCount,
          status:
            completedCount === s.totalTasks
              ? 'Completed'
              : completedCount > 0
                ? 'In progress'
                : 'Waiting',
        };
      }),
    );
  };

  return (
    <div className="space-y-4">
      {/* Top Breadcrumb & Actions Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-1">
        <div>
          <h2 className="text-lg font-bold text-slate-900">
            Milestone configuration
          </h2>
          <p className="text-xs text-slate-500">
            The stages of this workflow, in order
          </p>
        </div>
        <p className="text-xs text-slate-500 italic hidden md:block">
          Select a milestone to edit its settings, tasks, and rules
        </p>
      </div>

      {/* 3-Column Studio Layout */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-5 items-start">
        {/* Column 1: Milestones DAG Stepper (3 cols) */}
        <div className="lg:col-span-3 space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-xs font-bold uppercase tracking-wider text-slate-500">
              Milestones
            </h3>
            <Badge variant="default" size="xs">
              {stages.length} stages
            </Badge>
          </div>

          <div className="space-y-1.5 max-h-[calc(100vh-210px)] overflow-y-auto pr-1">
            {stages.map((stage) => {
              const isSelected = stage.id === selectedStageId;
              return (
                <div
                  key={stage.id}
                  onClick={() => handleSelectStage(stage)}
                  className={`flex items-center gap-2.5 p-2.5 rounded-xl cursor-pointer transition-all border ${
                    isSelected
                      ? 'bg-[#FDF2F8] border-[#E1007A] shadow-xs'
                      : 'bg-white border-slate-200/80 hover:border-slate-300 hover:bg-slate-50/60'
                  }`}
                >
                  <div className="text-slate-400 cursor-grab">
                    <GripVertical className="w-3.5 h-3.5" />
                  </div>

                  {/* Status Indicator / Step Icon */}
                  {stage.status === 'Completed' ? (
                    <div className="w-5 h-5 rounded-full bg-emerald-500 text-white flex items-center justify-center shrink-0">
                      <CheckCircle2 className="w-3.5 h-3.5" />
                    </div>
                  ) : (
                    <div
                      className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold shrink-0 ${
                        isSelected
                          ? 'bg-[#E1007A] text-white'
                          : 'bg-slate-100 text-slate-600'
                      }`}
                    >
                      {stage.number}
                    </div>
                  )}

                  {/* Title and task stats */}
                  <div className="min-w-0 flex-1">
                    <p
                      className={`text-xs font-semibold truncate ${
                        isSelected ? 'text-[#E1007A]' : 'text-slate-800'
                      }`}
                    >
                      {stage.name}
                    </p>
                    <p className="text-[10px] text-slate-500 flex items-center gap-1.5 mt-0.5">
                      <span
                        className={`w-1.5 h-1.5 rounded-full ${
                          stage.status === 'Completed'
                            ? 'bg-emerald-500'
                            : stage.status === 'In progress'
                              ? 'bg-[#E1007A]'
                              : stage.status === 'Waiting'
                                ? 'bg-amber-500'
                                : 'bg-slate-400'
                        }`}
                      />
                      <span>{stage.status}</span>
                      <span>
                        {stage.completedTasks}/{stage.totalTasks} tasks
                      </span>
                    </p>
                  </div>
                </div>
              );
            })}

            <button className="w-full py-2 px-3 rounded-xl border border-dashed border-slate-300 text-xs font-medium text-slate-500 hover:text-[#E1007A] hover:border-[#E1007A]/40 flex items-center justify-center gap-1.5 transition-colors">
              <Plus className="w-3.5 h-3.5" /> Add milestone
            </button>
          </div>
        </div>

        {/* Column 2: Milestone Detail Editor (6 cols) */}
        <div className="lg:col-span-6 space-y-4">
          {/* Main Stage Card */}
          <div className="iceberg-card p-6 space-y-5">
            {/* Header with Edit Icon and Badges */}
            <div className="flex items-start justify-between gap-4">
              <div className="space-y-1">
                <div className="flex items-center gap-2">
                  <div className="w-6 h-6 rounded-lg bg-pink-100 flex items-center justify-center text-[#E1007A]">
                    <Edit3 className="w-3.5 h-3.5" />
                  </div>
                  <span className="text-[10px] font-bold uppercase tracking-wider text-[#E1007A]">
                    Editing Milestone
                  </span>
                </div>
                <h2 className="text-xl font-extrabold text-slate-900">
                  {selectedStage.name}
                </h2>
              </div>
              <div className="flex items-center gap-2">
                <Badge
                  variant={
                    selectedStage.status === 'Completed'
                      ? 'success'
                      : selectedStage.status === 'In progress'
                        ? 'required'
                        : 'default'
                  }
                  size="xs"
                >
                  {selectedStage.status}
                </Badge>
                <Badge variant="required" size="xs">
                  Required
                </Badge>
              </div>
            </div>

            <p className="text-xs text-slate-500">
              These settings apply to the{' '}
              <span className="font-semibold text-slate-800">
                {selectedStage.name}
              </span>{' '}
              milestone only.
            </p>

            {/* Input Fields */}
            <div className="space-y-4 pt-1">
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Milestone Name
                </label>
                <input
                  type="text"
                  value={stageName}
                  onChange={(e) => setStageName(e.target.value)}
                  className="w-full rounded-xl bg-white border border-slate-200 px-3.5 py-2 text-sm text-slate-800 focus:border-[#E1007A] focus:outline-none focus:ring-2 focus:ring-[#E1007A]/15"
                />
              </div>

              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Description
                </label>
                <textarea
                  rows={2}
                  value={stageDescription}
                  onChange={(e) => setStageDescription(e.target.value)}
                  className="w-full rounded-xl bg-white border border-slate-200 px-3.5 py-2 text-sm text-slate-800 focus:border-[#E1007A] focus:outline-none focus:ring-2 focus:ring-[#E1007A]/15"
                />
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Owner Role
                  </label>
                  <select
                    value={ownerRole}
                    onChange={(e) => setOwnerRole(e.target.value)}
                    className="w-full rounded-xl bg-white border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-[#E1007A] focus:outline-none"
                  >
                    <option value="Sales Progressor">Sales Progressor</option>
                    <option value="Listing Agent">Listing Agent</option>
                    <option value="Branch Manager">Branch Manager</option>
                    <option value="Compliance Officer">Compliance Officer</option>
                  </select>
                </div>

                <div className="space-y-1.5">
                  <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                    Due Rule
                  </label>
                  <select
                    value={dueRule}
                    onChange={(e) => setDueRule(e.target.value)}
                    className="w-full rounded-xl bg-white border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-[#E1007A] focus:outline-none"
                  >
                    <option value="3 days after Memorandum of Sale Sent">
                      3 days after Memorandum of Sale Sent
                    </option>
                    <option value="5 days after Offer Accepted">
                      5 days after Offer Accepted
                    </option>
                    <option value="Day 0 of Case Creation">
                      Day 0 of Case Creation
                    </option>
                    <option value="Agreed Target Date">
                      Agreed Target Date
                    </option>
                  </select>
                </div>
              </div>

              {/* Requirement Type Dropdown */}
              <div className="space-y-1.5">
                <label className="block text-[10px] font-bold uppercase tracking-wider text-slate-500">
                  Type
                </label>
                <select
                  value={stageType}
                  onChange={(e) => setStageType(e.target.value as WorkItemRequirement)}
                  className="w-full rounded-xl bg-white border border-slate-200 px-3 py-2 text-xs text-slate-800 focus:border-[#E1007A] focus:outline-none"
                >
                  <option value="required">Required</option>
                  <option value="optional">Optional</option>
                  <option value="conditional">Conditional</option>
                </select>
              </div>
            </div>
          </div>

          {/* Default Tasks Card */}
          <div className="iceberg-card p-6 space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900">Default tasks</h3>
                <p className="text-xs text-slate-500">
                  Actions that must happen before this milestone can be completed
                </p>
              </div>
              <Badge variant="default" size="xs">
                {selectedStage.tasks.length} tasks
              </Badge>
            </div>

            <div className="space-y-2 pt-1">
              {selectedStage.tasks.map((task) => (
                <div
                  key={task.id}
                  className="flex items-center justify-between p-3 rounded-xl bg-slate-50/80 border border-slate-200/80 hover:border-slate-300 transition-colors group cursor-pointer"
                  onClick={() => handleToggleTask(task.id)}
                >
                  <div className="flex items-center gap-3">
                    <input
                      type="checkbox"
                      checked={task.isCompleted}
                      onChange={() => handleToggleTask(task.id)}
                      className="rounded border-slate-300 text-[#E1007A] focus:ring-[#E1007A] cursor-pointer"
                    />
                    <span
                      className={`text-xs font-medium ${
                        task.isCompleted
                          ? 'line-through text-slate-400'
                          : 'text-slate-800'
                      }`}
                    >
                      {task.title}
                    </span>
                  </div>

                  <div className="flex items-center gap-2">
                    <Badge
                      variant={
                        task.tag === 'Key Date'
                          ? 'keyDate'
                          : task.tag === 'Email'
                            ? 'info'
                            : task.tag === 'Document Upload'
                              ? 'info'
                              : 'manual'
                      }
                      size="xs"
                    >
                      {task.tag}
                    </Badge>
                    <Badge variant="required" size="xs">
                      {task.requirement === 'required' ? 'Required' : 'Optional'}
                    </Badge>
                    <span className="text-[10px] text-slate-500 font-medium">
                      {task.role}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-slate-600 transition-colors" />
                  </div>
                </div>
              ))}
            </div>

            <Button
              variant="secondary"
              size="sm"
              leftIcon={<Plus className="w-3.5 h-3.5" />}
              className="w-full mt-1"
            >
              Add task
            </Button>
          </div>
        </div>

        {/* Column 3: Inspector / Rules Panel (3 cols) */}
        <div className="lg:col-span-3 space-y-4">
          {/* Portal Visibility */}
          <div className="iceberg-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-pink-100 flex items-center justify-center text-[#E1007A]">
                <Eye className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Portal visibility</h4>
                <p className="text-[10px] text-slate-500">
                  For {selectedStage.name}
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-800">Buyer visible</p>
                  <p className="text-[10px] text-slate-500">
                    Show milestone progress to the buyer
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setBuyerVisible(!buyerVisible)}
                  className={`toggle-switch ${buyerVisible ? 'active' : 'inactive'}`}
                >
                  <span className="toggle-knob" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-800">Seller visible</p>
                  <p className="text-[10px] text-slate-500">
                    Show milestone progress to the seller
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSellerVisible(!sellerVisible)}
                  className={`toggle-switch ${sellerVisible ? 'active' : 'inactive'}`}
                >
                  <span className="toggle-knob" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-800">Solicitor visible</p>
                  <p className="text-[10px] text-slate-500">
                    Share updates with instructed solicitors
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setSolicitorVisible(!solicitorVisible)}
                  className={`toggle-switch ${solicitorVisible ? 'active' : 'inactive'}`}
                >
                  <span className="toggle-knob" />
                </button>
              </div>
            </div>
          </div>

          {/* Note Permissions */}
          <div className="iceberg-card p-5 space-y-4">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-pink-100 flex items-center justify-center text-[#E1007A]">
                <FileText className="w-3.5 h-3.5" />
              </div>
              <div>
                <h4 className="text-xs font-bold text-slate-900">Note permissions</h4>
                <p className="text-[10px] text-slate-500">
                  For {selectedStage.name}
                </p>
              </div>
            </div>

            <div className="space-y-3 pt-1">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-800">Public updates allowed</p>
                  <p className="text-[10px] text-slate-500">
                    Post updates visible on the client portal
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPublicUpdatesAllowed(!publicUpdatesAllowed)}
                  className={`toggle-switch ${publicUpdatesAllowed ? 'active' : 'inactive'}`}
                >
                  <span className="toggle-knob" />
                </button>
              </div>

              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-800">Private notes allowed</p>
                  <p className="text-[10px] text-slate-500">
                    Keep internal-only notes on this milestone
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() => setPrivateNotesAllowed(!privateNotesAllowed)}
                  className={`toggle-switch ${privateNotesAllowed ? 'active' : 'inactive'}`}
                >
                  <span className="toggle-knob" />
                </button>
              </div>
            </div>
          </div>

          {/* Basic Automations */}
          <div className="iceberg-card p-5 space-y-3">
            <div className="flex items-center gap-2">
              <div className="w-6 h-6 rounded-lg bg-pink-100 flex items-center justify-center text-[#E1007A]">
                <Zap className="w-3.5 h-3.5" />
              </div>
              <h4 className="text-xs font-bold text-slate-900">Basic automations</h4>
            </div>

            <div className="space-y-2 pt-1 text-xs">
              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                <CheckCircle2 className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    When all required tasks are completed
                  </p>
                  <p className="text-xs font-semibold text-slate-800 mt-0.5">
                    Allow milestone completion
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                <ArrowRight className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    When completed
                  </p>
                  <p className="text-xs font-semibold text-slate-800 mt-0.5">
                    Move case to next milestone
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    If overdue
                  </p>
                  <p className="text-xs font-semibold text-slate-800 mt-0.5">
                    Mark case as Needs Attention
                  </p>
                </div>
              </div>

              <div className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 flex items-start gap-2.5">
                <Send className="w-4 h-4 text-purple-600 shrink-0 mt-0.5" />
                <div>
                  <p className="text-[10px] font-bold uppercase tracking-wider text-slate-400">
                    When public update added
                  </p>
                  <p className="text-xs font-semibold text-slate-800 mt-0.5">
                    Notify buyer and seller
                  </p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};
