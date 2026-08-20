import React from 'react';
import {
  TemplateBuilderProvider,
  useTemplateBuilder,
} from './context/TemplateBuilderContext';
import { TemplateSidebar } from './components/TemplateSidebar';
import { StepCard } from './components/StepCard';
import { Layers, Plus, ArrowDown } from 'lucide-react';
import { Button } from '../../components/ui/Button';

const TemplateCanvas: React.FC = () => {
  const { steps, addStep } = useTemplateBuilder();

  return (
    <div className="space-y-6">
      {/* Canvas Top Bar */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 bg-white p-4 rounded-2xl border border-slate-200/90 shadow-2xs">
        <div>
          <h2 className="text-base font-extrabold text-slate-900 flex items-center gap-2">
            <Layers className="w-4 h-4 text-[#E1007A]" />
            Workflow Progression Canvas (DAG Node Sequence)
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Configure sequential or parallel progression steps, prerequisite
            dependencies, and work item rules.
          </p>
        </div>

        <Button
          variant="primary"
          size="sm"
          onClick={() => addStep()}
          leftIcon={<Plus className="w-3.5 h-3.5" />}
        >
          Add Step
        </Button>
      </div>

      {/* Step Cards Flow */}
      {steps.length === 0 ? (
        <div className="p-12 text-center rounded-2xl bg-white border border-dashed border-slate-200 space-y-3">
          <Layers className="w-10 h-10 text-slate-300 mx-auto" />
          <h3 className="text-sm font-bold text-slate-700">
            No Workflow Steps Configured
          </h3>
          <p className="text-xs text-slate-400 max-w-sm mx-auto">
            Click &ldquo;Add Step&rdquo; or load a quick preset from the sidebar
            to start configuring the workflow.
          </p>
          <Button variant="primary" size="sm" onClick={() => addStep()}>
            Create First Step
          </Button>
        </div>
      ) : (
        <div className="space-y-4">
          {steps.map((step, index) => (
            <React.Fragment key={step.id}>
              <StepCard step={step} index={index} totalSteps={steps.length} />
              {index < steps.length - 1 && (
                <div className="flex justify-center my-1">
                  <div className="w-6 h-6 rounded-full bg-slate-200/70 flex items-center justify-center text-slate-500 shadow-2xs">
                    <ArrowDown className="w-3.5 h-3.5" />
                  </div>
                </div>
              )}
            </React.Fragment>
          ))}
        </div>
      )}
    </div>
  );
};

export const TemplatesPage: React.FC = () => {
  return (
    <TemplateBuilderProvider>
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 items-start pb-12">
        {/* Left Column: Sidebar / Settings / Toolbox (4 cols) */}
        <div className="lg:col-span-4 sticky top-24">
          <TemplateSidebar />
        </div>

        {/* Right Column: Main Canvas / Step Cards Flow (8 cols) */}
        <div className="lg:col-span-8">
          <TemplateCanvas />
        </div>
      </div>
    </TemplateBuilderProvider>
  );
};
