"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { Icon, type IconName } from "@/lib/ui";
import type { StoryNode, StoryEdge, Entity, ExportedPrompt } from "@/lib/models";

type StoryBookViewProps = {
  nodes: StoryNode[];
  edges: StoryEdge[];
  entities: Entity[];
  exportedPrompts: ExportedPrompt[];
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
  onUpdateNode: (nodeId: string, data: Partial<StoryNode>) => Promise<void>;
  onCreateNode: (type: "CHAPTER" | "SCENE" | "BEAT", afterNodeId?: string) => void;
  onDeleteNode: (id: string) => void;
  onReorderNodes: (nodes: { id: string; order: number }[]) => Promise<void>;
  focusMode: boolean;
};

// =====================================================
// RICH TEXT EDITOR COMPONENT
// =====================================================
function RichTextEditor({
  value,
  onChange,
  placeholder,
  className = "",
  minHeight = "100px",
}: {
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
  className?: string;
  minHeight?: string;
}) {
  const editorRef = useRef<HTMLDivElement>(null);
  const [isFocused, setIsFocused] = useState(false);

  useEffect(() => {
    if (editorRef.current && editorRef.current.innerHTML !== value) {
      editorRef.current.innerHTML = value || "";
    }
  }, [value]);

  const handleInput = () => {
    if (editorRef.current) {
      onChange(editorRef.current.innerHTML);
    }
  };

  const formatText = (command: string, value?: string) => {
    document.execCommand(command, false, value);
    editorRef.current?.focus();
  };

  return (
    <div className={`rounded-xl border transition-all ${isFocused ? "border-indigo-300 ring-2 ring-indigo-100" : "border-zinc-200"} ${className}`}>
      {/* Toolbar */}
      <div className="flex items-center gap-1 px-2 py-1.5 border-b border-zinc-200 bg-zinc-50 rounded-t-xl">
        <button
          onClick={() => formatText("bold")}
          className="p-1.5 rounded hover:bg-zinc-200 transition-all"
          title="Bold"
        >
          <Icon name="edit" className="h-3.5 w-3.5 text-zinc-600" />
        </button>
        <button
          onClick={() => formatText("italic")}
          className="p-1.5 rounded hover:bg-zinc-200 transition-all italic"
          title="Italic"
        >
          <span className="text-xs font-serif text-zinc-600">I</span>
        </button>
        <div className="w-px h-4 bg-zinc-300 mx-1" />
        <button
          onClick={() => formatText("insertUnorderedList")}
          className="p-1.5 rounded hover:bg-zinc-200 transition-all"
          title="Bullet List"
        >
          <Icon name="layers" className="h-3.5 w-3.5 text-zinc-600" />
        </button>
        <button
          onClick={() => formatText("insertOrderedList")}
          className="p-1.5 rounded hover:bg-zinc-200 transition-all"
          title="Numbered List"
        >
          <Icon name="layers" className="h-3.5 w-3.5 text-zinc-600" />
        </button>
        <div className="w-px h-4 bg-zinc-300 mx-1" />
        <button
          onClick={() => formatText("formatBlock", "h3")}
          className="p-1.5 rounded hover:bg-zinc-200 transition-all"
          title="Heading"
        >
          <span className="text-xs font-bold text-zinc-600">H</span>
        </button>
        <button
          onClick={() => formatText("formatBlock", "blockquote")}
          className="p-1.5 rounded hover:bg-zinc-200 transition-all"
          title="Quote"
        >
          <Icon name="edit" className="h-3.5 w-3.5 text-zinc-600" />
        </button>
      </div>

      {/* Editor */}
      <div
        ref={editorRef}
        contentEditable
        onInput={handleInput}
        onFocus={() => setIsFocused(true)}
        onBlur={() => setIsFocused(false)}
        className="px-4 py-3 text-sm text-zinc-800 focus:outline-none prose prose-sm max-w-none"
        style={{ minHeight }}
        data-placeholder={placeholder}
      />
    </div>
  );
}

// =====================================================
// CHAPTER SECTION COMPONENT
// =====================================================
function ChapterSection({
  chapter,
  chapterIndex,
  scenes,
  entities,
  exportedPrompts,
  selectedNodeId,
  onSelectNode,
  onUpdateNode,
  onCreateNode,
  isExpanded,
  onToggleExpand,
}: {
  chapter: StoryNode;
  chapterIndex: number;
  scenes: StoryNode[];
  entities: Entity[];
  exportedPrompts: ExportedPrompt[];
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
  onUpdateNode: (nodeId: string, data: Partial<StoryNode>) => Promise<void>;
  onCreateNode: (type: "CHAPTER" | "SCENE" | "BEAT", afterNodeId?: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const [editingTitle, setEditingTitle] = useState(false);
  const [titleValue, setTitleValue] = useState(chapter.title);
  const [editingSynopsis, setEditingSynopsis] = useState(false);
  const isSelected = chapter._id === selectedNodeId;

  const saveTitle = async () => {
    if (titleValue !== chapter.title) {
      await onUpdateNode(chapter._id, { title: titleValue });
    }
    setEditingTitle(false);
  };

  // Get characters in this chapter's scenes
  const chapterCharacters = new Set<string>();
  scenes.forEach(scene => {
    scene.screenplay?.characterInstances?.forEach(c => {
      chapterCharacters.add(c.entityId);
    });
  });
  const characterEntities = entities.filter(e => chapterCharacters.has(e._id));

  return (
    <div className={`mb-12 transition-all ${isSelected ? "ring-2 ring-purple-300 rounded-2xl" : ""}`}>
      {/* Chapter Header */}
      <div
        onClick={() => onSelectNode(chapter._id)}
        className={`group relative cursor-pointer rounded-2xl p-6 transition-all ${
          isSelected ? "bg-purple-50" : "hover:bg-zinc-50"
        }`}
      >
        {/* Chapter Number Badge */}
        <div className="absolute -left-4 top-6 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-purple-500 to-indigo-600 text-white font-bold shadow-lg">
          {chapterIndex + 1}
        </div>

        <div className="ml-8">
          {/* Title */}
          {editingTitle ? (
            <input
              type="text"
              value={titleValue}
              onChange={(e) => setTitleValue(e.target.value)}
              onBlur={saveTitle}
              onKeyDown={(e) => e.key === "Enter" && saveTitle()}
              autoFocus
              className="w-full text-2xl font-bold text-zinc-900 bg-transparent border-b-2 border-indigo-500 focus:outline-none"
            />
          ) : (
            <h2
              className="text-2xl font-bold text-zinc-900 hover:text-indigo-600 transition-colors"
              onDoubleClick={() => setEditingTitle(true)}
            >
              {chapter.title}
            </h2>
          )}

          {/* Synopsis */}
          <div className="mt-3">
            {editingSynopsis ? (
              <RichTextEditor
                value={chapter.synopsis || ""}
                onChange={(val) => onUpdateNode(chapter._id, { synopsis: val })}
                placeholder="Write a synopsis for this chapter..."
                minHeight="80px"
              />
            ) : (
              <p
                className="text-zinc-600 leading-relaxed cursor-text hover:bg-zinc-100 rounded-lg p-2 -m-2 transition-all"
                onDoubleClick={() => setEditingSynopsis(true)}
              >
                {chapter.synopsis || (
                  <span className="italic text-zinc-400">Double-click to add synopsis...</span>
                )}
              </p>
            )}
          </div>

          {/* Chapter Meta */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            {/* Scene Count */}
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
              <Icon name="scene" className="h-3.5 w-3.5" />
              {scenes.length} scenes
            </div>

            {/* Characters */}
            {characterEntities.length > 0 && (
              <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
                <Icon name="users" className="h-3.5 w-3.5" />
                {characterEntities.length} characters
              </div>
            )}

            {/* Dramatic Elements */}
            {chapter.goals?.dramaticGoal && (
              <div className="px-3 py-1.5 rounded-full bg-purple-100 text-purple-700 text-xs font-medium">
                Goal: {chapter.goals.dramaticGoal}
              </div>
            )}
            {chapter.goals?.conflict && (
              <div className="px-3 py-1.5 rounded-full bg-red-100 text-red-700 text-xs font-medium">
                Conflict
              </div>
            )}
            {chapter.hooks?.hook && (
              <div className="px-3 py-1.5 rounded-full bg-amber-100 text-amber-700 text-xs font-medium">
                Hook
              </div>
            )}

            {/* Expand/Collapse */}
            <button
              onClick={(e) => {
                e.stopPropagation();
                onToggleExpand();
              }}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-zinc-100 text-zinc-600 text-xs font-medium hover:bg-zinc-200 transition-all"
            >
              <Icon name={isExpanded ? "chevronUp" : "chevronDown"} className="h-3.5 w-3.5" />
              {isExpanded ? "Collapse" : "Expand Scenes"}
            </button>
          </div>
        </div>
      </div>

      {/* Scenes */}
      {isExpanded && (
        <div className="mt-4 ml-12 space-y-4 border-l-2 border-zinc-200 pl-6">
          {scenes.map((scene, sceneIdx) => (
            <SceneSection
              key={scene._id}
              scene={scene}
              sceneIndex={sceneIdx}
              entities={entities}
              exportedPrompts={exportedPrompts.filter(p => p.nodeId === scene._id)}
              selectedNodeId={selectedNodeId}
              onSelectNode={onSelectNode}
              onUpdateNode={onUpdateNode}
            />
          ))}

          {/* Add Scene Button */}
          <button
            onClick={() => onCreateNode("SCENE", scenes[scenes.length - 1]?._id)}
            className="w-full py-3 border-2 border-dashed border-zinc-300 rounded-xl text-zinc-500 text-sm font-medium hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
          >
            <Icon name="plus" className="h-4 w-4" />
            Add Scene
          </button>
        </div>
      )}
    </div>
  );
}

// =====================================================
// SCENE SECTION COMPONENT
// =====================================================
function SceneSection({
  scene,
  sceneIndex,
  entities,
  exportedPrompts,
  selectedNodeId,
  onSelectNode,
  onUpdateNode,
}: {
  scene: StoryNode;
  sceneIndex: number;
  entities: Entity[];
  exportedPrompts: ExportedPrompt[];
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
  onUpdateNode: (nodeId: string, data: Partial<StoryNode>) => Promise<void>;
}) {
  const [showDetails, setShowDetails] = useState(false);
  const [editingContent, setEditingContent] = useState(false);
  const isSelected = scene._id === selectedNodeId;

  // Get characters in this scene
  const sceneCharacters = scene.screenplay?.characterInstances || [];
  const characterEntities = sceneCharacters
    .map(c => entities.find(e => e._id === c.entityId))
    .filter(Boolean) as Entity[];

  // Get prompts for this scene
  const scenePrompts = exportedPrompts.filter(p => p.nodeId === scene._id);

  return (
    <div
      onClick={() => onSelectNode(scene._id)}
      className={`group relative rounded-xl border-2 transition-all cursor-pointer ${
        isSelected
          ? "border-blue-300 bg-blue-50 shadow-lg"
          : "border-zinc-200 bg-white hover:border-blue-200 hover:shadow-md"
      }`}
    >
      {/* Scene Number Indicator */}
      <div className="absolute -left-9 top-4 flex h-6 w-6 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 text-white text-xs font-bold shadow">
        {sceneIndex + 1}
      </div>

      {/* Thumbnail */}
      {scene.thumbnail?.url && (
        <div className="h-40 overflow-hidden rounded-t-xl">
          <img src={scene.thumbnail.url} alt="" className="w-full h-full object-cover" />
        </div>
      )}

      <div className="p-4">
        {/* Title & Synopsis */}
        <h3 className="font-semibold text-zinc-900">{scene.title}</h3>
        {scene.synopsis && (
          <p className="mt-2 text-sm text-zinc-600 line-clamp-3">{scene.synopsis}</p>
        )}

        {/* Scene Direction */}
        {scene.screenplay?.sceneDirection && (
          <div className="mt-3 p-3 rounded-lg bg-zinc-100 text-sm text-zinc-700 italic">
            <Icon name="film" className="inline h-3.5 w-3.5 mr-2 text-zinc-500" />
            {scene.screenplay.sceneDirection}
          </div>
        )}

        {/* Characters in Scene */}
        {characterEntities.length > 0 && (
          <div className="mt-3 flex flex-wrap gap-2">
            {characterEntities.map(char => (
              <div
                key={char._id}
                className="flex items-center gap-1.5 px-2 py-1 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium"
              >
                {char.media?.thumbnailUrl ? (
                  <img src={char.media.thumbnailUrl} alt="" className="h-4 w-4 rounded-full object-cover" />
                ) : (
                  <Icon name="character" className="h-3.5 w-3.5" />
                )}
                {char.name}
              </div>
            ))}
          </div>
        )}

        {/* Dialog Preview */}
        {sceneCharacters.some(c => c.dialogLines?.length > 0) && (
          <div className="mt-3 space-y-2">
            {sceneCharacters.slice(0, 2).map(char => {
              const firstLine = char.dialogLines?.[0];
              if (!firstLine) return null;
              return (
                <div key={char.id} className="flex items-start gap-2 text-sm">
                  <span className="font-semibold text-zinc-700">{char.name}:</span>
                  <span className="text-zinc-600 italic line-clamp-1">"{firstLine.text}"</span>
                </div>
              );
            })}
            {sceneCharacters.filter(c => c.dialogLines?.length > 0).length > 2 && (
              <div className="text-xs text-zinc-400">
                + more dialog...
              </div>
            )}
          </div>
        )}

        {/* Meta Badges */}
        <div className="mt-3 flex flex-wrap items-center gap-2">
          {scene.cinematicSettings?.shotFraming && (
            <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-indigo-100 text-indigo-700">
              {scene.cinematicSettings.shotFraming}
            </span>
          )}
          {scene.cinematicSettings?.lightingType && (
            <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-amber-100 text-amber-700">
              {scene.cinematicSettings.lightingType}
            </span>
          )}
          {scenePrompts.length > 0 && (
            <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-violet-100 text-violet-700">
              {scenePrompts.length} prompt{scenePrompts.length > 1 ? "s" : ""}
            </span>
          )}
          {scene.versionHistory?.versions?.length && (
            <span className="px-2 py-0.5 text-[10px] font-medium rounded-full bg-rose-100 text-rose-700">
              V{scene.versionHistory.activeVersionNumber || 1}
            </span>
          )}

          {/* Expand Details */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              setShowDetails(!showDetails);
            }}
            className="ml-auto text-xs text-zinc-500 hover:text-indigo-600"
          >
            {showDetails ? "Hide Details" : "Show Details"}
          </button>
        </div>

        {/* Expanded Details */}
        {showDetails && (
          <div className="mt-4 pt-4 border-t border-zinc-200 space-y-3">
            {/* Dramatic Elements */}
            <div className="grid grid-cols-2 gap-3">
              {scene.goals?.dramaticGoal && (
                <div className="p-2 rounded-lg bg-purple-50">
                  <div className="text-[10px] font-semibold text-purple-600 uppercase">Goal</div>
                  <div className="text-xs text-purple-800">{scene.goals.dramaticGoal}</div>
                </div>
              )}
              {scene.goals?.conflict && (
                <div className="p-2 rounded-lg bg-red-50">
                  <div className="text-[10px] font-semibold text-red-600 uppercase">Conflict</div>
                  <div className="text-xs text-red-800">{scene.goals.conflict}</div>
                </div>
              )}
              {scene.goals?.turn && (
                <div className="p-2 rounded-lg bg-orange-50">
                  <div className="text-[10px] font-semibold text-orange-600 uppercase">Turn</div>
                  <div className="text-xs text-orange-800">{scene.goals.turn}</div>
                </div>
              )}
              {scene.hooks?.hook && (
                <div className="p-2 rounded-lg bg-amber-50">
                  <div className="text-[10px] font-semibold text-amber-600 uppercase">Hook</div>
                  <div className="text-xs text-amber-800">{scene.hooks.hook}</div>
                </div>
              )}
            </div>

            {/* Latest Prompt */}
            {scenePrompts.length > 0 && (
              <div className="p-3 rounded-lg bg-violet-50">
                <div className="text-[10px] font-semibold text-violet-600 uppercase mb-1">Latest Prompt</div>
                <div className="text-xs text-violet-800 line-clamp-3 font-mono">
                  {scenePrompts[scenePrompts.length - 1].finalPrompt}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================
// MAIN BOOK VIEW COMPONENT
// =====================================================
export function StoryBookView({
  nodes,
  edges,
  entities,
  exportedPrompts,
  selectedNodeId,
  onSelectNode,
  onUpdateNode,
  onCreateNode,
  onDeleteNode,
  onReorderNodes,
  focusMode,
}: StoryBookViewProps) {
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  // Group nodes by type
  const chapters = nodes.filter(n => n.nodeType === "CHAPTER");
  const scenes = nodes.filter(n => n.nodeType === "SCENE");

  // Simple scene-to-chapter mapping (by order)
  const getScenesForChapter = (chapterIdx: number) => {
    const start = chapterIdx * 3;
    const end = start + 3;
    return scenes.slice(start, end);
  };

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters(prev => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  };

  // Expand all chapters by default on mount
  useEffect(() => {
    setExpandedChapters(new Set(chapters.map(c => c._id)));
  }, []);

  return (
    <div
      ref={containerRef}
      className={`h-full overflow-auto ${focusMode ? "px-8 py-12" : "px-6 py-8"}`}
      style={{
        background: focusMode
          ? "linear-gradient(to bottom, #fafafa, #f5f5f4)"
          : "linear-gradient(135deg, #f8fafc 0%, #eef2ff 50%, #faf5ff 100%)",
      }}
    >
      <div className={`max-w-4xl mx-auto ${focusMode ? "prose prose-lg prose-zinc max-w-none" : ""}`}>
        {/* Book Title Area */}
        {!focusMode && (
          <div className="text-center mb-12">
            <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-xl mb-4">
              <Icon name="book" className="h-8 w-8" />
            </div>
            <h1 className="text-3xl font-bold text-zinc-900">Your Story</h1>
            <p className="mt-2 text-zinc-500">
              {chapters.length} chapters • {scenes.length} scenes • {nodes.filter(n => n.nodeType === "BEAT").length} beats
            </p>
          </div>
        )}

        {/* Chapters */}
        {chapters.length > 0 ? (
          chapters.map((chapter, idx) => (
            <ChapterSection
              key={chapter._id}
              chapter={chapter}
              chapterIndex={idx}
              scenes={getScenesForChapter(idx)}
              entities={entities}
              exportedPrompts={exportedPrompts}
              selectedNodeId={selectedNodeId}
              onSelectNode={onSelectNode}
              onUpdateNode={onUpdateNode}
              onCreateNode={onCreateNode}
              isExpanded={expandedChapters.has(chapter._id)}
              onToggleExpand={() => toggleChapter(chapter._id)}
            />
          ))
        ) : scenes.length > 0 ? (
          // Show scenes without chapters
          <div className="space-y-4">
            <h2 className="text-xl font-bold text-zinc-900 mb-4">Scenes</h2>
            {scenes.map((scene, idx) => (
              <SceneSection
                key={scene._id}
                scene={scene}
                sceneIndex={idx}
                entities={entities}
                exportedPrompts={exportedPrompts.filter(p => p.nodeId === scene._id)}
                selectedNodeId={selectedNodeId}
                onSelectNode={onSelectNode}
                onUpdateNode={onUpdateNode}
              />
            ))}
          </div>
        ) : (
          // Empty state
          <div className="text-center py-20">
            <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 mb-4">
              <Icon name="book" className="h-10 w-10" />
            </div>
            <h2 className="text-xl font-semibold text-zinc-700 mb-2">Start Your Story</h2>
            <p className="text-zinc-500 mb-6 max-w-md mx-auto">
              Create your first chapter or scene to begin building your narrative.
            </p>
            <div className="flex justify-center gap-3">
              <button
                onClick={() => onCreateNode("CHAPTER")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium shadow-lg hover:shadow-xl transition-all"
              >
                <Icon name="plus" className="h-4 w-4" />
                Add Chapter
              </button>
              <button
                onClick={() => onCreateNode("SCENE")}
                className="flex items-center gap-2 px-4 py-2.5 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium shadow-lg hover:shadow-xl transition-all"
              >
                <Icon name="plus" className="h-4 w-4" />
                Add Scene
              </button>
            </div>
          </div>
        )}

        {/* Add Chapter Button */}
        {chapters.length > 0 && (
          <div className="mt-8">
            <button
              onClick={() => onCreateNode("CHAPTER", chapters[chapters.length - 1]?._id)}
              className="w-full py-4 border-2 border-dashed border-zinc-300 rounded-2xl text-zinc-500 font-medium hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50 transition-all flex items-center justify-center gap-2"
            >
              <Icon name="plus" className="h-5 w-5" />
              Add New Chapter
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
