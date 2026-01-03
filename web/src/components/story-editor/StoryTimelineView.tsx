"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Icon, type IconName } from "@/lib/ui";
import type { StoryNode, StoryEdge, Entity } from "@/lib/models";

type StoryTimelineViewProps = {
  nodes: StoryNode[];
  edges: StoryEdge[];
  entities: Entity[];
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
  onUpdateNode: (nodeId: string, data: Partial<StoryNode>) => Promise<void>;
};

// =====================================================
// TIMELINE NODE COMPONENT
// =====================================================
function TimelineNode({
  node,
  isSelected,
  onSelect,
  position,
  entities,
}: {
  node: StoryNode;
  isSelected: boolean;
  onSelect: () => void;
  position: { x: number; y: number };
  entities: Entity[];
}) {
  const iconMap: Record<string, IconName> = {
    CHAPTER: "chapter",
    SCENE: "scene",
    BEAT: "beat",
  };

  const colorMap: Record<string, string> = {
    CHAPTER: "from-purple-500 to-indigo-600",
    SCENE: "from-blue-500 to-cyan-600",
    BEAT: "from-emerald-500 to-teal-600",
  };

  const borderColorMap: Record<string, string> = {
    CHAPTER: "border-purple-300",
    SCENE: "border-blue-300",
    BEAT: "border-emerald-300",
  };

  // Get characters for this node
  const characters = (node.screenplay?.characterInstances || [])
    .map(c => entities.find(e => e._id === c.entityId))
    .filter(Boolean) as Entity[];

  return (
    <div
      onClick={onSelect}
      className={`absolute cursor-pointer transition-all duration-300 hover:scale-105 hover:z-10 ${
        isSelected ? "z-20 scale-105" : ""
      }`}
      style={{
        left: position.x,
        top: position.y,
        transform: "translate(-50%, -50%)",
      }}
    >
      <div className={`w-64 rounded-2xl border-2 bg-white shadow-lg transition-all ${
        isSelected ? "ring-4 ring-indigo-300 shadow-2xl" : "hover:shadow-xl"
      } ${borderColorMap[node.nodeType]}`}>
        {/* Thumbnail */}
        {node.thumbnail?.url && (
          <div className="h-28 overflow-hidden rounded-t-xl">
            <img src={node.thumbnail.url} alt="" className="w-full h-full object-cover" />
          </div>
        )}

        <div className="p-3">
          {/* Header */}
          <div className="flex items-start gap-2">
            <div className={`flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br ${colorMap[node.nodeType]} text-white shadow-md flex-shrink-0`}>
              <Icon name={iconMap[node.nodeType]} className="h-4 w-4" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-zinc-900 text-sm line-clamp-1">{node.title}</h4>
              <div className="text-[10px] text-zinc-500 uppercase">{node.nodeType}</div>
            </div>
          </div>

          {/* Synopsis */}
          {node.synopsis && (
            <p className="mt-2 text-xs text-zinc-600 line-clamp-2">{node.synopsis}</p>
          )}

          {/* Characters */}
          {characters.length > 0 && (
            <div className="mt-2 flex -space-x-2">
              {characters.slice(0, 4).map(char => (
                <div key={char._id} className="h-6 w-6 rounded-full border-2 border-white overflow-hidden">
                  {char.media?.thumbnailUrl ? (
                    <img src={char.media.thumbnailUrl} alt="" className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full bg-zinc-200 flex items-center justify-center">
                      <Icon name="character" className="h-3 w-3 text-zinc-500" />
                    </div>
                  )}
                </div>
              ))}
              {characters.length > 4 && (
                <div className="h-6 w-6 rounded-full border-2 border-white bg-zinc-100 flex items-center justify-center text-[10px] font-medium text-zinc-600">
                  +{characters.length - 4}
                </div>
              )}
            </div>
          )}

          {/* Badges */}
          <div className="mt-2 flex flex-wrap gap-1">
            {node.goals?.dramaticGoal && (
              <span className="px-1.5 py-0.5 text-[9px] font-medium rounded bg-purple-100 text-purple-700">Goal</span>
            )}
            {node.goals?.conflict && (
              <span className="px-1.5 py-0.5 text-[9px] font-medium rounded bg-red-100 text-red-700">Conflict</span>
            )}
            {node.cinematicSettings?.shotFraming && (
              <span className="px-1.5 py-0.5 text-[9px] font-medium rounded bg-indigo-100 text-indigo-700">
                {node.cinematicSettings.shotFraming}
              </span>
            )}
          </div>
        </div>
      </div>

      {/* Order indicator */}
      <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 px-2 py-0.5 rounded-full bg-zinc-800 text-white text-[10px] font-mono">
        #{Math.floor(node.time?.order || 0)}
      </div>
    </div>
  );
}

// =====================================================
// TIMELINE CONNECTION LINE
// =====================================================
function TimelineConnection({
  from,
  to,
  edge,
}: {
  from: { x: number; y: number };
  to: { x: number; y: number };
  edge: StoryEdge;
}) {
  const edgeColors: Record<string, string> = {
    LINEAR: "#6366f1",
    BRANCH: "#8b5cf6",
    CHOICE: "#ec4899",
    FLASHBACK: "#f59e0b",
    TIMEJUMP: "#10b981",
  };

  const dx = to.x - from.x;
  const dy = to.y - from.y;
  
  // Calculate control points for curved line
  const cx1 = from.x + dx * 0.4;
  const cy1 = from.y;
  const cx2 = from.x + dx * 0.6;
  const cy2 = to.y;

  const path = `M ${from.x} ${from.y} C ${cx1} ${cy1}, ${cx2} ${cy2}, ${to.x} ${to.y}`;

  return (
    <g>
      <path
        d={path}
        fill="none"
        stroke={edgeColors[edge.edgeType] || "#6366f1"}
        strokeWidth={2}
        strokeDasharray={edge.edgeType !== "LINEAR" ? "5,5" : undefined}
        markerEnd="url(#arrowhead)"
      />
    </g>
  );
}

// =====================================================
// MAIN TIMELINE VIEW COMPONENT
// =====================================================
export function StoryTimelineView({
  nodes,
  edges,
  entities,
  selectedNodeId,
  onSelectNode,
  onUpdateNode,
}: StoryTimelineViewProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewOffset, setViewOffset] = useState({ x: 100, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [isDragging, setIsDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });

  // Calculate node positions
  const nodePositions = new Map<string, { x: number; y: number }>();
  
  const chapters = nodes.filter(n => n.nodeType === "CHAPTER");
  const scenes = nodes.filter(n => n.nodeType === "SCENE");
  const beats = nodes.filter(n => n.nodeType === "BEAT");

  const HORIZONTAL_GAP = 320;
  const CHAPTER_Y = 150;
  const SCENE_Y = 400;
  const BEAT_Y = 650;

  chapters.forEach((node, idx) => {
    nodePositions.set(node._id, { x: 200 + idx * HORIZONTAL_GAP, y: CHAPTER_Y });
  });

  scenes.forEach((node, idx) => {
    nodePositions.set(node._id, { x: 200 + idx * HORIZONTAL_GAP, y: SCENE_Y });
  });

  beats.forEach((node, idx) => {
    nodePositions.set(node._id, { x: 200 + idx * HORIZONTAL_GAP, y: BEAT_Y });
  });

  // Calculate total dimensions
  const maxX = Math.max(...Array.from(nodePositions.values()).map(p => p.x)) + 200;
  const maxY = BEAT_Y + 150;

  // Pan handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    if (e.button === 0) {
      setIsDragging(true);
      setDragStart({ x: e.clientX - viewOffset.x, y: e.clientY - viewOffset.y });
    }
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (isDragging) {
      setViewOffset({
        x: e.clientX - dragStart.x,
        y: e.clientY - dragStart.y,
      });
    }
  };

  const handleMouseUp = () => {
    setIsDragging(false);
  };

  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    const delta = e.deltaY > 0 ? 0.9 : 1.1;
    setZoom(prev => Math.max(0.3, Math.min(2, prev * delta)));
  };

  const resetView = () => {
    setViewOffset({ x: 100, y: 0 });
    setZoom(1);
  };

  return (
    <div className="h-full flex flex-col bg-gradient-to-br from-slate-100 via-indigo-50 to-purple-50">
      {/* Toolbar */}
      <div className="flex-shrink-0 px-4 py-2 bg-white/80 backdrop-blur-xl border-b border-zinc-200/50 flex items-center gap-2">
        <button
          onClick={() => setZoom(prev => Math.min(2, prev * 1.2))}
          className="p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 transition-all"
          title="Zoom In"
        >
          <Icon name="zoomIn" className="h-4 w-4 text-zinc-600" />
        </button>
        <button
          onClick={() => setZoom(prev => Math.max(0.3, prev * 0.8))}
          className="p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 transition-all"
          title="Zoom Out"
        >
          <Icon name="zoomOut" className="h-4 w-4 text-zinc-600" />
        </button>
        <button
          onClick={resetView}
          className="p-2 rounded-lg bg-zinc-100 hover:bg-zinc-200 transition-all"
          title="Reset View"
        >
          <Icon name="maximize" className="h-4 w-4 text-zinc-600" />
        </button>
        <div className="w-px h-6 bg-zinc-300 mx-2" />
        <span className="text-xs text-zinc-500">Zoom: {Math.round(zoom * 100)}%</span>
        <span className="text-xs text-zinc-500 ml-4">Drag to pan • Scroll to zoom</span>
      </div>

      {/* Timeline Canvas */}
      <div
        ref={containerRef}
        className="flex-1 overflow-hidden cursor-grab active:cursor-grabbing"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
        onWheel={handleWheel}
      >
        <div
          className="relative"
          style={{
            width: maxX * zoom,
            height: maxY * zoom,
            transform: `translate(${viewOffset.x}px, ${viewOffset.y}px) scale(${zoom})`,
            transformOrigin: "0 0",
          }}
        >
          {/* Type Labels */}
          <div className="absolute left-4" style={{ top: CHAPTER_Y - 50 }}>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-purple-100 text-purple-700 font-semibold text-sm">
              <Icon name="chapter" className="h-4 w-4" />
              Chapters
            </div>
          </div>
          <div className="absolute left-4" style={{ top: SCENE_Y - 50 }}>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-blue-100 text-blue-700 font-semibold text-sm">
              <Icon name="scene" className="h-4 w-4" />
              Scenes
            </div>
          </div>
          <div className="absolute left-4" style={{ top: BEAT_Y - 50 }}>
            <div className="flex items-center gap-2 px-3 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 font-semibold text-sm">
              <Icon name="beat" className="h-4 w-4" />
              Beats
            </div>
          </div>

          {/* Horizontal guide lines */}
          <svg className="absolute inset-0 w-full h-full pointer-events-none">
            <defs>
              <marker
                id="arrowhead"
                markerWidth="10"
                markerHeight="7"
                refX="9"
                refY="3.5"
                orient="auto"
              >
                <polygon points="0 0, 10 3.5, 0 7" fill="#6366f1" />
              </marker>
            </defs>
            
            {/* Lane guides */}
            <line x1="0" y1={CHAPTER_Y} x2={maxX} y2={CHAPTER_Y} stroke="#c4b5fd" strokeWidth="1" strokeDasharray="4,4" />
            <line x1="0" y1={SCENE_Y} x2={maxX} y2={SCENE_Y} stroke="#93c5fd" strokeWidth="1" strokeDasharray="4,4" />
            <line x1="0" y1={BEAT_Y} x2={maxX} y2={BEAT_Y} stroke="#6ee7b7" strokeWidth="1" strokeDasharray="4,4" />

            {/* Connections */}
            {edges.map(edge => {
              const fromPos = nodePositions.get(edge.fromNodeId);
              const toPos = nodePositions.get(edge.toNodeId);
              if (!fromPos || !toPos) return null;
              return (
                <TimelineConnection
                  key={edge._id}
                  from={fromPos}
                  to={toPos}
                  edge={edge}
                />
              );
            })}
          </svg>

          {/* Nodes */}
          {nodes.map(node => {
            const pos = nodePositions.get(node._id);
            if (!pos) return null;
            return (
              <TimelineNode
                key={node._id}
                node={node}
                isSelected={node._id === selectedNodeId}
                onSelect={() => onSelectNode(node._id)}
                position={pos}
                entities={entities}
              />
            );
          })}
        </div>
      </div>

      {/* Legend */}
      <div className="flex-shrink-0 px-4 py-2 bg-white/80 backdrop-blur-xl border-t border-zinc-200/50 flex items-center gap-4">
        <span className="text-xs text-zinc-500 font-medium">Edge Types:</span>
        {[
          { type: "LINEAR", color: "#6366f1", label: "Linear" },
          { type: "BRANCH", color: "#8b5cf6", label: "Branch" },
          { type: "FLASHBACK", color: "#f59e0b", label: "Flashback" },
        ].map(item => (
          <div key={item.type} className="flex items-center gap-1.5">
            <div className="w-4 h-0.5 rounded" style={{ backgroundColor: item.color }} />
            <span className="text-xs text-zinc-600">{item.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
