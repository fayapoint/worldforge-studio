"use client";

import { useState, useMemo } from "react";
import { Icon, Badge, PrimaryButton, SecondaryButton, type IconName } from "@/lib/ui";
import type { StoryNode, Entity } from "@/lib/models";

// =====================================================
// TYPES
// =====================================================

export type PlotPoint = {
  id: string;
  name: string;
  description: string;
  type: "SETUP" | "PAYOFF" | "MILESTONE" | "REVELATION" | "CALLBACK";
  status: "PENDING" | "IN_PROGRESS" | "COMPLETED" | "ABANDONED";
  priority: "LOW" | "MEDIUM" | "HIGH" | "CRITICAL";
  relatedSceneId?: string;
  relatedSceneOrder?: number;
  targetSceneId?: string;
  targetSceneOrder?: number;
  relatedEntities: string[];
  notes?: string;
  createdAt: Date;
};

export type StoryArc = {
  id: string;
  name: string;
  description: string;
  type: "MAIN" | "SUBPLOT" | "CHARACTER_ARC" | "MYSTERY" | "RELATIONSHIP";
  status: "NOT_STARTED" | "ACT_1" | "ACT_2" | "ACT_3" | "RESOLVED";
  plotPoints: PlotPoint[];
  relatedCharacters: string[];
  startSceneId?: string;
  endSceneId?: string;
};

type PlotTrackerProps = {
  nodes: StoryNode[];
  entities: Entity[];
  projectId: string;
  onSelectScene: (nodeId: string) => void;
};

// =====================================================
// CONFIGURATION
// =====================================================

const PLOT_TYPE_CONFIG: Record<PlotPoint["type"], { icon: IconName; color: string; label: string }> = {
  SETUP: { icon: "target", color: "from-blue-500 to-indigo-600", label: "Setup" },
  PAYOFF: { icon: "sparkles", color: "from-emerald-500 to-teal-600", label: "Payoff" },
  MILESTONE: { icon: "star", color: "from-amber-500 to-orange-600", label: "Milestone" },
  REVELATION: { icon: "eye", color: "from-purple-500 to-violet-600", label: "Revelation" },
  CALLBACK: { icon: "history", color: "from-pink-500 to-rose-600", label: "Callback" },
};

const ARC_TYPE_CONFIG: Record<StoryArc["type"], { icon: IconName; color: string }> = {
  MAIN: { icon: "story", color: "from-violet-600 to-purple-700" },
  SUBPLOT: { icon: "split", color: "from-blue-500 to-indigo-600" },
  CHARACTER_ARC: { icon: "character", color: "from-emerald-500 to-teal-600" },
  MYSTERY: { icon: "eye", color: "from-amber-500 to-orange-600" },
  RELATIONSHIP: { icon: "heart", color: "from-pink-500 to-rose-600" },
};

const STATUS_CONFIG: Record<PlotPoint["status"], { color: string; label: string }> = {
  PENDING: { color: "zinc", label: "Pending" },
  IN_PROGRESS: { color: "blue", label: "In Progress" },
  COMPLETED: { color: "emerald", label: "Completed" },
  ABANDONED: { color: "red", label: "Abandoned" },
};

// =====================================================
// MAIN COMPONENT
// =====================================================

export function PlotTracker({
  nodes,
  entities,
  projectId,
  onSelectScene,
}: PlotTrackerProps) {
  const [arcs, setArcs] = useState<StoryArc[]>([]);
  const [plotPoints, setPlotPoints] = useState<PlotPoint[]>([]);
  const [selectedArcId, setSelectedArcId] = useState<string | null>(null);
  const [showAddArc, setShowAddArc] = useState(false);
  const [showAddPlotPoint, setShowAddPlotPoint] = useState(false);
  const [filterStatus, setFilterStatus] = useState<PlotPoint["status"] | "ALL">("ALL");

  // Sort nodes
  const sortedNodes = useMemo(() => 
    [...nodes].sort((a, b) => (a.time?.order ?? 0) - (b.time?.order ?? 0)),
    [nodes]
  );

  // Auto-detect plot points from story nodes
  const autoDetectedPoints = useMemo(() => {
    const points: PlotPoint[] = [];
    
    sortedNodes.forEach((node, idx) => {
      // Foreshadowing = Setup
      node.hooks?.foreshadow?.forEach((foreshadow, fIdx) => {
        points.push({
          id: `auto-foreshadow-${node._id}-${fIdx}`,
          name: `Foreshadowing: ${foreshadow.slice(0, 40)}...`,
          description: foreshadow,
          type: "SETUP",
          status: "IN_PROGRESS",
          priority: "MEDIUM",
          relatedSceneId: node._id,
          relatedSceneOrder: node.time?.order ?? idx,
          relatedEntities: node.participants?.map(p => p.entityId) || [],
          createdAt: new Date(),
        });
      });
      
      // Payoff targets = Payoff
      node.hooks?.payoffTargets?.forEach((payoff, pIdx) => {
        points.push({
          id: `auto-payoff-${node._id}-${pIdx}`,
          name: `Payoff: ${payoff.slice(0, 40)}...`,
          description: payoff,
          type: "PAYOFF",
          status: "COMPLETED",
          priority: "MEDIUM",
          relatedSceneId: node._id,
          relatedSceneOrder: node.time?.order ?? idx,
          relatedEntities: node.participants?.map(p => p.entityId) || [],
          createdAt: new Date(),
        });
      });
      
      // Scene hooks = Setup
      if (node.hooks?.hook) {
        points.push({
          id: `auto-hook-${node._id}`,
          name: `Hook: ${node.hooks.hook.slice(0, 40)}...`,
          description: node.hooks.hook,
          type: "SETUP",
          status: "IN_PROGRESS",
          priority: "LOW",
          relatedSceneId: node._id,
          relatedSceneOrder: node.time?.order ?? idx,
          relatedEntities: node.participants?.map(p => p.entityId) || [],
          createdAt: new Date(),
        });
      }
      
      // Dramatic turns = Milestone
      if (node.goals?.turn) {
        points.push({
          id: `auto-turn-${node._id}`,
          name: `Turn: ${node.goals.turn.slice(0, 40)}...`,
          description: node.goals.turn,
          type: "MILESTONE",
          status: "COMPLETED",
          priority: "HIGH",
          relatedSceneId: node._id,
          relatedSceneOrder: node.time?.order ?? idx,
          relatedEntities: node.participants?.map(p => p.entityId) || [],
          createdAt: new Date(),
        });
      }
    });
    
    return points;
  }, [sortedNodes]);

  // Combined plot points
  const allPlotPoints = useMemo(() => 
    [...plotPoints, ...autoDetectedPoints],
    [plotPoints, autoDetectedPoints]
  );

  // Filtered plot points
  const filteredPoints = useMemo(() => {
    let points = allPlotPoints;
    if (filterStatus !== "ALL") {
      points = points.filter(p => p.status === filterStatus);
    }
    if (selectedArcId) {
      const arc = arcs.find(a => a.id === selectedArcId);
      if (arc) {
        const arcPointIds = new Set(arc.plotPoints.map(p => p.id));
        points = points.filter(p => arcPointIds.has(p.id));
      }
    }
    return points.sort((a, b) => (a.relatedSceneOrder ?? 0) - (b.relatedSceneOrder ?? 0));
  }, [allPlotPoints, filterStatus, selectedArcId, arcs]);

  // Stats
  const stats = useMemo(() => ({
    total: allPlotPoints.length,
    pending: allPlotPoints.filter(p => p.status === "PENDING").length,
    inProgress: allPlotPoints.filter(p => p.status === "IN_PROGRESS").length,
    completed: allPlotPoints.filter(p => p.status === "COMPLETED").length,
    abandoned: allPlotPoints.filter(p => p.status === "ABANDONED").length,
  }), [allPlotPoints]);

  // Unresolved setups (potential plot holes)
  const unresolvedSetups = useMemo(() => {
    const setups = allPlotPoints.filter(p => p.type === "SETUP" && p.status === "IN_PROGRESS");
    const payoffs = allPlotPoints.filter(p => p.type === "PAYOFF");
    
    return setups.filter(setup => {
      // Check if there's a matching payoff
      const hasPayoff = payoffs.some(payoff => 
        payoff.description.toLowerCase().includes(setup.description.toLowerCase().slice(0, 20)) ||
        setup.description.toLowerCase().includes(payoff.description.toLowerCase().slice(0, 20))
      );
      return !hasPayoff;
    });
  }, [allPlotPoints]);

  // Add new plot point
  const addPlotPoint = (point: Omit<PlotPoint, "id" | "createdAt">) => {
    const newPoint: PlotPoint = {
      ...point,
      id: `manual-${Date.now()}`,
      createdAt: new Date(),
    };
    setPlotPoints(prev => [...prev, newPoint]);
  };

  // Add new arc
  const addArc = (arc: Omit<StoryArc, "id" | "plotPoints">) => {
    const newArc: StoryArc = {
      ...arc,
      id: `arc-${Date.now()}`,
      plotPoints: [],
    };
    setArcs(prev => [...prev, newArc]);
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="p-3 rounded-xl bg-gradient-to-br from-purple-600 to-violet-700 text-white shadow-lg">
              <Icon name="story" className="h-6 w-6" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900">Plot Tracker</h2>
              <p className="text-sm text-zinc-500">
                Track setups, payoffs, and story requirements
              </p>
            </div>
          </div>
          
          <div className="flex gap-2">
            <SecondaryButton onClick={() => setShowAddArc(true)}>
              <Icon name="plus" className="h-4 w-4" />
              Add Arc
            </SecondaryButton>
            <PrimaryButton onClick={() => setShowAddPlotPoint(true)}>
              <Icon name="plus" className="h-4 w-4" />
              Add Plot Point
            </PrimaryButton>
          </div>
        </div>

        {/* Stats */}
        <div className="mt-4 grid grid-cols-5 gap-3">
          <div className="rounded-xl bg-zinc-100 p-3 text-center">
            <div className="text-2xl font-bold text-zinc-700">{stats.total}</div>
            <div className="text-xs text-zinc-500">Total</div>
          </div>
          <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-3 text-center">
            <div className="text-2xl font-bold text-zinc-600">{stats.pending}</div>
            <div className="text-xs text-zinc-500">Pending</div>
          </div>
          <div className="rounded-xl bg-blue-50 border border-blue-200 p-3 text-center">
            <div className="text-2xl font-bold text-blue-700">{stats.inProgress}</div>
            <div className="text-xs text-blue-600">In Progress</div>
          </div>
          <div className="rounded-xl bg-emerald-50 border border-emerald-200 p-3 text-center">
            <div className="text-2xl font-bold text-emerald-700">{stats.completed}</div>
            <div className="text-xs text-emerald-600">Completed</div>
          </div>
          <div className="rounded-xl bg-red-50 border border-red-200 p-3 text-center">
            <div className="text-2xl font-bold text-red-700">{unresolvedSetups.length}</div>
            <div className="text-xs text-red-600">Unresolved</div>
          </div>
        </div>
      </div>

      {/* Unresolved Setups Warning */}
      {unresolvedSetups.length > 0 && (
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-start gap-3">
            <Icon name="warning" className="h-5 w-5 text-amber-600 mt-0.5" />
            <div className="flex-1">
              <h3 className="text-sm font-semibold text-amber-800 mb-2">
                Potential Plot Holes Detected ({unresolvedSetups.length})
              </h3>
              <div className="space-y-2">
                {unresolvedSetups.slice(0, 3).map(setup => (
                  <div 
                    key={setup.id}
                    className="flex items-center justify-between p-2 rounded-lg bg-white/60"
                  >
                    <div className="flex items-center gap-2">
                      <Icon name="target" className="h-4 w-4 text-amber-600" />
                      <span className="text-xs text-amber-800">{setup.name}</span>
                    </div>
                    {setup.relatedSceneId && (
                      <button
                        onClick={() => onSelectScene(setup.relatedSceneId!)}
                        className="text-xs text-amber-700 hover:text-amber-900 font-medium"
                      >
                        Go to Scene #{setup.relatedSceneOrder}
                      </button>
                    )}
                  </div>
                ))}
                {unresolvedSetups.length > 3 && (
                  <p className="text-xs text-amber-700">
                    +{unresolvedSetups.length - 3} more unresolved setups
                  </p>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Filters */}
      <div className="flex gap-2 flex-wrap">
        <button
          onClick={() => { setFilterStatus("ALL"); setSelectedArcId(null); }}
          className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
            filterStatus === "ALL" && !selectedArcId
              ? "bg-zinc-900 text-white"
              : "bg-white border border-zinc-200 text-zinc-700 hover:border-zinc-300"
          }`}
        >
          All ({allPlotPoints.length})
        </button>
        {(["PENDING", "IN_PROGRESS", "COMPLETED"] as PlotPoint["status"][]).map(status => (
          <button
            key={status}
            onClick={() => { setFilterStatus(status); setSelectedArcId(null); }}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              filterStatus === status
                ? `bg-${STATUS_CONFIG[status].color}-100 text-${STATUS_CONFIG[status].color}-700 border border-${STATUS_CONFIG[status].color}-200`
                : "bg-white border border-zinc-200 text-zinc-700 hover:border-zinc-300"
            }`}
          >
            {STATUS_CONFIG[status].label}
          </button>
        ))}
      </div>

      {/* Story Arcs */}
      {arcs.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-zinc-900 mb-3 flex items-center gap-2">
            <Icon name="story" className="h-4 w-4 text-purple-600" />
            Story Arcs
          </h3>
          <div className="flex gap-2 flex-wrap">
            {arcs.map(arc => {
              const config = ARC_TYPE_CONFIG[arc.type];
              const isSelected = selectedArcId === arc.id;
              
              return (
                <button
                  key={arc.id}
                  onClick={() => setSelectedArcId(isSelected ? null : arc.id)}
                  className={`flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                    isSelected
                      ? `bg-gradient-to-r ${config.color} text-white shadow-lg`
                      : "bg-zinc-50 border border-zinc-200 text-zinc-700 hover:border-zinc-300"
                  }`}
                >
                  <Icon name={config.icon} className="h-4 w-4" />
                  {arc.name}
                  <Badge tone={isSelected ? "neutral" : "success"}>{arc.plotPoints.length}</Badge>
                </button>
              );
            })}
          </div>
        </div>
      )}

      {/* Plot Points Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filteredPoints.map(point => (
          <PlotPointCard
            key={point.id}
            point={point}
            entities={entities}
            onSelectScene={onSelectScene}
          />
        ))}

        {filteredPoints.length === 0 && (
          <div className="col-span-full rounded-2xl border-2 border-dashed border-zinc-200 bg-zinc-50 p-12 text-center">
            <Icon name="story" className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-zinc-700 mb-2">No Plot Points Found</h3>
            <p className="text-sm text-zinc-500 mb-4">
              {allPlotPoints.length === 0 
                ? "Add foreshadowing, hooks, and dramatic turns to your scenes to auto-detect plot points"
                : "No plot points match the current filter"
              }
            </p>
            <PrimaryButton onClick={() => setShowAddPlotPoint(true)}>
              <Icon name="plus" className="h-4 w-4" />
              Add Plot Point Manually
            </PrimaryButton>
          </div>
        )}
      </div>

      {/* Timeline Visualization */}
      {allPlotPoints.length > 0 && (
        <div className="rounded-xl border border-zinc-200 bg-white p-5">
          <h3 className="text-sm font-semibold text-zinc-900 mb-4 flex items-center gap-2">
            <Icon name="clock" className="h-4 w-4 text-indigo-600" />
            Plot Timeline
          </h3>
          
          <div className="relative">
            {/* Timeline Line */}
            <div className="absolute left-4 top-0 bottom-0 w-0.5 bg-gradient-to-b from-violet-500 via-blue-500 to-emerald-500" />
            
            {/* Plot Points on Timeline */}
            <div className="space-y-4 pl-10">
              {allPlotPoints
                .filter(p => p.relatedSceneOrder !== undefined)
                .sort((a, b) => (a.relatedSceneOrder ?? 0) - (b.relatedSceneOrder ?? 0))
                .map((point, idx) => {
                  const config = PLOT_TYPE_CONFIG[point.type];
                  const statusConfig = STATUS_CONFIG[point.status];
                  
                  return (
                    <div key={point.id} className="relative flex items-start gap-3">
                      {/* Timeline Node */}
                      <div className={`absolute -left-10 w-8 h-8 rounded-full bg-gradient-to-br ${config.color} flex items-center justify-center shadow-md`}>
                        <Icon name={config.icon} className="h-4 w-4 text-white" />
                      </div>
                      
                      {/* Content */}
                      <div className="flex-1 rounded-xl border border-zinc-100 bg-zinc-50 p-3">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <div className="flex items-center gap-2 mb-1">
                              <Badge tone={point.status === "COMPLETED" ? "success" : point.status === "IN_PROGRESS" ? "warn" : "neutral"}>
                                {config.label}
                              </Badge>
                              <span className="text-xs text-zinc-500">Scene #{point.relatedSceneOrder}</span>
                            </div>
                            <p className="text-xs text-zinc-700">{point.name}</p>
                          </div>
                          {point.relatedSceneId && (
                            <button
                              onClick={() => onSelectScene(point.relatedSceneId!)}
                              className="p-1.5 rounded-lg hover:bg-white text-zinc-500 hover:text-zinc-700"
                            >
                              <Icon name="arrowRight" className="h-4 w-4" />
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  );
                })}
            </div>
          </div>
        </div>
      )}

      {/* Add Plot Point Modal */}
      {showAddPlotPoint && (
        <AddPlotPointModal
          nodes={sortedNodes}
          entities={entities}
          onAdd={addPlotPoint}
          onClose={() => setShowAddPlotPoint(false)}
        />
      )}

      {/* Add Arc Modal */}
      {showAddArc && (
        <AddArcModal
          entities={entities.filter(e => e.type === "CHARACTER")}
          onAdd={addArc}
          onClose={() => setShowAddArc(false)}
        />
      )}
    </div>
  );
}

// =====================================================
// PLOT POINT CARD
// =====================================================

function PlotPointCard({
  point,
  entities,
  onSelectScene,
}: {
  point: PlotPoint;
  entities: Entity[];
  onSelectScene: (nodeId: string) => void;
}) {
  const config = PLOT_TYPE_CONFIG[point.type];
  const relatedEntities = point.relatedEntities
    .map(id => entities.find(e => e._id === id))
    .filter(Boolean) as Entity[];

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-4 hover:shadow-md transition-all">
      <div className="flex items-start gap-3">
        <div className={`p-2 rounded-lg bg-gradient-to-br ${config.color} text-white`}>
          <Icon name={config.icon} className="h-4 w-4" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 mb-1">
            <span className="text-sm font-semibold text-zinc-900">{point.name}</span>
            <Badge tone={
              point.status === "COMPLETED" ? "success" 
              : point.status === "IN_PROGRESS" ? "warn" 
              : point.status === "ABANDONED" ? "danger"
              : "neutral"
            }>
              {point.status.replace("_", " ")}
            </Badge>
          </div>
          
          <p className="text-xs text-zinc-600 line-clamp-2">{point.description}</p>
          
          {point.relatedSceneOrder !== undefined && (
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs text-zinc-500">Scene #{point.relatedSceneOrder}</span>
              {point.relatedSceneId && (
                <button
                  onClick={() => onSelectScene(point.relatedSceneId!)}
                  className="text-xs text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1"
                >
                  <Icon name="arrowRight" className="h-3 w-3" />
                  Go to scene
                </button>
              )}
            </div>
          )}
          
          {relatedEntities.length > 0 && (
            <div className="flex -space-x-1.5 mt-2">
              {relatedEntities.slice(0, 4).map(entity => (
                entity.media?.thumbnailUrl ? (
                  <img 
                    key={entity._id}
                    src={entity.media.thumbnailUrl} 
                    alt={entity.name}
                    className="w-5 h-5 rounded-full border-2 border-white object-cover"
                    title={entity.name}
                  />
                ) : (
                  <div 
                    key={entity._id}
                    className="w-5 h-5 rounded-full border-2 border-white bg-blue-500 flex items-center justify-center"
                    title={entity.name}
                  >
                    <span className="text-[8px] text-white font-bold">{entity.name.charAt(0)}</span>
                  </div>
                )
              ))}
            </div>
          )}
        </div>
        
        <div className={`px-2 py-1 rounded-full text-[10px] font-semibold ${
          point.priority === "CRITICAL" ? "bg-red-100 text-red-700"
          : point.priority === "HIGH" ? "bg-amber-100 text-amber-700"
          : point.priority === "MEDIUM" ? "bg-blue-100 text-blue-700"
          : "bg-zinc-100 text-zinc-600"
        }`}>
          {point.priority}
        </div>
      </div>
    </div>
  );
}

// =====================================================
// ADD PLOT POINT MODAL
// =====================================================

function AddPlotPointModal({
  nodes,
  entities,
  onAdd,
  onClose,
}: {
  nodes: StoryNode[];
  entities: Entity[];
  onAdd: (point: Omit<PlotPoint, "id" | "createdAt">) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<PlotPoint["type"]>("SETUP");
  const [status, setStatus] = useState<PlotPoint["status"]>("PENDING");
  const [priority, setPriority] = useState<PlotPoint["priority"]>("MEDIUM");
  const [relatedSceneId, setRelatedSceneId] = useState("");
  const [relatedEntities, setRelatedEntities] = useState<string[]>([]);

  const handleSubmit = () => {
    if (!name || !description) return;
    
    const node = nodes.find(n => n._id === relatedSceneId);
    
    onAdd({
      name,
      description,
      type,
      status,
      priority,
      relatedSceneId: relatedSceneId || undefined,
      relatedSceneOrder: node?.time?.order,
      relatedEntities,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-zinc-200">
          <h2 className="text-lg font-bold text-zinc-900">Add Plot Point</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-zinc-100">
            <Icon name="x" className="h-5 w-5 text-zinc-500" />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-600 mb-1 block">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Setup: Angela discovers the spiders"
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-sm"
            />
          </div>
          
          <div>
            <label className="text-xs font-semibold text-zinc-600 mb-1 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this plot point..."
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-sm resize-none"
              rows={3}
            />
          </div>
          
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-600 mb-1 block">Type</label>
              <select
                value={type}
                onChange={(e) => setType(e.target.value as PlotPoint["type"])}
                className="w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-sm"
              >
                {Object.entries(PLOT_TYPE_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-600 mb-1 block">Status</label>
              <select
                value={status}
                onChange={(e) => setStatus(e.target.value as PlotPoint["status"])}
                className="w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-sm"
              >
                {Object.entries(STATUS_CONFIG).map(([key, config]) => (
                  <option key={key} value={key}>{config.label}</option>
                ))}
              </select>
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-600 mb-1 block">Priority</label>
              <select
                value={priority}
                onChange={(e) => setPriority(e.target.value as PlotPoint["priority"])}
                className="w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-sm"
              >
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>
          </div>
          
          <div>
            <label className="text-xs font-semibold text-zinc-600 mb-1 block">Related Scene</label>
            <select
              value={relatedSceneId}
              onChange={(e) => setRelatedSceneId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-sm"
            >
              <option value="">None</option>
              {nodes.map(node => (
                <option key={node._id} value={node._id}>
                  #{node.time?.order ?? 0} - {node.title}
                </option>
              ))}
            </select>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 p-4 border-t border-zinc-200">
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          <PrimaryButton onClick={handleSubmit} disabled={!name || !description}>
            Add Plot Point
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// ADD ARC MODAL
// =====================================================

function AddArcModal({
  entities,
  onAdd,
  onClose,
}: {
  entities: Entity[];
  onAdd: (arc: Omit<StoryArc, "id" | "plotPoints">) => void;
  onClose: () => void;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [type, setType] = useState<StoryArc["type"]>("SUBPLOT");
  const [relatedCharacters, setRelatedCharacters] = useState<string[]>([]);

  const handleSubmit = () => {
    if (!name) return;
    onAdd({
      name,
      description,
      type,
      status: "NOT_STARTED",
      relatedCharacters,
    });
    onClose();
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl">
        <div className="flex items-center justify-between p-4 border-b border-zinc-200">
          <h2 className="text-lg font-bold text-zinc-900">Add Story Arc</h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-zinc-100">
            <Icon name="x" className="h-5 w-5 text-zinc-500" />
          </button>
        </div>
        
        <div className="p-4 space-y-4">
          <div>
            <label className="text-xs font-semibold text-zinc-600 mb-1 block">Arc Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g., Angela's Journey"
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-sm"
            />
          </div>
          
          <div>
            <label className="text-xs font-semibold text-zinc-600 mb-1 block">Description</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Describe this story arc..."
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-sm resize-none"
              rows={3}
            />
          </div>
          
          <div>
            <label className="text-xs font-semibold text-zinc-600 mb-1 block">Arc Type</label>
            <div className="grid grid-cols-3 gap-2">
              {(Object.keys(ARC_TYPE_CONFIG) as StoryArc["type"][]).map(arcType => {
                const config = ARC_TYPE_CONFIG[arcType];
                return (
                  <button
                    key={arcType}
                    onClick={() => setType(arcType)}
                    className={`flex items-center gap-2 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      type === arcType
                        ? `bg-gradient-to-r ${config.color} text-white`
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    }`}
                  >
                    <Icon name={config.icon} className="h-4 w-4" />
                    {arcType.replace("_", " ")}
                  </button>
                );
              })}
            </div>
          </div>
        </div>
        
        <div className="flex justify-end gap-3 p-4 border-t border-zinc-200">
          <SecondaryButton onClick={onClose}>Cancel</SecondaryButton>
          <PrimaryButton onClick={handleSubmit} disabled={!name}>
            Add Arc
          </PrimaryButton>
        </div>
      </div>
    </div>
  );
}
