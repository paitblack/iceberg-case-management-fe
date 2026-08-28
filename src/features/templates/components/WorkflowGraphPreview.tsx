import React, { useMemo, useState } from 'react';
import {
  GitFork,
  Maximize2,
  Minimize2,
  Zap,
  CheckCircle2,
  Info,
  AlertTriangle,
  Flame,
} from 'lucide-react';
import {
  useTemplateBuilder,
  type BuilderStep,
} from '../context/TemplateBuilderContext';

interface NodeLayout {
  step: BuilderStep;
  x: number;
  y: number;
  width: number;
  height: number;
  level: number;
  isInitial: boolean;
  isCyclic: boolean;
}

interface EdgeLayout {
  id: string;
  fromStepId: string;
  toStepId: string;
  fromPoint: { x: number; y: number };
  toPoint: { x: number; y: number };
  pathData: string;
  isBackward: boolean;
  isCyclic: boolean;
}

function findCyclicElements(
  stepIds: string[],
  edges: Array<{ fromStepId: string; toStepId: string }>,
): {
  cyclicNodeIds: Set<string>;
  cyclicEdgeIds: Set<string>;
} {
  const adj = new Map<string, string[]>();
  for (const id of stepIds) adj.set(id, []);
  for (const e of edges) {
    if (adj.has(e.fromStepId)) {
      adj.get(e.fromStepId)!.push(e.toStepId);
    }
  }

  const visited = new Map<string, number>(); // 0: unvisited, 1: visiting, 2: visited
  const cyclicNodeIds = new Set<string>();
  const cyclicEdgeIds = new Set<string>();
  const currentPath: string[] = [];

  const dfs = (nodeId: string) => {
    visited.set(nodeId, 1);
    currentPath.push(nodeId);

    const neighbors = adj.get(nodeId) || [];
    for (const neighbor of neighbors) {
      const neighborState = visited.get(neighbor) || 0;
      if (neighborState === 1) {
        // Cycle found
        const cycleStartIndex = currentPath.indexOf(neighbor);
        if (cycleStartIndex !== -1) {
          const cycleNodes = currentPath.slice(cycleStartIndex);
          cycleNodes.forEach((n) => cyclicNodeIds.add(n));
          for (let i = 0; i < cycleNodes.length; i++) {
            const from = cycleNodes[i];
            const to =
              i === cycleNodes.length - 1 ? neighbor : cycleNodes[i + 1];
            cyclicEdgeIds.add(`${from}->${to}`);
          }
          cyclicEdgeIds.add(`${nodeId}->${neighbor}`);
        }
      } else if (neighborState === 0) {
        dfs(neighbor);
      }
    }

    currentPath.pop();
    visited.set(nodeId, 2);
  };

  for (const id of stepIds) {
    if ((visited.get(id) || 0) === 0) {
      dfs(id);
    }
  }

  return { cyclicNodeIds, cyclicEdgeIds };
}

export const WorkflowGraphPreview: React.FC = () => {
  const { steps, edges } = useTemplateBuilder();
  const [isExpanded, setIsExpanded] = useState<boolean>(true);
  const [hoveredNodeId, setHoveredNodeId] = useState<string | null>(null);
  const [hoveredEdgeId, setHoveredEdgeId] = useState<string | null>(null);

  // Compute layered positions for steps (Topological DAG Layout with Loop-Back Cycle Arc support)
  const { nodes, graphEdges, width, height, standaloneCount, hasCycles } =
    useMemo(() => {
      if (!steps || steps.length === 0) {
        return {
          nodes: [],
          graphEdges: [],
          width: 600,
          height: 180,
          standaloneCount: 0,
          cyclicNodeIds: new Set<string>(),
          hasCycles: false,
        };
      }

      const nodeWidth = 148;
      const nodeHeight = 54;
      const xGap = 72;
      const yGap = 28;
      const paddingX = 36;
      const paddingY = 56; // Generous top padding for overhead cycle loop-back arcs

      const stepIds = steps.map((s) => s.id);
      const { cyclicNodeIds: cNodeIds, cyclicEdgeIds: cEdgeIds } =
        findCyclicElements(stepIds, edges);

      // 1. Separate standalone steps from DAG connected steps
      const standaloneSteps = steps.filter((s) => s.isStandalone);
      const dagSteps = steps.filter((s) => !s.isStandalone);

      // 2. Compute DAG level (depth) for each connected step
      const stepMap = new Map<string, BuilderStep>(steps.map((s) => [s.id, s]));
      const levelMap = new Map<string, number>();

      const getLevel = (
        stepId: string,
        visited: Set<string> = new Set(),
      ): number => {
        if (levelMap.has(stepId)) return levelMap.get(stepId)!;
        if (visited.has(stepId)) return 0; // Break cycle loops in level calculation

        visited.add(stepId);
        const currentStep = stepMap.get(stepId);
        if (!currentStep || currentStep.dependencies.length === 0) {
          levelMap.set(stepId, 0);
          return 0;
        }

        let maxPredLevel = -1;
        for (const predId of currentStep.dependencies) {
          if (stepMap.has(predId)) {
            maxPredLevel = Math.max(
              maxPredLevel,
              getLevel(predId, new Set(visited)),
            );
          }
        }

        const calculated = maxPredLevel + 1;
        levelMap.set(stepId, calculated);
        return calculated;
      };

      for (const s of dagSteps) {
        getLevel(s.id);
      }

      // 3. Group DAG steps by level
      const levels: BuilderStep[][] = [];
      for (const s of dagSteps) {
        const lvl = levelMap.get(s.id) ?? 0;
        if (!levels[lvl]) levels[lvl] = [];
        levels[lvl].push(s);
      }

      // 4. Calculate coordinates for DAG steps
      const nodeLayouts: NodeLayout[] = [];
      let maxColumnHeight = 1;

      levels.forEach((group, lvlIndex) => {
        if (!group) return;
        maxColumnHeight = Math.max(maxColumnHeight, group.length);
        const x = paddingX + lvlIndex * (nodeWidth + xGap);

        group.forEach((step, rowIdx) => {
          const y = paddingY + rowIdx * (nodeHeight + yGap);
          nodeLayouts.push({
            step,
            x,
            y,
            width: nodeWidth,
            height: nodeHeight,
            level: lvlIndex,
            isInitial: step.dependencies.length === 0,
            isCyclic: cNodeIds.has(step.id),
          });
        });
      });

      // 5. Add Standalone lane at the bottom if standalone steps exist
      if (standaloneSteps.length > 0) {
        const standaloneY =
          paddingY + maxColumnHeight * (nodeHeight + yGap) + 16;
        standaloneSteps.forEach((step, idx) => {
          const x = paddingX + idx * (nodeWidth + 24);
          nodeLayouts.push({
            step,
            x,
            y: standaloneY,
            width: nodeWidth,
            height: nodeHeight,
            level: -1,
            isInitial: false,
            isCyclic: false,
          });
        });
      }

      // 6. Compute edge paths
      const layoutMap = new Map<string, NodeLayout>(
        nodeLayouts.map((n) => [n.step.id, n]),
      );
      const computedEdges: EdgeLayout[] = [];

      // Check bidirectional edges between same two nodes
      const edgeKeySet = new Set(
        edges.map((e) => `${e.fromStepId}->${e.toStepId}`),
      );

      for (const edge of edges) {
        const source = layoutMap.get(edge.fromStepId);
        const target = layoutMap.get(edge.toStepId);

        if (source && target && !target.step.isStandalone) {
          const edgeId = `${edge.fromStepId}->${edge.toStepId}`;
          const hasReverse = edgeKeySet.has(
            `${edge.toStepId}->${edge.fromStepId}`,
          );
          const isCyclic = cEdgeIds.has(edgeId);

          // Backward or Reverse Loop Arc
          if (
            source.x >= target.x ||
            (hasReverse && edge.fromStepId > edge.toStepId)
          ) {
            // Overhead arc from top of source to top of target
            const fromX = source.x + source.width * 0.5;
            const fromY = source.y;
            const toX = target.x + target.width * 0.5;
            const toY = target.y;

            const distance = Math.max(Math.abs(fromX - toX), 40);
            const arcHeight = Math.min(38 + distance * 0.16, 80);

            const cp1X = fromX;
            const cp1Y = fromY - arcHeight;
            const cp2X = toX;
            const cp2Y = toY - arcHeight;

            const pathData = `M ${fromX} ${fromY} C ${cp1X} ${cp1Y}, ${cp2X} ${cp2Y}, ${toX} ${toY}`;

            computedEdges.push({
              id: edgeId,
              fromStepId: edge.fromStepId,
              toStepId: edge.toStepId,
              fromPoint: { x: fromX, y: fromY },
              toPoint: { x: toX, y: toY },
              pathData,
              isBackward: true,
              isCyclic,
            });
          } else {
            // Standard Forward Curve
            const fromX = source.x + source.width;
            const fromY = hasReverse
              ? source.y + source.height * 0.75
              : source.y + source.height * 0.5;
            const toX = target.x;
            const toY = hasReverse
              ? target.y + target.height * 0.75
              : target.y + target.height * 0.5;

            const dx = Math.max((toX - fromX) * 0.5, 25);
            const pathData = `M ${fromX} ${fromY} C ${fromX + dx} ${fromY}, ${toX - dx} ${toY}, ${toX} ${toY}`;

            computedEdges.push({
              id: edgeId,
              fromStepId: edge.fromStepId,
              toStepId: edge.toStepId,
              fromPoint: { x: fromX, y: fromY },
              toPoint: { x: toX, y: toY },
              pathData,
              isBackward: false,
              isCyclic,
            });
          }
        }
      }

      // Calculate total SVG canvas bounds
      const maxX = Math.max(
        ...nodeLayouts.map((n) => n.x + n.width + paddingX),
        560,
      );
      const maxY = Math.max(
        ...nodeLayouts.map((n) => n.y + n.height + paddingY + 16),
        180,
      );

      return {
        nodes: nodeLayouts,
        graphEdges: computedEdges,
        width: maxX,
        height: maxY,
        standaloneCount: standaloneSteps.length,
        cyclicNodeIds: cNodeIds,
        hasCycles: cNodeIds.size > 0,
      };
    }, [steps, edges]);

  const scrollToStep = (stepId: string) => {
    const el = document.getElementById(`step-card-${stepId}`);
    if (el) {
      el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      el.classList.add('ring-2', 'ring-[#E1007A]', 'ring-offset-2');
      setTimeout(() => {
        el.classList.remove('ring-2', 'ring-[#E1007A]', 'ring-offset-2');
      }, 1500);
    }
  };

  if (steps.length === 0) return null;

  return (
    <div
      className={`rounded-2xl bg-gradient-to-b from-slate-900 via-slate-900 to-slate-950 border text-white shadow-lg overflow-hidden transition-all duration-300 ${
        hasCycles ? 'border-rose-500/80 shadow-rose-500/10' : 'border-slate-800'
      }`}
    >
      {/* Header Bar */}
      <div className="px-4 py-3 bg-slate-950/60 border-b border-slate-800/80 flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2.5">
          <div
            className={`w-6 h-6 rounded-lg flex items-center justify-center ${
              hasCycles
                ? 'bg-rose-500/20 border border-rose-500/50 text-rose-400'
                : 'bg-[#E1007A]/20 border border-[#E1007A]/40 text-[#E1007A]'
            }`}
          >
            {hasCycles ? (
              <AlertTriangle className="w-3.5 h-3.5 text-rose-400 animate-pulse" />
            ) : (
              <GitFork className="w-3.5 h-3.5" />
            )}
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h3 className="text-xs font-bold tracking-tight text-white flex items-center gap-1.5">
                Interactive Workflow Topology (Live DAG)
              </h3>
              {hasCycles ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold bg-rose-500/20 text-rose-300 border border-rose-500/40 animate-pulse">
                  <Flame className="w-3 h-3 text-rose-400" />
                  Cyclic Loop Detected
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <span className="w-1.5 h-1.5 rounded-full bg-emerald-400 animate-pulse" />
                  Live Sync
                </span>
              )}
            </div>
            <p className="text-[11px] text-slate-400 font-normal">
              {steps.length} Milestones · {graphEdges.length} Active Transitions
              {standaloneCount > 0 && ` · ${standaloneCount} Standalone`}
            </p>
          </div>
        </div>

        {/* Right Controls */}
        <div className="flex items-center gap-2">
          <button
            type="button"
            onClick={() => setIsExpanded(!isExpanded)}
            title={
              isExpanded ? 'Collapse Graph Preview' : 'Expand Graph Preview'
            }
            className="px-2.5 py-1 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white border border-slate-700 text-xs font-medium flex items-center gap-1.5 transition-colors cursor-pointer"
          >
            {isExpanded ? (
              <>
                <Minimize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Collapse</span>
              </>
            ) : (
              <>
                <Maximize2 className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Expand Graph</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Cyclic Warning Banner */}
      {hasCycles && isExpanded && (
        <div className="mx-4 mt-3 p-3 rounded-xl bg-rose-950/60 border border-rose-500/40 flex items-start gap-2.5 text-rose-200 text-xs shadow-md">
          <AlertTriangle className="w-4 h-4 text-rose-400 shrink-0 mt-0.5 animate-bounce" />
          <div className="space-y-0.5 flex-1 min-w-0">
            <p className="font-bold text-rose-100">
              Circular Dependency Loop Formed
            </p>
            <p className="text-[11px] text-rose-300 leading-relaxed">
              The workflow contains a cyclic prerequisite loop (highlighted with
              red glowing return arcs). Please remove circular prerequisites to
              ensure an acyclic progression flow.
            </p>
          </div>
        </div>
      )}

      {/* Graph Visualizer Canvas */}
      {isExpanded && (
        <div className="relative p-4 overflow-x-auto custom-scrollbar bg-radial from-slate-900 via-slate-950 to-slate-950 min-h-[190px]">
          {/* Subtle Blueprint Grid Pattern */}
          <div
            className="absolute inset-0 opacity-[0.07] pointer-events-none"
            style={{
              backgroundImage: `radial-gradient(#E1007A 1px, transparent 1px), radial-gradient(#6366f1 1px, transparent 1px)`,
              backgroundSize: '24px 24px',
              backgroundPosition: '0 0, 12px 12px',
            }}
          />

          <div
            className="relative"
            style={{
              width: `${width}px`,
              height: `${height}px`,
              minWidth: '100%',
            }}
          >
            {/* SVG Layer for Animated Connecting Edges */}
            <svg
              className="absolute inset-0 pointer-events-none w-full h-full"
              style={{ width: `${width}px`, height: `${height}px` }}
            >
              <defs>
                {/* Standard Arrow Marker */}
                <marker
                  id="dag-arrow"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="6"
                  markerHeight="6"
                  orient="auto"
                >
                  <path d="M 0 1 L 9 5 L 0 9 z" fill="#E1007A" />
                </marker>
                {/* Hover Arrow Marker */}
                <marker
                  id="dag-arrow-hover"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto"
                >
                  <path d="M 0 1 L 9 5 L 0 9 z" fill="#38BDF8" />
                </marker>
                {/* Cyclic Red Arrow Marker */}
                <marker
                  id="dag-arrow-cycle"
                  viewBox="0 0 10 10"
                  refX="8"
                  refY="5"
                  markerWidth="7"
                  markerHeight="7"
                  orient="auto"
                >
                  <path d="M 0 1 L 9 5 L 0 9 z" fill="#F43F5E" />
                </marker>
                {/* Gradients */}
                <linearGradient
                  id="edgeGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#E1007A" />
                  <stop offset="100%" stopColor="#818CF8" />
                </linearGradient>
                <linearGradient
                  id="cycleGradient"
                  x1="0%"
                  y1="0%"
                  x2="100%"
                  y2="0%"
                >
                  <stop offset="0%" stopColor="#F43F5E" />
                  <stop offset="100%" stopColor="#FB7185" />
                </linearGradient>
              </defs>

              {/* Render Animated Directed Curves */}
              {graphEdges.map((edge) => {
                const isHovered =
                  hoveredEdgeId === edge.id ||
                  hoveredNodeId === edge.fromStepId ||
                  hoveredNodeId === edge.toStepId;

                const isCyclicEdge = edge.isCyclic;

                return (
                  <g key={edge.id} className="transition-opacity duration-200">
                    {/* Shadow / Base Glow Path */}
                    <path
                      d={edge.pathData}
                      fill="none"
                      stroke={
                        isCyclicEdge
                          ? '#F43F5E'
                          : isHovered
                            ? '#38BDF8'
                            : '#E1007A'
                      }
                      strokeWidth={isCyclicEdge ? 4 : isHovered ? 4 : 2}
                      strokeOpacity={isCyclicEdge ? 0.9 : isHovered ? 0.9 : 0.4}
                      className={`transition-all duration-200 ${
                        isCyclicEdge ? 'animate-pulse' : ''
                      }`}
                    />

                    {/* Animated Flow Dash Particles */}
                    <path
                      d={edge.pathData}
                      fill="none"
                      stroke={
                        isCyclicEdge
                          ? 'url(#cycleGradient)'
                          : isHovered
                            ? '#FFFFFF'
                            : 'url(#edgeGradient)'
                      }
                      strokeWidth={isCyclicEdge ? 3 : isHovered ? 3 : 2}
                      strokeDasharray={isCyclicEdge ? '5 5' : '6 6'}
                      markerEnd={
                        isCyclicEdge
                          ? 'url(#dag-arrow-cycle)'
                          : isHovered
                            ? 'url(#dag-arrow-hover)'
                            : 'url(#dag-arrow)'
                      }
                      className="animate-flow-dash pointer-events-auto cursor-pointer"
                      onMouseEnter={() => setHoveredEdgeId(edge.id)}
                      onMouseLeave={() => setHoveredEdgeId(null)}
                    />
                  </g>
                );
              })}
            </svg>

            {/* HTML Nodes Layer */}
            {nodes.map((node) => {
              const {
                step,
                x,
                y,
                width: nWidth,
                height: nHeight,
                isInitial,
                isCyclic,
              } = node;
              const isNodeHovered =
                hoveredNodeId === step.id ||
                hoveredEdgeId?.startsWith(`${step.id}->`) ||
                hoveredEdgeId?.endsWith(`->${step.id}`);

              return (
                <div
                  key={step.id}
                  style={{
                    position: 'absolute',
                    left: `${x}px`,
                    top: `${y}px`,
                    width: `${nWidth}px`,
                    height: `${nHeight}px`,
                  }}
                  onMouseEnter={() => setHoveredNodeId(step.id)}
                  onMouseLeave={() => setHoveredNodeId(null)}
                  onClick={() => scrollToStep(step.id)}
                  className={`group rounded-xl border p-2 flex items-center gap-2 cursor-pointer transition-all duration-200 select-none shadow-md backdrop-blur-xs ${
                    isCyclic
                      ? 'bg-rose-950/60 border-rose-500 ring-2 ring-rose-500/40 shadow-rose-500/30 shadow-lg scale-102'
                      : step.isStandalone
                        ? 'bg-amber-950/40 border-amber-500/40 hover:border-amber-400 hover:bg-amber-950/60'
                        : isNodeHovered
                          ? 'bg-slate-800/95 border-[#E1007A] scale-105 shadow-[#E1007A]/20 shadow-lg'
                          : 'bg-slate-900/90 border-slate-700/80 hover:border-slate-500 hover:bg-slate-800/80'
                  }`}
                  title={
                    isCyclic
                      ? `⚠️ Cyclic dependency loop detected on Milestone ${step.displayOrder}`
                      : `Click to scroll to Milestone ${step.displayOrder}: ${step.name}`
                  }
                >
                  {/* Step Order Avatar */}
                  <div
                    className={`w-7 h-7 rounded-lg flex items-center justify-center font-extrabold text-xs shrink-0 transition-transform group-hover:scale-110 ${
                      isCyclic
                        ? 'bg-rose-500/30 text-rose-200 border border-rose-500 animate-pulse'
                        : step.isStandalone
                          ? 'bg-amber-500/20 text-amber-300 border border-amber-500/40'
                          : isInitial
                            ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/40'
                            : 'bg-[#E1007A]/20 text-[#E1007A] border border-[#E1007A]/40'
                    }`}
                  >
                    {step.displayOrder}
                  </div>

                  {/* Step Title & Metadata */}
                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-[11px] font-bold truncate transition-colors ${
                        isCyclic
                          ? 'text-rose-200'
                          : 'text-slate-100 group-hover:text-pink-300'
                      }`}
                    >
                      {step.name || `Milestone ${step.displayOrder}`}
                    </p>
                    <div className="flex items-center gap-1 mt-0.5">
                      {isCyclic ? (
                        <span className="text-[9px] font-bold text-rose-400 flex items-center gap-0.5">
                          <Flame className="w-2.5 h-2.5" /> Loop
                        </span>
                      ) : step.isStandalone ? (
                        <span className="text-[9px] font-medium text-amber-400 flex items-center gap-0.5">
                          <Zap className="w-2.5 h-2.5" /> Standalone
                        </span>
                      ) : isInitial ? (
                        <span className="text-[9px] font-medium text-emerald-400 flex items-center gap-0.5">
                          <CheckCircle2 className="w-2.5 h-2.5" /> Initial
                        </span>
                      ) : (
                        <span className="text-[9px] font-medium text-slate-400">
                          {step.dependencies.length} Dep
                          {step.dependencies.length > 1 ? 's' : ''}
                        </span>
                      )}
                      {step.isOptional && (
                        <span className="text-[9px] font-medium text-purple-400">
                          · Optional
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              );
            })}
          </div>

          {/* Bottom Hint */}
          <div className="mt-2 pt-2 border-t border-slate-800/60 flex items-center justify-between text-[10px] text-slate-400 flex-wrap gap-2">
            <span className="flex items-center gap-1.5">
              <Info className="w-3 h-3 text-slate-500" />
              Connected nodes represent milestone unlocks in real time. Click
              any milestone to jump directly to its editor.
            </span>
            <div className="flex items-center gap-3">
              {hasCycles && (
                <span className="flex items-center gap-1 text-rose-400 font-bold">
                  <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />{' '}
                  Cycle Loop Arc
                </span>
              )}
              <span className="flex items-center gap-1 text-emerald-400">
                <span className="w-2 h-2 rounded-full bg-emerald-400/80" />{' '}
                Initial Step
              </span>
              <span className="flex items-center gap-1 text-amber-400">
                <span className="w-2 h-2 rounded-full bg-amber-400/80" />{' '}
                Standalone (Parallel)
              </span>
              <span className="flex items-center gap-1 text-pink-400">
                <span className="w-2 h-2 rounded-full bg-pink-400/80" /> DAG
                Connected
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};
