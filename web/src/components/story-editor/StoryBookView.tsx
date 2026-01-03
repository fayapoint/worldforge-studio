"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Icon, type IconName } from "@/lib/ui";
import type { StoryNode, StoryEdge, Entity, ExportedPrompt, SceneCharacterInstance, DialogLine } from "@/lib/models";
import { buildHighlightedPrompt, SOURCE_STYLES, type PromptSection, type PromptSourceType } from "@/lib/storyPromptBuilder";

// =====================================================
// TYPES FOR TOGGLEABLE PROMPT SECTIONS
// =====================================================
type ToggleableSection = {
  id: string;
  type: PromptSourceType;
  label: string;
  enabled: boolean;
  color: string;
  icon: string;
};

// =====================================================
// SCREENPLAY DIALOG ENTRY - Character line in order
// =====================================================
type DialogEntry = {
  characterId: string;
  characterName: string;
  characterThumbnail?: string;
  line: DialogLine;
  order: number;
  position?: string;
  expression?: string;
};

// =====================================================
// SCREENPLAY FORMAT VIEW - Shows dialog in chronological order
// =====================================================
function ScreenplayFormatView({
  scene,
  entities,
}: {
  scene: StoryNode;
  entities: Entity[];
}) {
  const characterInstances = scene.screenplay?.characterInstances || [];
  
  // Build dialog entries in order
  const dialogEntries = useMemo(() => {
    const entries: DialogEntry[] = [];
    let globalOrder = 0;
    
    // Get dialog from each character and track order
    characterInstances.forEach(char => {
      const entity = entities.find(e => e._id === char.entityId);
      char.dialogLines?.forEach((line, lineIdx) => {
        entries.push({
          characterId: char.id,
          characterName: char.name,
          characterThumbnail: char.thumbnailUrl || entity?.media?.thumbnailUrl,
          line,
          order: globalOrder++,
          position: char.position,
          expression: char.expression,
        });
      });
    });
    
    return entries;
  }, [characterInstances, entities]);

  if (characterInstances.length === 0) {
    return (
      <div className="text-center py-6 text-zinc-400 text-sm">
        <Icon name="film" className="h-8 w-8 mx-auto mb-2 opacity-50" />
        <p>No screenplay data yet</p>
        <p className="text-xs mt-1">Edit scene to add characters and dialog</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {/* Scene Header - INT/EXT format */}
      {scene.screenplay?.sceneDirection && (
        <div className="font-mono text-sm uppercase tracking-wider text-zinc-800 bg-zinc-100 px-4 py-2 rounded-lg">
          {scene.screenplay.sceneDirection.split('\n')[0]}
        </div>
      )}
      
      {/* Opening Action */}
      {scene.screenplay?.openingAction && (
        <div className="text-sm text-zinc-600 italic px-4 py-2 bg-amber-50 rounded-lg border-l-4 border-amber-400">
          {scene.screenplay.openingAction}
        </div>
      )}

      {/* Character Blocking - Who's where */}
      <div className="flex flex-wrap gap-2 px-2">
        {characterInstances.map(char => {
          const entity = entities.find(e => e._id === char.entityId);
          return (
            <div
              key={char.id}
              className={`flex items-center gap-2 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                char.includeInPrompt
                  ? "bg-cyan-100 text-cyan-800 border border-cyan-300"
                  : "bg-zinc-100 text-zinc-500 border border-zinc-200"
              }`}
            >
              {(char.thumbnailUrl || entity?.media?.thumbnailUrl) ? (
                <img
                  src={char.thumbnailUrl || entity?.media?.thumbnailUrl}
                  alt={char.name}
                  className="w-5 h-5 rounded-full object-cover"
                />
              ) : (
                <div className="w-5 h-5 rounded-full bg-cyan-200 flex items-center justify-center">
                  <Icon name="character" className="h-3 w-3 text-cyan-600" />
                </div>
              )}
              <span>{char.name}</span>
              <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/50">
                {char.position}
              </span>
              {char.currentAction && (
                <span className="text-[10px] text-orange-600">
                  {char.currentAction.slice(0, 20)}...
                </span>
              )}
            </div>
          );
        })}
      </div>

      {/* Dialog Lines in Order */}
      {dialogEntries.length > 0 && (
        <div className="space-y-3 mt-4">
          <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide px-2">
            Dialog Sequence
          </div>
          {dialogEntries.map((entry, idx) => (
            <div key={`${entry.characterId}-${idx}`} className="pl-2">
              {/* Character Name - Screenplay format */}
              <div className="flex items-center gap-2 mb-1">
                {entry.characterThumbnail ? (
                  <img
                    src={entry.characterThumbnail}
                    alt={entry.characterName}
                    className="w-6 h-6 rounded-full object-cover border-2 border-white shadow-sm"
                  />
                ) : (
                  <div className="w-6 h-6 rounded-full bg-indigo-100 flex items-center justify-center">
                    <Icon name="character" className="h-3 w-3 text-indigo-600" />
                  </div>
                )}
                <span className="font-bold text-sm text-zinc-900 uppercase tracking-wide">
                  {entry.characterName}
                </span>
                {entry.line.emotion && (
                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-100 text-pink-700">
                    {entry.line.emotion}
                  </span>
                )}
                {entry.line.direction && (
                  <span className="text-[10px] text-zinc-500 italic">
                    ({entry.line.direction})
                  </span>
                )}
              </div>
              {/* Dialog Text */}
              <div className="ml-8 pl-4 border-l-2 border-indigo-200">
                <p className="text-sm text-zinc-700 leading-relaxed">
                  "{entry.line.text}"
                </p>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Actions Summary - What characters are doing */}
      {characterInstances.some(c => c.currentAction) && (
        <div className="mt-4 space-y-2">
          <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide px-2">
            Actions
          </div>
          {characterInstances
            .filter(c => c.currentAction)
            .map(char => (
              <div key={char.id} className="flex items-start gap-2 px-2 py-1 bg-orange-50 rounded-lg">
                <Icon name="flame" className="h-4 w-4 text-orange-500 mt-0.5" />
                <div>
                  <span className="font-medium text-xs text-orange-900">{char.name}:</span>
                  <span className="text-xs text-orange-700 ml-1">{char.currentAction}</span>
                </div>
              </div>
            ))}
        </div>
      )}

      {/* Closing Action */}
      {scene.screenplay?.closingAction && (
        <div className="text-sm text-zinc-600 italic px-4 py-2 bg-amber-50 rounded-lg border-l-4 border-amber-400 mt-4">
          {scene.screenplay.closingAction}
        </div>
      )}
    </div>
  );
}

// =====================================================
// TOGGLEABLE PROMPT PREVIEW - With highlighting
// =====================================================
function ToggleablePromptPreview({
  scene,
  entities,
  onCopyPrompt,
}: {
  scene: StoryNode;
  entities: Entity[];
  onCopyPrompt?: (prompt: string) => void;
}) {
  // Get the highlighted prompt data
  const promptData = useMemo(() => buildHighlightedPrompt(scene, entities), [scene, entities]);
  
  // State for which sections are enabled
  const [enabledSections, setEnabledSections] = useState<Set<string>>(() => 
    new Set(promptData.sections.map(s => s.id))
  );
  
  // Update enabled sections when prompt data changes
  useEffect(() => {
    setEnabledSections(new Set(promptData.sections.map(s => s.id)));
  }, [promptData.sections]);

  // Toggle a section
  const toggleSection = (sectionId: string) => {
    setEnabledSections(prev => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  // Build filtered prompt
  const filteredPrompt = useMemo(() => {
    return promptData.sections
      .filter(s => enabledSections.has(s.id))
      .map(s => s.text)
      .filter(Boolean)
      .join(". ") + (promptData.sections.length > 0 ? "." : "");
  }, [promptData.sections, enabledSections]);

  // Group sections by source type for the toggle UI
  const groupedSections = useMemo(() => {
    const groups: Record<string, PromptSection[]> = {};
    promptData.sections.forEach(section => {
      const key = section.sourceType;
      if (!groups[key]) groups[key] = [];
      groups[key].push(section);
    });
    return groups;
  }, [promptData.sections]);

  const handleCopy = () => {
    navigator.clipboard.writeText(filteredPrompt);
    if (onCopyPrompt) onCopyPrompt(filteredPrompt);
  };

  if (promptData.sections.length === 0) {
    return (
      <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
        <div className="text-center text-zinc-400 text-sm">
          <Icon name="wand" className="h-6 w-6 mx-auto mb-2 opacity-50" />
          <p>No prompt data available</p>
          <p className="text-xs mt-1">Edit scene to add characters and cinematic settings</p>
        </div>
        {promptData.missingDataWarnings.length > 0 && (
          <div className="mt-3 pt-3 border-t border-zinc-200">
            <div className="text-[10px] font-semibold text-amber-600 flex items-center gap-1 mb-2">
              <Icon name="warning" className="h-3 w-3" />
              Missing Data
            </div>
            <ul className="text-[10px] text-amber-700 space-y-1">
              {promptData.missingDataWarnings.slice(0, 5).map((w, i) => (
                <li key={i}>• {w}</li>
              ))}
            </ul>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {/* Section Toggles */}
      <div className="flex flex-wrap gap-1.5">
        {Object.entries(groupedSections).map(([type, sections]) => {
          const style = SOURCE_STYLES[type as PromptSourceType];
          const allEnabled = sections.every(s => enabledSections.has(s.id));
          const someEnabled = sections.some(s => enabledSections.has(s.id));
          
          return (
            <button
              key={type}
              onClick={() => {
                sections.forEach(s => {
                  if (allEnabled) {
                    setEnabledSections(prev => {
                      const next = new Set(prev);
                      next.delete(s.id);
                      return next;
                    });
                  } else {
                    setEnabledSections(prev => new Set([...prev, s.id]));
                  }
                });
              }}
              className={`flex items-center gap-1.5 px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all border ${
                allEnabled
                  ? style.color
                  : someEnabled
                  ? `${style.color} opacity-60`
                  : "bg-zinc-100 text-zinc-400 border-zinc-200"
              }`}
            >
              <Icon name={style.icon as IconName} className="h-3 w-3" />
              {style.label}
              {sections.length > 1 && (
                <span className="text-[9px] opacity-70">({sections.length})</span>
              )}
            </button>
          );
        })}
      </div>

      {/* Highlighted Prompt Text */}
      <div className="p-3 rounded-xl bg-white border border-zinc-200 shadow-sm">
        <div className="flex flex-wrap gap-1 leading-relaxed">
          {promptData.sections.map((section, idx) => {
            const isEnabled = enabledSections.has(section.id);
            const style = SOURCE_STYLES[section.sourceType];
            
            return (
              <span
                key={section.id}
                onClick={() => toggleSection(section.id)}
                className={`cursor-pointer px-1.5 py-0.5 rounded text-xs transition-all border ${
                  isEnabled
                    ? `${style.color} hover:opacity-80`
                    : "bg-zinc-100 text-zinc-400 border-zinc-200 line-through opacity-50"
                }`}
                title={`${section.sourceLabel} - Click to toggle`}
              >
                {section.text}
                {idx < promptData.sections.length - 1 && isEnabled && "."}
              </span>
            );
          })}
        </div>
        
        {/* Stats & Copy */}
        <div className="flex items-center justify-between mt-3 pt-2 border-t border-zinc-100">
          <div className="text-[10px] text-zinc-500">
            {filteredPrompt.length} chars • {filteredPrompt.split(/\s+/).filter(Boolean).length} words • {enabledSections.size}/{promptData.sections.length} sections
          </div>
          <button
            onClick={handleCopy}
            className="flex items-center gap-1 px-2 py-1 rounded-lg bg-indigo-100 text-indigo-700 text-[10px] font-medium hover:bg-indigo-200 transition-all"
          >
            <Icon name="copy" className="h-3 w-3" />
            Copy Prompt
          </button>
        </div>
      </div>

      {/* Warnings */}
      {promptData.missingDataWarnings.length > 0 && (
        <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
          <div className="text-[10px] font-semibold text-amber-700 flex items-center gap-1 mb-1">
            <Icon name="warning" className="h-3 w-3" />
            {promptData.missingDataWarnings.length} warnings
          </div>
          <ul className="text-[10px] text-amber-600 space-y-0.5">
            {promptData.missingDataWarnings.slice(0, 3).map((w, i) => (
              <li key={i}>• {w}</li>
            ))}
            {promptData.missingDataWarnings.length > 3 && (
              <li className="italic">+ {promptData.missingDataWarnings.length - 3} more...</li>
            )}
          </ul>
        </div>
      )}
    </div>
  );
}

// =====================================================
// SCENE IMAGE GALLERY - Shows scene images prominently
// =====================================================
function SceneImageGallery({
  scene,
  exportedPrompts,
}: {
  scene: StoryNode;
  exportedPrompts: ExportedPrompt[];
}) {
  const [selectedImageIdx, setSelectedImageIdx] = useState(0);
  
  // Collect all images: thumbnail, version images, exported prompt thumbnails
  const allImages = useMemo(() => {
    const images: { url: string; label: string; type: string }[] = [];
    
    // Main thumbnail
    if (scene.thumbnail?.url) {
      images.push({ url: scene.thumbnail.url, label: "Scene Thumbnail", type: "thumbnail" });
    }
    
    // Version images
    if (scene.versionHistory?.versions) {
      scene.versionHistory.versions.forEach(version => {
        if (version.thumbnail?.url) {
          images.push({ url: version.thumbnail.url, label: `V${version.versionNumber} Thumbnail`, type: "version" });
        }
        if (version.firstFrame?.url) {
          images.push({ url: version.firstFrame.url, label: `V${version.versionNumber} First Frame`, type: "version" });
        }
        if (version.lastFrame?.url) {
          images.push({ url: version.lastFrame.url, label: `V${version.versionNumber} Last Frame`, type: "version" });
        }
      });
    }
    
    // Exported prompt thumbnails
    exportedPrompts.forEach(prompt => {
      if (prompt.thumbnailUrl) {
        images.push({ url: prompt.thumbnailUrl, label: prompt.title, type: "exported" });
      }
    });
    
    return images;
  }, [scene, exportedPrompts]);

  if (allImages.length === 0) {
    return null;
  }

  return (
    <div className="space-y-2">
      {/* Main Image */}
      <div className="relative aspect-video rounded-xl overflow-hidden bg-zinc-100 shadow-lg">
        <img
          src={allImages[selectedImageIdx]?.url}
          alt={allImages[selectedImageIdx]?.label}
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-2 left-2 px-2 py-1 rounded-lg bg-black/60 text-white text-xs">
          {allImages[selectedImageIdx]?.label}
        </div>
        {allImages.length > 1 && (
          <>
            <button
              onClick={() => setSelectedImageIdx(prev => (prev - 1 + allImages.length) % allImages.length)}
              className="absolute left-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-all"
            >
              <Icon name="chevronLeft" className="h-4 w-4" />
            </button>
            <button
              onClick={() => setSelectedImageIdx(prev => (prev + 1) % allImages.length)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-2 rounded-full bg-black/40 text-white hover:bg-black/60 transition-all"
            >
              <Icon name="chevronRight" className="h-4 w-4" />
            </button>
          </>
        )}
      </div>
      
      {/* Thumbnail Strip */}
      {allImages.length > 1 && (
        <div className="flex gap-2 overflow-x-auto pb-1">
          {allImages.map((img, idx) => (
            <button
              key={idx}
              onClick={() => setSelectedImageIdx(idx)}
              className={`flex-shrink-0 w-16 h-10 rounded-lg overflow-hidden border-2 transition-all ${
                idx === selectedImageIdx
                  ? "border-indigo-500 shadow-md"
                  : "border-transparent opacity-70 hover:opacity-100"
              }`}
            >
              <img src={img.url} alt={img.label} className="w-full h-full object-cover" />
            </button>
          ))}
        </div>
      )}
    </div>
  );
}

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
  onEditScene?: (sceneId: string) => void;
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
  onEditScene,
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
  onEditScene?: (sceneId: string) => void;
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
              onEditScene={onEditScene}
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
// SCENE SECTION COMPONENT - Enhanced with Screenplay & Toggleable Prompts
// =====================================================
function SceneSection({
  scene,
  sceneIndex,
  entities,
  exportedPrompts,
  selectedNodeId,
  onSelectNode,
  onUpdateNode,
  onEditScene,
}: {
  scene: StoryNode;
  sceneIndex: number;
  entities: Entity[];
  exportedPrompts: ExportedPrompt[];
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
  onUpdateNode: (nodeId: string, data: Partial<StoryNode>) => Promise<void>;
  onEditScene?: (sceneId: string) => void;
}) {
  const [activeTab, setActiveTab] = useState<"overview" | "screenplay" | "prompt">("overview");
  const [copied, setCopied] = useState(false);
  const isSelected = scene._id === selectedNodeId;

  // Get characters in this scene
  const sceneCharacters = scene.screenplay?.characterInstances || [];
  const characterEntities = sceneCharacters
    .map(c => entities.find(e => e._id === c.entityId))
    .filter(Boolean) as Entity[];

  // Get prompts for this scene
  const scenePrompts = exportedPrompts.filter(p => p.nodeId === scene._id);

  // Handle copy feedback
  const handleCopyPrompt = () => {
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  return (
    <div
      onClick={() => onSelectNode(scene._id)}
      className={`group relative rounded-2xl border-2 transition-all cursor-pointer overflow-hidden ${
        isSelected
          ? "border-blue-400 bg-gradient-to-br from-blue-50 to-indigo-50 shadow-xl"
          : "border-zinc-200 bg-white hover:border-blue-300 hover:shadow-lg"
      }`}
    >
      {/* Scene Number Indicator */}
      <div className="absolute -left-9 top-4 flex h-7 w-7 items-center justify-center rounded-full bg-gradient-to-br from-blue-500 to-cyan-600 text-white text-xs font-bold shadow-lg z-10">
        {sceneIndex + 1}
      </div>

      {/* Image Gallery at Top */}
      {(scene.thumbnail?.url || scenePrompts.some(p => p.thumbnailUrl)) && (
        <div className="p-3 pb-0">
          <SceneImageGallery scene={scene} exportedPrompts={scenePrompts} />
        </div>
      )}

      <div className="p-4">
        {/* Header: Title & Edit Button */}
        <div className="flex items-start justify-between gap-3 mb-3">
          <div>
            <h3 className="font-bold text-lg text-zinc-900">{scene.title}</h3>
            {scene.synopsis && (
              <p className="mt-1 text-sm text-zinc-600 line-clamp-2">{scene.synopsis}</p>
            )}
          </div>
          {onEditScene && (
            <button
              onClick={(e) => {
                e.stopPropagation();
                onEditScene(scene._id);
              }}
              className="flex-shrink-0 flex items-center gap-1.5 px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white text-xs font-medium hover:from-indigo-700 hover:to-purple-700 transition-all shadow-md"
            >
              <Icon name="edit" className="h-3.5 w-3.5" />
              Edit Scene
            </button>
          )}
        </div>

        {/* Quick Info Badges */}
        <div className="flex flex-wrap items-center gap-2 mb-4">
          {sceneCharacters.length > 0 && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-cyan-100 text-cyan-700 text-xs font-medium">
              <Icon name="users" className="h-3.5 w-3.5" />
              {sceneCharacters.length} characters
            </span>
          )}
          {sceneCharacters.reduce((acc, c) => acc + (c.dialogLines?.length || 0), 0) > 0 && (
            <span className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-pink-100 text-pink-700 text-xs font-medium">
              <Icon name="mic" className="h-3.5 w-3.5" />
              {sceneCharacters.reduce((acc, c) => acc + (c.dialogLines?.length || 0), 0)} lines
            </span>
          )}
          {scene.cinematicSettings?.shotFraming && (
            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-purple-100 text-purple-700">
              {scene.cinematicSettings.shotFraming}
            </span>
          )}
          {scene.cinematicSettings?.lightingType && (
            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-amber-100 text-amber-700">
              {scene.cinematicSettings.lightingType}
            </span>
          )}
          {scenePrompts.length > 0 && (
            <span className="px-2.5 py-1 text-xs font-medium rounded-full bg-violet-100 text-violet-700">
              {scenePrompts.length} exported
            </span>
          )}
        </div>

        {/* Tab Navigation */}
        <div className="flex gap-1 p-1 bg-zinc-100 rounded-xl mb-4">
          {[
            { id: "overview" as const, label: "Overview", icon: "eye" as IconName },
            { id: "screenplay" as const, label: "Screenplay", icon: "film" as IconName },
            { id: "prompt" as const, label: "Prompt Builder", icon: "wand" as IconName },
          ].map(tab => (
            <button
              key={tab.id}
              onClick={(e) => {
                e.stopPropagation();
                setActiveTab(tab.id);
              }}
              className={`flex-1 flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg text-xs font-semibold transition-all ${
                activeTab === tab.id
                  ? "bg-white text-indigo-700 shadow-sm"
                  : "text-zinc-600 hover:text-zinc-900"
              }`}
            >
              <Icon name={tab.icon} className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="min-h-[200px]" onClick={(e) => e.stopPropagation()}>
          {activeTab === "overview" && (
            <div className="space-y-4">
              {/* Scene Direction */}
              {scene.screenplay?.sceneDirection && (
                <div className="p-3 rounded-xl bg-indigo-50 border border-indigo-200">
                  <div className="flex items-center gap-2 mb-2">
                    <Icon name="film" className="h-4 w-4 text-indigo-600" />
                    <span className="text-xs font-semibold text-indigo-700 uppercase">Scene Direction</span>
                  </div>
                  <p className="text-sm text-indigo-900 font-mono">{scene.screenplay.sceneDirection}</p>
                </div>
              )}

              {/* Dramatic Elements Grid */}
              <div className="grid grid-cols-2 gap-3">
                {scene.goals?.dramaticGoal && (
                  <div className="p-3 rounded-xl bg-purple-50 border border-purple-200">
                    <div className="text-[10px] font-bold text-purple-600 uppercase mb-1 flex items-center gap-1">
                      <Icon name="target" className="h-3 w-3" />
                      Goal
                    </div>
                    <div className="text-xs text-purple-800">{scene.goals.dramaticGoal}</div>
                  </div>
                )}
                {scene.goals?.conflict && (
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                    <div className="text-[10px] font-bold text-red-600 uppercase mb-1 flex items-center gap-1">
                      <Icon name="warning" className="h-3 w-3" />
                      Conflict
                    </div>
                    <div className="text-xs text-red-800">{scene.goals.conflict}</div>
                  </div>
                )}
                {scene.goals?.turn && (
                  <div className="p-3 rounded-xl bg-orange-50 border border-orange-200">
                    <div className="text-[10px] font-bold text-orange-600 uppercase mb-1 flex items-center gap-1">
                      <Icon name="refresh" className="h-3 w-3" />
                      Turn
                    </div>
                    <div className="text-xs text-orange-800">{scene.goals.turn}</div>
                  </div>
                )}
                {scene.hooks?.hook && (
                  <div className="p-3 rounded-xl bg-amber-50 border border-amber-200">
                    <div className="text-[10px] font-bold text-amber-600 uppercase mb-1 flex items-center gap-1">
                      <Icon name="sparkles" className="h-3 w-3" />
                      Hook
                    </div>
                    <div className="text-xs text-amber-800">{scene.hooks.hook}</div>
                  </div>
                )}
              </div>

              {/* Character Cards */}
              {sceneCharacters.length > 0 && (
                <div className="space-y-2">
                  <div className="text-xs font-bold text-zinc-600 uppercase flex items-center gap-1">
                    <Icon name="users" className="h-3.5 w-3.5" />
                    Characters in Scene
                  </div>
                  <div className="grid gap-2">
                    {sceneCharacters.map(char => {
                      const entity = entities.find(e => e._id === char.entityId);
                      return (
                        <div key={char.id} className="p-3 rounded-xl bg-white border border-zinc-200 shadow-sm">
                          <div className="flex items-center gap-3">
                            {(char.thumbnailUrl || entity?.media?.thumbnailUrl) ? (
                              <img 
                                src={char.thumbnailUrl || entity?.media?.thumbnailUrl} 
                                alt={char.name}
                                className="h-10 w-10 rounded-xl object-cover border border-zinc-200"
                              />
                            ) : (
                              <div className="h-10 w-10 rounded-xl bg-gradient-to-br from-cyan-100 to-blue-100 flex items-center justify-center">
                                <Icon name="character" className="h-5 w-5 text-cyan-600" />
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="flex items-center gap-2">
                                <span className="font-semibold text-sm text-zinc-900">{char.name}</span>
                                <span className="text-[10px] px-2 py-0.5 rounded-full bg-blue-100 text-blue-700">
                                  {char.position}
                                </span>
                                {char.expression && (
                                  <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-100 text-pink-700">
                                    {char.expression}
                                  </span>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-x-3 gap-y-1 mt-1">
                                {char.currentOutfitDescription && (
                                  <span className="text-[10px] text-rose-600">
                                    <Icon name="sparkles" className="inline h-3 w-3 mr-0.5" />
                                    {char.currentOutfitDescription.slice(0, 40)}...
                                  </span>
                                )}
                                {char.currentAction && (
                                  <span className="text-[10px] text-orange-600">
                                    <Icon name="flame" className="inline h-3 w-3 mr-0.5" />
                                    {char.currentAction.slice(0, 30)}...
                                  </span>
                                )}
                                {char.dialogLines?.length > 0 && (
                                  <span className="text-[10px] text-indigo-600">
                                    <Icon name="mic" className="inline h-3 w-3 mr-0.5" />
                                    {char.dialogLines.length} lines
                                  </span>
                                )}
                              </div>
                            </div>
                            {!char.includeInPrompt && (
                              <span className="text-[10px] px-2 py-1 rounded-full bg-zinc-100 text-zinc-500">
                                Excluded
                              </span>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </div>
              )}

              {/* No content state */}
              {!scene.screenplay?.sceneDirection && !scene.goals?.dramaticGoal && sceneCharacters.length === 0 && (
                <div className="text-center py-8 text-zinc-400">
                  <Icon name="edit" className="h-8 w-8 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">No scene details yet</p>
                  <p className="text-xs mt-1">Click "Edit Scene" to add content</p>
                </div>
              )}
            </div>
          )}

          {activeTab === "screenplay" && (
            <ScreenplayFormatView scene={scene} entities={entities} />
          )}

          {activeTab === "prompt" && (
            <ToggleablePromptPreview 
              scene={scene} 
              entities={entities} 
              onCopyPrompt={handleCopyPrompt}
            />
          )}
        </div>

        {/* Footer: Export History */}
        {scenePrompts.length > 0 && (
          <div className="mt-4 pt-4 border-t border-zinc-200">
            <div className="text-[10px] font-bold text-zinc-500 uppercase mb-2 flex items-center gap-1">
              <Icon name="exports" className="h-3 w-3" />
              Recent Exports ({scenePrompts.length})
            </div>
            <div className="flex gap-2 overflow-x-auto pb-1">
              {scenePrompts.slice(-4).map((prompt) => (
                <div 
                  key={prompt._id} 
                  className="flex-shrink-0 px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 hover:bg-zinc-100 transition-all cursor-pointer"
                  onClick={(e) => {
                    e.stopPropagation();
                    navigator.clipboard.writeText(prompt.finalPrompt);
                  }}
                  title="Click to copy"
                >
                  <div className="flex items-center gap-2">
                    <span className={`px-1.5 py-0.5 text-[9px] font-medium rounded ${
                      prompt.type === "IMAGE" ? "bg-indigo-100 text-indigo-600" : "bg-purple-100 text-purple-600"
                    }`}>
                      {prompt.type}
                    </span>
                    <span className="text-xs text-zinc-700 font-medium max-w-[120px] truncate">{prompt.title}</span>
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      {/* Copy Feedback Toast */}
      {copied && (
        <div className="absolute bottom-4 right-4 px-3 py-2 rounded-lg bg-emerald-500 text-white text-xs font-medium shadow-lg animate-pulse">
          <Icon name="check" className="inline h-3 w-3 mr-1" />
          Copied!
        </div>
      )}
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
  onEditScene,
  focusMode,
}: StoryBookViewProps) {
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const containerRef = useRef<HTMLDivElement>(null);

  // Group nodes by type
  const chapters = nodes.filter(n => n.nodeType === "CHAPTER");
  const scenes = nodes.filter(n => n.nodeType === "SCENE");
  const beats = nodes.filter(n => n.nodeType === "BEAT");

  // Build scene-to-chapter mapping using edges
  // Edges connect nodes: fromNodeId -> toNodeId
  // A scene belongs to a chapter if there's an edge connecting them
  // or if the scene follows the chapter in order
  const getScenesForChapter = useCallback((chapterId: string, chapterIdx: number) => {
    // First try to find scenes connected via edges
    const connectedSceneIds = new Set<string>();
    
    // Find all edges from this chapter
    edges.forEach(edge => {
      if (edge.fromNodeId === chapterId) {
        const targetNode = nodes.find(n => n._id === edge.toNodeId);
        if (targetNode?.nodeType === "SCENE") {
          connectedSceneIds.add(edge.toNodeId);
        }
      }
    });

    // If we have connected scenes, use them
    if (connectedSceneIds.size > 0) {
      return scenes.filter(s => connectedSceneIds.has(s._id))
        .sort((a, b) => (a.time?.order || 0) - (b.time?.order || 0));
    }

    // Fallback: Use order-based assignment
    // Find scenes that fall between this chapter's order and the next chapter's order
    const chapter = chapters[chapterIdx];
    const nextChapter = chapters[chapterIdx + 1];
    
    const chapterOrder = chapter?.time?.order ?? 0;
    const nextChapterOrder = nextChapter?.time?.order ?? Infinity;

    return scenes.filter(scene => {
      const sceneOrder = scene.time?.order ?? 0;
      // Scene belongs to chapter if its order is after chapter but before next chapter
      return sceneOrder > chapterOrder && sceneOrder < nextChapterOrder;
    }).sort((a, b) => (a.time?.order || 0) - (b.time?.order || 0));
  }, [nodes, edges, chapters, scenes]);

  // Get orphan scenes (not belonging to any chapter)
  const orphanScenes = useMemo(() => {
    if (chapters.length === 0) return scenes;
    
    const assignedSceneIds = new Set<string>();
    chapters.forEach((chapter, idx) => {
      const chapterScenes = getScenesForChapter(chapter._id, idx);
      chapterScenes.forEach(s => assignedSceneIds.add(s._id));
    });
    
    return scenes.filter(s => !assignedSceneIds.has(s._id));
  }, [chapters, scenes, getScenesForChapter]);

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
              scenes={getScenesForChapter(chapter._id, idx)}
              entities={entities}
              exportedPrompts={exportedPrompts}
              selectedNodeId={selectedNodeId}
              onSelectNode={onSelectNode}
              onUpdateNode={onUpdateNode}
              onCreateNode={onCreateNode}
              onEditScene={onEditScene}
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
                onEditScene={onEditScene}
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
