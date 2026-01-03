"use client";

import { useCallback, useEffect, useState, useMemo, useRef } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/apiClient";
import type { StoryNode, StoryEdge, Entity, ExportedPrompt } from "@/lib/models";
import { Icon, type IconName } from "@/lib/ui";
import { GlassCard, GlassButton } from "@/components/GlassCard";
import {
  StoryBookView,
  StoryOutlinePanel,
  StoryMetadataPanel,
  StoryTimelineView,
  StoryExportModal,
  SceneEditorModal,
  FullBookEditor,
} from "@/components/story-editor";

// =====================================================
// VIEW MODES
// =====================================================
type ViewMode = "book" | "full-book" | "timeline" | "cards" | "outline";

// =====================================================
// STORY STATISTICS
// =====================================================
type StoryStats = {
  chapters: number;
  scenes: number;
  beats: number;
  characters: number;
  locations: number;
  wordCount: number;
  estimatedReadTime: number;
};

function calculateStats(nodes: StoryNode[], entities: Entity[]): StoryStats {
  const chapters = nodes.filter(n => n.nodeType === "CHAPTER").length;
  const scenes = nodes.filter(n => n.nodeType === "SCENE").length;
  const beats = nodes.filter(n => n.nodeType === "BEAT").length;
  const characters = entities.filter(e => e.type === "CHARACTER").length;
  const locations = entities.filter(e => e.type === "LOCATION").length;
  
  // Estimate word count from synopses and content
  const wordCount = nodes.reduce((acc, node) => {
    const text = [
      node.synopsis || "",
      node.goals?.dramaticGoal || "",
      node.goals?.conflict || "",
      node.goals?.turn || "",
      node.hooks?.hook || "",
      node.screenplay?.sceneDirection || "",
      node.screenplay?.openingAction || "",
      node.screenplay?.closingAction || "",
      ...(node.screenplay?.characterInstances?.flatMap(c => c.dialogLines?.map(d => d.text) || []) || []),
    ].join(" ");
    return acc + text.split(/\s+/).filter(Boolean).length;
  }, 0);
  
  // Estimate read time (200 words per minute)
  const estimatedReadTime = Math.ceil(wordCount / 200);
  
  return { chapters, scenes, beats, characters, locations, wordCount, estimatedReadTime };
}

// =====================================================
// MAIN STORY EDITOR PAGE
// =====================================================
export default function StoryEditorPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;

  // Core state
  const [mounted, setMounted] = useState(false);
  const [storyNodes, setStoryNodes] = useState<StoryNode[]>([]);
  const [storyEdges, setStoryEdges] = useState<StoryEdge[]>([]);
  const [entities, setEntities] = useState<Entity[]>([]);
  const [exportedPrompts, setExportedPrompts] = useState<ExportedPrompt[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);

  // UI state
  const [viewMode, setViewMode] = useState<ViewMode>("book");
  const [selectedNodeId, setSelectedNodeId] = useState<string | null>(null);
  const [leftPanelCollapsed, setLeftPanelCollapsed] = useState(false);
  const [rightPanelCollapsed, setRightPanelCollapsed] = useState(true);
  const [showExportModal, setShowExportModal] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [focusMode, setFocusMode] = useState(false);
  const [editingSceneId, setEditingSceneId] = useState<string | null>(null);

  // Computed
  const selectedNode = useMemo(() => 
    storyNodes.find(n => n._id === selectedNodeId) || null,
    [storyNodes, selectedNodeId]
  );

  const stats = useMemo(() => calculateStats(storyNodes, entities), [storyNodes, entities]);

  const sortedNodes = useMemo(() => {
    return [...storyNodes].sort((a, b) => (a.time?.order || 0) - (b.time?.order || 0));
  }, [storyNodes]);

  const chapters = useMemo(() => sortedNodes.filter(n => n.nodeType === "CHAPTER"), [sortedNodes]);
  const scenes = useMemo(() => sortedNodes.filter(n => n.nodeType === "SCENE"), [sortedNodes]);
  const beats = useMemo(() => sortedNodes.filter(n => n.nodeType === "BEAT"), [sortedNodes]);

  // Mount effect
  useEffect(() => {
    setMounted(true);
  }, []);

  // Load data
  const loadData = useCallback(async () => {
    setLoading(true);
    try {
      const [nodesRes, edgesRes, entitiesRes, promptsRes] = await Promise.all([
        apiFetch<{ items: StoryNode[] }>(`/api/projects/${projectId}/storyNodes`),
        apiFetch<{ items: StoryEdge[] }>(`/api/projects/${projectId}/storyEdges`),
        apiFetch<{ items: Entity[] }>(`/api/projects/${projectId}/entities`),
        apiFetch<{ items: ExportedPrompt[] }>(`/api/projects/${projectId}/exportedPrompts`),
      ]);

      if (nodesRes.ok) setStoryNodes(nodesRes.data.items || []);
      if (edgesRes.ok) setStoryEdges(edgesRes.data.items || []);
      if (entitiesRes.ok) setEntities(entitiesRes.data.items || []);
      if (promptsRes.ok) setExportedPrompts(promptsRes.data.items || []);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load story data");
    } finally {
      setLoading(false);
    }
  }, [projectId]);

  useEffect(() => {
    if (mounted) {
      void loadData();
    }
  }, [mounted, loadData]);

  // Update node handler
  const handleUpdateNode = useCallback(async (nodeId: string, data: Partial<StoryNode>) => {
    setSaving(true);
    try {
      const res = await apiFetch<{ node: StoryNode }>(`/api/projects/${projectId}/storyNodes/${nodeId}`, {
        method: "PATCH",
        body: JSON.stringify(data),
      });
      
      if (res.ok && res.data.node) {
        setStoryNodes(prev => prev.map(n => n._id === nodeId ? res.data.node : n));
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update node");
    } finally {
      setSaving(false);
    }
  }, [projectId]);

  // Reorder nodes handler
  const handleReorderNodes = useCallback(async (reorderedNodes: { id: string; order: number }[]) => {
    setSaving(true);
    try {
      // Update all nodes with new order
      await Promise.all(
        reorderedNodes.map(({ id, order }) =>
          apiFetch(`/api/projects/${projectId}/storyNodes/${id}`, {
            method: "PATCH",
            body: JSON.stringify({ time: { order } }),
          })
        )
      );
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to reorder nodes");
    } finally {
      setSaving(false);
    }
  }, [projectId, loadData]);

  // Create node handler
  const handleCreateNode = useCallback(async (nodeType: "CHAPTER" | "SCENE" | "BEAT", afterNodeId?: string) => {
    setSaving(true);
    try {
      const afterNode = afterNodeId ? storyNodes.find(n => n._id === afterNodeId) : null;
      const newOrder = afterNode ? (afterNode.time?.order || 0) + 0.5 : storyNodes.length;
      
      const res = await apiFetch<{ node: StoryNode }>(`/api/projects/${projectId}/storyNodes`, {
        method: "POST",
        body: JSON.stringify({
          nodeType,
          title: `New ${nodeType.charAt(0) + nodeType.slice(1).toLowerCase()}`,
          synopsis: "",
          time: { order: newOrder },
          goals: { dramaticGoal: "", conflict: "", turn: "" },
          hooks: { hook: "", foreshadow: [], payoffTargets: [] },
          participants: [],
          locations: [],
          worldStateDelta: [],
        }),
      });

      if (res.ok && res.data.node) {
        await loadData();
        setSelectedNodeId(res.data.node._id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create node");
    } finally {
      setSaving(false);
    }
  }, [projectId, storyNodes, loadData]);

  // Delete node handler
  const handleDeleteNode = useCallback(async (nodeId: string) => {
    if (!confirm("Are you sure you want to delete this node?")) return;
    
    setSaving(true);
    try {
      await apiFetch(`/api/projects/${projectId}/storyNodes/${nodeId}`, {
        method: "DELETE",
      });
      
      if (selectedNodeId === nodeId) {
        setSelectedNodeId(null);
      }
      await loadData();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete node");
    } finally {
      setSaving(false);
    }
  }, [projectId, selectedNodeId, loadData]);

  if (loading) {
    return (
      <div className="flex h-[calc(100vh-200px)] items-center justify-center">
        <div className="text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
          <p className="text-zinc-600">Loading your story...</p>
        </div>
      </div>
    );
  }

  return (
    <div className={`h-[calc(100vh-120px)] flex flex-col ${isFullscreen ? "fixed inset-0 z-50 bg-gradient-to-br from-slate-50 via-indigo-50 to-purple-50 h-screen" : ""}`}>
      {/* Top Toolbar */}
      <div className="flex-shrink-0 bg-white/80 backdrop-blur-xl border-b border-zinc-200/50 px-4 py-3">
        <div className="flex items-center justify-between gap-4">
          {/* Left: Title & Stats */}
          <div className="flex items-center gap-4">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
                <Icon name="book" className="h-5 w-5" />
              </div>
              <div>
                <h1 className="font-bold text-zinc-900 text-lg">Story Editor</h1>
                <div className="flex items-center gap-3 text-xs text-zinc-500">
                  <span>{stats.chapters} chapters</span>
                  <span>•</span>
                  <span>{stats.scenes} scenes</span>
                  <span>•</span>
                  <span>~{stats.wordCount.toLocaleString()} words</span>
                  <span>•</span>
                  <span>~{stats.estimatedReadTime} min read</span>
                </div>
              </div>
            </div>
            
            {saving && (
              <div className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-50 border border-amber-200">
                <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
                <span className="text-xs font-medium text-amber-700">Saving...</span>
              </div>
            )}
          </div>

          {/* Center: View Mode Tabs */}
          <div className="flex items-center gap-1 bg-zinc-100 rounded-xl p-1">
            {[
              { id: "book" as const, label: "Book View", icon: "book" as IconName },
              { id: "full-book" as const, label: "Full Editor", icon: "edit" as IconName },
              { id: "timeline" as const, label: "Timeline", icon: "clock" as IconName },
              { id: "cards" as const, label: "Cards", icon: "layers" as IconName },
              { id: "outline" as const, label: "Outline", icon: "list" as IconName },
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setViewMode(mode.id)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-all ${
                  viewMode === mode.id
                    ? "bg-white text-indigo-600 shadow-sm"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                <Icon name={mode.icon} className="h-4 w-4" />
                <span className="hidden lg:inline">{mode.label}</span>
              </button>
            ))}
          </div>

          {/* Right: Actions */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => setFocusMode(!focusMode)}
              className={`p-2.5 rounded-xl transition-all ${
                focusMode 
                  ? "bg-indigo-100 text-indigo-600" 
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
              title="Focus Mode"
            >
              <Icon name="eye" className="h-5 w-5" />
            </button>
            <button
              onClick={() => setIsFullscreen(!isFullscreen)}
              className="p-2.5 rounded-xl bg-zinc-100 text-zinc-600 hover:bg-zinc-200 transition-all"
              title={isFullscreen ? "Exit Fullscreen" : "Fullscreen"}
            >
              <Icon name={isFullscreen ? "minimize" : "maximize"} className="h-5 w-5" />
            </button>
            <button
              onClick={() => setShowExportModal(true)}
              className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium shadow-lg hover:shadow-xl transition-all"
            >
              <Icon name="exports" className="h-4 w-4" />
              <span>Export</span>
            </button>
          </div>
        </div>
      </div>

      {/* Main Content Area */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Outline/Navigation */}
        {!focusMode && (
          <div className={`flex-shrink-0 transition-all duration-300 ${leftPanelCollapsed ? "w-12" : "w-72"}`}>
            <StoryOutlinePanel
              nodes={sortedNodes}
              edges={storyEdges}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
              onCreateNode={handleCreateNode}
              onDeleteNode={handleDeleteNode}
              onReorderNodes={handleReorderNodes}
              collapsed={leftPanelCollapsed}
              onToggleCollapse={() => setLeftPanelCollapsed(!leftPanelCollapsed)}
              stats={stats}
            />
          </div>
        )}

        {/* Main View */}
        <div className="flex-1 overflow-hidden">
          {viewMode === "book" && (
            <StoryBookView
              nodes={sortedNodes}
              edges={storyEdges}
              entities={entities}
              exportedPrompts={exportedPrompts}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
              onUpdateNode={handleUpdateNode}
              onCreateNode={handleCreateNode}
              onDeleteNode={handleDeleteNode}
              onReorderNodes={handleReorderNodes}
              onEditScene={setEditingSceneId}
              focusMode={focusMode}
            />
          )}
          {viewMode === "full-book" && (
            <FullBookEditor
              nodes={sortedNodes}
              edges={storyEdges}
              entities={entities}
              exportedPrompts={exportedPrompts}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
              onUpdateNode={handleUpdateNode}
              onCreateNode={handleCreateNode}
              onDeleteNode={handleDeleteNode}
              onEditScene={setEditingSceneId}
            />
          )}
          {viewMode === "timeline" && (
            <StoryTimelineView
              nodes={sortedNodes}
              edges={storyEdges}
              entities={entities}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
              onUpdateNode={handleUpdateNode}
            />
          )}
          {viewMode === "cards" && (
            <StoryCardsView
              nodes={sortedNodes}
              entities={entities}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
              onUpdateNode={handleUpdateNode}
              onReorderNodes={handleReorderNodes}
            />
          )}
          {viewMode === "outline" && (
            <StoryOutlineView
              nodes={sortedNodes}
              edges={storyEdges}
              selectedNodeId={selectedNodeId}
              onSelectNode={setSelectedNodeId}
              onUpdateNode={handleUpdateNode}
            />
          )}
        </div>

        {/* Right Panel - Metadata/Properties */}
        {!focusMode && selectedNode && (
          <div className={`flex-shrink-0 transition-all duration-300 ${rightPanelCollapsed ? "w-12" : "w-96"}`}>
            <StoryMetadataPanel
              node={selectedNode}
              entities={entities}
              exportedPrompts={exportedPrompts.filter(p => p.nodeId === selectedNode._id)}
              onUpdate={(data: Partial<StoryNode>) => handleUpdateNode(selectedNode._id, data)}
              onDelete={() => handleDeleteNode(selectedNode._id)}
              collapsed={rightPanelCollapsed}
              onToggleCollapse={() => setRightPanelCollapsed(!rightPanelCollapsed)}
              saving={saving}
            />
          </div>
        )}
      </div>

      {/* Export Modal */}
      {showExportModal && (
        <StoryExportModal
          nodes={sortedNodes}
          edges={storyEdges}
          entities={entities}
          exportedPrompts={exportedPrompts}
          onClose={() => setShowExportModal(false)}
        />
      )}

      {/* Scene Editor Modal */}
      {editingSceneId && (() => {
        const editingScene = storyNodes.find(n => n._id === editingSceneId);
        if (!editingScene) return null;
        return (
          <SceneEditorModal
            node={editingScene}
            entities={entities}
            exportedPrompts={exportedPrompts}
            projectId={projectId}
            onUpdate={async (data) => {
              await handleUpdateNode(editingSceneId, data);
            }}
            onClose={() => setEditingSceneId(null)}
          />
        );
      })()}

      {/* Error Toast */}
      {error && (
        <div className="fixed bottom-4 right-4 z-50 flex items-center gap-3 px-4 py-3 rounded-xl bg-red-50 border border-red-200 shadow-lg">
          <Icon name="warning" className="h-5 w-5 text-red-500" />
          <span className="text-sm text-red-700">{error}</span>
          <button onClick={() => setError(null)} className="p-1 rounded hover:bg-red-100">
            <Icon name="x" className="h-4 w-4 text-red-500" />
          </button>
        </div>
      )}
    </div>
  );
}

// =====================================================
// CARDS VIEW - Kanban-style card layout
// =====================================================
function StoryCardsView({
  nodes,
  entities,
  selectedNodeId,
  onSelectNode,
  onUpdateNode,
  onReorderNodes,
}: {
  nodes: StoryNode[];
  entities: Entity[];
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
  onUpdateNode: (nodeId: string, data: Partial<StoryNode>) => Promise<void>;
  onReorderNodes: (nodes: { id: string; order: number }[]) => Promise<void>;
}) {
  const chapters = nodes.filter(n => n.nodeType === "CHAPTER");
  const scenes = nodes.filter(n => n.nodeType === "SCENE");
  const beats = nodes.filter(n => n.nodeType === "BEAT");

  const NodeCard = ({ node }: { node: StoryNode }) => {
    const isSelected = node._id === selectedNodeId;
    const colorMap: Record<string, string> = {
      CHAPTER: "from-purple-500 to-indigo-600",
      SCENE: "from-blue-500 to-cyan-600",
      BEAT: "from-emerald-500 to-teal-600",
    };
    const bgMap: Record<string, string> = {
      CHAPTER: "bg-purple-50 border-purple-200",
      SCENE: "bg-blue-50 border-blue-200",
      BEAT: "bg-emerald-50 border-emerald-200",
    };

    return (
      <div
        onClick={() => onSelectNode(node._id)}
        className={`group cursor-pointer rounded-xl border-2 p-4 transition-all hover:shadow-lg ${
          isSelected ? "ring-2 ring-indigo-500 shadow-lg" : ""
        } ${bgMap[node.nodeType]}`}
      >
        {node.thumbnail?.url && (
          <div className="-mx-4 -mt-4 mb-3 h-32 overflow-hidden rounded-t-xl">
            <img src={node.thumbnail.url} alt="" className="w-full h-full object-cover" />
          </div>
        )}
        <div className="flex items-start gap-3">
          <div className={`flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-br ${colorMap[node.nodeType]} text-white shadow-md`}>
            <Icon name={node.nodeType === "CHAPTER" ? "chapter" : node.nodeType === "SCENE" ? "scene" : "beat"} className="h-4 w-4" />
          </div>
          <div className="flex-1 min-w-0">
            <h4 className="font-semibold text-zinc-900 text-sm line-clamp-2">{node.title}</h4>
            <p className="text-xs text-zinc-500 mt-1 line-clamp-2">{node.synopsis || "No synopsis"}</p>
          </div>
        </div>
        {/* Status badges */}
        <div className="mt-3 flex flex-wrap gap-1">
          {node.goals?.dramaticGoal && (
            <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-purple-100 text-purple-700">Goal</span>
          )}
          {node.goals?.conflict && (
            <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-red-100 text-red-700">Conflict</span>
          )}
          {node.screenplay?.characterInstances?.length && (
            <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-blue-100 text-blue-700">
              {node.screenplay.characterInstances.length} chars
            </span>
          )}
        </div>
      </div>
    );
  };

  return (
    <div className="h-full overflow-auto p-6 bg-gradient-to-br from-slate-50 via-indigo-50/30 to-purple-50/30">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Chapters Column */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-purple-500 to-indigo-600 text-white">
              <Icon name="chapter" className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-zinc-900">Chapters</h3>
            <span className="ml-auto px-2 py-0.5 text-xs font-medium rounded-full bg-purple-100 text-purple-700">{chapters.length}</span>
          </div>
          <div className="space-y-3">
            {chapters.map(node => <NodeCard key={node._id} node={node} />)}
          </div>
        </div>

        {/* Scenes Column */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-blue-500 to-cyan-600 text-white">
              <Icon name="scene" className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-zinc-900">Scenes</h3>
            <span className="ml-auto px-2 py-0.5 text-xs font-medium rounded-full bg-blue-100 text-blue-700">{scenes.length}</span>
          </div>
          <div className="space-y-3">
            {scenes.map(node => <NodeCard key={node._id} node={node} />)}
          </div>
        </div>

        {/* Beats Column */}
        <div>
          <div className="flex items-center gap-2 mb-4">
            <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 text-white">
              <Icon name="beat" className="h-4 w-4" />
            </div>
            <h3 className="font-bold text-zinc-900">Beats</h3>
            <span className="ml-auto px-2 py-0.5 text-xs font-medium rounded-full bg-emerald-100 text-emerald-700">{beats.length}</span>
          </div>
          <div className="space-y-3">
            {beats.map(node => <NodeCard key={node._id} node={node} />)}
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// OUTLINE VIEW - Simple text outline
// =====================================================
function StoryOutlineView({
  nodes,
  edges,
  selectedNodeId,
  onSelectNode,
  onUpdateNode,
}: {
  nodes: StoryNode[];
  edges: StoryEdge[];
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
  onUpdateNode: (nodeId: string, data: Partial<StoryNode>) => Promise<void>;
}) {
  const chapters = nodes.filter(n => n.nodeType === "CHAPTER");
  const scenes = nodes.filter(n => n.nodeType === "SCENE");

  return (
    <div className="h-full overflow-auto p-8 bg-white">
      <div className="max-w-4xl mx-auto">
        <div className="prose prose-zinc max-w-none">
          {chapters.length === 0 && scenes.length === 0 ? (
            <div className="text-center py-12 text-zinc-400">
              <Icon name="book" className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>No story content yet. Start by creating chapters and scenes.</p>
            </div>
          ) : (
            <>
              {chapters.map((chapter, chapterIdx) => (
                <div key={chapter._id} className="mb-12">
                  <div
                    onClick={() => onSelectNode(chapter._id)}
                    className={`cursor-pointer rounded-lg p-4 -mx-4 transition-all ${
                      selectedNodeId === chapter._id ? "bg-purple-50 ring-2 ring-purple-300" : "hover:bg-zinc-50"
                    }`}
                  >
                    <h2 className="text-2xl font-bold text-zinc-900 mb-2">
                      Chapter {chapterIdx + 1}: {chapter.title}
                    </h2>
                    {chapter.synopsis && (
                      <p className="text-zinc-600 italic">{chapter.synopsis}</p>
                    )}
                  </div>
                  
                  {/* Show scenes for this chapter */}
                  <div className="mt-6 space-y-6 pl-6 border-l-2 border-zinc-200">
                    {scenes
                      .filter((_, idx) => idx >= chapterIdx * 3 && idx < (chapterIdx + 1) * 3)
                      .map((scene, sceneIdx) => (
                        <div
                          key={scene._id}
                          onClick={() => onSelectNode(scene._id)}
                          className={`cursor-pointer rounded-lg p-4 -ml-2 transition-all ${
                            selectedNodeId === scene._id ? "bg-blue-50 ring-2 ring-blue-300" : "hover:bg-zinc-50"
                          }`}
                        >
                          <h3 className="text-lg font-semibold text-zinc-800 mb-2">
                            Scene {sceneIdx + 1}: {scene.title}
                          </h3>
                          {scene.synopsis && (
                            <p className="text-zinc-600">{scene.synopsis}</p>
                          )}
                          {scene.screenplay?.sceneDirection && (
                            <p className="mt-2 text-sm text-zinc-500 italic">
                              {scene.screenplay.sceneDirection}
                            </p>
                          )}
                        </div>
                      ))}
                  </div>
                </div>
              ))}
              
              {/* Show orphan scenes */}
              {chapters.length === 0 && scenes.map((scene, idx) => (
                <div
                  key={scene._id}
                  onClick={() => onSelectNode(scene._id)}
                  className={`cursor-pointer rounded-lg p-4 -mx-4 mb-6 transition-all ${
                    selectedNodeId === scene._id ? "bg-blue-50 ring-2 ring-blue-300" : "hover:bg-zinc-50"
                  }`}
                >
                  <h3 className="text-lg font-semibold text-zinc-800 mb-2">
                    Scene {idx + 1}: {scene.title}
                  </h3>
                  {scene.synopsis && (
                    <p className="text-zinc-600">{scene.synopsis}</p>
                  )}
                </div>
              ))}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
