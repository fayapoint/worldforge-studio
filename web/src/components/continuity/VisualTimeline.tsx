"use client";

import { useState, useRef, useEffect, useMemo, useCallback } from "react";
import { Icon, Badge, SecondaryButton, type IconName } from "@/lib/ui";
import type { StoryNode, Entity } from "@/lib/models";

// =====================================================
// TYPES
// =====================================================

type VisualTimelineProps = {
  nodes: StoryNode[];
  entities: Entity[];
  onSelectNode: (nodeId: string) => void;
  selectedNodeId?: string;
};

type TimelineTrack = {
  id: string;
  type: "CHARACTER" | "LOCATION" | "PLOT";
  entity?: Entity;
  label: string;
  color: string;
  icon: IconName;
};

type TimelineEvent = {
  nodeId: string;
  trackId: string;
  startOrder: number;
  endOrder: number;
  label: string;
  type: "PRESENCE" | "ACTION" | "TRANSITION";
};

type ViewMode = "swimlane" | "gantt" | "compact";
type ZoomLevel = 0.5 | 0.75 | 1 | 1.25 | 1.5;

// =====================================================
// COLOR UTILITIES
// =====================================================

const CHARACTER_COLORS = [
  "from-blue-500 to-indigo-600",
  "from-emerald-500 to-teal-600",
  "from-violet-500 to-purple-600",
  "from-rose-500 to-pink-600",
  "from-amber-500 to-orange-600",
  "from-cyan-500 to-sky-600",
  "from-lime-500 to-green-600",
  "from-fuchsia-500 to-pink-600",
];

const LOCATION_COLORS = [
  "from-slate-500 to-zinc-600",
  "from-stone-500 to-neutral-600",
  "from-gray-500 to-zinc-600",
];

const NODE_TYPE_CONFIG: Record<string, { color: string; icon: IconName }> = {
  CHAPTER: { color: "from-violet-600 to-purple-700", icon: "chapter" },
  SCENE: { color: "from-emerald-500 to-teal-600", icon: "scene" },
  BEAT: { color: "from-amber-500 to-orange-600", icon: "target" },
};

// =====================================================
// MAIN COMPONENT
// =====================================================

export function VisualTimeline({
  nodes,
  entities,
  onSelectNode,
  selectedNodeId,
}: VisualTimelineProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const [viewMode, setViewMode] = useState<ViewMode>("swimlane");
  const [zoom, setZoom] = useState<ZoomLevel>(1);
  const [showCharacters, setShowCharacters] = useState(true);
  const [showLocations, setShowLocations] = useState(true);
  const [hoveredNode, setHoveredNode] = useState<string | null>(null);
  const [panOffset, setPanOffset] = useState(0);

  // Sort nodes by timeline order
  const sortedNodes = useMemo(() => 
    [...nodes].sort((a, b) => (a.time?.order ?? 0) - (b.time?.order ?? 0)),
    [nodes]
  );

  // Build timeline tracks for characters
  const characterTracks = useMemo(() => {
    const chars = entities.filter(e => e.type === "CHARACTER");
    return chars.slice(0, 8).map((char, idx): TimelineTrack => ({
      id: char._id,
      type: "CHARACTER",
      entity: char,
      label: char.name,
      color: CHARACTER_COLORS[idx % CHARACTER_COLORS.length],
      icon: "character",
    }));
  }, [entities]);

  // Build timeline tracks for locations
  const locationTracks = useMemo(() => {
    const locs = entities.filter(e => e.type === "LOCATION");
    return locs.slice(0, 4).map((loc, idx): TimelineTrack => ({
      id: loc._id,
      type: "LOCATION",
      entity: loc,
      label: loc.name,
      color: LOCATION_COLORS[idx % LOCATION_COLORS.length],
      icon: "location",
    }));
  }, [entities]);

  // Build events for each track
  const trackEvents = useMemo(() => {
    const events: TimelineEvent[] = [];
    
    sortedNodes.forEach((node, nodeIdx) => {
      // Character events
      node.participants?.forEach(p => {
        events.push({
          nodeId: node._id,
          trackId: p.entityId,
          startOrder: node.time?.order ?? nodeIdx,
          endOrder: node.time?.order ?? nodeIdx,
          label: node.title,
          type: "PRESENCE",
        });
      });
      
      // Location events
      node.locations?.forEach(locId => {
        events.push({
          nodeId: node._id,
          trackId: locId,
          startOrder: node.time?.order ?? nodeIdx,
          endOrder: node.time?.order ?? nodeIdx,
          label: node.title,
          type: "PRESENCE",
        });
      });
    });
    
    return events;
  }, [sortedNodes]);

  // Calculate timeline dimensions
  const minOrder = Math.min(...sortedNodes.map(n => n.time?.order ?? 0));
  const maxOrder = Math.max(...sortedNodes.map(n => n.time?.order ?? 0));
  const orderRange = maxOrder - minOrder + 1;
  const cellWidth = 120 * zoom;
  const trackHeight = viewMode === "compact" ? 32 : 48;
  const headerHeight = 60;

  // Get visible tracks
  const visibleTracks = useMemo(() => {
    const tracks: TimelineTrack[] = [];
    if (showCharacters) tracks.push(...characterTracks);
    if (showLocations) tracks.push(...locationTracks);
    return tracks;
  }, [characterTracks, locationTracks, showCharacters, showLocations]);

  // Scroll handling
  const handleScroll = useCallback((e: React.WheelEvent) => {
    if (e.shiftKey) {
      // Horizontal scroll
      setPanOffset(prev => Math.max(0, prev + e.deltaY));
    }
  }, []);

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white overflow-hidden">
      {/* Toolbar */}
      <div className="flex items-center justify-between p-4 border-b border-zinc-200 bg-gradient-to-r from-zinc-50 to-white">
        <div className="flex items-center gap-3">
          <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-600 to-violet-700 text-white">
            <Icon name="clock" className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-zinc-900">Visual Timeline</h3>
            <p className="text-xs text-zinc-500">{sortedNodes.length} scenes • {visibleTracks.length} tracks</p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          {/* View Mode Toggle */}
          <div className="flex rounded-lg bg-zinc-100 p-1">
            {(["swimlane", "gantt", "compact"] as ViewMode[]).map(mode => (
              <button
                key={mode}
                onClick={() => setViewMode(mode)}
                className={`px-3 py-1.5 rounded-md text-xs font-medium transition-all ${
                  viewMode === mode
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                {mode.charAt(0).toUpperCase() + mode.slice(1)}
              </button>
            ))}
          </div>

          {/* Track Filters */}
          <div className="flex gap-1 ml-2">
            <button
              onClick={() => setShowCharacters(!showCharacters)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                showCharacters
                  ? "bg-blue-100 text-blue-700 border border-blue-200"
                  : "bg-zinc-100 text-zinc-500 border border-zinc-200"
              }`}
            >
              <Icon name="character" className="h-3.5 w-3.5" />
              Characters
            </button>
            <button
              onClick={() => setShowLocations(!showLocations)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                showLocations
                  ? "bg-emerald-100 text-emerald-700 border border-emerald-200"
                  : "bg-zinc-100 text-zinc-500 border border-zinc-200"
              }`}
            >
              <Icon name="location" className="h-3.5 w-3.5" />
              Locations
            </button>
          </div>

          {/* Zoom Controls */}
          <div className="flex items-center gap-1 ml-2 bg-zinc-100 rounded-lg p-1">
            <button
              onClick={() => setZoom(Math.max(0.5, zoom - 0.25) as ZoomLevel)}
              className="p-1.5 rounded-md hover:bg-white text-zinc-600"
              disabled={zoom <= 0.5}
            >
              <Icon name="zoomOut" className="h-3.5 w-3.5" />
            </button>
            <span className="px-2 text-xs font-medium text-zinc-700">{Math.round(zoom * 100)}%</span>
            <button
              onClick={() => setZoom(Math.min(1.5, zoom + 0.25) as ZoomLevel)}
              className="p-1.5 rounded-md hover:bg-white text-zinc-600"
              disabled={zoom >= 1.5}
            >
              <Icon name="zoomIn" className="h-3.5 w-3.5" />
            </button>
          </div>
        </div>
      </div>

      {/* Timeline View */}
      <div 
        ref={containerRef}
        className="overflow-auto relative"
        style={{ maxHeight: "70vh" }}
        onWheel={handleScroll}
      >
        {viewMode === "swimlane" ? (
          <SwimlaneView
            nodes={sortedNodes}
            tracks={visibleTracks}
            events={trackEvents}
            cellWidth={cellWidth}
            trackHeight={trackHeight}
            headerHeight={headerHeight}
            selectedNodeId={selectedNodeId}
            hoveredNode={hoveredNode}
            onSelectNode={onSelectNode}
            onHoverNode={setHoveredNode}
            minOrder={minOrder}
            maxOrder={maxOrder}
          />
        ) : viewMode === "gantt" ? (
          <GanttView
            nodes={sortedNodes}
            tracks={visibleTracks}
            events={trackEvents}
            cellWidth={cellWidth}
            trackHeight={trackHeight}
            headerHeight={headerHeight}
            selectedNodeId={selectedNodeId}
            hoveredNode={hoveredNode}
            onSelectNode={onSelectNode}
            onHoverNode={setHoveredNode}
            minOrder={minOrder}
            maxOrder={maxOrder}
          />
        ) : (
          <CompactView
            nodes={sortedNodes}
            selectedNodeId={selectedNodeId}
            onSelectNode={onSelectNode}
            entities={entities}
          />
        )}
      </div>

      {/* Legend */}
      <div className="flex items-center gap-4 p-3 border-t border-zinc-200 bg-zinc-50">
        <span className="text-xs font-medium text-zinc-500">Legend:</span>
        {Object.entries(NODE_TYPE_CONFIG).map(([type, config]) => (
          <div key={type} className="flex items-center gap-1.5">
            <div className={`w-3 h-3 rounded bg-gradient-to-r ${config.color}`} />
            <span className="text-xs text-zinc-600">{type}</span>
          </div>
        ))}
        <div className="flex items-center gap-1.5 ml-4">
          <div className="w-3 h-3 rounded-full bg-violet-500 ring-2 ring-violet-300" />
          <span className="text-xs text-zinc-600">Selected</span>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// SWIMLANE VIEW
// =====================================================

function SwimlaneView({
  nodes,
  tracks,
  events,
  cellWidth,
  trackHeight,
  headerHeight,
  selectedNodeId,
  hoveredNode,
  onSelectNode,
  onHoverNode,
  minOrder,
  maxOrder,
}: {
  nodes: StoryNode[];
  tracks: TimelineTrack[];
  events: TimelineEvent[];
  cellWidth: number;
  trackHeight: number;
  headerHeight: number;
  selectedNodeId?: string;
  hoveredNode: string | null;
  onSelectNode: (nodeId: string) => void;
  onHoverNode: (nodeId: string | null) => void;
  minOrder: number;
  maxOrder: number;
}) {
  const totalWidth = (maxOrder - minOrder + 1) * cellWidth + 200; // +200 for track labels
  const totalHeight = headerHeight + tracks.length * trackHeight;

  return (
    <div style={{ width: totalWidth, minWidth: "100%" }}>
      {/* Header Row - Scene Titles */}
      <div 
        className="sticky top-0 z-20 bg-white border-b border-zinc-200 flex"
        style={{ height: headerHeight }}
      >
        {/* Track Label Column Header */}
        <div 
          className="sticky left-0 z-30 bg-zinc-50 border-r border-zinc-200 flex items-center justify-center"
          style={{ width: 200, minWidth: 200 }}
        >
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Tracks</span>
        </div>
        
        {/* Scene Headers */}
        <div className="flex">
          {nodes.map((node, idx) => {
            const config = NODE_TYPE_CONFIG[node.nodeType] || NODE_TYPE_CONFIG.SCENE;
            const isSelected = node._id === selectedNodeId;
            const isHovered = node._id === hoveredNode;
            
            return (
              <div
                key={node._id}
                style={{ width: cellWidth }}
                className={`flex-shrink-0 border-r border-zinc-100 p-2 cursor-pointer transition-all ${
                  isSelected ? "bg-violet-50" : isHovered ? "bg-zinc-50" : ""
                }`}
                onClick={() => onSelectNode(node._id)}
                onMouseEnter={() => onHoverNode(node._id)}
                onMouseLeave={() => onHoverNode(null)}
              >
                <div className="flex items-center gap-1.5 mb-1">
                  <div className={`w-5 h-5 rounded flex items-center justify-center bg-gradient-to-r ${config.color} text-white`}>
                    <span className="text-[9px] font-bold">{node.time?.order ?? idx}</span>
                  </div>
                  <Badge tone={node.nodeType === "SCENE" ? "success" : node.nodeType === "CHAPTER" ? "neutral" : "warn"}>
                    {node.nodeType}
                  </Badge>
                </div>
                <div className="text-xs font-medium text-zinc-900 truncate" title={node.title}>
                  {node.title}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Track Rows */}
      {tracks.map((track, trackIdx) => {
        const trackNodeEvents = events.filter(e => e.trackId === track.id);
        
        return (
          <div
            key={track.id}
            className={`flex border-b border-zinc-100 ${trackIdx % 2 === 0 ? "bg-white" : "bg-zinc-50/50"}`}
            style={{ height: trackHeight }}
          >
            {/* Track Label */}
            <div 
              className="sticky left-0 z-10 bg-inherit border-r border-zinc-200 flex items-center gap-2 px-3"
              style={{ width: 200, minWidth: 200 }}
            >
              {track.entity?.media?.thumbnailUrl ? (
                <img 
                  src={track.entity.media.thumbnailUrl} 
                  alt={track.label} 
                  className="w-7 h-7 rounded-full object-cover"
                />
              ) : (
                <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${track.color} flex items-center justify-center`}>
                  <Icon name={track.icon} className="h-3.5 w-3.5 text-white" />
                </div>
              )}
              <span className="text-xs font-medium text-zinc-700 truncate">{track.label}</span>
            </div>

            {/* Track Cells */}
            <div className="flex flex-1">
              {nodes.map((node) => {
                const hasEvent = trackNodeEvents.some(e => e.nodeId === node._id);
                const isSelected = node._id === selectedNodeId;
                const isHovered = node._id === hoveredNode;
                
                return (
                  <div
                    key={`${track.id}-${node._id}`}
                    style={{ width: cellWidth }}
                    className={`flex-shrink-0 border-r border-zinc-100 flex items-center justify-center p-1 cursor-pointer transition-all ${
                      isSelected ? "bg-violet-100" : isHovered ? "bg-zinc-100" : ""
                    }`}
                    onClick={() => onSelectNode(node._id)}
                    onMouseEnter={() => onHoverNode(node._id)}
                    onMouseLeave={() => onHoverNode(null)}
                  >
                    {hasEvent && (
                      <div 
                        className={`h-6 w-full max-w-[90%] rounded-full bg-gradient-to-r ${track.color} flex items-center justify-center shadow-sm ${
                          isSelected ? "ring-2 ring-violet-400 ring-offset-1" : ""
                        }`}
                      >
                        <Icon name={track.icon} className="h-3 w-3 text-white" />
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// =====================================================
// GANTT VIEW
// =====================================================

function GanttView({
  nodes,
  tracks,
  events,
  cellWidth,
  trackHeight,
  headerHeight,
  selectedNodeId,
  hoveredNode,
  onSelectNode,
  onHoverNode,
  minOrder,
  maxOrder,
}: {
  nodes: StoryNode[];
  tracks: TimelineTrack[];
  events: TimelineEvent[];
  cellWidth: number;
  trackHeight: number;
  headerHeight: number;
  selectedNodeId?: string;
  hoveredNode: string | null;
  onSelectNode: (nodeId: string) => void;
  onHoverNode: (nodeId: string | null) => void;
  minOrder: number;
  maxOrder: number;
}) {
  // Group consecutive events for each track
  const groupedEvents = useMemo(() => {
    const grouped: Map<string, { start: number; end: number; nodes: StoryNode[] }[]> = new Map();
    
    tracks.forEach(track => {
      const trackEvents = events
        .filter(e => e.trackId === track.id)
        .sort((a, b) => a.startOrder - b.startOrder);
      
      const groups: { start: number; end: number; nodes: StoryNode[] }[] = [];
      let currentGroup: { start: number; end: number; nodes: StoryNode[] } | null = null;
      
      trackEvents.forEach(event => {
        const node = nodes.find(n => n._id === event.nodeId);
        if (!node) return;
        
        if (!currentGroup) {
          currentGroup = { start: event.startOrder, end: event.endOrder, nodes: [node] };
        } else if (event.startOrder <= currentGroup.end + 1) {
          // Consecutive or overlapping
          currentGroup.end = Math.max(currentGroup.end, event.endOrder);
          currentGroup.nodes.push(node);
        } else {
          groups.push(currentGroup);
          currentGroup = { start: event.startOrder, end: event.endOrder, nodes: [node] };
        }
      });
      
      if (currentGroup) groups.push(currentGroup);
      grouped.set(track.id, groups);
    });
    
    return grouped;
  }, [tracks, events, nodes]);

  const totalWidth = (maxOrder - minOrder + 2) * cellWidth + 200;

  return (
    <div style={{ width: totalWidth, minWidth: "100%" }}>
      {/* Header */}
      <div 
        className="sticky top-0 z-20 bg-white border-b border-zinc-200 flex"
        style={{ height: headerHeight }}
      >
        <div 
          className="sticky left-0 z-30 bg-zinc-50 border-r border-zinc-200 flex items-center justify-center"
          style={{ width: 200, minWidth: 200 }}
        >
          <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">Entity</span>
        </div>
        
        {/* Time markers */}
        <div className="flex">
          {Array.from({ length: maxOrder - minOrder + 2 }, (_, i) => minOrder + i).map(order => (
            <div
              key={order}
              style={{ width: cellWidth }}
              className="flex-shrink-0 border-r border-zinc-100 flex items-center justify-center"
            >
              <span className="text-xs text-zinc-500">{order}</span>
            </div>
          ))}
        </div>
      </div>

      {/* Tracks */}
      {tracks.map((track, trackIdx) => {
        const groups = groupedEvents.get(track.id) || [];
        
        return (
          <div
            key={track.id}
            className={`flex border-b border-zinc-100 relative ${trackIdx % 2 === 0 ? "bg-white" : "bg-zinc-50/50"}`}
            style={{ height: trackHeight + 8 }}
          >
            {/* Track Label */}
            <div 
              className="sticky left-0 z-10 bg-inherit border-r border-zinc-200 flex items-center gap-2 px-3"
              style={{ width: 200, minWidth: 200 }}
            >
              {track.entity?.media?.thumbnailUrl ? (
                <img 
                  src={track.entity.media.thumbnailUrl} 
                  alt={track.label} 
                  className="w-7 h-7 rounded-full object-cover"
                />
              ) : (
                <div className={`w-7 h-7 rounded-full bg-gradient-to-br ${track.color} flex items-center justify-center`}>
                  <Icon name={track.icon} className="h-3.5 w-3.5 text-white" />
                </div>
              )}
              <span className="text-xs font-medium text-zinc-700 truncate">{track.label}</span>
            </div>

            {/* Gantt Bars */}
            <div className="relative flex-1" style={{ marginLeft: 0 }}>
              {groups.map((group, groupIdx) => {
                const left = (group.start - minOrder) * cellWidth;
                const width = (group.end - group.start + 1) * cellWidth - 8;
                const isSelected = group.nodes.some(n => n._id === selectedNodeId);
                
                return (
                  <div
                    key={groupIdx}
                    className={`absolute top-1/2 -translate-y-1/2 h-8 rounded-lg bg-gradient-to-r ${track.color} shadow-sm cursor-pointer transition-all hover:shadow-md ${
                      isSelected ? "ring-2 ring-violet-400 ring-offset-1" : ""
                    }`}
                    style={{ left, width: Math.max(width, 30) }}
                    onClick={() => onSelectNode(group.nodes[0]._id)}
                    title={group.nodes.map(n => n.title).join(", ")}
                  >
                    <div className="h-full flex items-center justify-center px-2">
                      <span className="text-[10px] text-white font-medium truncate">
                        {group.nodes.length > 1 ? `${group.nodes.length} scenes` : group.nodes[0].title}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })}
    </div>
  );
}

// =====================================================
// COMPACT VIEW
// =====================================================

function CompactView({
  nodes,
  selectedNodeId,
  onSelectNode,
  entities,
}: {
  nodes: StoryNode[];
  selectedNodeId?: string;
  onSelectNode: (nodeId: string) => void;
  entities: Entity[];
}) {
  // Group nodes by type
  const groupedNodes = useMemo(() => {
    const chapters: StoryNode[] = [];
    const scenes: StoryNode[] = [];
    const beats: StoryNode[] = [];
    
    nodes.forEach(node => {
      if (node.nodeType === "CHAPTER") chapters.push(node);
      else if (node.nodeType === "SCENE") scenes.push(node);
      else beats.push(node);
    });
    
    return { chapters, scenes, beats };
  }, [nodes]);

  return (
    <div className="p-4 space-y-6">
      {/* Chapters Row */}
      {groupedNodes.chapters.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Icon name="chapter" className="h-4 w-4" />
            Chapters ({groupedNodes.chapters.length})
          </h4>
          <div className="flex gap-2 flex-wrap">
            {groupedNodes.chapters.map(node => (
              <CompactNodeCard
                key={node._id}
                node={node}
                isSelected={node._id === selectedNodeId}
                onSelect={() => onSelectNode(node._id)}
                entities={entities}
              />
            ))}
          </div>
        </div>
      )}

      {/* Scenes Row */}
      {groupedNodes.scenes.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Icon name="scene" className="h-4 w-4" />
            Scenes ({groupedNodes.scenes.length})
          </h4>
          <div className="flex gap-2 flex-wrap">
            {groupedNodes.scenes.map(node => (
              <CompactNodeCard
                key={node._id}
                node={node}
                isSelected={node._id === selectedNodeId}
                onSelect={() => onSelectNode(node._id)}
                entities={entities}
              />
            ))}
          </div>
        </div>
      )}

      {/* Beats Row */}
      {groupedNodes.beats.length > 0 && (
        <div>
          <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Icon name="target" className="h-4 w-4" />
            Beats ({groupedNodes.beats.length})
          </h4>
          <div className="flex gap-2 flex-wrap">
            {groupedNodes.beats.map(node => (
              <CompactNodeCard
                key={node._id}
                node={node}
                isSelected={node._id === selectedNodeId}
                onSelect={() => onSelectNode(node._id)}
                entities={entities}
              />
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function CompactNodeCard({
  node,
  isSelected,
  onSelect,
  entities,
}: {
  node: StoryNode;
  isSelected: boolean;
  onSelect: () => void;
  entities: Entity[];
}) {
  const config = NODE_TYPE_CONFIG[node.nodeType] || NODE_TYPE_CONFIG.SCENE;
  const participants = (node.participants || [])
    .map(p => entities.find(e => e._id === p.entityId))
    .filter(Boolean) as Entity[];

  return (
    <button
      onClick={onSelect}
      className={`flex flex-col items-start p-3 rounded-xl border text-left transition-all ${
        isSelected
          ? "bg-violet-50 border-violet-300 shadow-md ring-2 ring-violet-400"
          : "bg-white border-zinc-200 hover:border-zinc-300 hover:shadow-sm"
      }`}
      style={{ minWidth: 160 }}
    >
      <div className="flex items-center gap-2 mb-2 w-full">
        <div className={`w-6 h-6 rounded flex items-center justify-center bg-gradient-to-r ${config.color} text-white`}>
          <span className="text-[10px] font-bold">{node.time?.order ?? 0}</span>
        </div>
        <span className="text-xs font-medium text-zinc-900 truncate flex-1">{node.title}</span>
      </div>
      
      {participants.length > 0 && (
        <div className="flex -space-x-1.5">
          {participants.slice(0, 4).map(entity => (
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
          {participants.length > 4 && (
            <div className="w-5 h-5 rounded-full border-2 border-white bg-zinc-400 flex items-center justify-center">
              <span className="text-[8px] text-white font-bold">+{participants.length - 4}</span>
            </div>
          )}
        </div>
      )}
    </button>
  );
}
