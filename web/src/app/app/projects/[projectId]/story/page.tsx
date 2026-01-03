"use client";

import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import ReactFlow, {
  Background,
  Controls,
  MiniMap,
  useNodesState,
  useEdgesState,
  addEdge,
  useReactFlow,
  ReactFlowProvider,
  type Connection,
  type Edge,
  type Node,
} from "reactflow";
import "reactflow/dist/style.css";
import { apiFetch } from "@/lib/apiClient";
import type { StoryNode, StoryEdge, Entity } from "@/lib/models";
import { Icon, type IconName } from "@/lib/ui";
import { GlassCard, GlassButton, IconOption, GlassInput } from "@/components/GlassCard";
import { CinematicPromptBuilder, type CinematicSelections } from "@/components/CinematicPromptBuilder";
import { PropertiesPromptBuilder, type PropertySelections } from "@/components/PropertiesPromptBuilder";
import { PromptExportModal } from "@/components/PromptExportModal";
import { InsertNodeWizard } from "@/components/InsertNodeWizard";
import { SceneVersionPanel } from "@/components/SceneVersionPanel";
import { ScenePreviewModal } from "@/components/ScenePreviewModal";
import { ScreenplayPanel } from "@/components/ScreenplayPanel";
import type { ExportedPrompt, CinematicSettings, SceneVersion } from "@/lib/models";
import {
  NODE_TYPE_OPTIONS,
  EDGE_TYPE_OPTIONS,
  MOOD_OPTIONS,
  PACING_OPTIONS,
  FOCUS_OPTIONS,
  DRAMATIC_GOAL_OPTIONS,
  CONFLICT_OPTIONS,
  TURN_OPTIONS,
} from "@/lib/storyGraphIcons";

// =====================================================
// LAYOUT MODES FOR WINDOW MANAGEMENT
// =====================================================
type LayoutMode = "default" | "graph-focus" | "inspector-focus" | "fullscreen-graph" | "fullscreen-inspector";

// =====================================================
// STORY HIERARCHY TREE COMPONENT
// =====================================================
type TreeNodeData = {
  id: string;
  title: string;
  type: "CHAPTER" | "SCENE" | "BEAT";
  children: TreeNodeData[];
  synopsis?: string;
};

function StoryTreeNode({ 
  node, 
  level = 0, 
  selectedId, 
  onSelect,
  expandedIds,
  onToggleExpand,
  onDrillDown,
}: { 
  node: TreeNodeData; 
  level?: number; 
  selectedId: string | null;
  onSelect: (id: string) => void;
  expandedIds: Set<string>;
  onToggleExpand: (id: string) => void;
  onDrillDown?: (id: string) => void;
}) {
  const isExpanded = expandedIds.has(node.id);
  const hasChildren = node.children.length > 0;
  const isSelected = selectedId === node.id;

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

  return (
    <div className="select-none">
      <div
        className={`group flex items-center gap-2 rounded-xl px-3 py-2 cursor-pointer transition-all duration-200 ${
          isSelected 
            ? "bg-white/80 shadow-lg ring-2 ring-indigo-500" 
            : "hover:bg-white/40"
        }`}
        style={{ paddingLeft: `${level * 16 + 12}px` }}
        onClick={() => onSelect(node.id)}
      >
        {hasChildren ? (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onToggleExpand(node.id);
            }}
            className="flex h-5 w-5 items-center justify-center rounded-md hover:bg-white/60 transition-transform duration-200"
            style={{ transform: isExpanded ? "rotate(90deg)" : "rotate(0deg)" }}
          >
            <Icon name="chevronRight" className="h-3 w-3 text-zinc-500" />
          </button>
        ) : (
          <div className="w-5" />
        )}
        
        <div className={`flex h-7 w-7 items-center justify-center rounded-lg bg-gradient-to-br ${colorMap[node.type]} text-white shadow-sm`}>
          <Icon name={iconMap[node.type]} className="h-3.5 w-3.5" />
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="font-medium text-zinc-900 text-sm truncate" title={node.title}>{node.title}</div>
          <div className="text-[10px] text-zinc-500 uppercase tracking-wide">{node.type}</div>
        </div>
        {/* Drill-down button for chapters */}
        {node.type === "CHAPTER" && onDrillDown && (
          <button
            onClick={(e) => {
              e.stopPropagation();
              onDrillDown(node.id);
            }}
            className="opacity-0 group-hover:opacity-100 p-1.5 rounded-lg hover:bg-indigo-100 text-indigo-600 transition-all"
            title="View chapter contents"
          >
            <Icon name="arrowRight" className="h-3.5 w-3.5" />
          </button>
        )}
      </div>
      
      {hasChildren && isExpanded && (
        <div className="transition-all duration-300 ease-out">
          {node.children.map((child) => (
            <StoryTreeNode
              key={child.id}
              node={child}
              level={level + 1}
              selectedId={selectedId}
              onSelect={onSelect}
              expandedIds={expandedIds}
              onToggleExpand={onToggleExpand}
              onDrillDown={onDrillDown}
            />
          ))}
        </div>
      )}
    </div>
  );
}

// =====================================================
// VIEW MODE FOR HIERARCHICAL NAVIGATION
// =====================================================
type ViewMode = "overview" | "chapter" | "scene";
type ViewContext = {
  mode: ViewMode;
  chapterId?: string;
  sceneId?: string;
};

// =====================================================
// LEFT NAVIGATION PANEL - REDESIGNED FOR READABILITY
// =====================================================
function NavigationPanel({ 
  storyNodes, 
  selectedId, 
  onSelect,
  onCollapse,
  isCollapsed,
  onViewContextChange,
  viewContext,
}: { 
  storyNodes: StoryNode[]; 
  selectedId: string | null;
  onSelect: (id: string) => void;
  onCollapse: () => void;
  isCollapsed: boolean;
  onViewContextChange?: (context: ViewContext) => void;
  viewContext?: ViewContext;
}) {
  const [expandedIds, setExpandedIds] = useState<Set<string>>(new Set());
  const [searchTerm, setSearchTerm] = useState("");
  const [localViewContext, setLocalViewContext] = useState<ViewContext>({ mode: "overview" });
  
  const currentViewContext = viewContext || localViewContext;
  const setViewContext = onViewContextChange || setLocalViewContext;

  // Build tree structure from flat nodes
  const treeData = useMemo(() => {
    const chapters = storyNodes.filter(n => n.nodeType === "CHAPTER").sort((a, b) => (a.time?.order || 0) - (b.time?.order || 0));
    const scenes = storyNodes.filter(n => n.nodeType === "SCENE").sort((a, b) => (a.time?.order || 0) - (b.time?.order || 0));
    const beats = storyNodes.filter(n => n.nodeType === "BEAT").sort((a, b) => (a.time?.order || 0) - (b.time?.order || 0));

    // Simple grouping - scenes under chapters, beats under scenes
    const tree: TreeNodeData[] = chapters.map(chapter => ({
      id: chapter._id,
      title: chapter.title,
      type: "CHAPTER" as const,
      synopsis: chapter.synopsis,
      children: scenes
        .filter(s => s.title.includes(chapter.title.split(" ")[0]) || scenes.indexOf(s) < 3)
        .slice(0, 5)
        .map(scene => ({
          id: scene._id,
          title: scene.title,
          type: "SCENE" as const,
          synopsis: scene.synopsis,
          children: [],
        })),
    }));

    // Add orphan scenes
    const usedSceneIds = new Set(tree.flatMap(c => c.children.map(s => s.id)));
    const orphanScenes = scenes.filter(s => !usedSceneIds.has(s._id));
    orphanScenes.forEach(scene => {
      tree.push({
        id: scene._id,
        title: scene.title,
        type: "SCENE" as const,
        synopsis: scene.synopsis,
        children: [],
      });
    });

    // Add orphan beats
    beats.forEach(beat => {
      tree.push({
        id: beat._id,
        title: beat.title,
        type: "BEAT" as const,
        synopsis: beat.synopsis,
        children: [],
      });
    });

    return tree;
  }, [storyNodes]);

  const filteredTree = useMemo(() => {
    if (!searchTerm) return treeData;
    const term = searchTerm.toLowerCase();
    return treeData.filter(node => 
      node.title.toLowerCase().includes(term) ||
      node.children.some(c => c.title.toLowerCase().includes(term))
    );
  }, [treeData, searchTerm]);

  const toggleExpand = (id: string) => {
    setExpandedIds(prev => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const expandAll = () => {
    setExpandedIds(new Set(treeData.map(n => n.id)));
  };

  const collapseAll = () => {
    setExpandedIds(new Set());
  };

  // Get current chapter for breadcrumb
  const currentChapter = currentViewContext.chapterId 
    ? storyNodes.find(n => n._id === currentViewContext.chapterId)
    : null;

  // Get scenes for current chapter
  const chaptersForNav = storyNodes.filter(n => n.nodeType === "CHAPTER").sort((a, b) => (a.time?.order || 0) - (b.time?.order || 0));
  const scenesForNav = storyNodes.filter(n => n.nodeType === "SCENE").sort((a, b) => (a.time?.order || 0) - (b.time?.order || 0));

  if (isCollapsed) {
    return (
      <div className="h-full flex flex-col items-center py-4 bg-white/30 backdrop-blur-xl border-r border-white/30 shadow-lg">
        <button
          onClick={onCollapse}
          className="p-2.5 rounded-xl hover:bg-white/50 transition-all mb-4"
          title="Expand Navigation"
        >
          <Icon name="chevronRight" className="h-5 w-5 text-zinc-700" />
        </button>
        <div className="flex flex-col gap-3">
          <button 
            onClick={() => { onCollapse(); setViewContext({ mode: "overview" }); }}
            className="p-2.5 rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white shadow-md hover:scale-105 transition-all"
            title="Chapters"
          >
            <Icon name="chapter" className="h-5 w-5" />
          </button>
          <button 
            onClick={() => { onCollapse(); }}
            className="p-2.5 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 text-white shadow-md hover:scale-105 transition-all"
            title="Scenes"
          >
            <Icon name="scene" className="h-5 w-5" />
          </button>
          <button 
            onClick={() => { onCollapse(); }}
            className="p-2.5 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-600 text-white shadow-md hover:scale-105 transition-all"
            title="Beats"
          >
            <Icon name="beat" className="h-5 w-5" />
          </button>
        </div>
        {/* Mini stats */}
        <div className="mt-auto flex flex-col gap-1 text-center">
          <div className="text-xs font-bold text-purple-600">{chaptersForNav.length}</div>
          <div className="text-xs font-bold text-blue-600">{scenesForNav.length}</div>
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white/30 backdrop-blur-xl border-r border-white/30 shadow-lg transition-all duration-300">
      {/* Header with Breadcrumb */}
      <div className="flex-shrink-0 border-b border-white/30">
        {/* Breadcrumb Navigation */}
        {currentViewContext.mode !== "overview" && (
          <div className="px-4 pt-3 pb-2">
            <div className="flex items-center gap-2 text-sm">
              <button
                onClick={() => setViewContext({ mode: "overview" })}
                className="text-indigo-600 hover:text-indigo-800 font-medium flex items-center gap-1 hover:underline"
              >
                <Icon name="layers" className="h-3.5 w-3.5" />
                All
              </button>
              {currentChapter && (
                <>
                  <Icon name="chevronRight" className="h-3 w-3 text-zinc-400" />
                  <span className="text-zinc-700 font-medium truncate max-w-[150px]">
                    {currentChapter.title}
                  </span>
                </>
              )}
            </div>
          </div>
        )}
        
        <div className="px-4 py-3">
          <div className="flex items-center justify-between mb-3">
            <h3 className="font-bold text-zinc-900 flex items-center gap-2 text-base">
              <div className="p-1.5 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                <Icon name="layers" className="h-4 w-4" />
              </div>
              {currentViewContext.mode === "overview" ? "Story Structure" : "Chapter View"}
            </h3>
            <button
              onClick={onCollapse}
              className="p-2 rounded-lg hover:bg-white/50 transition-all"
              title="Collapse"
            >
              <Icon name="chevronLeft" className="h-4 w-4 text-zinc-500" />
            </button>
          </div>
          
          {/* Search */}
          <div className="relative">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              placeholder="Search nodes..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2.5 rounded-xl bg-white/60 border border-white/40 text-sm placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white transition-all"
            />
          </div>

          {/* Quick Actions */}
          <div className="flex gap-2 mt-3">
            <button
              onClick={expandAll}
              className="flex-1 px-3 py-2 rounded-xl bg-white/50 text-xs font-semibold text-zinc-700 hover:bg-white/80 transition-all flex items-center justify-center gap-1.5"
            >
              <Icon name="chevronDown" className="h-3 w-3" />
              Expand
            </button>
            <button
              onClick={collapseAll}
              className="flex-1 px-3 py-2 rounded-xl bg-white/50 text-xs font-semibold text-zinc-700 hover:bg-white/80 transition-all flex items-center justify-center gap-1.5"
            >
              <Icon name="chevronUp" className="h-3 w-3" />
              Collapse
            </button>
          </div>
        </div>
      </div>

      {/* Tree View - Improved with better spacing and readability */}
      <div className="flex-1 overflow-auto px-3 py-2">
        {filteredTree.length === 0 ? (
          <div className="text-center py-12 px-4">
            <div className="mx-auto mb-3 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-zinc-100 text-zinc-400">
              <Icon name="search" className="h-6 w-6" />
            </div>
            <p className="text-zinc-500 text-sm">
              {searchTerm ? "No nodes match your search" : "No story nodes yet"}
            </p>
          </div>
        ) : (
          <div className="space-y-1">
            {filteredTree.map((node) => (
              <StoryTreeNode
                key={node.id}
                node={node}
                selectedId={selectedId}
                onSelect={onSelect}
                expandedIds={expandedIds}
                onToggleExpand={toggleExpand}
                onDrillDown={(id) => setViewContext({ mode: "chapter", chapterId: id })}
              />
            ))}
          </div>
        )}
      </div>

      {/* Stats Footer - Enhanced */}
      <div className="flex-shrink-0 p-4 border-t border-white/30 bg-white/20">
        <div className="grid grid-cols-3 gap-2">
          <div className="text-center p-2 rounded-xl bg-purple-50 border border-purple-100">
            <div className="text-xl font-bold text-purple-600">{storyNodes.filter(n => n.nodeType === "CHAPTER").length}</div>
            <div className="text-[10px] text-purple-500 uppercase font-semibold tracking-wide">Chapters</div>
          </div>
          <div className="text-center p-2 rounded-xl bg-blue-50 border border-blue-100">
            <div className="text-xl font-bold text-blue-600">{storyNodes.filter(n => n.nodeType === "SCENE").length}</div>
            <div className="text-[10px] text-blue-500 uppercase font-semibold tracking-wide">Scenes</div>
          </div>
          <div className="text-center p-2 rounded-xl bg-emerald-50 border border-emerald-100">
            <div className="text-xl font-bold text-emerald-600">{storyNodes.filter(n => n.nodeType === "BEAT").length}</div>
            <div className="text-[10px] text-emerald-500 uppercase font-semibold tracking-wide">Beats</div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// RIGHT PROPERTIES PANEL (EDITABLE) WITH CINEMATIC PROMPT BUILDER
// =====================================================
function PropertiesPanel({
  selectedNode,
  onUpdate,
  onDelete,
  onOpenEditModal,
  onOpenExportModal,
  onCollapse,
  isCollapsed,
  saving,
  onPromptGenerated,
  onCinematicSettingsChange,
  onFocusNode,
  onDuplicateNode,
  onAddContinuation,
  onCreateVersion,
  onUploadImage,
  onUploadThumbnail,
  onDeleteThumbnail,
  onOpenScenePreview,
  currentPrompt,
  entities,
}: {
  selectedNode: StoryNode | null;
  onUpdate: (nodeId: string, data: Partial<StoryNode>) => Promise<void>;
  onDelete: (nodeId: string) => Promise<void>;
  onOpenEditModal: () => void;
  onOpenExportModal: () => void;
  onCollapse: () => void;
  isCollapsed: boolean;
  saving: boolean;
  onPromptGenerated?: (prompt: string) => void;
  onCinematicSettingsChange?: (nodeId: string, settings: any) => void;
  onFocusNode?: (nodeId: string) => void;
  onDuplicateNode?: (nodeId: string, variationType: 'DUPLICATE' | 'CLOSE_SHOT' | 'WIDE_SHOT') => void;
  onAddContinuation?: (nodeId: string) => void;
  onCreateVersion?: (nodeId: string, version: Partial<SceneVersion>) => Promise<void>;
  onUploadImage?: (nodeId: string, versionNumber: number, frameType: 'first' | 'last', file: File) => Promise<string>;
  onUploadThumbnail?: (nodeId: string, file: File) => Promise<string>;
  onDeleteThumbnail?: (nodeId: string) => Promise<void>;
  onOpenScenePreview?: () => void;
  currentPrompt?: string;
  entities?: Entity[];
}) {
  const [editingSynopsis, setEditingSynopsis] = useState(false);
  const [synopsisValue, setSynopsisValue] = useState("");
  const [editingGoal, setEditingGoal] = useState(false);
  const [goalValue, setGoalValue] = useState("");
  const [editingConflict, setEditingConflict] = useState(false);
  const [conflictValue, setConflictValue] = useState("");
  const [editingTurn, setEditingTurn] = useState(false);
  const [turnValue, setTurnValue] = useState("");
  const [editingHook, setEditingHook] = useState(false);
  const [hookValue, setHookValue] = useState("");
  const [activeTab, setActiveTab] = useState<"properties" | "cinematic" | "versions" | "screenplay">("cinematic");

  useEffect(() => {
    if (selectedNode) {
      setSynopsisValue(selectedNode.synopsis || "");
      setGoalValue(selectedNode.goals?.dramaticGoal || "");
      setConflictValue(selectedNode.goals?.conflict || "");
      setTurnValue(selectedNode.goals?.turn || "");
      setHookValue(selectedNode.hooks?.hook || "");
    }
  }, [selectedNode]);

  const saveField = async (field: string, value: string) => {
    if (!selectedNode) return;
    
    const updateData: any = {};
    if (field === "synopsis") {
      updateData.synopsis = value;
    } else if (field === "goal") {
      updateData.goals = { ...selectedNode.goals, dramaticGoal: value };
    } else if (field === "conflict") {
      updateData.goals = { ...selectedNode.goals, conflict: value };
    } else if (field === "turn") {
      updateData.goals = { ...selectedNode.goals, turn: value };
    } else if (field === "hook") {
      updateData.hooks = { ...selectedNode.hooks, hook: value };
    }
    
    await onUpdate(selectedNode._id, updateData);
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

  if (isCollapsed) {
    return (
      <div className="h-full flex flex-col items-center py-4 bg-white/20 backdrop-blur-xl border-l border-white/20">
        <button
          onClick={onCollapse}
          className="p-2 rounded-xl hover:bg-white/40 transition-all"
          title="Expand Properties"
        >
          <Icon name="chevronLeft" className="h-5 w-5 text-zinc-700" />
        </button>
        {selectedNode && (
          <div className="mt-4 flex flex-col gap-2">
            <div className={`p-2 rounded-xl bg-gradient-to-br ${colorMap[selectedNode.nodeType]} text-white`}>
              <Icon name={iconMap[selectedNode.nodeType]} className="h-4 w-4" />
            </div>
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600" title="Cinematic Prompt">
              <Icon name="camera" className="h-4 w-4" />
            </div>
          </div>
        )}
        {!selectedNode && (
          <div className="mt-4">
            <div className="p-2 rounded-xl bg-indigo-100 text-indigo-600" title="Cinematic Prompt Builder">
              <Icon name="camera" className="h-4 w-4" />
            </div>
          </div>
        )}
      </div>
    );
  }

  const EditableField = ({ 
    label, 
    value, 
    isEditing, 
    setIsEditing, 
    editValue, 
    setEditValue,
    onSave,
    fieldKey,
    multiline = false,
  }: {
    label: string;
    value: string;
    isEditing: boolean;
    setIsEditing: (v: boolean) => void;
    editValue: string;
    setEditValue: (v: string) => void;
    onSave: () => void;
    fieldKey: string;
    multiline?: boolean;
  }) => (
    <div className="group">
      <div className="flex items-center justify-between mb-1.5">
        <label className="text-xs font-semibold text-zinc-500 uppercase tracking-wide">{label}</label>
        {!isEditing && (
          <button
            onClick={() => setIsEditing(true)}
            className="opacity-0 group-hover:opacity-100 p-1 rounded hover:bg-white/40 transition-all"
          >
            <Icon name="edit" className="h-3 w-3 text-zinc-400" />
          </button>
        )}
      </div>
      {isEditing ? (
        <div className="space-y-2">
          {multiline ? (
            <textarea
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/60 border border-indigo-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={3}
              autoFocus
            />
          ) : (
            <input
              type="text"
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              className="w-full px-3 py-2 rounded-xl bg-white/60 border border-indigo-300 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
          )}
          <div className="flex gap-2">
            <button
              onClick={() => {
                onSave();
                setIsEditing(false);
              }}
              disabled={saving}
              className="flex-1 px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 transition-all disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save"}
            </button>
            <button
              onClick={() => {
                setEditValue(value);
                setIsEditing(false);
              }}
              className="px-3 py-1.5 rounded-lg bg-white/40 text-zinc-700 text-xs font-medium hover:bg-white/60 transition-all"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div className="rounded-xl bg-white/40 px-3 py-2.5 text-sm text-zinc-700 min-h-[40px]">
          {value || <span className="text-zinc-400 italic">Not set</span>}
        </div>
      )}
    </div>
  );

  return (
    <div className="h-full flex flex-col bg-white/20 backdrop-blur-xl border-l border-white/20 transition-all duration-300">
      {/* Header with Tabs */}
      <div className="flex-shrink-0 border-b border-white/20">
        <div className="p-3 flex items-center justify-between">
          <div className="flex items-center gap-1 bg-white/30 rounded-xl p-1">
            <button
              onClick={() => setActiveTab("cinematic")}
              className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                activeTab === "cinematic"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                  : "text-zinc-600 hover:bg-white/50"
              }`}
            >
              <Icon name="camera" className="h-3.5 w-3.5" />
              Cinematic
            </button>
            <button
              onClick={() => setActiveTab("versions")}
              className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                activeTab === "versions"
                  ? "bg-gradient-to-r from-violet-600 to-purple-600 text-white shadow-lg"
                  : "text-zinc-600 hover:bg-white/50"
              }`}
            >
              <Icon name="layers" className="h-3.5 w-3.5" />
              Versions
            </button>
            <button
              onClick={() => setActiveTab("screenplay")}
              className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                activeTab === "screenplay"
                  ? "bg-gradient-to-r from-rose-600 to-orange-600 text-white shadow-lg"
                  : "text-zinc-600 hover:bg-white/50"
              }`}
            >
              <Icon name="film" className="h-3.5 w-3.5" />
              Screenplay
            </button>
            <button
              onClick={() => setActiveTab("properties")}
              className={`px-2 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1 ${
                activeTab === "properties"
                  ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                  : "text-zinc-600 hover:bg-white/50"
              }`}
            >
              <Icon name="settings" className="h-3.5 w-3.5" />
              Props
            </button>
          </div>
          <button onClick={onCollapse} className="p-1.5 rounded-lg hover:bg-white/40 transition-all">
            <Icon name="chevronRight" className="h-4 w-4 text-zinc-500" />
          </button>
        </div>
        
        {/* Node Header - Show when node is selected */}
        {selectedNode && (
          <div className="px-3 pb-3">
            <div className="flex items-center gap-3 p-2 rounded-xl bg-white/40">
              <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${colorMap[selectedNode.nodeType]} text-white shadow-lg`}>
                <Icon name={iconMap[selectedNode.nodeType]} className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-zinc-900 truncate text-sm">{selectedNode.title}</div>
                <div className="text-[10px] text-zinc-500 uppercase tracking-wide">{selectedNode.nodeType}</div>
              </div>
              {/* Focus Button */}
              {onFocusNode && (
                <button
                  onClick={() => onFocusNode(selectedNode._id)}
                  className="p-2 rounded-lg bg-white/60 hover:bg-white text-indigo-600 transition-all"
                  title="Focus on this node in graph"
                >
                  <Icon name="target" className="h-4 w-4" />
                </button>
              )}
            </div>
          </div>
        )}
      </div>

      {/* Tab Content */}
      {activeTab === "cinematic" ? (
        <CinematicPromptBuilder
          key={selectedNode?._id || "no-node"}
          nodeId={selectedNode?._id}
          nodeTitle={selectedNode?.title}
          nodeSynopsis={selectedNode?.synopsis}
          screenplay={selectedNode?.screenplay}
          initialSelections={selectedNode?.cinematicSettings}
          onPromptGenerated={onPromptGenerated}
          onSelectionsChange={(selections) => {
            if (selectedNode && onCinematicSettingsChange) {
              onCinematicSettingsChange(selectedNode._id, selections);
            }
          }}
        />
      ) : activeTab === "versions" ? (
        <>
          {/* Versions Tab Content */}
          {!selectedNode ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-violet-500 to-purple-600 text-white">
                  <Icon name="layers" className="h-8 w-8" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-zinc-900">Scene Versions</h3>
                <p className="text-sm text-zinc-600">Select a scene to manage versions and images</p>
              </div>
            </div>
          ) : (
            <div className="flex-1 overflow-auto p-3">
              <SceneVersionPanel
                node={selectedNode}
                currentPrompt={currentPrompt || ""}
                cinematicSettings={selectedNode.cinematicSettings || {}}
                onVersionChange={async (versionNumber) => {
                  await onUpdate(selectedNode._id, {
                    versionHistory: {
                      ...selectedNode.versionHistory,
                      versions: selectedNode.versionHistory?.versions || [],
                      activeVersionNumber: versionNumber,
                    },
                  });
                }}
                onCreateVersion={async (version) => {
                  if (onCreateVersion) {
                    await onCreateVersion(selectedNode._id, version);
                  }
                }}
                onUploadImage={async (versionNumber, frameType, file) => {
                  if (onUploadImage) {
                    return await onUploadImage(selectedNode._id, versionNumber, frameType, file);
                  }
                  return "";
                }}
                onUploadThumbnail={async (file) => {
                  if (onUploadThumbnail) {
                    return await onUploadThumbnail(selectedNode._id, file);
                  }
                  return "";
                }}
                onDeleteThumbnail={async () => {
                  if (onDeleteThumbnail) {
                    await onDeleteThumbnail(selectedNode._id);
                  }
                }}
                onDuplicate={(variationType) => {
                  if (onDuplicateNode) {
                    onDuplicateNode(selectedNode._id, variationType);
                  }
                }}
                onAddContinuation={() => {
                  if (onAddContinuation) {
                    onAddContinuation(selectedNode._id);
                  }
                }}
                onOpenScenePreview={() => {
                  if (onOpenScenePreview) {
                    onOpenScenePreview();
                  }
                }}
                saving={saving}
              />
            </div>
          )}
        </>
      ) : activeTab === "screenplay" ? (
        <ScreenplayPanel
          node={selectedNode}
          entities={entities || []}
          onUpdate={onUpdate}
          saving={saving}
        />
      ) : (
        <>
          {/* Properties Tab Content */}
          {!selectedNode ? (
            <div className="flex-1 flex items-center justify-center p-6">
              <div className="text-center">
                <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                  <Icon name="eye" className="h-8 w-8" />
                </div>
                <h3 className="mb-2 text-lg font-semibold text-zinc-900">Inspector</h3>
                <p className="text-sm text-zinc-600">Select a node to view and edit its properties</p>
              </div>
            </div>
          ) : (
            <>
              {/* Synopsis at top */}
              <div className="flex-shrink-0 p-3 border-b border-white/20">
                <EditableField
                  label="Synopsis"
                  value={selectedNode.synopsis || ""}
                  isEditing={editingSynopsis}
                  setIsEditing={setEditingSynopsis}
                  editValue={synopsisValue}
                  setEditValue={setSynopsisValue}
                  onSave={() => saveField("synopsis", synopsisValue)}
                  fieldKey="synopsis"
                  multiline
                />
              </div>

              {/* Icon-based Dramatic Elements Editor */}
              <PropertiesPromptBuilder
                key={selectedNode._id}
                initialSelections={{
                  goal: selectedNode.goals?.dramaticGoal || "",
                  goalCustom: "",
                  conflict: selectedNode.goals?.conflict || "",
                  conflictCustom: "",
                  turn: selectedNode.goals?.turn || "",
                  turnCustom: "",
                  hook: selectedNode.hooks?.hook || "",
                  hookCustom: "",
                }}
                onSave={async (selections: PropertySelections) => {
                  // Determine what values to save (prefer custom if set)
                  const goalValue = selections.goalCustom || selections.goal;
                  const conflictValue = selections.conflictCustom || selections.conflict;
                  const turnValue = selections.turnCustom || selections.turn;
                  const hookValue = selections.hookCustom || selections.hook;
                  
                  await onUpdate(selectedNode._id, {
                    goals: {
                      ...selectedNode.goals,
                      dramaticGoal: goalValue,
                      conflict: conflictValue,
                      turn: turnValue,
                    },
                    hooks: {
                      ...selectedNode.hooks,
                      hook: hookValue,
                    },
                  });
                }}
                saving={saving}
              />

              {/* Actions Footer */}
              <div className="flex-shrink-0 p-3 border-t border-white/20 space-y-2">
                <button
                  onClick={onOpenExportModal}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium shadow-lg hover:scale-[1.02] transition-all"
                >
                  <Icon name="image" className="h-4 w-4" />
                  Export Prompt
                </button>
                <button
                  onClick={onOpenEditModal}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/60 text-zinc-700 font-medium hover:bg-white transition-all"
                >
                  <Icon name="edit" className="h-4 w-4" />
                  Edit with Icons
                </button>
                <button
                  onClick={() => onDelete(selectedNode._id)}
                  className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-white/40 text-red-600 font-medium hover:bg-red-50 transition-all"
                >
                  <Icon name="trash" className="h-4 w-4" />
                  Delete Node
                </button>
              </div>
            </>
          )}
        </>
      )}
    </div>
  );
}

// =====================================================
// FOCUS CONTROLLER - Handles focus commands from outside ReactFlow
// =====================================================
function FocusController({ 
  focusNodeId, 
  nodes 
}: { 
  focusNodeId: string | null; 
  nodes: Node[];
}) {
  const { setCenter } = useReactFlow();

  useEffect(() => {
    if (focusNodeId) {
      const node = nodes.find(n => n.id === focusNodeId);
      if (node) {
        setCenter(node.position.x + 100, node.position.y + 50, { zoom: 1.2, duration: 500 });
      }
    }
  }, [focusNodeId, nodes, setCenter]);

  return null;
}

// =====================================================
// GRAPH TOOLBAR - Uses useReactFlow for actual zoom/fit controls
// =====================================================
function GraphToolbar({
  layoutMode,
  setLayoutMode,
}: {
  layoutMode: LayoutMode;
  setLayoutMode: (mode: LayoutMode) => void;
}) {
  const { fitView, zoomIn, zoomOut, setViewport, getViewport } = useReactFlow();

  const handleFitView = () => {
    fitView({ padding: 0.2, duration: 300 });
  };

  const handleZoomIn = () => {
    zoomIn({ duration: 200 });
  };

  const handleZoomOut = () => {
    zoomOut({ duration: 200 });
  };

  const handleResetView = () => {
    setViewport({ x: 0, y: 0, zoom: 0.6 }, { duration: 300 });
  };

  return (
    <div className="absolute bottom-4 left-4 z-10 flex items-center gap-2">
      {/* Zoom Controls */}
      <div className="flex items-center gap-1 rounded-xl bg-white/80 backdrop-blur-xl p-1.5 shadow-lg border border-white/20">
        <button
          onClick={handleZoomIn}
          className="p-2.5 rounded-lg hover:bg-white transition-all"
          title="Zoom In"
        >
          <Icon name="zoomIn" className="h-5 w-5 text-zinc-700" />
        </button>
        <button
          onClick={handleZoomOut}
          className="p-2.5 rounded-lg hover:bg-white transition-all"
          title="Zoom Out"
        >
          <Icon name="zoomOut" className="h-5 w-5 text-zinc-700" />
        </button>
        <div className="w-px h-7 bg-zinc-200" />
        <button
          onClick={handleFitView}
          className="p-2.5 rounded-lg hover:bg-white transition-all bg-indigo-50"
          title="Fit All Nodes in View"
        >
          <Icon name="maximize" className="h-5 w-5 text-indigo-600" />
        </button>
        <button
          onClick={handleResetView}
          className="p-2.5 rounded-lg hover:bg-white transition-all"
          title="Reset View"
        >
          <Icon name="refresh" className="h-5 w-5 text-zinc-700" />
        </button>
      </div>

      {/* Layout Controls */}
      <div className="flex items-center gap-1 rounded-xl bg-white/80 backdrop-blur-xl p-1.5 shadow-lg border border-white/20">
        <button
          onClick={() => setLayoutMode("default")}
          className={`p-2.5 rounded-lg transition-all ${layoutMode === "default" ? "bg-indigo-100 text-indigo-700" : "hover:bg-white text-zinc-700"}`}
          title="Default Layout"
        >
          <Icon name="layers" className="h-5 w-5" />
        </button>
        <button
          onClick={() => setLayoutMode("graph-focus")}
          className={`p-2.5 rounded-lg transition-all ${layoutMode === "graph-focus" ? "bg-indigo-100 text-indigo-700" : "hover:bg-white text-zinc-700"}`}
          title="Focus Graph (Hide Panels)"
        >
          <Icon name="fullscreen" className="h-5 w-5" />
        </button>
        <button
          onClick={() => setLayoutMode(layoutMode === "fullscreen-graph" ? "default" : "fullscreen-graph")}
          className={`p-2.5 rounded-lg transition-all ${layoutMode === "fullscreen-graph" ? "bg-indigo-100 text-indigo-700" : "hover:bg-white text-zinc-700"}`}
          title="Fullscreen Mode"
        >
          <Icon name="move" className="h-5 w-5" />
        </button>
      </div>
    </div>
  );
}

// =====================================================
// FULLSCREEN OVERLAY WITH PROPERTIES PANEL
// =====================================================
function FullscreenOverlay({
  children,
  onClose,
  title,
  rightPanel,
  showRightPanel = true,
}: {
  children: React.ReactNode;
  onClose: () => void;
  title: string;
  rightPanel?: React.ReactNode;
  showRightPanel?: boolean;
}) {
  const [panelWidth, setPanelWidth] = useState(420);
  
  return (
    <div className="fixed inset-0 z-50 bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
      {/* Top Bar */}
      <div className="absolute top-0 left-0 right-0 h-12 bg-white/80 backdrop-blur-xl border-b border-white/20 flex items-center justify-between px-4 z-10">
        <h2 className="font-semibold text-zinc-900 flex items-center gap-2">
          <Icon name="maximize" className="h-4 w-4 text-indigo-600" />
          {title}
        </h2>
        <button
          onClick={onClose}
          className="flex items-center gap-2 px-3 py-1.5 rounded-xl bg-white/60 hover:bg-white text-zinc-700 font-medium text-sm transition-all"
        >
          <Icon name="x" className="h-4 w-4" />
          Exit Fullscreen
        </button>
      </div>
      <div className="pt-12 h-full flex">
        <div className={`flex-1 ${showRightPanel && rightPanel ? '' : ''}`}>{children}</div>
        {showRightPanel && rightPanel && (
          <div style={{ width: panelWidth }} className="flex-shrink-0 h-full border-l border-white/20">
            {rightPanel}
          </div>
        )}
      </div>
    </div>
  );
}

export default function StoryGraphPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;

  const [mounted, setMounted] = useState(false);
  const [storyNodes, setStoryNodes] = useState<StoryNode[]>([]);
  const [storyEdges, setStoryEdges] = useState<StoryEdge[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [selectedNode, setSelectedNode] = useState<StoryNode | null>(null);
  const [error, setError] = useState<string | null>(null);

  // Ensure we're mounted on client before API calls
  useEffect(() => {
    setMounted(true);
  }, []);

  // Node creation/editing state
  const [showCreateNode, setShowCreateNode] = useState(false);
  const [editingNode, setEditingNode] = useState<StoryNode | null>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [newNodeType, setNewNodeType] = useState<"BEAT" | "SCENE" | "CHAPTER">("SCENE");
  const [newNodeTitle, setNewNodeTitle] = useState("");
  const [newNodeOrder, setNewNodeOrder] = useState(0);

  // Icon selections for node
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [selectedPacing, setSelectedPacing] = useState<string>("");
  const [selectedFocus, setSelectedFocus] = useState<string>("");
  const [selectedGoal, setSelectedGoal] = useState<string>("");
  const [selectedConflict, setSelectedConflict] = useState<string>("");
  const [selectedTurn, setSelectedTurn] = useState<string>("");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);

  // AI generation state
  const [generating, setGenerating] = useState(false);
  const [generatedContent, setGeneratedContent] = useState<any>(null);
  const [saving, setSaving] = useState(false);

  // Layout state
  const [layoutMode, setLayoutMode] = useState<LayoutMode>("default");
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(false);
  
  // View context for hierarchical navigation (drill-down into chapters)
  const [viewContext, setViewContext] = useState<ViewContext>({ mode: "overview" });
  
  // Generated prompt state
  const [generatedPrompt, setGeneratedPrompt] = useState<string>("");
  
  // Export modal state
  const [showExportModal, setShowExportModal] = useState(false);
  const [exportedPrompts, setExportedPrompts] = useState<ExportedPrompt[]>([]);
  const [currentCinematicSettings, setCurrentCinematicSettings] = useState<CinematicSettings>({});

  // Insert node wizard state (double-click on edge)
  const [showInsertWizard, setShowInsertWizard] = useState(false);
  const [insertEdgeId, setInsertEdgeId] = useState<string>("");
  const [insertSourceNode, setInsertSourceNode] = useState<StoryNode | null>(null);
  const [insertTargetNode, setInsertTargetNode] = useState<StoryNode | null>(null);

  // ReactFlow state
  const [nodes, setNodes, onNodesChange] = useNodesState([]);
  const [edges, setEdges, onEdgesChange] = useEdgesState([]);

  const loadData = useCallback(async () => {
    const [nodesRes, edgesRes, entitiesRes] = await Promise.all([
      apiFetch<{ items: StoryNode[] }>(`/api/projects/${projectId}/storyNodes`),
      apiFetch<{ items: StoryEdge[] }>(`/api/projects/${projectId}/storyEdges`),
      apiFetch<{ items: Entity[] }>(`/api/projects/${projectId}/entities`),
    ]);

    console.log("Story nodes response:", nodesRes);
    console.log("Story edges response:", edgesRes);

    if (nodesRes.ok) {
      console.log("Setting story nodes:", nodesRes.data.items);
      setStoryNodes(nodesRes.data.items || []);
    } else {
      console.error("Failed to load story nodes:", nodesRes.error);
      setError(`Failed to load nodes: ${nodesRes.error?.message}`);
    }
    if (edgesRes.ok) setStoryEdges(edgesRes.data.items || []);
    if (entitiesRes.ok) setEntities(entitiesRes.data.items || []);
  }, [projectId]);

  useEffect(() => {
    if (mounted) {
      void loadData();
    }
  }, [mounted, loadData]);

  // Keep selectedNode in sync with storyNodes when storyNodes changes
  useEffect(() => {
    if (selectedNode && storyNodes.length > 0) {
      const freshNode = storyNodes.find(n => n._id === selectedNode._id);
      if (freshNode && JSON.stringify(freshNode) !== JSON.stringify(selectedNode)) {
        setSelectedNode(freshNode);
      }
    }
  }, [storyNodes]);

  // Convert story nodes to ReactFlow nodes with TIMELINE LAYOUT
  useEffect(() => {
    if (!storyNodes || !Array.isArray(storyNodes) || storyNodes.length === 0) {
      setNodes([]);
      return;
    }

    // Sort nodes by order for timeline layout
    const sortedNodes = [...storyNodes].sort((a, b) => (a.time?.order || 0) - (b.time?.order || 0));
    
    // Group by type for vertical lanes
    const chapters = sortedNodes.filter(n => n.nodeType === "CHAPTER");
    const scenes = sortedNodes.filter(n => n.nodeType === "SCENE");
    const beats = sortedNodes.filter(n => n.nodeType === "BEAT");
    
    // Timeline layout: horizontal flow with vertical type separation
    // Increased gaps for better visibility
    const HORIZONTAL_GAP = 300;
    const START_X = 100;
    const CHAPTER_Y = 50;
    const SCENE_Y = 280;
    const BEAT_Y = 510;

    const flowNodes: Node[] = sortedNodes.map((node) => {
      let x: number;
      let y: number;
      
      if (node.nodeType === "CHAPTER") {
        const idx = chapters.findIndex(n => n._id === node._id);
        x = START_X + idx * HORIZONTAL_GAP;
        y = CHAPTER_Y;
      } else if (node.nodeType === "SCENE") {
        const idx = scenes.findIndex(n => n._id === node._id);
        x = START_X + idx * HORIZONTAL_GAP;
        y = SCENE_Y;
      } else {
        const idx = beats.findIndex(n => n._id === node._id);
        x = START_X + idx * HORIZONTAL_GAP;
        y = BEAT_Y;
      }
      
      // Determine border color based on type
      const borderColor = node.nodeType === "CHAPTER" 
        ? "border-purple-300" 
        : node.nodeType === "SCENE" 
          ? "border-blue-300"
          : "border-emerald-300";
      
      const bgGradient = node.nodeType === "CHAPTER" 
        ? "from-purple-50/95 to-white/90" 
        : node.nodeType === "SCENE" 
          ? "from-blue-50/95 to-white/90"
          : "from-emerald-50/95 to-white/90";

      return {
        id: node._id,
        type: "default",
        position: { x, y },
        data: {
          label: (
          <div className={`min-w-[240px] max-w-[280px] rounded-2xl border-2 ${borderColor} bg-gradient-to-br ${bgGradient} p-4 shadow-xl backdrop-blur-xl hover:shadow-2xl transition-shadow cursor-pointer`}>
            {/* Thumbnail if available */}
            {node.thumbnail?.url && (
              <div className="-mx-4 -mt-4 mb-3 h-24 overflow-hidden rounded-t-xl">
                <img src={node.thumbnail.url} alt="" className="w-full h-full object-cover" />
              </div>
            )}
            
            <div className="flex items-start gap-3">
              <div className={`flex-shrink-0 flex h-11 w-11 items-center justify-center rounded-xl shadow-lg ${
                node.nodeType === "CHAPTER" 
                  ? "bg-gradient-to-br from-purple-500 to-indigo-600" 
                  : node.nodeType === "SCENE" 
                    ? "bg-gradient-to-br from-blue-500 to-cyan-600"
                    : "bg-gradient-to-br from-emerald-500 to-teal-600"
              } text-white`}>
                <Icon name={node.nodeType === "CHAPTER" ? "chapter" : node.nodeType === "SCENE" ? "scene" : "beat"} className="h-5 w-5" />
              </div>
              <div className="flex-1 min-w-0">
                <div className="font-bold text-zinc-900 line-clamp-2 text-sm leading-tight" title={node.title}>{node.title}</div>
                <div className="text-[10px] text-zinc-500 uppercase font-semibold tracking-wide mt-0.5">{node.nodeType}</div>
              </div>
            </div>
            
            {node.synopsis && (
              <div className="mt-3 text-xs text-zinc-600 line-clamp-2 leading-relaxed bg-white/50 rounded-lg p-2">{node.synopsis}</div>
            )}
            
            {/* Status badges */}
            <div className="mt-3 flex flex-wrap items-center gap-1.5">
              {node.goals?.dramaticGoal && (
                <div className="rounded-full bg-purple-100 border border-purple-200 px-2 py-0.5 text-[10px] font-semibold text-purple-700">Goal</div>
              )}
              {node.goals?.conflict && (
                <div className="rounded-full bg-red-100 border border-red-200 px-2 py-0.5 text-[10px] font-semibold text-red-700">Conflict</div>
              )}
              {node.hooks?.hook && (
                <div className="rounded-full bg-amber-100 border border-amber-200 px-2 py-0.5 text-[10px] font-semibold text-amber-700">Hook</div>
              )}
              {node.versionHistory?.versions && node.versionHistory.versions.length > 0 && (
                <div className="rounded-full bg-indigo-100 border border-indigo-200 px-2 py-0.5 text-[10px] font-semibold text-indigo-700">
                  V{node.versionHistory?.activeVersionNumber || node.versionHistory?.versions?.length || 1}
                </div>
              )}
            </div>
          </div>
          ),
        },
        style: {
          background: "transparent",
          border: "none",
          padding: 0,
        },
      };
    });

    setNodes(flowNodes);
  }, [storyNodes, setNodes]);

  // Convert story edges to ReactFlow edges
  useEffect(() => {
    if (!storyEdges || !Array.isArray(storyEdges) || storyEdges.length === 0) {
      setEdges([]);
      return;
    }

    const flowEdges: Edge[] = storyEdges.map((edge) => {
      const edgeOption = EDGE_TYPE_OPTIONS.find((o) => o.value === edge.edgeType);
      return {
        id: edge._id,
        source: edge.fromNodeId,
        target: edge.toNodeId,
        label: edge.edgeType,
        style: {
          stroke: edgeOption?.color || "#18181b",
          strokeWidth: 2,
        },
        animated: edge.edgeType !== "LINEAR",
      };
    });

    setEdges(flowEdges);
  }, [storyEdges, setEdges]);

  const onConnect = useCallback(
    async (connection: Connection) => {
      if (!connection.source || !connection.target) return;
      
      // Persist the new edge to the API
      try {
        const res = await apiFetch<{ edge: StoryEdge }>(
          `/api/projects/${projectId}/storyEdges`,
          {
            method: "POST",
            body: JSON.stringify({
              fromNodeId: connection.source,
              toNodeId: connection.target,
              edgeType: "LINEAR",
            }),
          }
        );

        if (res.ok) {
          // Add to local state with the real ID from the API
          const newEdge: Edge = {
            id: res.data.edge._id,
            source: connection.source,
            target: connection.target,
            label: "LINEAR",
            style: { stroke: "#18181b", strokeWidth: 2 },
            animated: false,
          };
          setEdges((eds) => [...eds, newEdge]);
          // Also update the storyEdges state
          setStoryEdges((prev) => [...prev, res.data.edge]);
        } else {
          setError(`Failed to create edge: ${res.error?.message}`);
        }
      } catch (err) {
        setError(err instanceof Error ? err.message : "Failed to create connection");
      }
    },
    [projectId, setEdges]
  );

  const handleGenerateNode = async () => {
    if (!newNodeTitle) {
      setError("Title is required");
      return;
    }

    setGenerating(true);
    setError(null);

    try {
      // First create the node
      const createRes = await apiFetch<{ node: StoryNode }>(
        `/api/projects/${projectId}/storyNodes`,
        {
          method: "POST",
          body: JSON.stringify({
            nodeType: newNodeType,
            title: newNodeTitle,
            synopsis: "",
            time: { order: newNodeOrder },
            goals: { dramaticGoal: "", conflict: "", turn: "" },
            hooks: { hook: "", foreshadow: [], payoffTargets: [] },
            participants: selectedParticipants.map((id) => ({
              entityId: id,
              role: "PROTAGONIST",
            })),
            locations: selectedLocations,
            worldStateDelta: [],
          }),
        }
      );

      if (!createRes.ok) {
        setError(`Failed to create node: ${createRes.error.message}`);
        setGenerating(false);
        return;
      }

      const nodeId = createRes.data.node._id;

      // Then generate content with AI
      const generateRes = await apiFetch<{ generated: any }>(
        `/api/projects/${projectId}/storyNodes/${nodeId}/generate`,
        {
          method: "POST",
          body: JSON.stringify({
            nodeType: newNodeType,
            title: newNodeTitle,
            iconSelections: {
              mood: selectedMood,
              pacing: selectedPacing,
              focus: selectedFocus,
              dramaticGoal: selectedGoal,
              conflict: selectedConflict,
              turn: selectedTurn,
            },
            participants: selectedParticipants,
            locations: selectedLocations,
          }),
        }
      );

      if (generateRes.ok && generateRes.data.generated) {
        setGeneratedContent(generateRes.data.generated);

        // Update the node with generated content
        await apiFetch(`/api/projects/${projectId}/storyNodes/${nodeId}`, {
          method: "PATCH",
          body: JSON.stringify({
            synopsis: generateRes.data.generated.synopsis,
            goals: {
              dramaticGoal: generateRes.data.generated.dramaticGoal,
              conflict: generateRes.data.generated.conflict,
              turn: generateRes.data.generated.turn,
            },
            hooks: {
              hook: generateRes.data.generated.hook,
              foreshadow: generateRes.data.generated.foreshadowing || [],
              payoffTargets: generateRes.data.generated.payoffs || [],
            },
          }),
        });
      }

      await loadData();
      setShowCreateNode(false);
      resetForm();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to generate node");
    } finally {
      setGenerating(false);
    }
  };

  const resetForm = () => {
    setNewNodeTitle("");
    setNewNodeOrder(0);
    setSelectedMood("");
    setSelectedPacing("");
    setSelectedFocus("");
    setSelectedGoal("");
    setSelectedConflict("");
    setSelectedTurn("");
    setSelectedParticipants([]);
    setSelectedLocations([]);
    setGeneratedContent(null);
  };

  const characters = (entities || []).filter((e) => e.type === "CHARACTER");
  const locations = (entities || []).filter((e) => e.type === "LOCATION");

  // Update node handler for properties panel
  const handleUpdateNode = async (nodeId: string, data: Partial<StoryNode>) => {
    setSaving(true);
    try {
      console.log("Updating node:", nodeId, "with data:", data);
      const res = await apiFetch<{ node: StoryNode }>(`/api/projects/${projectId}/storyNodes/${nodeId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      
      console.log("Update response:", res);
      
      if (res.ok && res.data.node) {
        // Update local state with the fresh node from API response
        const freshNode = res.data.node;
        setStoryNodes(prev => prev.map(n => n._id === nodeId ? freshNode : n));
        setSelectedNode(freshNode);
      } else if (!res.ok) {
        // Handle API error properly
        console.error("Failed to update node:", res.error);
        setError(res.error?.message || "Failed to update node");
      } else {
        // Fallback to full reload if response doesn't include node
        await loadData();
      }
    } catch (err) {
      console.error("Exception updating node:", err);
      setError(err instanceof Error ? err.message : "Failed to update node");
    } finally {
      setSaving(false);
    }
  };

  // Delete node handler
  const handleDeleteNode = async (nodeId: string) => {
    if (!confirm("Delete this node?")) return;
    await apiFetch(`/api/projects/${projectId}/storyNodes/${nodeId}`, {
      method: "DELETE",
    });
    setSelectedNode(null);
    await loadData();
  };

  // Save cinematic settings handler (debounced via ref to avoid excessive API calls)
  const cinematicSaveTimeoutRef = useRef<NodeJS.Timeout | null>(null);
  const handleCinematicSettingsChange = useCallback((nodeId: string, settings: any) => {
    // Clear any pending save
    if (cinematicSaveTimeoutRef.current) {
      clearTimeout(cinematicSaveTimeoutRef.current);
    }
    // Debounce the save by 500ms
    cinematicSaveTimeoutRef.current = setTimeout(async () => {
      try {
        await apiFetch(`/api/projects/${projectId}/storyNodes/${nodeId}`, {
          method: "PATCH",
          body: JSON.stringify({ cinematicSettings: settings }),
        });
        // Update local state without full reload
        setStoryNodes(prev => prev.map(n => 
          n._id === nodeId ? { ...n, cinematicSettings: settings } : n
        ));
        if (selectedNode?._id === nodeId) {
          setSelectedNode(prev => prev ? { ...prev, cinematicSettings: settings } : null);
        }
      } catch (err) {
        console.error("Failed to save cinematic settings:", err);
      }
    }, 500);
  }, [projectId, selectedNode]);

  // Select node from tree
  const handleSelectFromTree = (nodeId: string) => {
    const node = storyNodes.find(n => n._id === nodeId);
    setSelectedNode(node || null);
  };

  // Focus on a specific node in the graph
  const [focusNodeId, setFocusNodeId] = useState<string | null>(null);
  const handleFocusNode = useCallback((nodeId: string) => {
    setFocusNodeId(nodeId);
    // Reset after a short delay to allow re-focus on same node
    setTimeout(() => setFocusNodeId(null), 100);
  }, []);

  // Duplicate a node with variation
  const handleDuplicateNode = async (nodeId: string, variationType: 'DUPLICATE' | 'CLOSE_SHOT' | 'WIDE_SHOT') => {
    const sourceNode = storyNodes.find(n => n._id === nodeId);
    if (!sourceNode) return;

    setSaving(true);
    try {
      // Modify cinematic settings based on variation type
      let newCinematicSettings = { ...sourceNode.cinematicSettings };
      let titleSuffix = '';
      
      if (variationType === 'CLOSE_SHOT') {
        newCinematicSettings.shotFraming = 'Close-up';
        titleSuffix = ' (Close Shot)';
      } else if (variationType === 'WIDE_SHOT') {
        newCinematicSettings.shotFraming = 'Wide Shot';
        titleSuffix = ' (Wide Shot)';
      } else {
        titleSuffix = ' (Copy)';
      }

      const createRes = await apiFetch<{ node: StoryNode }>(
        `/api/projects/${projectId}/storyNodes`,
        {
          method: "POST",
          body: JSON.stringify({
            nodeType: sourceNode.nodeType,
            title: sourceNode.title + titleSuffix,
            synopsis: sourceNode.synopsis,
            time: { order: (sourceNode.time?.order || 0) + 0.5 },
            goals: sourceNode.goals,
            hooks: sourceNode.hooks,
            participants: sourceNode.participants,
            locations: sourceNode.locations,
            worldStateDelta: sourceNode.worldStateDelta,
            cinematicSettings: newCinematicSettings,
            parentNodeId: sourceNode._id,
            variationType,
          }),
        }
      );

      if (createRes.ok) {
        await loadData();
        setSelectedNode(createRes.data.node);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to duplicate node");
    } finally {
      setSaving(false);
    }
  };

  // Add continuation node
  const handleAddContinuation = async (nodeId: string) => {
    const sourceNode = storyNodes.find(n => n._id === nodeId);
    if (!sourceNode) return;

    setSaving(true);
    try {
      const createRes = await apiFetch<{ node: StoryNode }>(
        `/api/projects/${projectId}/storyNodes`,
        {
          method: "POST",
          body: JSON.stringify({
            nodeType: sourceNode.nodeType,
            title: sourceNode.title + ' — Continuation',
            synopsis: '',
            time: { order: (sourceNode.time?.order || 0) + 1 },
            goals: { dramaticGoal: '', conflict: '', turn: '' },
            hooks: { hook: '', foreshadow: [], payoffTargets: [] },
            participants: sourceNode.participants,
            locations: sourceNode.locations,
            worldStateDelta: [],
            cinematicSettings: sourceNode.cinematicSettings,
            parentNodeId: sourceNode._id,
            variationType: 'CONTINUATION',
          }),
        }
      );

      if (createRes.ok) {
        // Create edge from source to new continuation
        await apiFetch(`/api/projects/${projectId}/storyEdges`, {
          method: "POST",
          body: JSON.stringify({
            fromNodeId: sourceNode._id,
            toNodeId: createRes.data.node._id,
            edgeType: "LINEAR",
          }),
        });
        
        await loadData();
        setSelectedNode(createRes.data.node);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to add continuation");
    } finally {
      setSaving(false);
    }
  };

  // Create a new version for a scene
  const handleCreateVersion = async (nodeId: string, version: Partial<SceneVersion>) => {
    const node = storyNodes.find(n => n._id === nodeId);
    if (!node) return;

    setSaving(true);
    try {
      const existingVersions = node.versionHistory?.versions || [];
      
      // Get current active version to copy from, or use node-level data
      const currentActiveVersion = existingVersions.find(v => v.isActive);
      
      const newVersion: SceneVersion = {
        versionNumber: version.versionNumber || existingVersions.length + 1,
        title: version.title || currentActiveVersion?.title || node.title,
        synopsis: version.synopsis || currentActiveVersion?.synopsis || node.synopsis,
        goals: version.goals || currentActiveVersion?.goals || node.goals,
        hooks: version.hooks || currentActiveVersion?.hooks || node.hooks,
        prompt: version.prompt || generatedPrompt || '',
        cinematicSettings: version.cinematicSettings || currentActiveVersion?.cinematicSettings || node.cinematicSettings || {},
        thumbnail: version.thumbnail || currentActiveVersion?.thumbnail,
        createdAt: new Date(),
        isActive: true,
      };

      // Set all existing versions to inactive
      const updatedVersions = existingVersions.map(v => ({ ...v, isActive: false }));
      updatedVersions.push(newVersion);

      await handleUpdateNode(nodeId, {
        versionHistory: {
          versions: updatedVersions,
          activeVersionNumber: newVersion.versionNumber,
        },
      });
    } finally {
      setSaving(false);
    }
  };

  // Upload image for a version
  const handleUploadImage = async (nodeId: string, versionNumber: number, frameType: 'first' | 'last', file: File): Promise<string> => {
    const node = storyNodes.find(n => n._id === nodeId);
    if (!node) return '';

    // Convert file to base64 for now (in production, you'd upload to cloud storage)
    const reader = new FileReader();
    return new Promise((resolve) => {
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        
        const existingVersions = node.versionHistory?.versions || [];
        const updatedVersions = existingVersions.map(v => {
          if (v.versionNumber === versionNumber) {
            const frameImage = {
              url: base64,
              uploadedAt: new Date(),
            };
            return {
              ...v,
              [frameType === 'first' ? 'firstFrame' : 'lastFrame']: frameImage,
            };
          }
          return v;
        });

        await handleUpdateNode(nodeId, {
          versionHistory: {
            versions: updatedVersions,
            activeVersionNumber: node.versionHistory?.activeVersionNumber || versionNumber,
          },
        });

        resolve(base64);
      };
      reader.readAsDataURL(file);
    });
  };

  // Upload thumbnail for a node (stores both at node level AND active version level)
  const handleUploadThumbnail = async (nodeId: string, file: File): Promise<string> => {
    const node = storyNodes.find(n => n._id === nodeId);
    if (!node) return '';

    const reader = new FileReader();
    return new Promise((resolve) => {
      reader.onloadend = async () => {
        const base64 = reader.result as string;
        
        // Generate smaller thumbnail
        const img = new Image();
        img.onload = async () => {
          const canvas = document.createElement('canvas');
          const maxSize = 300;
          let width = img.width;
          let height = img.height;
          
          if (width > height) {
            if (width > maxSize) {
              height = (height * maxSize) / width;
              width = maxSize;
            }
          } else {
            if (height > maxSize) {
              width = (width * maxSize) / height;
              height = maxSize;
            }
          }
          
          canvas.width = width;
          canvas.height = height;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, width, height);
          const thumbnailBase64 = canvas.toDataURL('image/jpeg', 0.85);
          
          const thumbnailData = {
            url: thumbnailBase64,
            uploadedAt: new Date(),
            width,
            height,
          };

          // If we have version history, update the active version's thumbnail too
          if (node.versionHistory?.versions.length) {
            const updatedVersions = node.versionHistory.versions.map(v => {
              if (v.versionNumber === node.versionHistory?.activeVersionNumber) {
                return { ...v, thumbnail: thumbnailData };
              }
              return v;
            });
            
            await handleUpdateNode(nodeId, {
              thumbnail: thumbnailData, // Node-level for graph display
              versionHistory: {
                versions: updatedVersions,
                activeVersionNumber: node.versionHistory.activeVersionNumber,
              },
            });
          } else {
            // No version history, just update node-level
            await handleUpdateNode(nodeId, {
              thumbnail: thumbnailData,
            });
          }
          
          resolve(thumbnailBase64);
        };
        img.src = base64;
      };
      reader.readAsDataURL(file);
    });
  };

  // Delete thumbnail for a node
  const handleDeleteThumbnail = async (nodeId: string): Promise<void> => {
    await handleUpdateNode(nodeId, {
      thumbnail: undefined,
    });
  };

  // Scene preview modal state
  const [showScenePreview, setShowScenePreview] = useState(false);

  // Handle edge double-click to insert node
  const handleEdgeDoubleClick = useCallback((event: React.MouseEvent, edge: Edge) => {
    event.stopPropagation();
    
    // Find the source and target story nodes
    const sourceStoryNode = storyNodes.find(n => n._id === edge.source);
    const targetStoryNode = storyNodes.find(n => n._id === edge.target);
    
    if (sourceStoryNode && targetStoryNode) {
      setInsertEdgeId(edge.id);
      setInsertSourceNode(sourceStoryNode);
      setInsertTargetNode(targetStoryNode);
      setShowInsertWizard(true);
    }
  }, [storyNodes]);

  // Handle inserting a new node between two existing nodes
  const handleInsertNode = async (data: {
    nodeType: "BEAT" | "SCENE" | "CHAPTER";
    title: string;
    preset?: string;
    mood?: string;
    pacing?: string;
    dramaticGoal?: string;
    conflict?: string;
    participants?: string[];
    locations?: string[];
  }) => {
    if (!insertSourceNode || !insertTargetNode) return;

    setGenerating(true);
    setError(null);

    try {
      // Calculate order between source and target
      const sourceOrder = insertSourceNode.time?.order || 0;
      const targetOrder = insertTargetNode.time?.order || sourceOrder + 2;
      const newOrder = (sourceOrder + targetOrder) / 2;

      // Create the new node
      const createRes = await apiFetch<{ node: StoryNode }>(
        `/api/projects/${projectId}/storyNodes`,
        {
          method: "POST",
          body: JSON.stringify({
            nodeType: data.nodeType,
            title: data.title,
            synopsis: "",
            time: { order: newOrder },
            goals: {
              dramaticGoal: data.dramaticGoal || "",
              conflict: data.conflict || "",
              turn: "",
            },
            hooks: { hook: "", foreshadow: [], payoffTargets: [] },
            participants: (data.participants || []).map((id) => ({
              entityId: id,
              role: "PROTAGONIST",
            })),
            locations: data.locations || [],
            worldStateDelta: [],
          }),
        }
      );

      if (!createRes.ok) {
        setError(`Failed to create node: ${createRes.error.message}`);
        return;
      }

      const newNodeId = createRes.data.node._id;

      // Generate content with AI if we have selections
      if (data.mood || data.pacing || data.dramaticGoal || data.conflict) {
        const generateRes = await apiFetch<{ generated: any }>(
          `/api/projects/${projectId}/storyNodes/${newNodeId}/generate`,
          {
            method: "POST",
            body: JSON.stringify({
              nodeType: data.nodeType,
              title: data.title,
              iconSelections: {
                mood: data.mood || "",
                pacing: data.pacing || "",
                focus: "",
                dramaticGoal: data.dramaticGoal || "",
                conflict: data.conflict || "",
                turn: "",
              },
              participants: data.participants || [],
              locations: data.locations || [],
            }),
          }
        );

        if (generateRes.ok && generateRes.data.generated) {
          await apiFetch(`/api/projects/${projectId}/storyNodes/${newNodeId}`, {
            method: "PATCH",
            body: JSON.stringify({
              synopsis: generateRes.data.generated.synopsis,
              goals: {
                dramaticGoal: generateRes.data.generated.dramaticGoal,
                conflict: generateRes.data.generated.conflict,
                turn: generateRes.data.generated.turn,
              },
              hooks: {
                hook: generateRes.data.generated.hook,
                foreshadow: generateRes.data.generated.foreshadowing || [],
                payoffTargets: generateRes.data.generated.payoffs || [],
              },
            }),
          });
        }
      }

      // Delete the old edge
      const oldEdge = storyEdges.find(e => e._id === insertEdgeId);
      if (oldEdge) {
        await apiFetch(`/api/projects/${projectId}/storyEdges/${oldEdge._id}`, {
          method: "DELETE",
        });
      }

      // Create new edge from source to new node
      await apiFetch(`/api/projects/${projectId}/storyEdges`, {
        method: "POST",
        body: JSON.stringify({
          fromNodeId: insertSourceNode._id,
          toNodeId: newNodeId,
          edgeType: oldEdge?.edgeType || "LINEAR",
        }),
      });

      // Create new edge from new node to target
      await apiFetch(`/api/projects/${projectId}/storyEdges`, {
        method: "POST",
        body: JSON.stringify({
          fromNodeId: newNodeId,
          toNodeId: insertTargetNode._id,
          edgeType: "LINEAR",
        }),
      });

      // Reload data and close wizard
      await loadData();
      setShowInsertWizard(false);
      setInsertEdgeId("");
      setInsertSourceNode(null);
      setInsertTargetNode(null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to insert node");
    } finally {
      setGenerating(false);
    }
  };

  // Layout class calculations - optimized for maximum graph space
  const getLayoutClasses = () => {
    switch (layoutMode) {
      case "graph-focus":
        return {
          left: "w-0 hidden",
          center: "flex-1",
          right: "w-[420px]",
        };
      case "fullscreen-graph":
        return null; // handled separately
      default:
        return {
          left: leftPanelCollapsed ? "w-14" : "w-80",
          center: "flex-1",
          right: rightPanelCollapsed ? "w-14" : "w-[420px]",
        };
    }
  };

  const layoutClasses = getLayoutClasses();

  // Fullscreen graph mode - WITH PROPERTIES PANEL
  if (layoutMode === "fullscreen-graph") {
    return (
      <FullscreenOverlay 
        onClose={() => setLayoutMode("default")} 
        title="Story Graph — Fullscreen"
        rightPanel={
          <PropertiesPanel
            selectedNode={selectedNode}
            onUpdate={handleUpdateNode}
            onDelete={handleDeleteNode}
            onOpenEditModal={() => {
              if (selectedNode) {
                setEditingNode(selectedNode);
                setShowEditModal(true);
              }
            }}
            onOpenExportModal={() => {
              if (selectedNode) {
                setShowExportModal(true);
              }
            }}
            onCollapse={() => {}}
            isCollapsed={false}
            saving={saving}
            onPromptGenerated={setGeneratedPrompt}
            onCinematicSettingsChange={handleCinematicSettingsChange}
            onFocusNode={handleFocusNode}
            onDuplicateNode={handleDuplicateNode}
            onAddContinuation={handleAddContinuation}
            onCreateVersion={handleCreateVersion}
            onUploadImage={handleUploadImage}
            onUploadThumbnail={handleUploadThumbnail}
            onDeleteThumbnail={handleDeleteThumbnail}
            onOpenScenePreview={() => setShowScenePreview(true)}
            currentPrompt={generatedPrompt}
            entities={entities}
          />
        }
        showRightPanel={true}
      >
        <div className="h-full relative">
          <ReactFlow
            nodes={nodes}
            edges={edges}
            onNodesChange={onNodesChange}
            onEdgesChange={onEdgesChange}
            onConnect={onConnect}
            onNodeClick={(_, node) => {
              const storyNode = storyNodes.find((n) => n._id === node.id);
              setSelectedNode(storyNode || null);
            }}
            onEdgeDoubleClick={handleEdgeDoubleClick}
            onPaneClick={() => setSelectedNode(null)}
            fitView
            fitViewOptions={{ padding: 0.3 }}
            minZoom={0.2}
            maxZoom={2}
          >
            <Background gap={40} size={1} color="#e5e7eb" />
            <Controls />
            <MiniMap 
              style={{ 
                backgroundColor: 'rgba(255,255,255,0.8)',
                borderRadius: '12px',
              }}
            />
            <GraphToolbar
              layoutMode={layoutMode}
              setLayoutMode={setLayoutMode}
            />
            <FocusController focusNodeId={focusNodeId} nodes={nodes} />
          </ReactFlow>
        </div>
      </FullscreenOverlay>
    );
  }

  // Timeline lane labels for visual structure
  const TimelineLanes = () => (
    <div className="absolute left-2 top-0 bottom-0 w-20 flex flex-col justify-start pt-4 pointer-events-none z-10">
      <div className="mb-4" style={{ marginTop: '30px' }}>
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gradient-to-r from-purple-500/20 to-purple-500/5">
          <div className="w-2 h-2 rounded-full bg-purple-500" />
          <span className="text-[10px] font-bold text-purple-700 uppercase tracking-wider">Chapters</span>
        </div>
      </div>
      <div className="mb-4" style={{ marginTop: '200px' }}>
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gradient-to-r from-blue-500/20 to-blue-500/5">
          <div className="w-2 h-2 rounded-full bg-blue-500" />
          <span className="text-[10px] font-bold text-blue-700 uppercase tracking-wider">Scenes</span>
        </div>
      </div>
      <div style={{ marginTop: '200px' }}>
        <div className="flex items-center gap-2 px-2 py-1.5 rounded-lg bg-gradient-to-r from-emerald-500/20 to-emerald-500/5">
          <div className="w-2 h-2 rounded-full bg-emerald-500" />
          <span className="text-[10px] font-bold text-emerald-700 uppercase tracking-wider">Beats</span>
        </div>
      </div>
    </div>
  );

  return (
    <div className="h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 flex flex-col overflow-hidden">
      {/* Compact Header with Breadcrumb */}
      <div className="flex-shrink-0 px-4 py-2 bg-white/50 backdrop-blur-xl border-b border-white/30 shadow-sm">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg">
              <Icon name="story" className="h-5 w-5" />
            </div>
            <div>
              {/* Breadcrumb Navigation */}
              <div className="flex items-center gap-2">
                <h1 className="text-lg font-bold text-zinc-900">Story Graph</h1>
                {viewContext.mode !== "overview" && viewContext.chapterId && (
                  <>
                    <Icon name="chevronRight" className="h-4 w-4 text-zinc-400" />
                    <span className="text-lg font-semibold text-purple-700">
                      {storyNodes.find(n => n._id === viewContext.chapterId)?.title || "Chapter"}
                    </span>
                  </>
                )}
              </div>
              <p className="text-xs text-zinc-500 mt-0.5">
                {viewContext.mode === "overview" 
                  ? "AI-powered visual story structure" 
                  : "Viewing chapter scenes and beats"}
              </p>
            </div>
          </div>
          <div className="flex items-center gap-3">
            {error && (
              <div className="px-3 py-1.5 rounded-xl bg-red-50 border border-red-200 text-xs text-red-600 max-w-xs truncate">
                {error}
              </div>
            )}
            {viewContext.mode !== "overview" && (
              <GlassButton 
                size="sm" 
                variant="secondary"
                onClick={() => setViewContext({ mode: "overview" })}
              >
                <Icon name="chevronLeft" className="h-3.5 w-3.5" />
                Back to Overview
              </GlassButton>
            )}
            <GlassButton size="sm" onClick={() => setShowCreateNode(true)}>
              <Icon name="plus" className="h-3.5 w-3.5" />
              Create Node
            </GlassButton>
          </div>
        </div>
      </div>

      {/* Main Three-Panel Layout */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Navigation Panel */}
        <div className={`flex-shrink-0 transition-all duration-300 ease-out ${layoutClasses?.left || "w-72"}`}>
          <NavigationPanel
            storyNodes={storyNodes}
            selectedId={selectedNode?._id || null}
            onSelect={handleSelectFromTree}
            onCollapse={() => {
              if (layoutMode === "graph-focus") {
                setLayoutMode("default");
              } else {
                setLeftPanelCollapsed(!leftPanelCollapsed);
              }
            }}
            isCollapsed={layoutMode === "graph-focus" || leftPanelCollapsed}
            viewContext={viewContext}
            onViewContextChange={setViewContext}
          />
        </div>

        {/* Center Graph Panel */}
        <div className={`${layoutClasses?.center || "flex-1"} relative transition-all duration-300 ease-out`}>
          <div className="absolute inset-2">
            <GlassCard className="h-full p-0 overflow-hidden relative">
              {storyNodes.length === 0 ? (
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="mx-auto mb-4 inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                      <Icon name="story" className="h-10 w-10" />
                    </div>
                    <h3 className="mb-2 text-xl font-semibold text-zinc-900">No Story Nodes Yet</h3>
                    <p className="mb-4 text-zinc-600">Click "Create Node" to start building your story</p>
                    <GlassButton onClick={() => setShowCreateNode(true)}>
                      <Icon name="plus" className="h-4 w-4" />
                      Create Your First Node
                    </GlassButton>
                  </div>
                </div>
              ) : (
                <ReactFlow
                  nodes={nodes}
                  edges={edges}
                  onNodesChange={onNodesChange}
                  onEdgesChange={onEdgesChange}
                  onConnect={onConnect}
                  onNodeClick={(_, node) => {
                    const storyNode = storyNodes.find((n) => n._id === node.id);
                    setSelectedNode(storyNode || null);
                  }}
                  onEdgeDoubleClick={handleEdgeDoubleClick}
                  onPaneClick={() => setSelectedNode(null)}
                  fitView
                  fitViewOptions={{ padding: 0.3 }}
                  minZoom={0.2}
                  maxZoom={2}
                >
                  <Background gap={40} size={1} color="#e5e7eb" />
                  <MiniMap 
                    style={{ 
                      backgroundColor: 'rgba(255,255,255,0.9)',
                      borderRadius: '12px',
                      border: '1px solid rgba(255,255,255,0.3)',
                    }}
                    nodeColor={(node) => {
                      const storyNode = storyNodes.find(n => n._id === node.id);
                      if (storyNode?.nodeType === 'CHAPTER') return '#8b5cf6';
                      if (storyNode?.nodeType === 'SCENE') return '#06b6d4';
                      return '#10b981';
                    }}
                  />
                  {/* Graph Toolbar - MUST be inside ReactFlow for useReactFlow hook */}
                  <GraphToolbar
                    layoutMode={layoutMode}
                    setLayoutMode={setLayoutMode}
                  />
                  <FocusController focusNodeId={focusNodeId} nodes={nodes} />
                </ReactFlow>
              )}
            </GlassCard>
          </div>
        </div>

        {/* Right Properties Panel */}
        <div className={`flex-shrink-0 transition-all duration-300 ease-out ${layoutClasses?.right || "w-96"}`}>
          <PropertiesPanel
            selectedNode={selectedNode}
            onUpdate={handleUpdateNode}
            onDelete={handleDeleteNode}
            onOpenEditModal={() => {
              if (selectedNode) {
                setEditingNode(selectedNode);
                if (selectedNode.goals?.dramaticGoal) {
                  const goalMatch = DRAMATIC_GOAL_OPTIONS.find(o => 
                    selectedNode.goals?.dramaticGoal?.toLowerCase().includes(o.value.toLowerCase())
                  );
                  if (goalMatch) setSelectedGoal(goalMatch.value);
                }
                if (selectedNode.goals?.conflict) {
                  const conflictMatch = CONFLICT_OPTIONS.find(o => 
                    selectedNode.goals?.conflict?.toLowerCase().includes(o.value.toLowerCase())
                  );
                  if (conflictMatch) setSelectedConflict(conflictMatch.value);
                }
                setShowEditModal(true);
              }
            }}
            onOpenExportModal={() => {
              if (selectedNode) {
                setShowExportModal(true);
              }
            }}
            onCollapse={() => {
              if (layoutMode === "graph-focus") {
                setLayoutMode("default");
              } else {
                setRightPanelCollapsed(!rightPanelCollapsed);
              }
            }}
            isCollapsed={layoutMode === "graph-focus" || rightPanelCollapsed}
            saving={saving}
            onPromptGenerated={setGeneratedPrompt}
            onCinematicSettingsChange={handleCinematicSettingsChange}
            onFocusNode={handleFocusNode}
            onDuplicateNode={handleDuplicateNode}
            onAddContinuation={handleAddContinuation}
            onCreateVersion={handleCreateVersion}
            onUploadImage={handleUploadImage}
            onUploadThumbnail={handleUploadThumbnail}
            onDeleteThumbnail={handleDeleteThumbnail}
            onOpenScenePreview={() => setShowScenePreview(true)}
            currentPrompt={generatedPrompt}
            entities={entities}
          />
        </div>
      </div>

      {/* Scene Preview Modal */}
      {showScenePreview && selectedNode && (
        <ScenePreviewModal
          node={selectedNode}
          prompt={generatedPrompt}
          onClose={() => setShowScenePreview(false)}
          onUpdate={handleUpdateNode}
          saving={saving}
          entities={entities || []}
        />
      )}

      {/* Create Node Modal */}
        {showCreateNode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-5xl overflow-auto">
              <GlassCard className="p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-zinc-900">
                    Create Story Node with AI
                  </h2>
                  <GlassButton
                    variant="ghost"
                    onClick={() => {
                      setShowCreateNode(false);
                      resetForm();
                    }}
                  >
                    Close
                  </GlassButton>
                </div>

                <div className="space-y-6">
                  {/* Node Type */}
                  <div>
                    <h3 className="mb-3 font-semibold text-zinc-900">Node Type</h3>
                    <div className="grid grid-cols-3 gap-3">
                      {NODE_TYPE_OPTIONS.map((option) => (
                        <IconOption
                          key={option.value}
                          icon={<Icon name={option.icon as any} className="h-6 w-6" />}
                          label={option.label}
                          description={option.description}
                          selected={newNodeType === option.value}
                          onClick={() => setNewNodeType(option.value)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Title and Order */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <h3 className="mb-2 font-semibold text-zinc-900">Title</h3>
                      <GlassInput
                        value={newNodeTitle}
                        onChange={setNewNodeTitle}
                        placeholder="Enter title..."
                      />
                    </div>
                    <div>
                      <h3 className="mb-2 font-semibold text-zinc-900">Order</h3>
                      <GlassInput
                        value={String(newNodeOrder)}
                        onChange={(v) => setNewNodeOrder(Number(v) || 0)}
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Mood */}
                  <div>
                    <h3 className="mb-3 font-semibold text-zinc-900">Mood</h3>
                    <div className="grid grid-cols-4 gap-2">
                      {MOOD_OPTIONS.map((option) => (
                        <IconOption
                          key={option.value}
                          icon={<Icon name={option.icon as any} className="h-5 w-5" />}
                          label={option.label}
                          description={option.description}
                          selected={selectedMood === option.value}
                          onClick={() => setSelectedMood(option.value)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Pacing */}
                  <div>
                    <h3 className="mb-3 font-semibold text-zinc-900">Pacing</h3>
                    <div className="grid grid-cols-4 gap-2">
                      {PACING_OPTIONS.map((option) => (
                        <IconOption
                          key={option.value}
                          icon={<Icon name={option.icon as any} className="h-5 w-5" />}
                          label={option.label}
                          description={option.description}
                          selected={selectedPacing === option.value}
                          onClick={() => setSelectedPacing(option.value)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Focus */}
                  <div>
                    <h3 className="mb-3 font-semibold text-zinc-900">Focus</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {FOCUS_OPTIONS.map((option) => (
                        <IconOption
                          key={option.value}
                          icon={<Icon name={option.icon as any} className="h-5 w-5" />}
                          label={option.label}
                          description={option.description}
                          selected={selectedFocus === option.value}
                          onClick={() => setSelectedFocus(option.value)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Dramatic Goal */}
                  <div>
                    <h3 className="mb-3 font-semibold text-zinc-900">Dramatic Goal</h3>
                    <div className="grid grid-cols-4 gap-2">
                      {DRAMATIC_GOAL_OPTIONS.map((option) => (
                        <IconOption
                          key={option.value}
                          icon={<Icon name={option.icon as any} className="h-5 w-5" />}
                          label={option.label}
                          description={option.description}
                          selected={selectedGoal === option.value}
                          onClick={() => setSelectedGoal(option.value)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Conflict */}
                  <div>
                    <h3 className="mb-3 font-semibold text-zinc-900">Conflict Type</h3>
                    <div className="grid grid-cols-3 gap-2">
                      {CONFLICT_OPTIONS.map((option) => (
                        <IconOption
                          key={option.value}
                          icon={<Icon name={option.icon as any} className="h-5 w-5" />}
                          label={option.label}
                          description={option.description}
                          selected={selectedConflict === option.value}
                          onClick={() => setSelectedConflict(option.value)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Turn/Twist */}
                  <div>
                    <h3 className="mb-3 font-semibold text-zinc-900">Turn/Twist</h3>
                    <div className="grid grid-cols-4 gap-2">
                      {TURN_OPTIONS.map((option) => (
                        <IconOption
                          key={option.value}
                          icon={<Icon name={option.icon as any} className="h-5 w-5" />}
                          label={option.label}
                          description={option.description}
                          selected={selectedTurn === option.value}
                          onClick={() => setSelectedTurn(option.value)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Characters */}
                  {characters.length > 0 && (
                    <div>
                      <h3 className="mb-3 font-semibold text-zinc-900">
                        Characters (select multiple)
                      </h3>
                      <div className="grid grid-cols-3 gap-2">
                        {characters.map((char) => (
                          <IconOption
                            key={char._id}
                            icon={
                              char.media?.thumbnailUrl ? (
                                <img
                                  src={char.media.thumbnailUrl}
                                  className="h-6 w-6 rounded-full object-cover"
                                  alt={char.name}
                                />
                              ) : (
                                <Icon name="character" className="h-5 w-5" />
                              )
                            }
                            label={char.name}
                            selected={selectedParticipants.includes(char._id)}
                            onClick={() => {
                              setSelectedParticipants((prev) =>
                                prev.includes(char._id)
                                  ? prev.filter((id) => id !== char._id)
                                  : [...prev, char._id]
                              );
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Locations */}
                  {locations.length > 0 && (
                    <div>
                      <h3 className="mb-3 font-semibold text-zinc-900">
                        Locations (select multiple)
                      </h3>
                      <div className="grid grid-cols-3 gap-2">
                        {locations.map((loc) => (
                          <IconOption
                            key={loc._id}
                            icon={<Icon name="location" className="h-5 w-5" />}
                            label={loc.name}
                            selected={selectedLocations.includes(loc._id)}
                            onClick={() => {
                              setSelectedLocations((prev) =>
                                prev.includes(loc._id)
                                  ? prev.filter((id) => id !== loc._id)
                                  : [...prev, loc._id]
                              );
                            }}
                          />
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Generate Button */}
                  <div className="flex justify-end gap-3 border-t border-white/20 pt-6">
                    <GlassButton
                      variant="secondary"
                      onClick={() => {
                        setShowCreateNode(false);
                        resetForm();
                      }}
                    >
                      Cancel
                    </GlassButton>
                    <GlassButton onClick={handleGenerateNode} disabled={generating}>
                      <Icon name="sparkles" className="h-4 w-4" />
                      {generating ? "Generating with AI..." : "Generate with AI"}
                    </GlassButton>
                  </div>

                  {/* Generated Content Preview */}
                  {generatedContent && (
                    <div className="rounded-xl border border-green-200 bg-green-50 p-4">
                      <h3 className="mb-2 font-semibold text-green-900">
                        ✓ Generated Successfully
                      </h3>
                      <div className="space-y-2 text-sm text-green-800">
                        <div>
                          <strong>Synopsis:</strong> {generatedContent.synopsis}
                        </div>
                        <div>
                          <strong>Hook:</strong> {generatedContent.hook}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </GlassCard>
            </div>
          </div>
        )}

        {/* Edit Node Modal */}
        {showEditModal && editingNode && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
            <div className="max-h-[90vh] w-full max-w-4xl overflow-auto">
              <GlassCard className="p-6">
                <div className="mb-6 flex items-center justify-between">
                  <h2 className="text-2xl font-bold text-zinc-900">
                    Edit: {editingNode.title}
                  </h2>
                  <GlassButton
                    variant="ghost"
                    onClick={() => {
                      setShowEditModal(false);
                      setEditingNode(null);
                      resetForm();
                    }}
                  >
                    Close
                  </GlassButton>
                </div>

                <div className="space-y-6">
                  {/* Mood */}
                  <div>
                    <h3 className="mb-3 font-semibold text-zinc-900">Mood</h3>
                    <div className="grid grid-cols-4 gap-3">
                      {MOOD_OPTIONS.map((option) => (
                        <IconOption
                          key={option.value}
                          icon={<Icon name={option.icon as any} className="h-6 w-6" />}
                          label={option.label}
                          description={option.description}
                          selected={selectedMood === option.value}
                          onClick={() => setSelectedMood(option.value)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Pacing */}
                  <div>
                    <h3 className="mb-3 font-semibold text-zinc-900">Pacing</h3>
                    <div className="grid grid-cols-4 gap-3">
                      {PACING_OPTIONS.map((option) => (
                        <IconOption
                          key={option.value}
                          icon={<Icon name={option.icon as any} className="h-6 w-6" />}
                          label={option.label}
                          description={option.description}
                          selected={selectedPacing === option.value}
                          onClick={() => setSelectedPacing(option.value)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Dramatic Goal */}
                  <div>
                    <h3 className="mb-3 font-semibold text-zinc-900">Dramatic Goal</h3>
                    <div className="grid grid-cols-4 gap-3">
                      {DRAMATIC_GOAL_OPTIONS.map((option) => (
                        <IconOption
                          key={option.value}
                          icon={<Icon name={option.icon as any} className="h-6 w-6" />}
                          label={option.label}
                          description={option.description}
                          selected={selectedGoal === option.value}
                          onClick={() => setSelectedGoal(option.value)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Conflict */}
                  <div>
                    <h3 className="mb-3 font-semibold text-zinc-900">Conflict Type</h3>
                    <div className="grid grid-cols-4 gap-3">
                      {CONFLICT_OPTIONS.map((option) => (
                        <IconOption
                          key={option.value}
                          icon={<Icon name={option.icon as any} className="h-6 w-6" />}
                          label={option.label}
                          description={option.description}
                          selected={selectedConflict === option.value}
                          onClick={() => setSelectedConflict(option.value)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Turn */}
                  <div>
                    <h3 className="mb-3 font-semibold text-zinc-900">Story Turn</h3>
                    <div className="grid grid-cols-4 gap-3">
                      {TURN_OPTIONS.map((option) => (
                        <IconOption
                          key={option.value}
                          icon={<Icon name={option.icon as any} className="h-6 w-6" />}
                          label={option.label}
                          description={option.description}
                          selected={selectedTurn === option.value}
                          onClick={() => setSelectedTurn(option.value)}
                        />
                      ))}
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end gap-3 border-t border-white/20 pt-6">
                    <GlassButton
                      variant="secondary"
                      onClick={() => {
                        setShowEditModal(false);
                        setEditingNode(null);
                        resetForm();
                      }}
                    >
                      Cancel
                    </GlassButton>
                    <GlassButton
                      onClick={async () => {
                        setGenerating(true);
                        try {
                          // Regenerate content with new icon selections
                          const generateRes = await apiFetch<{ generated: any }>(
                            `/api/projects/${projectId}/storyNodes/${editingNode._id}/generate`,
                            {
                              method: "POST",
                              body: JSON.stringify({
                                nodeType: editingNode.nodeType,
                                title: editingNode.title,
                                iconSelections: {
                                  mood: selectedMood,
                                  pacing: selectedPacing,
                                  focus: selectedFocus,
                                  dramaticGoal: selectedGoal,
                                  conflict: selectedConflict,
                                  turn: selectedTurn,
                                },
                                participants: selectedParticipants,
                                locations: selectedLocations,
                              }),
                            }
                          );

                          if (generateRes.ok && generateRes.data.generated) {
                            // Update the node with regenerated content
                            await apiFetch(`/api/projects/${projectId}/storyNodes/${editingNode._id}`, {
                              method: "PATCH",
                              body: JSON.stringify({
                                synopsis: generateRes.data.generated.synopsis,
                                goals: {
                                  dramaticGoal: generateRes.data.generated.dramaticGoal,
                                  conflict: generateRes.data.generated.conflict,
                                  turn: generateRes.data.generated.turn,
                                },
                                hooks: {
                                  hook: generateRes.data.generated.hook,
                                  foreshadow: generateRes.data.generated.foreshadowing || [],
                                  payoffTargets: generateRes.data.generated.payoffs || [],
                                },
                              }),
                            });
                          }

                          await loadData();
                          setShowEditModal(false);
                          setEditingNode(null);
                          setSelectedNode(null);
                          resetForm();
                        } catch (err) {
                          setError(err instanceof Error ? err.message : "Failed to update node");
                        } finally {
                          setGenerating(false);
                        }
                      }}
                      disabled={generating}
                    >
                      <Icon name="sparkles" className="h-4 w-4" />
                      {generating ? "Regenerating..." : "Regenerate with AI"}
                    </GlassButton>
                  </div>
                </div>
              </GlassCard>
            </div>
          </div>
        )}

        {/* Export Prompt Modal */}
        {showExportModal && selectedNode && (
          <PromptExportModal
            isOpen={showExportModal}
            onClose={() => setShowExportModal(false)}
            node={selectedNode}
            entities={entities}
            cinematicSettings={currentCinematicSettings}
            previousPrompts={exportedPrompts}
            onExport={async (exportData) => {
              try {
                const res = await apiFetch<{ prompt: ExportedPrompt }>(
                  `/api/projects/${projectId}/exported-prompts`,
                  {
                    method: "POST",
                    body: JSON.stringify(exportData),
                  }
                );
                
                if (res.ok) {
                  setExportedPrompts(prev => [...prev, res.data.prompt]);
                  setShowExportModal(false);
                } else {
                  setError(`Export failed: ${res.error?.message}`);
                }
              } catch (err) {
                console.error("Export error:", err);
                setError("Failed to export prompt");
              }
            }}
          />
        )}

        {/* Insert Node Wizard (double-click on edge) */}
        <InsertNodeWizard
          isOpen={showInsertWizard}
          onClose={() => {
            setShowInsertWizard(false);
            setInsertEdgeId("");
            setInsertSourceNode(null);
            setInsertTargetNode(null);
          }}
          sourceNode={insertSourceNode}
          targetNode={insertTargetNode}
          edgeId={insertEdgeId}
          entities={entities}
          onInsert={handleInsertNode}
        />
    </div>
  );
}
