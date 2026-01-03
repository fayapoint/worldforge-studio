"use client";

import { useState, useRef, useEffect, useCallback, useMemo } from "react";
import { Icon, type IconName } from "@/lib/ui";
import type { 
  StoryNode, 
  StoryEdge, 
  Entity, 
  ExportedPrompt, 
  SceneCharacterInstance, 
  DialogLine,
  SceneScreenplay 
} from "@/lib/models";

// =====================================================
// TYPES
// =====================================================
type FullBookEditorProps = {
  nodes: StoryNode[];
  edges: StoryEdge[];
  entities: Entity[];
  exportedPrompts: ExportedPrompt[];
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
  onUpdateNode: (nodeId: string, data: Partial<StoryNode>) => Promise<void>;
  onCreateNode: (type: "CHAPTER" | "SCENE" | "BEAT", afterNodeId?: string) => void;
  onDeleteNode: (id: string) => void;
  onEditScene?: (sceneId: string) => void;
};

type ViewMode = "screenplay" | "outline" | "prose";

// =====================================================
// INLINE DIALOG EDITOR
// =====================================================
function InlineDialogEditor({
  line,
  characterName,
  onChange,
  onDelete,
}: {
  line: DialogLine;
  characterName: string;
  onChange: (updated: DialogLine) => void;
  onDelete: () => void;
}) {
  const [isEditing, setIsEditing] = useState(false);
  const [text, setText] = useState(line.text);
  const [emotion, setEmotion] = useState(line.emotion || "");
  const [direction, setDirection] = useState(line.direction || "");

  const handleSave = () => {
    onChange({ ...line, text, emotion: emotion || undefined, direction: direction || undefined });
    setIsEditing(false);
  };

  if (isEditing) {
    return (
      <div className="ml-8 p-3 rounded-lg bg-indigo-50 border border-indigo-200 space-y-2">
        <div className="flex items-center gap-2">
          <span className="font-bold text-sm text-indigo-900 uppercase">{characterName}</span>
          <input
            type="text"
            value={emotion}
            onChange={(e) => setEmotion(e.target.value)}
            placeholder="emotion"
            className="px-2 py-1 rounded text-xs bg-white border border-indigo-300 w-24"
          />
          <input
            type="text"
            value={direction}
            onChange={(e) => setDirection(e.target.value)}
            placeholder="direction"
            className="px-2 py-1 rounded text-xs bg-white border border-indigo-300 w-32"
          />
        </div>
        <textarea
          value={text}
          onChange={(e) => setText(e.target.value)}
          className="w-full px-3 py-2 rounded-lg bg-white border border-indigo-300 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
          rows={2}
          autoFocus
        />
        <div className="flex items-center gap-2">
          <button
            onClick={handleSave}
            className="px-3 py-1.5 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700"
          >
            Save
          </button>
          <button
            onClick={() => setIsEditing(false)}
            className="px-3 py-1.5 rounded-lg bg-zinc-200 text-zinc-700 text-xs font-medium hover:bg-zinc-300"
          >
            Cancel
          </button>
          <button
            onClick={onDelete}
            className="px-3 py-1.5 rounded-lg bg-red-100 text-red-600 text-xs font-medium hover:bg-red-200 ml-auto"
          >
            Delete
          </button>
        </div>
      </div>
    );
  }

  return (
    <div 
      className="ml-8 group cursor-pointer hover:bg-indigo-50 rounded-lg p-2 -m-2 transition-all"
      onClick={() => setIsEditing(true)}
    >
      <div className="flex items-center gap-2 mb-1">
        <span className="font-bold text-sm text-zinc-900 uppercase">{characterName}</span>
        {line.emotion && (
          <span className="text-[10px] px-2 py-0.5 rounded-full bg-pink-100 text-pink-700">
            {line.emotion}
          </span>
        )}
        {line.direction && (
          <span className="text-[10px] text-zinc-500 italic">({line.direction})</span>
        )}
        <Icon name="edit" className="h-3 w-3 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
      </div>
      <p className="text-sm text-zinc-700 pl-4 border-l-2 border-indigo-200">"{line.text}"</p>
    </div>
  );
}

// =====================================================
// PACING & TENSION SELECTOR
// =====================================================
const PACING_OPTIONS = [
  { value: "SLOW", label: "Slow", icon: "⏳" },
  { value: "MEDIUM", label: "Medium", icon: "▶️" },
  { value: "FAST", label: "Fast", icon: "⏩" },
  { value: "FRENETIC", label: "Frenetic", icon: "⚡" },
];

const TENSION_OPTIONS = [
  { value: "LOW", label: "Low", color: "bg-emerald-100 text-emerald-700 border-emerald-300" },
  { value: "BUILDING", label: "Building", color: "bg-amber-100 text-amber-700 border-amber-300" },
  { value: "HIGH", label: "High", color: "bg-orange-100 text-orange-700 border-orange-300" },
  { value: "CLIMAX", label: "Climax", color: "bg-red-100 text-red-700 border-red-300" },
];

const POSITION_OPTIONS = [
  { value: "LEFT", label: "Left", icon: "←" },
  { value: "CENTER", label: "Center", icon: "◎" },
  { value: "RIGHT", label: "Right", icon: "→" },
  { value: "FOREGROUND", label: "Front", icon: "▲" },
  { value: "MIDGROUND", label: "Mid", icon: "◆" },
  { value: "BACKGROUND", label: "Back", icon: "▼" },
  { value: "OFF_SCREEN", label: "Off", icon: "✕" },
];

// =====================================================
// CHARACTER POSITION GRID
// =====================================================
function CharacterPositionGrid({
  value,
  onChange,
}: {
  value: string;
  onChange: (position: string) => void;
}) {
  const positions = [
    ["LEFT", "CENTER", "RIGHT"],
    ["FOREGROUND", "MIDGROUND", "BACKGROUND"],
  ];

  return (
    <div className="space-y-2">
      <div className="text-xs font-medium text-zinc-600 uppercase">Position in Frame</div>
      <div className="grid grid-cols-3 gap-1 p-2 bg-zinc-100 rounded-lg">
        {positions[0].map((pos) => (
          <button
            key={pos}
            onClick={() => onChange(pos)}
            className={`py-2 rounded text-xs font-medium transition-all ${
              value === pos
                ? "bg-indigo-600 text-white shadow-sm"
                : "bg-white text-zinc-600 hover:bg-indigo-50"
            }`}
          >
            {POSITION_OPTIONS.find((p) => p.value === pos)?.label}
          </button>
        ))}
      </div>
      <div className="grid grid-cols-3 gap-1 p-2 bg-zinc-100 rounded-lg">
        {positions[1].map((pos) => (
          <button
            key={pos}
            onClick={() => onChange(pos)}
            className={`py-2 rounded text-xs font-medium transition-all ${
              value === pos
                ? "bg-purple-600 text-white shadow-sm"
                : "bg-white text-zinc-600 hover:bg-purple-50"
            }`}
          >
            {POSITION_OPTIONS.find((p) => p.value === pos)?.label}
          </button>
        ))}
      </div>
      <button
        onClick={() => onChange("OFF_SCREEN")}
        className={`w-full py-1.5 rounded text-xs font-medium transition-all ${
          value === "OFF_SCREEN"
            ? "bg-zinc-700 text-white"
            : "bg-white text-zinc-500 hover:bg-zinc-200 border border-zinc-300"
        }`}
      >
        Off Screen
      </button>
    </div>
  );
}

// =====================================================
// CHARACTER INLINE EDITOR
// =====================================================
function CharacterInlineEditor({
  instance,
  entity,
  onUpdate,
  onRemove,
}: {
  instance: SceneCharacterInstance;
  entity?: Entity;
  onUpdate: (updated: SceneCharacterInstance) => void;
  onRemove: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"position" | "look" | "action" | "dialog">("position");
  const [isExpanded, setIsExpanded] = useState(false);

  const tabs = [
    { key: "position" as const, label: "Position", icon: "target" as IconName },
    { key: "look" as const, label: "Look", icon: "eye" as IconName },
    { key: "action" as const, label: "Action", icon: "flame" as IconName },
    { key: "dialog" as const, label: "Dialog", icon: "mic" as IconName },
  ];

  return (
    <div className="bg-white rounded-xl border border-zinc-200 overflow-hidden shadow-sm">
      {/* Character Header */}
      <div 
        className="flex items-center gap-3 p-3 bg-gradient-to-r from-zinc-50 to-white cursor-pointer hover:bg-zinc-50"
        onClick={() => setIsExpanded(!isExpanded)}
      >
        {(instance.thumbnailUrl || entity?.media?.thumbnailUrl) ? (
          <img
            src={instance.thumbnailUrl || entity?.media?.thumbnailUrl}
            alt={instance.name}
            className="w-10 h-10 rounded-full object-cover border-2 border-white shadow-sm"
          />
        ) : (
          <div className="w-10 h-10 rounded-full bg-gradient-to-br from-indigo-500 to-purple-500 flex items-center justify-center text-white font-bold">
            {instance.name.charAt(0)}
          </div>
        )}
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-zinc-900 text-sm">{instance.name}</div>
          <div className="text-xs text-zinc-500 flex items-center gap-2">
            <span className="px-1.5 py-0.5 rounded bg-indigo-100 text-indigo-700">{instance.position}</span>
            {instance.expression && <span className="text-pink-600">{instance.expression}</span>}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={(e) => { e.stopPropagation(); onRemove(); }}
            className="p-1.5 rounded-lg text-red-400 hover:text-red-600 hover:bg-red-50 transition-all"
          >
            <Icon name="trash" className="h-4 w-4" />
          </button>
          <Icon name={isExpanded ? "chevronUp" : "chevronDown"} className="h-4 w-4 text-zinc-400" />
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-zinc-100">
          {/* Tabs */}
          <div className="flex border-b border-zinc-100">
            {tabs.map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key)}
                className={`flex items-center gap-1.5 px-4 py-2 text-xs font-medium transition-all ${
                  activeTab === tab.key
                    ? "text-indigo-600 border-b-2 border-indigo-600 bg-indigo-50/50"
                    : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                <Icon name={tab.icon} className="h-3.5 w-3.5" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-4">
            {activeTab === "position" && (
              <CharacterPositionGrid
                value={instance.position}
                onChange={(pos) => onUpdate({ ...instance, position: pos as SceneCharacterInstance["position"] })}
              />
            )}

            {activeTab === "look" && (
              <div className="space-y-3">
                <div>
                  <label className="text-xs font-medium text-zinc-600 uppercase mb-1 block">Expression</label>
                  <input
                    type="text"
                    value={instance.expression || ""}
                    onChange={(e) => onUpdate({ ...instance, expression: e.target.value })}
                    placeholder="e.g., concerned, determined, fearful..."
                    className="w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-xs font-medium text-zinc-600 uppercase mb-1 block">Body Language</label>
                  <input
                    type="text"
                    value={instance.bodyLanguage || ""}
                    onChange={(e) => onUpdate({ ...instance, bodyLanguage: e.target.value })}
                    placeholder="e.g., tense, relaxed, defensive..."
                    className="w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            )}

            {activeTab === "action" && (
              <div>
                <label className="text-xs font-medium text-zinc-600 uppercase mb-1 block">Current Action</label>
                <textarea
                  value={instance.currentAction || ""}
                  onChange={(e) => onUpdate({ ...instance, currentAction: e.target.value })}
                  placeholder="What is the character doing in this scene?"
                  className="w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  rows={3}
                />
              </div>
            )}

            {activeTab === "dialog" && (
              <div className="space-y-2">
                <div className="text-xs font-medium text-zinc-600 uppercase mb-2">Dialog Lines ({instance.dialogLines?.length || 0})</div>
                {instance.dialogLines?.map((line, idx) => (
                  <div key={line.id || idx} className="flex items-start gap-2 p-2 bg-zinc-50 rounded-lg">
                    <span className="text-xs text-zinc-400 mt-1">{idx + 1}.</span>
                    <div className="flex-1 text-sm text-zinc-700">"{line.text}"</div>
                    {line.emotion && (
                      <span className="text-[10px] px-1.5 py-0.5 rounded bg-pink-100 text-pink-600">{line.emotion}</span>
                    )}
                  </div>
                ))}
                {(!instance.dialogLines || instance.dialogLines.length === 0) && (
                  <div className="text-xs text-zinc-400 italic py-2">No dialog lines yet</div>
                )}
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// =====================================================
// SCENE SCREENPLAY BLOCK - Inline editable
// =====================================================
function SceneScreenplayBlock({
  scene,
  entities,
  onUpdate,
  onEditScene,
}: {
  scene: StoryNode;
  entities: Entity[];
  onUpdate: (data: Partial<StoryNode>) => Promise<void>;
  onEditScene?: () => void;
}) {
  const [isEditingDirection, setIsEditingDirection] = useState(false);
  const [direction, setDirection] = useState(scene.screenplay?.sceneDirection || "");
  const [openingAction, setOpeningAction] = useState(scene.screenplay?.openingAction || "");
  const [closingAction, setClosingAction] = useState(scene.screenplay?.closingAction || "");
  const [atmosphereNotes, setAtmosphereNotes] = useState(scene.screenplay?.atmosphereNotes || "");
  const [pacing, setPacing] = useState<"SLOW" | "MEDIUM" | "FAST" | "FRENETIC">(scene.screenplay?.pacing || "MEDIUM");
  const [tension, setTension] = useState<"LOW" | "BUILDING" | "HIGH" | "CLIMAX" | "RELEASE">(scene.screenplay?.tension || "LOW");

  const screenplay = scene.screenplay;
  const characterInstances = screenplay?.characterInstances || [];

  const handleSaveDirection = async () => {
    await onUpdate({
      screenplay: {
        ...screenplay,
        sceneNodeId: scene._id,
        characterInstances: screenplay?.characterInstances || [],
        dialogSequence: screenplay?.dialogSequence || [],
        sceneDirection: direction,
        openingAction,
        closingAction,
      },
    });
    setIsEditingDirection(false);
  };

  const updateCharacterDialog = async (charId: string, lineIdx: number, updatedLine: DialogLine) => {
    const newInstances = characterInstances.map((char) => {
      if (char.id !== charId) return char;
      const newLines = [...char.dialogLines];
      newLines[lineIdx] = updatedLine;
      return { ...char, dialogLines: newLines };
    });
    await onUpdate({
      screenplay: {
        ...screenplay,
        sceneNodeId: scene._id,
        characterInstances: newInstances,
        dialogSequence: screenplay?.dialogSequence || [],
      },
    });
  };

  const deleteCharacterDialog = async (charId: string, lineIdx: number) => {
    const newInstances = characterInstances.map((char) => {
      if (char.id !== charId) return char;
      const newLines = char.dialogLines.filter((_, i) => i !== lineIdx);
      return { ...char, dialogLines: newLines };
    });
    await onUpdate({
      screenplay: {
        ...screenplay,
        sceneNodeId: scene._id,
        characterInstances: newInstances,
        dialogSequence: screenplay?.dialogSequence || [],
      },
    });
  };

  const addDialogLine = async (charId: string) => {
    const newInstances = characterInstances.map((char) => {
      if (char.id !== charId) return char;
      const newLine: DialogLine = {
        id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
        text: "New dialog line...",
      };
      return { ...char, dialogLines: [...char.dialogLines, newLine] };
    });
    await onUpdate({
      screenplay: {
        ...screenplay,
        sceneNodeId: scene._id,
        characterInstances: newInstances,
        dialogSequence: screenplay?.dialogSequence || [],
      },
    });
  };

  // Build ordered dialog entries
  const dialogEntries = useMemo(() => {
    const entries: { charId: string; charName: string; line: DialogLine; lineIdx: number }[] = [];
    characterInstances.forEach((char) => {
      char.dialogLines?.forEach((line, idx) => {
        entries.push({
          charId: char.id,
          charName: char.name,
          line,
          lineIdx: idx,
        });
      });
    });
    return entries;
  }, [characterInstances]);

  return (
    <div className="space-y-4">
      {/* Scene Header / Direction */}
      {isEditingDirection ? (
        <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-3">
          <div>
            <label className="text-xs font-semibold text-zinc-600 uppercase mb-1 block">Scene Heading</label>
            <textarea
              value={direction}
              onChange={(e) => setDirection(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-zinc-300 text-sm font-mono resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={3}
              placeholder="INT. LOCATION - TIME"
            />
          </div>
          <div>
            <label className="text-xs font-semibold text-zinc-600 uppercase mb-1 block">Opening Action</label>
            <textarea
              value={openingAction}
              onChange={(e) => setOpeningAction(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-white border border-zinc-300 text-sm italic resize-none focus:outline-none focus:ring-2 focus:ring-indigo-500"
              rows={2}
              placeholder="Describe what we see as the scene opens..."
            />
          </div>
          <div className="flex gap-2">
            <button
              onClick={handleSaveDirection}
              className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700"
            >
              Save
            </button>
            <button
              onClick={() => setIsEditingDirection(false)}
              className="px-4 py-2 rounded-lg bg-zinc-200 text-zinc-700 text-sm font-medium hover:bg-zinc-300"
            >
              Cancel
            </button>
          </div>
        </div>
      ) : (
        <div 
          className="group cursor-pointer"
          onClick={() => setIsEditingDirection(true)}
        >
          {scene.screenplay?.sceneDirection && (
            <div className="font-mono text-sm uppercase tracking-wider text-zinc-800 bg-zinc-100 px-4 py-2 rounded-lg hover:bg-zinc-200 transition-all">
              {scene.screenplay.sceneDirection}
              <Icon name="edit" className="inline h-3 w-3 ml-2 text-zinc-400 opacity-0 group-hover:opacity-100" />
            </div>
          )}
          {scene.screenplay?.openingAction && (
            <div className="text-sm text-zinc-600 italic px-4 py-2 mt-2 bg-amber-50 rounded-lg border-l-4 border-amber-400 hover:bg-amber-100 transition-all">
              {scene.screenplay.openingAction}
            </div>
          )}
          {!scene.screenplay?.sceneDirection && !scene.screenplay?.openingAction && (
            <div className="text-sm text-zinc-400 italic px-4 py-3 bg-zinc-50 rounded-lg border-2 border-dashed border-zinc-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all text-center">
              Click to add scene direction...
            </div>
          )}
        </div>
      )}

      {/* Pacing & Tension */}
      <div className="grid grid-cols-2 gap-4 p-4 bg-zinc-50 rounded-xl border border-zinc-200">
        {/* Pacing */}
        <div>
          <div className="text-xs font-semibold text-zinc-600 uppercase mb-2">Pacing</div>
          <div className="flex flex-wrap gap-1">
            {PACING_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={async () => {
                  setPacing(opt.value as "SLOW" | "MEDIUM" | "FAST" | "FRENETIC");
                  await onUpdate({
                    screenplay: {
                      ...screenplay,
                      sceneNodeId: scene._id,
                      characterInstances: screenplay?.characterInstances || [],
                      dialogSequence: screenplay?.dialogSequence || [],
                      pacing: opt.value as "SLOW" | "MEDIUM" | "FAST" | "FRENETIC",
                    },
                  });
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                  pacing === opt.value
                    ? "bg-indigo-600 text-white shadow-sm"
                    : "bg-white text-zinc-600 border border-zinc-200 hover:border-indigo-300"
                }`}
              >
                {opt.icon} {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Tension */}
        <div>
          <div className="text-xs font-semibold text-zinc-600 uppercase mb-2">Tension</div>
          <div className="flex flex-wrap gap-1">
            {TENSION_OPTIONS.map((opt) => (
              <button
                key={opt.value}
                onClick={async () => {
                  setTension(opt.value as "LOW" | "BUILDING" | "HIGH" | "CLIMAX" | "RELEASE");
                  await onUpdate({
                    screenplay: {
                      ...screenplay,
                      sceneNodeId: scene._id,
                      characterInstances: screenplay?.characterInstances || [],
                      dialogSequence: screenplay?.dialogSequence || [],
                      tension: opt.value as "LOW" | "BUILDING" | "HIGH" | "CLIMAX" | "RELEASE",
                    },
                  });
                }}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all border ${
                  tension === opt.value
                    ? opt.color + " shadow-sm"
                    : "bg-white text-zinc-600 border-zinc-200 hover:border-indigo-300"
                }`}
              >
                {opt.label}
              </button>
            ))}
          </div>
        </div>

        {/* Atmosphere Notes */}
        <div className="col-span-2">
          <div className="text-xs font-semibold text-zinc-600 uppercase mb-2">Atmosphere Notes</div>
          <input
            type="text"
            value={atmosphereNotes}
            onChange={(e) => setAtmosphereNotes(e.target.value)}
            onBlur={async () => {
              await onUpdate({
                screenplay: {
                  ...screenplay,
                  sceneNodeId: scene._id,
                  characterInstances: screenplay?.characterInstances || [],
                  dialogSequence: screenplay?.dialogSequence || [],
                  atmosphereNotes,
                },
              });
            }}
            placeholder="e.g., tense, intimate, chaotic..."
            className="w-full px-3 py-2 rounded-lg bg-white border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Characters in Scene */}
      <div className="space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Icon name="users" className="h-4 w-4 text-pink-600" />
            <span className="text-sm font-semibold text-zinc-700">Characters in Scene</span>
            <span className="text-xs text-zinc-400">({characterInstances.length})</span>
          </div>
          <button
            onClick={onEditScene}
            className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 text-white text-xs font-medium hover:from-pink-600 hover:to-rose-600 transition-all shadow-sm"
          >
            <Icon name="plus" className="h-3.5 w-3.5" />
            Add Character
          </button>
        </div>

        {characterInstances.length > 0 ? (
          <div className="space-y-2">
            {characterInstances.map((char) => {
              const entity = entities.find((e) => e._id === char.entityId);
              return (
                <CharacterInlineEditor
                  key={char.id}
                  instance={char}
                  entity={entity}
                  onUpdate={async (updated) => {
                    const newInstances = characterInstances.map((c) =>
                      c.id === updated.id ? updated : c
                    );
                    await onUpdate({
                      screenplay: {
                        ...screenplay,
                        sceneNodeId: scene._id,
                        characterInstances: newInstances,
                        dialogSequence: screenplay?.dialogSequence || [],
                      },
                    });
                  }}
                  onRemove={async () => {
                    const newInstances = characterInstances.filter((c) => c.id !== char.id);
                    await onUpdate({
                      screenplay: {
                        ...screenplay,
                        sceneNodeId: scene._id,
                        characterInstances: newInstances,
                        dialogSequence: screenplay?.dialogSequence || [],
                      },
                    });
                  }}
                />
              );
            })}
          </div>
        ) : (
          <div className="text-center py-6 bg-zinc-50 rounded-xl border-2 border-dashed border-zinc-200">
            <Icon name="users" className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
            <p className="text-sm text-zinc-400">No characters in this scene</p>
            <button
              onClick={onEditScene}
              className="mt-2 text-xs text-indigo-600 font-medium hover:underline"
            >
              Add characters →
            </button>
          </div>
        )}
      </div>

      {/* Dialog Sequence */}
      {dialogEntries.length > 0 && (
        <div className="space-y-3 mt-4">
          {dialogEntries.map((entry, idx) => (
            <InlineDialogEditor
              key={`${entry.charId}-${entry.lineIdx}`}
              line={entry.line}
              characterName={entry.charName}
              onChange={(updated) => updateCharacterDialog(entry.charId, entry.lineIdx, updated)}
              onDelete={() => deleteCharacterDialog(entry.charId, entry.lineIdx)}
            />
          ))}
        </div>
      )}

      {/* Add dialog buttons */}
      {characterInstances.length > 0 && (
        <div className="flex flex-wrap gap-2 mt-4">
          {characterInstances.map((char) => (
            <button
              key={char.id}
              onClick={() => addDialogLine(char.id)}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-600 text-xs font-medium hover:bg-indigo-100 transition-all border border-indigo-200"
            >
              <Icon name="plus" className="h-3 w-3" />
              Add {char.name} line
            </button>
          ))}
        </div>
      )}

      {/* Closing Action */}
      {scene.screenplay?.closingAction && (
        <div className="text-sm text-zinc-600 italic px-4 py-2 mt-4 bg-amber-50 rounded-lg border-l-4 border-amber-400">
          {scene.screenplay.closingAction}
        </div>
      )}

      {/* Edit full scene button */}
      {onEditScene && (
        <button
          onClick={onEditScene}
          className="w-full mt-4 py-2 rounded-lg bg-gradient-to-r from-indigo-500 to-purple-500 text-white text-sm font-medium hover:from-indigo-600 hover:to-purple-600 transition-all flex items-center justify-center gap-2"
        >
          <Icon name="edit" className="h-4 w-4" />
          Open Full Scene Editor
        </button>
      )}
    </div>
  );
}

// =====================================================
// CHAPTER BLOCK
// =====================================================
function ChapterBlock({
  chapter,
  chapterIndex,
  scenes,
  entities,
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
  selectedNodeId: string | null;
  onSelectNode: (id: string) => void;
  onUpdateNode: (nodeId: string, data: Partial<StoryNode>) => Promise<void>;
  onCreateNode: (type: "CHAPTER" | "SCENE" | "BEAT", afterNodeId?: string) => void;
  onEditScene?: (sceneId: string) => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const [isEditingTitle, setIsEditingTitle] = useState(false);
  const [title, setTitle] = useState(chapter.title);
  const [synopsis, setSynopsis] = useState(chapter.synopsis || "");
  const isSelected = chapter._id === selectedNodeId;

  const handleSaveTitle = async () => {
    if (title !== chapter.title || synopsis !== chapter.synopsis) {
      await onUpdateNode(chapter._id, { title, synopsis });
    }
    setIsEditingTitle(false);
  };

  // Calculate chapter stats
  const totalLines = scenes.reduce((acc, s) => {
    return acc + (s.screenplay?.characterInstances?.reduce((a, c) => a + (c.dialogLines?.length || 0), 0) || 0);
  }, 0);
  
  const uniqueChars = new Set<string>();
  scenes.forEach((s) => {
    s.screenplay?.characterInstances?.forEach((c) => uniqueChars.add(c.entityId));
  });

  return (
    <div className={`mb-8 ${isSelected ? "ring-2 ring-purple-300 rounded-2xl" : ""}`}>
      {/* Chapter Header */}
      <div
        onClick={() => onSelectNode(chapter._id)}
        className={`relative p-6 rounded-t-2xl cursor-pointer transition-all ${
          isSelected ? "bg-purple-50" : "bg-gradient-to-r from-purple-50 to-indigo-50 hover:from-purple-100 hover:to-indigo-100"
        }`}
      >
        {/* Chapter Number */}
        <div className="absolute -left-3 top-6 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-purple-600 to-indigo-600 text-white font-bold text-lg shadow-lg">
          {chapterIndex + 1}
        </div>

        <div className="ml-12">
          {isEditingTitle ? (
            <div className="space-y-3">
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full text-2xl font-bold bg-transparent border-b-2 border-purple-500 focus:outline-none"
                autoFocus
              />
              <textarea
                value={synopsis}
                onChange={(e) => setSynopsis(e.target.value)}
                placeholder="Chapter synopsis..."
                className="w-full px-3 py-2 rounded-lg bg-white border border-zinc-200 text-sm resize-none focus:outline-none focus:ring-2 focus:ring-purple-500"
                rows={2}
              />
              <div className="flex gap-2">
                <button
                  onClick={handleSaveTitle}
                  className="px-4 py-2 rounded-lg bg-purple-600 text-white text-sm font-medium hover:bg-purple-700"
                >
                  Save
                </button>
                <button
                  onClick={() => setIsEditingTitle(false)}
                  className="px-4 py-2 rounded-lg bg-zinc-200 text-zinc-700 text-sm font-medium hover:bg-zinc-300"
                >
                  Cancel
                </button>
              </div>
            </div>
          ) : (
            <>
              <h2 
                className="text-2xl font-bold text-zinc-900 hover:text-purple-600 transition-colors cursor-text"
                onDoubleClick={(e) => { e.stopPropagation(); setIsEditingTitle(true); }}
              >
                {chapter.title}
              </h2>
              {chapter.synopsis && (
                <p className="mt-2 text-zinc-600">{chapter.synopsis}</p>
              )}
            </>
          )}

          {/* Chapter Stats */}
          <div className="mt-4 flex flex-wrap items-center gap-3">
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-blue-100 text-blue-700 text-xs font-medium">
              <Icon name="scene" className="h-3.5 w-3.5" />
              {scenes.length} scenes
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-pink-100 text-pink-700 text-xs font-medium">
              <Icon name="mic" className="h-3.5 w-3.5" />
              {totalLines} dialog lines
            </div>
            <div className="flex items-center gap-1.5 px-3 py-1.5 rounded-full bg-emerald-100 text-emerald-700 text-xs font-medium">
              <Icon name="users" className="h-3.5 w-3.5" />
              {uniqueChars.size} characters
            </div>

            <button
              onClick={(e) => { e.stopPropagation(); onToggleExpand(); }}
              className="ml-auto flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-white text-zinc-600 text-xs font-medium hover:bg-zinc-100 transition-all shadow-sm"
            >
              <Icon name={isExpanded ? "chevronUp" : "chevronDown"} className="h-3.5 w-3.5" />
              {isExpanded ? "Collapse" : "Expand"}
            </button>
          </div>
        </div>
      </div>

      {/* Chapter Scenes */}
      {isExpanded && (
        <div className="border-l-4 border-purple-200 ml-6 pl-8 space-y-6 py-6 bg-white rounded-b-2xl">
          {scenes.map((scene, sceneIdx) => (
            <div
              key={scene._id}
              onClick={() => onSelectNode(scene._id)}
              className={`relative p-5 rounded-xl border-2 transition-all cursor-pointer ${
                scene._id === selectedNodeId
                  ? "border-blue-400 bg-blue-50 shadow-lg"
                  : "border-zinc-200 bg-white hover:border-blue-300 hover:shadow-md"
              }`}
            >
              {/* Scene Number */}
              <div className="absolute -left-12 top-5 flex h-8 w-8 items-center justify-center rounded-full bg-blue-500 text-white text-sm font-bold shadow">
                {sceneIdx + 1}
              </div>

              {/* Scene Title */}
              <h3 className="font-bold text-lg text-zinc-900 mb-1">{scene.title}</h3>
              {scene.synopsis && (
                <p className="text-sm text-zinc-600 mb-4">{scene.synopsis}</p>
              )}

              {/* Scene Screenplay Content */}
              <div onClick={(e) => e.stopPropagation()}>
                <SceneScreenplayBlock
                  scene={scene}
                  entities={entities}
                  onUpdate={(data) => onUpdateNode(scene._id, data)}
                  onEditScene={onEditScene ? () => onEditScene(scene._id) : undefined}
                />
              </div>
            </div>
          ))}

          {/* Add Scene Button */}
          <button
            onClick={() => onCreateNode("SCENE", scenes[scenes.length - 1]?._id)}
            className="w-full py-3 border-2 border-dashed border-zinc-300 rounded-xl text-zinc-500 text-sm font-medium hover:border-blue-300 hover:text-blue-600 hover:bg-blue-50 transition-all flex items-center justify-center gap-2"
          >
            <Icon name="plus" className="h-4 w-4" />
            Add Scene to Chapter
          </button>
        </div>
      )}
    </div>
  );
}

// =====================================================
// MAIN FULL BOOK EDITOR COMPONENT
// =====================================================
export function FullBookEditor({
  nodes,
  edges,
  entities,
  exportedPrompts,
  selectedNodeId,
  onSelectNode,
  onUpdateNode,
  onCreateNode,
  onDeleteNode,
  onEditScene,
}: FullBookEditorProps) {
  const [expandedChapters, setExpandedChapters] = useState<Set<string>>(new Set());
  const [viewMode, setViewMode] = useState<ViewMode>("screenplay");
  const [searchQuery, setSearchQuery] = useState("");
  const containerRef = useRef<HTMLDivElement>(null);

  // Organize nodes
  const chapters = nodes.filter((n) => n.nodeType === "CHAPTER").sort((a, b) => (a.time?.order || 0) - (b.time?.order || 0));
  const scenes = nodes.filter((n) => n.nodeType === "SCENE").sort((a, b) => (a.time?.order || 0) - (b.time?.order || 0));

  // Get scenes for chapter
  const getScenesForChapter = useCallback(
    (chapterId: string, chapterIdx: number) => {
      const connectedSceneIds = new Set<string>();
      edges.forEach((edge) => {
        if (edge.fromNodeId === chapterId) {
          const targetNode = nodes.find((n) => n._id === edge.toNodeId);
          if (targetNode?.nodeType === "SCENE") {
            connectedSceneIds.add(edge.toNodeId);
          }
        }
      });
      if (connectedSceneIds.size > 0) {
        return scenes.filter((s) => connectedSceneIds.has(s._id));
      }
      const chapter = chapters[chapterIdx];
      const nextChapter = chapters[chapterIdx + 1];
      const chapterOrder = chapter?.time?.order ?? 0;
      const nextChapterOrder = nextChapter?.time?.order ?? Infinity;
      return scenes.filter((scene) => {
        const sceneOrder = scene.time?.order ?? 0;
        return sceneOrder > chapterOrder && sceneOrder < nextChapterOrder;
      });
    },
    [nodes, edges, chapters, scenes]
  );

  // Calculate totals
  const totalScenes = scenes.length;
  const totalDialogLines = scenes.reduce((acc, s) => {
    return acc + (s.screenplay?.characterInstances?.reduce((a, c) => a + (c.dialogLines?.length || 0), 0) || 0);
  }, 0);
  const totalCharacters = new Set<string>();
  scenes.forEach((s) => {
    s.screenplay?.characterInstances?.forEach((c) => totalCharacters.add(c.entityId));
  });

  // Expand all by default
  useEffect(() => {
    setExpandedChapters(new Set(chapters.map((c) => c._id)));
  }, []);

  const toggleChapter = (chapterId: string) => {
    setExpandedChapters((prev) => {
      const next = new Set(prev);
      if (next.has(chapterId)) {
        next.delete(chapterId);
      } else {
        next.add(chapterId);
      }
      return next;
    });
  };

  const expandAll = () => setExpandedChapters(new Set(chapters.map((c) => c._id)));
  const collapseAll = () => setExpandedChapters(new Set());

  return (
    <div ref={containerRef} className="h-full flex flex-col bg-gradient-to-br from-slate-50 to-indigo-50">
      {/* Header Toolbar */}
      <div className="flex-shrink-0 px-6 py-4 bg-white/90 backdrop-blur-xl border-b border-zinc-200/50 flex items-center justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg">
            <Icon name="book" className="h-6 w-6" />
          </div>
          <div>
            <h1 className="text-xl font-bold text-zinc-900">Full Book Editor</h1>
            <p className="text-sm text-zinc-500">
              {chapters.length} chapters • {totalScenes} scenes • {totalDialogLines} dialog lines • {totalCharacters.size} characters
            </p>
          </div>
        </div>

        <div className="flex items-center gap-3">
          {/* View Mode */}
          <div className="flex items-center gap-1 p-1 bg-zinc-100 rounded-xl">
            {[
              { mode: "screenplay" as ViewMode, label: "Screenplay", icon: "film" as IconName },
              { mode: "outline" as ViewMode, label: "Outline", icon: "layers" as IconName },
            ].map((item) => (
              <button
                key={item.mode}
                onClick={() => setViewMode(item.mode)}
                className={`flex items-center gap-1.5 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                  viewMode === item.mode
                    ? "bg-white text-indigo-700 shadow-sm"
                    : "text-zinc-600 hover:text-zinc-900"
                }`}
              >
                <Icon name={item.icon} className="h-3.5 w-3.5" />
                {item.label}
              </button>
            ))}
          </div>

          {/* Expand/Collapse */}
          <button
            onClick={expandAll}
            className="px-3 py-2 rounded-lg bg-zinc-100 text-zinc-600 text-xs font-medium hover:bg-zinc-200 transition-all"
          >
            Expand All
          </button>
          <button
            onClick={collapseAll}
            className="px-3 py-2 rounded-lg bg-zinc-100 text-zinc-600 text-xs font-medium hover:bg-zinc-200 transition-all"
          >
            Collapse All
          </button>

          {/* Search */}
          <div className="relative">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search..."
              className="pl-9 pr-4 py-2 w-48 rounded-xl bg-zinc-100 border-none text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            />
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="flex-1 overflow-auto px-8 py-8">
        <div className="max-w-5xl mx-auto">
          {chapters.length > 0 ? (
            chapters.map((chapter, idx) => (
              <ChapterBlock
                key={chapter._id}
                chapter={chapter}
                chapterIndex={idx}
                scenes={getScenesForChapter(chapter._id, idx)}
                entities={entities}
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
            <div className="space-y-6">
              <h2 className="text-xl font-bold text-zinc-900">Scenes</h2>
              {scenes.map((scene, idx) => (
                <div
                  key={scene._id}
                  onClick={() => onSelectNode(scene._id)}
                  className={`p-5 rounded-xl border-2 transition-all cursor-pointer ${
                    scene._id === selectedNodeId
                      ? "border-blue-400 bg-blue-50 shadow-lg"
                      : "border-zinc-200 bg-white hover:border-blue-300 hover:shadow-md"
                  }`}
                >
                  <h3 className="font-bold text-lg text-zinc-900 mb-2">{scene.title}</h3>
                  <div onClick={(e) => e.stopPropagation()}>
                    <SceneScreenplayBlock
                      scene={scene}
                      entities={entities}
                      onUpdate={(data) => onUpdateNode(scene._id, data)}
                      onEditScene={onEditScene ? () => onEditScene(scene._id) : undefined}
                    />
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-20">
              <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 mb-4">
                <Icon name="book" className="h-10 w-10" />
              </div>
              <h2 className="text-xl font-semibold text-zinc-700 mb-2">Start Your Story</h2>
              <p className="text-zinc-500 mb-6 max-w-md mx-auto">
                Create chapters and scenes to begin building your screenplay.
              </p>
              <div className="flex justify-center gap-3">
                <button
                  onClick={() => onCreateNode("CHAPTER")}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-purple-600 to-indigo-600 text-white font-medium shadow-lg hover:shadow-xl transition-all"
                >
                  <Icon name="plus" className="h-4 w-4" />
                  Add Chapter
                </button>
                <button
                  onClick={() => onCreateNode("SCENE")}
                  className="flex items-center gap-2 px-5 py-3 rounded-xl bg-gradient-to-r from-blue-600 to-cyan-600 text-white font-medium shadow-lg hover:shadow-xl transition-all"
                >
                  <Icon name="plus" className="h-4 w-4" />
                  Add Scene
                </button>
              </div>
            </div>
          )}

          {/* Add Chapter Button */}
          {chapters.length > 0 && (
            <button
              onClick={() => onCreateNode("CHAPTER", chapters[chapters.length - 1]?._id)}
              className="w-full mt-8 py-4 border-2 border-dashed border-zinc-300 rounded-2xl text-zinc-500 font-medium hover:border-purple-300 hover:text-purple-600 hover:bg-purple-50 transition-all flex items-center justify-center gap-2"
            >
              <Icon name="plus" className="h-5 w-5" />
              Add New Chapter
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
