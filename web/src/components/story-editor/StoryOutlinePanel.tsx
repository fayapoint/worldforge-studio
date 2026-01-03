"use client";

import { useState, useCallback } from "react";
import { Icon, type IconName } from "@/lib/ui";
import type { StoryNode, StoryEdge } from "@/lib/models";

type StoryStats = {
  chapters: number;
  scenes: number;
  beats: number;
  characters: number;
  locations: number;
  wordCount: number;
  estimatedReadTime: number;
};

type StoryOutlinePanelProps = {
  nodes: StoryNode[];
  edges: StoryEdge[];
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
  onCreateNode: (type: "CHAPTER" | "SCENE" | "BEAT", afterNodeId?: string) => void;
  onDeleteNode: (id: string) => void;
  onReorderNodes: (nodes: { id: string; order: number }[]) => Promise<void>;
  collapsed: boolean;
  onToggleCollapse: () => void;
  stats: StoryStats;
};

type TreeNode = {
  id: string;
  node: StoryNode;
  children: TreeNode[];
};

export function StoryOutlinePanel({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  onCreateNode,
  onDeleteNode,
  onReorderNodes,
  collapsed,
  onToggleCollapse,
  stats,
}: StoryOutlinePanelProps) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [draggedId, setDraggedId] = useState<string | null>(null);
  const [dropTargetId, setDropTargetId] = useState<string | null>(null);

  // Build tree structure
  const chapters = nodes.filter(n => n.nodeType === "CHAPTER");
  const scenes = nodes.filter(n => n.nodeType === "SCENE");
  const beats = nodes.filter(n => n.nodeType === "BEAT");

  // Filter by search
  const filteredNodes = searchTerm
    ? nodes.filter(n => n.title.toLowerCase().includes(searchTerm.toLowerCase()))
    : nodes;

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const handleDragStart = (e: React.DragEvent, nodeId: string) => {
    setDraggedId(nodeId);
    e.dataTransfer.effectAllowed = "move";
  };

  const handleDragOver = (e: React.DragEvent, nodeId: string) => {
    e.preventDefault();
    if (draggedId !== nodeId) {
      setDropTargetId(nodeId);
    }
  };

  const handleDragEnd = async () => {
    if (draggedId && dropTargetId && draggedId !== dropTargetId) {
      const draggedNode = nodes.find(n => n._id === draggedId);
      const dropNode = nodes.find(n => n._id === dropTargetId);
      
      if (draggedNode && dropNode) {
        const dropOrder = dropNode.time?.order || 0;
        const newOrder = dropOrder + 0.5;
        
        // Recalculate all orders
        const reorderedNodes = nodes
          .map(n => {
            if (n._id === draggedId) {
              return { id: n._id, order: newOrder };
            }
            return { id: n._id, order: n.time?.order || 0 };
          })
          .sort((a, b) => a.order - b.order)
          .map((n, idx) => ({ id: n.id, order: idx }));

        await onReorderNodes(reorderedNodes);
      }
    }
    setDraggedId(null);
    setDropTargetId(null);
  };

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

  if (collapsed) {
    return (
      <div className="h-full flex flex-col items-center py-4 bg-white/60 backdrop-blur-xl border-r border-zinc-200/50">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg hover:bg-zinc-100 transition-all"
          title="Expand Outline"
        >
          <Icon name="chevronRight" className="h-5 w-5 text-zinc-600" />
        </button>
        <div className="mt-4 flex flex-col gap-2">
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white text-xs font-bold">
            {stats.chapters}
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 text-white text-xs font-bold">
            {stats.scenes}
          </div>
          <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white text-xs font-bold">
            {stats.beats}
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white/60 backdrop-blur-xl border-r border-zinc-200/50">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-zinc-200/50">
        <div className="flex items-center justify-between mb-3">
          <h3 className="font-bold text-zinc-900 flex items-center gap-2">
            <Icon name="layers" className="h-4 w-4 text-indigo-600" />
            Outline
          </h3>
          <button onClick={onToggleCollapse} className="p-1.5 rounded-lg hover:bg-zinc-100">
            <Icon name="chevronLeft" className="h-4 w-4 text-zinc-500" />
          </button>
        </div>

        {/* Search */}
        <div className="relative">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            placeholder="Search..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="w-full pl-9 pr-3 py-2 rounded-lg bg-white border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>

        {/* Quick Add Buttons */}
        <div className="mt-3 flex gap-2">
          <button
            onClick={() => onCreateNode("CHAPTER")}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-purple-100 text-purple-700 text-xs font-medium hover:bg-purple-200 transition-all"
          >
            <Icon name="plus" className="h-3 w-3" />
            Chapter
          </button>
          <button
            onClick={() => onCreateNode("SCENE")}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-blue-100 text-blue-700 text-xs font-medium hover:bg-blue-200 transition-all"
          >
            <Icon name="plus" className="h-3 w-3" />
            Scene
          </button>
          <button
            onClick={() => onCreateNode("BEAT")}
            className="flex-1 flex items-center justify-center gap-1.5 px-2 py-1.5 rounded-lg bg-emerald-100 text-emerald-700 text-xs font-medium hover:bg-emerald-200 transition-all"
          >
            <Icon name="plus" className="h-3 w-3" />
            Beat
          </button>
        </div>
      </div>

      {/* Tree View */}
      <div className="flex-1 overflow-auto p-2">
        {filteredNodes.length === 0 ? (
          <div className="text-center py-8 text-zinc-400 text-sm">
            {searchTerm ? "No results found" : "No story nodes yet"}
          </div>
        ) : (
          <div className="space-y-1">
            {filteredNodes.map((node) => {
              const isSelected = node._id === selectedNodeId;
              const isExpanded = expandedIds.has(node._id);
              const isDragging = node._id === draggedId;
              const isDropTarget = node._id === dropTargetId;

              return (
                <div
                  key={node._id}
                  draggable
                  onDragStart={(e) => handleDragStart(e, node._id)}
                  onDragOver={(e) => handleDragOver(e, node._id)}
                  onDragEnd={handleDragEnd}
                  onClick={() => onSelectNode(node._id)}
                  className={`group flex items-center gap-2 px-3 py-2 rounded-lg cursor-pointer transition-all ${
                    isSelected
                      ? "bg-indigo-100 ring-2 ring-indigo-300"
                      : isDragging
                      ? "opacity-50"
                      : isDropTarget
                      ? "bg-indigo-50 ring-2 ring-indigo-200 ring-dashed"
                      : "hover:bg-zinc-100"
                  }`}
                >
                  {/* Drag Handle */}
                  <div className="opacity-0 group-hover:opacity-100 cursor-grab">
                    <Icon name="move" className="h-3 w-3 text-zinc-400" />
                  </div>

                  {/* Type Icon */}
                  <div className={`flex h-6 w-6 items-center justify-center rounded-md bg-gradient-to-br ${colorMap[node.nodeType]} text-white shadow-sm`}>
                    <Icon name={iconMap[node.nodeType]} className="h-3 w-3" />
                  </div>

                  {/* Title */}
                  <div className="flex-1 min-w-0">
                    <div className="text-sm font-medium text-zinc-900 truncate">{node.title}</div>
                    <div className="text-[10px] text-zinc-500 uppercase">{node.nodeType}</div>
                  </div>

                  {/* Order Badge */}
                  <div className="text-[10px] font-mono text-zinc-400">
                    #{Math.floor(node.time?.order || 0)}
                  </div>

                  {/* Actions */}
                  <div className="opacity-0 group-hover:opacity-100 flex gap-1">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onCreateNode(node.nodeType, node._id);
                      }}
                      className="p-1 rounded hover:bg-zinc-200"
                      title="Add after"
                    >
                      <Icon name="plus" className="h-3 w-3 text-zinc-500" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        onDeleteNode(node._id);
                      }}
                      className="p-1 rounded hover:bg-red-100"
                      title="Delete"
                    >
                      <Icon name="trash" className="h-3 w-3 text-red-500" />
                    </button>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>

      {/* Stats Footer */}
      <div className="flex-shrink-0 p-3 border-t border-zinc-200/50 bg-zinc-50">
        <div className="grid grid-cols-3 gap-2 text-center">
          <div>
            <div className="text-lg font-bold text-purple-600">{stats.chapters}</div>
            <div className="text-[10px] text-zinc-500 uppercase">Chapters</div>
          </div>
          <div>
            <div className="text-lg font-bold text-blue-600">{stats.scenes}</div>
            <div className="text-[10px] text-zinc-500 uppercase">Scenes</div>
          </div>
          <div>
            <div className="text-lg font-bold text-emerald-600">{stats.beats}</div>
            <div className="text-[10px] text-zinc-500 uppercase">Beats</div>
          </div>
        </div>
        <div className="mt-2 text-center text-xs text-zinc-500">
          {stats.wordCount.toLocaleString()} words • ~{stats.estimatedReadTime} min read
        </div>
      </div>
    </div>
  );
}
