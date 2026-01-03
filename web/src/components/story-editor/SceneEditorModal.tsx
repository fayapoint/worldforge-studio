"use client";

import { useState, useEffect, useCallback, useMemo, useRef } from "react";
import { Icon, type IconName } from "@/lib/ui";
import type { 
  StoryNode, 
  Entity, 
  ExportedPrompt,
  SceneScreenplay,
  SceneCharacterInstance,
  DialogLine,
  StoryNodeCinematicSettings,
  CommunityWardrobeItem,
} from "@/lib/models";
import { WardrobePicker } from "@/components/WardrobePicker";
import { apiFetch } from "@/lib/apiClient";
import { HighlightedPromptPreview } from "./HighlightedPromptPreview";
import { SceneTimeline } from "./SceneTimeline";
import type { PromptLibraryItem } from "@/lib/promptLibrary";
import { PROMPT_CATEGORIES } from "@/lib/promptLibrary";

// =====================================================
// CONSTANTS
// =====================================================
const POSITION_OPTIONS = [
  { value: "LEFT", label: "Left", icon: "chevronLeft" as IconName },
  { value: "CENTER", label: "Center", icon: "target" as IconName },
  { value: "RIGHT", label: "Right", icon: "chevronRight" as IconName },
  { value: "FOREGROUND", label: "Front", icon: "maximize" as IconName },
  { value: "BACKGROUND", label: "Back", icon: "minimize" as IconName },
] as const;

const EXPRESSION_PRESETS = [
  "neutral", "happy", "sad", "angry", "fearful", "surprised", 
  "disgusted", "contemplative", "determined", "confused", 
  "hopeful", "skeptical", "exhausted", "amused", "worried"
];

const SHOT_FRAMING_OPTIONS = [
  { value: "extreme-wide", label: "Extreme Wide", icon: "world" as IconName },
  { value: "wide", label: "Wide Shot", icon: "maximize" as IconName },
  { value: "medium-wide", label: "Medium Wide", icon: "layers" as IconName },
  { value: "medium", label: "Medium", icon: "scene" as IconName },
  { value: "medium-close", label: "Medium Close", icon: "character" as IconName },
  { value: "close-up", label: "Close-Up", icon: "eye" as IconName },
  { value: "extreme-close", label: "Extreme Close", icon: "target" as IconName },
];

const SHOT_ANGLE_OPTIONS = [
  { value: "eye-level", label: "Eye Level", icon: "eye" as IconName },
  { value: "low-angle", label: "Low Angle", icon: "chevronUp" as IconName },
  { value: "high-angle", label: "High Angle", icon: "chevronDown" as IconName },
  { value: "dutch-angle", label: "Dutch Angle", icon: "split" as IconName },
  { value: "birds-eye", label: "Bird's Eye", icon: "sun" as IconName },
  { value: "worms-eye", label: "Worm's Eye", icon: "world" as IconName },
];

const LIGHTING_OPTIONS = [
  { value: "natural", label: "Natural", icon: "sun" as IconName },
  { value: "golden-hour", label: "Golden Hour", icon: "sun" as IconName },
  { value: "blue-hour", label: "Blue Hour", icon: "moon" as IconName },
  { value: "dramatic", label: "Dramatic", icon: "flame" as IconName },
  { value: "soft", label: "Soft", icon: "cloud" as IconName },
  { value: "hard", label: "Hard", icon: "target" as IconName },
  { value: "neon", label: "Neon", icon: "sparkles" as IconName },
  { value: "candlelight", label: "Candlelit", icon: "flame" as IconName },
];

const TIME_OF_DAY_OPTIONS = [
  { value: "dawn", label: "Dawn", icon: "sun" as IconName },
  { value: "morning", label: "Morning", icon: "sun" as IconName },
  { value: "noon", label: "Noon", icon: "sun" as IconName },
  { value: "afternoon", label: "Afternoon", icon: "sun" as IconName },
  { value: "sunset", label: "Sunset", icon: "sun" as IconName },
  { value: "dusk", label: "Dusk", icon: "moon" as IconName },
  { value: "night", label: "Night", icon: "moon" as IconName },
];

const ATMOSPHERE_OPTIONS = [
  { value: "peaceful", label: "Peaceful", icon: "heart" as IconName },
  { value: "tense", label: "Tense", icon: "warning" as IconName },
  { value: "mysterious", label: "Mysterious", icon: "eye" as IconName },
  { value: "romantic", label: "Romantic", icon: "heart" as IconName },
  { value: "eerie", label: "Eerie", icon: "skull" as IconName },
  { value: "chaotic", label: "Chaotic", icon: "flame" as IconName },
  { value: "melancholic", label: "Melancholic", icon: "cloud" as IconName },
  { value: "hopeful", label: "Hopeful", icon: "sparkles" as IconName },
];

function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// =====================================================
// TYPES
// =====================================================
type SceneEditorModalProps = {
  node: StoryNode;
  entities: Entity[];
  exportedPrompts: ExportedPrompt[];
  projectId: string;
  onUpdate: (data: Partial<StoryNode>) => Promise<void>;
  onClose: () => void;
  onGeneratePrompt?: (node: StoryNode) => void;
};

type EditorTab = "content" | "screenplay" | "characters" | "cinematic" | "timeline" | "prompts" | "versions";

// =====================================================
// CHARACTER EDITOR COMPONENT
// =====================================================
function CharacterEditor({
  instance,
  entity,
  onChange,
  onRemove,
  isExpanded,
  onToggleExpand,
}: {
  instance: SceneCharacterInstance;
  entity?: Entity;
  onChange: (updated: SceneCharacterInstance) => void;
  onRemove: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
}) {
  const [activeTab, setActiveTab] = useState<"position" | "appearance" | "dialog" | "wardrobe">("position");
  const [showWardrobePicker, setShowWardrobePicker] = useState(false);

  const updateField = <K extends keyof SceneCharacterInstance>(field: K, value: SceneCharacterInstance[K]) => {
    onChange({ ...instance, [field]: value, updatedAt: new Date() });
  };

  const addDialogLine = () => {
    const newLine: DialogLine = {
      id: generateId(),
      text: "",
      emotion: instance.emotionalState,
    };
    updateField("dialogLines", [...instance.dialogLines, newLine]);
  };

  const updateDialogLine = (lineId: string, updates: Partial<DialogLine>) => {
    updateField("dialogLines", instance.dialogLines.map(line => 
      line.id === lineId ? { ...line, ...updates } : line
    ));
  };

  const removeDialogLine = (lineId: string) => {
    updateField("dialogLines", instance.dialogLines.filter(line => line.id !== lineId));
  };

  const handleSelectWardrobeItem = (item: CommunityWardrobeItem) => {
    const current = instance.currentOutfitDescription || "";
    const separator = current ? ", " : "";
    updateField("currentOutfitDescription", current + separator + item.promptText);
    setShowWardrobePicker(false);
  };

  const thumbnailUrl = instance.thumbnailUrl || entity?.media?.thumbnailUrl;

  return (
    <div className="rounded-2xl bg-white border border-zinc-200 overflow-hidden shadow-lg">
      {/* Header */}
      <div 
        onClick={onToggleExpand}
        className="flex items-center gap-3 p-4 cursor-pointer hover:bg-zinc-50 transition-all"
      >
        {thumbnailUrl ? (
          <img 
            src={thumbnailUrl} 
            alt={instance.name}
            className="w-14 h-14 rounded-xl object-cover border-2 border-white shadow-md"
          />
        ) : (
          <div className="w-14 h-14 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
            <Icon name="character" className="h-7 w-7" />
          </div>
        )}
        
        <div className="flex-1 min-w-0">
          <div className="font-bold text-zinc-900 text-lg">{instance.name}</div>
          <div className="flex items-center gap-3 text-sm text-zinc-500">
            <span className="flex items-center gap-1">
              <Icon name="target" className="h-3.5 w-3.5" />
              {instance.position}
            </span>
            {instance.expression && (
              <span className="flex items-center gap-1">
                <Icon name="smile" className="h-3.5 w-3.5" />
                {instance.expression}
              </span>
            )}
            {instance.dialogLines.length > 0 && (
              <span className="flex items-center gap-1 px-2 py-0.5 rounded-full bg-indigo-100 text-indigo-700">
                <Icon name="mic" className="h-3.5 w-3.5" />
                {instance.dialogLines.length} lines
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={(e) => {
              e.stopPropagation();
              updateField("includeInPrompt", !instance.includeInPrompt);
            }}
            className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
              instance.includeInPrompt 
                ? "bg-green-100 text-green-700" 
                : "bg-zinc-100 text-zinc-500"
            }`}
          >
            {instance.includeInPrompt ? "In Prompt" : "Excluded"}
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-2 rounded-lg hover:bg-red-100 text-red-500 transition-all"
          >
            <Icon name="trash" className="h-4 w-4" />
          </button>
          
          <Icon 
            name={isExpanded ? "chevronUp" : "chevronDown"} 
            className="h-5 w-5 text-zinc-400" 
          />
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-zinc-200">
          {/* Tabs */}
          <div className="flex gap-1 p-2 bg-zinc-50 overflow-x-auto">
            {[
              { key: "position", icon: "target" as IconName, label: "Position & Pose" },
              { key: "appearance", icon: "eye" as IconName, label: "Expression" },
              { key: "dialog", icon: "mic" as IconName, label: "Dialog" },
              { key: "wardrobe", icon: "sparkles" as IconName, label: "Wardrobe" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveTab(tab.key as any)}
                className={`px-4 py-2 rounded-lg text-sm font-medium transition-all flex items-center gap-2 whitespace-nowrap ${
                  activeTab === tab.key
                    ? "bg-indigo-600 text-white shadow"
                    : "bg-white text-zinc-600 hover:bg-zinc-100"
                }`}
              >
                <Icon name={tab.icon} className="h-4 w-4" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Tab Content */}
          <div className="p-4 space-y-4">
            {activeTab === "position" && (
              <>
                {/* Position Grid */}
                <div>
                  <label className="text-sm font-semibold text-zinc-700 mb-2 block">Position in Frame</label>
                  <div className="grid grid-cols-5 gap-2">
                    {POSITION_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => updateField("position", opt.value)}
                        className={`p-3 rounded-xl text-sm font-medium transition-all flex flex-col items-center gap-2 ${
                          instance.position === opt.value
                            ? "bg-indigo-600 text-white shadow-lg"
                            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                        }`}
                      >
                        <Icon name={opt.icon} className="h-5 w-5" />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Pose */}
                <div>
                  <label className="text-sm font-semibold text-zinc-700 mb-2 block">Pose</label>
                  <input
                    type="text"
                    value={instance.pose || ""}
                    onChange={(e) => updateField("pose", e.target.value)}
                    placeholder="e.g., standing with arms crossed, sitting, leaning against wall..."
                    className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Current Action */}
                <div>
                  <label className="text-sm font-semibold text-zinc-700 mb-2 block">What is this character doing?</label>
                  <textarea
                    value={instance.currentAction || ""}
                    onChange={(e) => updateField("currentAction", e.target.value)}
                    placeholder="e.g., walking towards the door, reading a letter, arguing..."
                    className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    rows={2}
                  />
                </div>

                {/* Props */}
                <div>
                  <label className="text-sm font-semibold text-zinc-700 mb-2 block">Props (items holding)</label>
                  <input
                    type="text"
                    value={instance.props?.join(", ") || ""}
                    onChange={(e) => updateField("props", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                    placeholder="e.g., sword, book, phone, coffee cup..."
                    className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </>
            )}

            {activeTab === "appearance" && (
              <>
                {/* Expression Presets */}
                <div>
                  <label className="text-sm font-semibold text-zinc-700 mb-2 block">Expression</label>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {EXPRESSION_PRESETS.map((expr) => (
                      <button
                        key={expr}
                        onClick={() => updateField("expression", instance.expression === expr ? undefined : expr)}
                        className={`px-3 py-1.5 rounded-lg text-sm font-medium transition-all ${
                          instance.expression === expr
                            ? "bg-indigo-600 text-white"
                            : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                        }`}
                      >
                        {expr}
                      </button>
                    ))}
                  </div>
                  <input
                    type="text"
                    value={instance.expression || ""}
                    onChange={(e) => updateField("expression", e.target.value)}
                    placeholder="Or type custom expression..."
                    className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Emotional State */}
                <div>
                  <label className="text-sm font-semibold text-zinc-700 mb-2 block">Internal Emotional State</label>
                  <input
                    type="text"
                    value={instance.emotionalState || ""}
                    onChange={(e) => updateField("emotionalState", e.target.value)}
                    placeholder="What is this character feeling internally?"
                    className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Body Language */}
                <div>
                  <label className="text-sm font-semibold text-zinc-700 mb-2 block">Body Language</label>
                  <input
                    type="text"
                    value={instance.bodyLanguage || ""}
                    onChange={(e) => updateField("bodyLanguage", e.target.value)}
                    placeholder="e.g., tense, relaxed, defensive, open..."
                    className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </>
            )}

            {activeTab === "dialog" && (
              <div className="space-y-3">
                {instance.dialogLines.map((line, lineIndex) => (
                  <div key={line.id} className="p-4 rounded-xl bg-zinc-50 border border-zinc-200 space-y-3">
                    <div className="flex items-start gap-3">
                      <div className="w-8 h-8 rounded-full bg-indigo-600 text-white flex items-center justify-center text-sm font-bold flex-shrink-0">
                        {lineIndex + 1}
                      </div>
                      <div className="flex-1 space-y-2">
                        <textarea
                          value={line.text}
                          onChange={(e) => updateDialogLine(line.id, { text: e.target.value })}
                          placeholder="Write the dialog line..."
                          className="w-full px-4 py-3 rounded-xl bg-white border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                          rows={2}
                        />
                        <div className="flex gap-2">
                          <input
                            type="text"
                            value={line.emotion || ""}
                            onChange={(e) => updateDialogLine(line.id, { emotion: e.target.value })}
                            placeholder="Emotion (angry, sad...)"
                            className="flex-1 px-3 py-2 rounded-lg bg-white border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                          <input
                            type="text"
                            value={line.direction || ""}
                            onChange={(e) => updateDialogLine(line.id, { direction: e.target.value })}
                            placeholder="Direction (softly, firmly...)"
                            className="flex-1 px-3 py-2 rounded-lg bg-white border border-zinc-200 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                          />
                        </div>
                      </div>
                      <button
                        onClick={() => removeDialogLine(line.id)}
                        className="p-2 rounded-lg hover:bg-red-100 text-red-500 transition-all"
                      >
                        <Icon name="x" className="h-4 w-4" />
                      </button>
                    </div>
                  </div>
                ))}
                
                <button
                  onClick={addDialogLine}
                  className="w-full px-4 py-3 rounded-xl border-2 border-dashed border-indigo-300 text-indigo-600 font-medium hover:bg-indigo-50 transition-all flex items-center justify-center gap-2"
                >
                  <Icon name="plus" className="h-4 w-4" />
                  Add Dialog Line
                </button>
              </div>
            )}

            {activeTab === "wardrobe" && (
              <>
                <div className="flex items-center justify-between mb-3">
                  <label className="text-sm font-semibold text-zinc-700">Current Outfit</label>
                  <button
                    onClick={() => setShowWardrobePicker(true)}
                    className="px-4 py-2 rounded-xl bg-gradient-to-r from-pink-500 to-rose-500 text-white text-sm font-medium hover:from-pink-600 hover:to-rose-600 transition-all flex items-center gap-2"
                  >
                    <Icon name="sparkles" className="h-4 w-4" />
                    Browse Wardrobe
                  </button>
                </div>
                <textarea
                  value={instance.currentOutfitDescription || ""}
                  onChange={(e) => updateField("currentOutfitDescription", e.target.value)}
                  placeholder="Describe the complete outfit for this scene..."
                  className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  rows={4}
                />

                {entity?.character?.appearance && (
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                    <div className="text-sm font-semibold text-amber-700 mb-1">Base Appearance</div>
                    <div className="text-sm text-amber-600">{entity.character.appearance}</div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-semibold text-zinc-700 mb-2 block">Continuity Notes</label>
                  <textarea
                    value={instance.continuityNotes || ""}
                    onChange={(e) => updateField("continuityNotes", e.target.value)}
                    placeholder="Notes for maintaining visual consistency..."
                    className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    rows={2}
                  />
                </div>

                {showWardrobePicker && (
                  <WardrobePicker
                    characterEntityId={instance.entityId}
                    characterName={instance.name}
                    onSelectItem={handleSelectWardrobeItem}
                    onClose={() => setShowWardrobePicker(false)}
                  />
                )}
              </>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// =====================================================
// CINEMATIC OPTION SELECTOR
// =====================================================
function CinematicSelector({
  label,
  options,
  value,
  onChange,
}: {
  label: string;
  options: { value: string; label: string; icon: IconName }[];
  value: string;
  onChange: (v: string) => void;
}) {
  return (
    <div>
      <label className="text-sm font-semibold text-zinc-700 mb-2 block">{label}</label>
      <div className="grid grid-cols-4 gap-2">
        {options.map((opt) => (
          <button
            key={opt.value}
            onClick={() => onChange(value === opt.value ? "" : opt.value)}
            className={`p-3 rounded-xl text-xs font-medium transition-all flex flex-col items-center gap-1.5 ${
              value === opt.value
                ? "bg-indigo-600 text-white shadow-lg"
                : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
            }`}
          >
            <Icon name={opt.icon} className="h-5 w-5" />
            {opt.label}
          </button>
        ))}
      </div>
    </div>
  );
}

// =====================================================
// MAIN SCENE EDITOR MODAL
// =====================================================
export function SceneEditorModal({
  node,
  entities,
  exportedPrompts,
  projectId,
  onUpdate,
  onClose,
  onGeneratePrompt,
}: SceneEditorModalProps) {
  const [activeTab, setActiveTab] = useState<EditorTab>("content");
  const [saving, setSaving] = useState(false);
  const [hasChanges, setHasChanges] = useState(false);

  // Local state for editing
  const [title, setTitle] = useState(node.title);
  const [synopsis, setSynopsis] = useState(node.synopsis || "");
  const [dramaticGoal, setDramaticGoal] = useState(node.goals?.dramaticGoal || "");
  const [conflict, setConflict] = useState(node.goals?.conflict || "");
  const [turn, setTurn] = useState(node.goals?.turn || "");
  const [hook, setHook] = useState(node.hooks?.hook || "");
  
  // Screenplay state
  const [screenplay, setScreenplay] = useState<SceneScreenplay>(() => {
    return node.screenplay || {
      sceneNodeId: node._id,
      sceneDirection: "",
      characterInstances: [],
      dialogSequence: [],
    };
  });
  const [expandedCharacterId, setExpandedCharacterId] = useState<string | null>(null);

  // Cinematic settings
  const [cinematicSettings, setCinematicSettings] = useState<StoryNodeCinematicSettings>(
    node.cinematicSettings || {}
  );

  // Get available characters
  const characters = useMemo(() => entities.filter(e => e.type === "CHARACTER"), [entities]);
  const availableCharacters = useMemo(() => 
    characters.filter(c => !screenplay.characterInstances.find(inst => inst.entityId === c._id)),
    [characters, screenplay.characterInstances]
  );

  // Scene prompts
  const scenePrompts = useMemo(() => 
    exportedPrompts.filter(p => p.nodeId === node._id),
    [exportedPrompts, node._id]
  );

  // Prompt Library state
  const [libraryPrompts, setLibraryPrompts] = useState<PromptLibraryItem[]>([]);
  const [selectedLibraryPrompts, setSelectedLibraryPrompts] = useState<PromptLibraryItem[]>([]);
  const [libraryLoading, setLibraryLoading] = useState(false);
  const [librarySearch, setLibrarySearch] = useState("");
  const [libraryCategory, setLibraryCategory] = useState<string | null>(null);

  // Load prompt library
  useEffect(() => {
    async function loadLibrary() {
      setLibraryLoading(true);
      try {
        const params = new URLSearchParams({ projectId });
        if (libraryCategory) params.set("category", libraryCategory);
        if (librarySearch) params.set("search", librarySearch);
        
        const res = await apiFetch<{ items: PromptLibraryItem[] }>(`/api/prompts/library?${params.toString()}`);
        if (res.ok && res.data.items) {
          setLibraryPrompts(res.data.items);
        }
      } catch (err) {
        console.error("Failed to load prompt library:", err);
      }
      setLibraryLoading(false);
    }
    loadLibrary();
  }, [projectId, libraryCategory, librarySearch]);

  // Mark changes
  useEffect(() => {
    setHasChanges(true);
  }, [title, synopsis, dramaticGoal, conflict, turn, hook, screenplay, cinematicSettings]);

  // Add character to scene
  const addCharacterToScene = useCallback((entityId: string) => {
    const entity = characters.find(c => c._id === entityId);
    if (!entity) return;

    const newInstance: SceneCharacterInstance = {
      id: generateId(),
      entityId: entity._id,
      sceneNodeId: node._id,
      name: entity.name,
      thumbnailUrl: entity.media?.thumbnailUrl,
      baseAppearance: entity.character?.appearance,
      wardrobe: [],
      position: "CENTER",
      dialogLines: [],
      stateChanges: [],
      includeInPrompt: true,
      promptPriority: 1,
      createdAt: new Date(),
      updatedAt: new Date(),
    };

    setScreenplay(prev => ({
      ...prev,
      characterInstances: [...prev.characterInstances, newInstance],
    }));
    setExpandedCharacterId(newInstance.id);
  }, [node._id, characters]);

  // Update character instance
  const updateCharacterInstance = useCallback((updated: SceneCharacterInstance) => {
    setScreenplay(prev => ({
      ...prev,
      characterInstances: prev.characterInstances.map(inst =>
        inst.id === updated.id ? updated : inst
      ),
    }));
  }, []);

  // Remove character from scene
  const removeCharacterFromScene = useCallback((instanceId: string) => {
    setScreenplay(prev => ({
      ...prev,
      characterInstances: prev.characterInstances.filter(inst => inst.id !== instanceId),
    }));
  }, []);

  // Save all changes
  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate({
        title,
        synopsis,
        goals: { dramaticGoal, conflict, turn },
        hooks: { hook, foreshadow: node.hooks?.foreshadow || [], payoffTargets: node.hooks?.payoffTargets || [] },
        screenplay,
        cinematicSettings,
      });
      setHasChanges(false);
    } catch (err) {
      console.error("Failed to save:", err);
    }
    setSaving(false);
  };

  // Build prompt preview
  const buildPromptPreview = () => {
    const parts: string[] = [];
    
    // Scene direction
    if (screenplay.sceneDirection) {
      parts.push(screenplay.sceneDirection);
    }

    // Cinematic settings
    if (cinematicSettings.shotFraming) parts.push(`${cinematicSettings.shotFraming} shot`);
    if (cinematicSettings.shotAngle) parts.push(cinematicSettings.shotAngle);
    if (cinematicSettings.lightingType) parts.push(`${cinematicSettings.lightingType} lighting`);
    if (cinematicSettings.timeOfDay) parts.push(cinematicSettings.timeOfDay);
    if (cinematicSettings.atmosphere) parts.push(`${cinematicSettings.atmosphere} atmosphere`);

    // Characters
    const activeChars = screenplay.characterInstances.filter(c => c.includeInPrompt);
    activeChars.forEach(char => {
      const charParts: string[] = [char.name];
      if (char.position) charParts.push(`(${char.position.toLowerCase()})`);
      if (char.expression) charParts.push(`${char.expression} expression`);
      if (char.pose) charParts.push(char.pose);
      if (char.currentAction) charParts.push(char.currentAction);
      if (char.currentOutfitDescription) charParts.push(`wearing ${char.currentOutfitDescription}`);
      parts.push(charParts.join(", "));
    });

    return parts.filter(Boolean).join(". ");
  };

  const tabs: { key: EditorTab; label: string; icon: IconName }[] = [
    { key: "content", label: "Content", icon: "edit" },
    { key: "screenplay", label: "Screenplay", icon: "film" },
    { key: "characters", label: "Characters", icon: "users" },
    { key: "cinematic", label: "Cinematic", icon: "camera" },
    { key: "timeline", label: "Timeline", icon: "clock" },
    { key: "prompts", label: "Prompts", icon: "wand" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className="w-full max-w-6xl max-h-[95vh] overflow-hidden rounded-3xl bg-white shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-zinc-200 flex items-center justify-between bg-gradient-to-r from-indigo-50 to-purple-50">
          <div className="flex items-center gap-4">
            {node.thumbnail?.url ? (
              <img src={node.thumbnail.url} alt="" className="w-16 h-16 rounded-xl object-cover shadow-lg" />
            ) : (
              <div className="w-16 h-16 rounded-xl bg-gradient-to-br from-blue-500 to-cyan-600 flex items-center justify-center text-white shadow-lg">
                <Icon name="scene" className="h-8 w-8" />
              </div>
            )}
            <div>
              <input
                type="text"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="text-2xl font-bold text-zinc-900 bg-transparent border-none focus:outline-none focus:ring-2 focus:ring-indigo-500 rounded-lg px-2 -ml-2"
              />
              <div className="flex items-center gap-2 text-sm text-zinc-500 mt-1">
                <span className="px-2 py-0.5 rounded-full bg-blue-100 text-blue-700 font-medium">
                  {node.nodeType}
                </span>
                <span>•</span>
                <span>{screenplay.characterInstances.length} characters</span>
                <span>•</span>
                <span>{screenplay.characterInstances.reduce((acc, c) => acc + c.dialogLines.length, 0)} dialog lines</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-3">
            {hasChanges && (
              <span className="text-sm text-amber-600 font-medium">Unsaved changes</span>
            )}
            <button
              onClick={handleSave}
              disabled={saving || !hasChanges}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium shadow-lg hover:shadow-xl transition-all disabled:opacity-50"
            >
              {saving ? (
                <>
                  <div className="h-4 w-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Saving...
                </>
              ) : (
                <>
                  <Icon name="save" className="h-4 w-4" />
                  Save
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="p-2.5 rounded-xl hover:bg-zinc-100 transition-all"
            >
              <Icon name="x" className="h-5 w-5 text-zinc-500" />
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex-shrink-0 px-6 py-3 border-b border-zinc-200 flex gap-2 overflow-x-auto bg-zinc-50">
          {tabs.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-5 py-2.5 rounded-xl text-sm font-semibold transition-all flex items-center gap-2 whitespace-nowrap ${
                activeTab === tab.key
                  ? "bg-indigo-600 text-white shadow-lg"
                  : "bg-white text-zinc-600 hover:bg-zinc-100 border border-zinc-200"
              }`}
            >
              <Icon name={tab.icon} className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === "content" && (
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Synopsis */}
              <div>
                <label className="text-sm font-semibold text-zinc-700 mb-2 block">Synopsis</label>
                <textarea
                  value={synopsis}
                  onChange={(e) => setSynopsis(e.target.value)}
                  placeholder="Describe what happens in this scene..."
                  className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  rows={4}
                />
              </div>

              {/* Dramatic Elements */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-zinc-700 mb-2 block flex items-center gap-2">
                    <Icon name="target" className="h-4 w-4 text-purple-600" />
                    Dramatic Goal
                  </label>
                  <textarea
                    value={dramaticGoal}
                    onChange={(e) => setDramaticGoal(e.target.value)}
                    placeholder="What is the scene trying to achieve?"
                    className="w-full px-4 py-3 rounded-xl bg-purple-50 border border-purple-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-zinc-700 mb-2 block flex items-center gap-2">
                    <Icon name="warning" className="h-4 w-4 text-red-600" />
                    Conflict
                  </label>
                  <textarea
                    value={conflict}
                    onChange={(e) => setConflict(e.target.value)}
                    placeholder="What is the conflict or tension?"
                    className="w-full px-4 py-3 rounded-xl bg-red-50 border border-red-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-zinc-700 mb-2 block flex items-center gap-2">
                    <Icon name="refresh" className="h-4 w-4 text-orange-600" />
                    Turn / Reversal
                  </label>
                  <textarea
                    value={turn}
                    onChange={(e) => setTurn(e.target.value)}
                    placeholder="How does the scene change?"
                    className="w-full px-4 py-3 rounded-xl bg-orange-50 border border-orange-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
                    rows={2}
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-zinc-700 mb-2 block flex items-center gap-2">
                    <Icon name="sparkles" className="h-4 w-4 text-amber-600" />
                    Hook
                  </label>
                  <textarea
                    value={hook}
                    onChange={(e) => setHook(e.target.value)}
                    placeholder="What hooks the audience?"
                    className="w-full px-4 py-3 rounded-xl bg-amber-50 border border-amber-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
                    rows={2}
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "screenplay" && (
            <div className="max-w-3xl mx-auto space-y-6">
              {/* Scene Direction */}
              <div>
                <label className="text-sm font-semibold text-zinc-700 mb-2 block flex items-center gap-2">
                  <Icon name="film" className="h-4 w-4 text-indigo-600" />
                  Scene Direction
                </label>
                <textarea
                  value={screenplay.sceneDirection || ""}
                  onChange={(e) => setScreenplay(prev => ({ ...prev, sceneDirection: e.target.value }))}
                  placeholder="INT. LOCATION - TIME OF DAY

Describe the setting, atmosphere, and what's happening as the scene opens..."
                  className="w-full px-4 py-4 rounded-xl bg-zinc-50 border border-zinc-200 text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  rows={6}
                />
              </div>

              {/* Atmosphere Notes */}
              <div>
                <label className="text-sm font-semibold text-zinc-700 mb-2 block">Atmosphere Notes</label>
                <textarea
                  value={screenplay.atmosphereNotes || ""}
                  onChange={(e) => setScreenplay(prev => ({ ...prev, atmosphereNotes: e.target.value }))}
                  placeholder="Describe the mood, feeling, and atmosphere of this scene..."
                  className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                  rows={3}
                />
              </div>

              {/* Generated Prompt Preview */}
              <div className="p-4 rounded-xl bg-violet-50 border border-violet-200">
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-semibold text-violet-700">Generated Prompt Preview</span>
                  <button
                    onClick={() => navigator.clipboard.writeText(buildPromptPreview())}
                    className="px-3 py-1.5 rounded-lg bg-violet-600 text-white text-xs font-medium hover:bg-violet-700"
                  >
                    Copy
                  </button>
                </div>
                <p className="text-sm text-violet-800 font-mono whitespace-pre-wrap">
                  {buildPromptPreview() || "Add scene direction and characters to generate prompt..."}
                </p>
              </div>
            </div>
          )}

          {activeTab === "characters" && (
            <div className="max-w-4xl mx-auto space-y-4">
              {/* Add Character */}
              {availableCharacters.length > 0 && (
                <div className="p-4 rounded-xl bg-emerald-50 border border-emerald-200">
                  <div className="text-sm font-semibold text-emerald-700 mb-3">Add Character to Scene</div>
                  <div className="flex flex-wrap gap-2">
                    {availableCharacters.map((char) => (
                      <button
                        key={char._id}
                        onClick={() => addCharacterToScene(char._id)}
                        className="flex items-center gap-2 px-4 py-2 rounded-xl bg-white border border-emerald-300 text-emerald-700 font-medium hover:bg-emerald-100 transition-all"
                      >
                        {char.media?.thumbnailUrl ? (
                          <img src={char.media.thumbnailUrl} alt="" className="w-6 h-6 rounded-full object-cover" />
                        ) : (
                          <Icon name="character" className="h-5 w-5" />
                        )}
                        {char.name}
                        <Icon name="plus" className="h-4 w-4" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Character List */}
              {screenplay.characterInstances.length === 0 ? (
                <div className="text-center py-16">
                  <div className="inline-flex h-20 w-20 items-center justify-center rounded-2xl bg-zinc-100 text-zinc-400 mb-4">
                    <Icon name="users" className="h-10 w-10" />
                  </div>
                  <h3 className="text-lg font-semibold text-zinc-700 mb-2">No Characters Yet</h3>
                  <p className="text-zinc-500">Add characters from your project to this scene</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {screenplay.characterInstances.map((instance) => (
                    <CharacterEditor
                      key={instance.id}
                      instance={instance}
                      entity={entities.find(e => e._id === instance.entityId)}
                      onChange={updateCharacterInstance}
                      onRemove={() => removeCharacterFromScene(instance.id)}
                      isExpanded={expandedCharacterId === instance.id}
                      onToggleExpand={() => setExpandedCharacterId(
                        expandedCharacterId === instance.id ? null : instance.id
                      )}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === "cinematic" && (
            <div className="max-w-4xl mx-auto space-y-6">
              <CinematicSelector
                label="Shot Framing"
                options={SHOT_FRAMING_OPTIONS}
                value={cinematicSettings.shotFraming || ""}
                onChange={(v) => setCinematicSettings(prev => ({ ...prev, shotFraming: v }))}
              />
              <CinematicSelector
                label="Shot Angle"
                options={SHOT_ANGLE_OPTIONS}
                value={cinematicSettings.shotAngle || ""}
                onChange={(v) => setCinematicSettings(prev => ({ ...prev, shotAngle: v }))}
              />
              <CinematicSelector
                label="Lighting"
                options={LIGHTING_OPTIONS}
                value={cinematicSettings.lightingType || ""}
                onChange={(v) => setCinematicSettings(prev => ({ ...prev, lightingType: v }))}
              />
              <CinematicSelector
                label="Time of Day"
                options={TIME_OF_DAY_OPTIONS}
                value={cinematicSettings.timeOfDay || ""}
                onChange={(v) => setCinematicSettings(prev => ({ ...prev, timeOfDay: v }))}
              />
              <CinematicSelector
                label="Atmosphere"
                options={ATMOSPHERE_OPTIONS}
                value={cinematicSettings.atmosphere || ""}
                onChange={(v) => setCinematicSettings(prev => ({ ...prev, atmosphere: v }))}
              />

              {/* Custom Settings */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-semibold text-zinc-700 mb-2 block">Color Palette</label>
                  <input
                    type="text"
                    value={cinematicSettings.colorPalette || ""}
                    onChange={(e) => setCinematicSettings(prev => ({ ...prev, colorPalette: e.target.value }))}
                    placeholder="e.g., warm tones, muted colors..."
                    className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
                <div>
                  <label className="text-sm font-semibold text-zinc-700 mb-2 block">Visual Style</label>
                  <input
                    type="text"
                    value={cinematicSettings.visualStyle || ""}
                    onChange={(e) => setCinematicSettings(prev => ({ ...prev, visualStyle: e.target.value }))}
                    placeholder="e.g., cinematic, noir, documentary..."
                    className="w-full px-4 py-3 rounded-xl bg-zinc-50 border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </div>
            </div>
          )}

          {activeTab === "timeline" && (
            <div className="max-w-5xl mx-auto space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-zinc-900">Scene Timeline</h3>
                  <p className="text-sm text-zinc-500">Visual breakdown of actions and dialog with estimated durations</p>
                </div>
              </div>
              <SceneTimeline
                screenplay={screenplay}
                onUpdateScreenplay={setScreenplay}
              />
            </div>
          )}

          {activeTab === "prompts" && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Left: Highlighted Prompt Preview */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                  <Icon name="eye" className="h-4 w-4 text-violet-600" />
                  Live Prompt Preview
                </h3>
                
                {/* Pass the current node state with local edits for live preview */}
                <HighlightedPromptPreview
                  node={{
                    ...node,
                    title,
                    synopsis,
                    goals: { dramaticGoal, conflict, turn },
                    hooks: { hook, foreshadow: node.hooks?.foreshadow || [], payoffTargets: node.hooks?.payoffTargets || [] },
                    screenplay,
                    cinematicSettings,
                  }}
                  entities={entities}
                  libraryPrompts={selectedLibraryPrompts}
                  showWarnings={true}
                  showNegative={true}
                />

                {/* Generate Button */}
                {onGeneratePrompt && (
                  <button
                    onClick={() => onGeneratePrompt({
                      ...node,
                      title,
                      synopsis,
                      goals: { dramaticGoal, conflict, turn },
                      hooks: { hook, foreshadow: node.hooks?.foreshadow || [], payoffTargets: node.hooks?.payoffTargets || [] },
                      screenplay,
                      cinematicSettings,
                    })}
                    className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-xl bg-gradient-to-r from-violet-600 to-purple-600 text-white font-semibold shadow-lg hover:shadow-xl transition-all"
                  >
                    <Icon name="wand" className="h-5 w-5" />
                    Export & Generate
                  </button>
                )}

                {/* Existing Exported Prompts */}
                {scenePrompts.length > 0 && (
                  <div className="space-y-3">
                    <h4 className="text-xs font-semibold text-zinc-500 uppercase">Previously Exported</h4>
                    {scenePrompts.map((prompt) => (
                      <div key={prompt._id} className="p-3 rounded-xl bg-white border border-zinc-200 shadow-sm">
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-0.5 text-xs font-medium rounded-full ${
                            prompt.type === "IMAGE" ? "bg-indigo-100 text-indigo-700" : "bg-purple-100 text-purple-700"
                          }`}>
                            {prompt.type}
                          </span>
                          <span className="text-sm font-medium text-zinc-900">{prompt.title}</span>
                        </div>
                        <pre className="text-xs text-zinc-700 font-mono bg-zinc-50 p-2 rounded-lg overflow-x-auto whitespace-pre-wrap line-clamp-3">
                          {prompt.finalPrompt}
                        </pre>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              {/* Right: Prompt Library Browser */}
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-zinc-700 flex items-center gap-2">
                  <Icon name="layers" className="h-4 w-4 text-indigo-600" />
                  Prompt Library
                </h3>

                {/* Selected Prompts */}
                {selectedLibraryPrompts.length > 0 && (
                  <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                    <div className="text-xs font-semibold text-emerald-700 mb-2">
                      {selectedLibraryPrompts.length} prompt{selectedLibraryPrompts.length > 1 ? "s" : ""} selected
                    </div>
                    <div className="flex flex-wrap gap-2">
                      {selectedLibraryPrompts.map(p => (
                        <span
                          key={p._id}
                          className="inline-flex items-center gap-1 px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-xs"
                        >
                          {p.name}
                          <button
                            onClick={() => setSelectedLibraryPrompts(prev => prev.filter(x => x._id !== p._id))}
                            className="p-0.5 hover:bg-emerald-200 rounded"
                          >
                            <Icon name="x" className="h-3 w-3" />
                          </button>
                        </span>
                      ))}
                    </div>
                  </div>
                )}

                {/* Search */}
                <div className="relative">
                  <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
                  <input
                    type="text"
                    value={librarySearch}
                    onChange={(e) => setLibrarySearch(e.target.value)}
                    placeholder="Search prompts..."
                    className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Category Pills */}
                <div className="flex flex-wrap gap-2">
                  <button
                    onClick={() => setLibraryCategory(null)}
                    className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                      !libraryCategory ? "bg-indigo-600 text-white" : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    }`}
                  >
                    All
                  </button>
                  {PROMPT_CATEGORIES.slice(0, 6).map(cat => (
                    <button
                      key={cat.id}
                      onClick={() => setLibraryCategory(libraryCategory === cat.id ? null : cat.id)}
                      className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                        libraryCategory === cat.id
                          ? `bg-gradient-to-r ${cat.color} text-white`
                          : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                      }`}
                    >
                      <Icon name={cat.icon} className="h-3 w-3" />
                      {cat.name}
                    </button>
                  ))}
                </div>

                {/* Library Items */}
                <div className="max-h-[400px] overflow-y-auto space-y-2">
                  {libraryLoading ? (
                    <div className="flex items-center justify-center py-8">
                      <Icon name="refresh" className="h-6 w-6 animate-spin text-zinc-400" />
                    </div>
                  ) : libraryPrompts.length === 0 ? (
                    <div className="text-center py-8 text-zinc-400 text-sm">
                      No prompts found. Create some in the Prompt Manager.
                    </div>
                  ) : (
                    libraryPrompts.map(item => {
                      const isSelected = selectedLibraryPrompts.some(p => p._id === item._id);
                      return (
                        <button
                          key={item._id}
                          onClick={() => {
                            if (isSelected) {
                              setSelectedLibraryPrompts(prev => prev.filter(p => p._id !== item._id));
                            } else {
                              setSelectedLibraryPrompts(prev => [...prev, item]);
                            }
                          }}
                          className={`w-full text-left p-3 rounded-xl border transition-all ${
                            isSelected
                              ? "bg-indigo-50 border-indigo-300 ring-2 ring-indigo-200"
                              : "bg-white border-zinc-200 hover:border-indigo-200 hover:bg-indigo-50/50"
                          }`}
                        >
                          <div className="flex items-start gap-2">
                            <div className={`p-1.5 rounded-lg ${
                              isSelected ? "bg-indigo-600 text-white" : "bg-zinc-100 text-zinc-600"
                            }`}>
                              <Icon name={item.icon || "wand"} className="h-3.5 w-3.5" />
                            </div>
                            <div className="flex-1 min-w-0">
                              <div className="font-medium text-sm text-zinc-900">{item.name}</div>
                              <div className="text-xs text-zinc-500 line-clamp-2 mt-0.5">{item.promptText}</div>
                              <div className="flex items-center gap-2 mt-1">
                                <span className="text-[10px] px-1.5 py-0.5 rounded bg-zinc-100 text-zinc-500">
                                  {item.category}
                                </span>
                                {item.tags?.slice(0, 2).map(tag => (
                                  <span key={tag} className="text-[10px] text-zinc-400">#{tag}</span>
                                ))}
                              </div>
                            </div>
                            {isSelected && (
                              <Icon name="check" className="h-5 w-5 text-indigo-600 flex-shrink-0" />
                            )}
                          </div>
                        </button>
                      );
                    })
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
