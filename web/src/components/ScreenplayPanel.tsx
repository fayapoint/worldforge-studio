"use client";

import { useState, useEffect, useMemo, useCallback } from "react";
import { Icon, type IconName } from "@/lib/ui";
import type { 
  StoryNode, 
  Entity, 
  SceneCharacterInstance, 
  SceneScreenplay, 
  DialogLine,
  WardrobeItem,
  CommunityWardrobeItem,
} from "@/lib/models";
import { WardrobePicker } from "@/components/WardrobePicker";

// =====================================================
// POSITION OPTIONS
// =====================================================
const POSITION_OPTIONS = [
  { value: "LEFT", label: "Left", icon: "chevronLeft" },
  { value: "CENTER", label: "Center", icon: "target" },
  { value: "RIGHT", label: "Right", icon: "chevronRight" },
  { value: "FOREGROUND", label: "Front", icon: "character" },
  { value: "MIDGROUND", label: "Mid", icon: "users" },
  { value: "BACKGROUND", label: "Back", icon: "world" },
  { value: "OFF_SCREEN", label: "Off", icon: "x" },
] as const;

const FACING_OPTIONS = [
  { value: "CAMERA", label: "Camera", icon: "camera" },
  { value: "AWAY", label: "Away", icon: "chevronUp" },
  { value: "LEFT", label: "Left", icon: "chevronLeft" },
  { value: "RIGHT", label: "Right", icon: "chevronRight" },
] as const;

const EXPRESSION_PRESETS = [
  "neutral", "happy", "sad", "angry", "fearful", "surprised", 
  "disgusted", "contemplative", "determined", "confused", 
  "hopeful", "skeptical", "exhausted", "amused", "worried"
];

const ACTION_INTENSITY_OPTIONS = [
  { value: "SUBTLE", label: "Subtle", description: "Barely noticeable" },
  { value: "MODERATE", label: "Moderate", description: "Clear but controlled" },
  { value: "DRAMATIC", label: "Dramatic", description: "Bold and intense" },
] as const;

const WARDROBE_TYPES = [
  { value: "FULL_OUTFIT", label: "Full Outfit", icon: "character" },
  { value: "TOP", label: "Top", icon: "shirt" },
  { value: "BOTTOM", label: "Bottom", icon: "pants" },
  { value: "DRESS", label: "Dress", icon: "dress" },
  { value: "OUTERWEAR", label: "Outerwear", icon: "jacket" },
  { value: "FOOTWEAR", label: "Footwear", icon: "shoe" },
  { value: "ACCESSORY", label: "Accessory", icon: "star" },
  { value: "HEADWEAR", label: "Headwear", icon: "crown" },
] as const;

const PACING_OPTIONS = [
  { value: "SLOW", label: "Slow", icon: "clock" },
  { value: "MEDIUM", label: "Medium", icon: "scene" },
  { value: "FAST", label: "Fast", icon: "flame" },
  { value: "FRENETIC", label: "Frenetic", icon: "sparkles" },
] as const;

const TENSION_OPTIONS = [
  { value: "LOW", label: "Low", color: "emerald" },
  { value: "BUILDING", label: "Building", color: "yellow" },
  { value: "HIGH", label: "High", color: "orange" },
  { value: "CLIMAX", label: "Climax", color: "red" },
  { value: "RELEASE", label: "Release", color: "blue" },
] as const;

// =====================================================
// HELPER: Generate unique ID
// =====================================================
function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// =====================================================
// WARDROBE SECTION - For character instance wardrobe editing
// =====================================================
function WardrobeSection({
  instance,
  entity,
  onUpdateField,
}: {
  instance: SceneCharacterInstance;
  entity?: Entity;
  onUpdateField: <K extends keyof SceneCharacterInstance>(field: K, value: SceneCharacterInstance[K]) => void;
}) {
  const [showWardrobePicker, setShowWardrobePicker] = useState(false);

  const handleSelectWardrobeItem = (item: CommunityWardrobeItem) => {
    // Append the prompt text to the current outfit description
    const current = instance.currentOutfitDescription || "";
    const separator = current ? ", " : "";
    onUpdateField("currentOutfitDescription", current + separator + item.promptText);
    setShowWardrobePicker(false);
  };

  return (
    <>
      {/* Current Outfit Description */}
      <div>
        <div className="flex items-center justify-between mb-1.5">
          <label className="text-[10px] font-semibold text-zinc-500 uppercase">Current Outfit Description</label>
          <button
            onClick={() => setShowWardrobePicker(true)}
            className="px-2 py-1 rounded-lg bg-gradient-to-r from-pink-500 to-rose-500 text-white text-[9px] font-medium hover:from-pink-600 hover:to-rose-600 transition-all flex items-center gap-1"
          >
            <Icon name="sparkles" className="h-3 w-3" />
            Browse Wardrobe
          </button>
        </div>
        <textarea
          value={instance.currentOutfitDescription || ""}
          onChange={(e) => onUpdateField("currentOutfitDescription", e.target.value)}
          placeholder="Describe the complete outfit for this scene... Click 'Browse Wardrobe' to add items from the community wardrobe"
          className="w-full px-2.5 py-2 rounded-lg bg-white/60 border border-white/40 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          rows={3}
        />
      </div>

      {/* Quick wardrobe note from original character */}
      {entity?.character?.appearance && (
        <div className="p-2 rounded-lg bg-amber-50 border border-amber-200">
          <div className="text-[10px] font-semibold text-amber-700 mb-1">Base Appearance (from character sheet)</div>
          <div className="text-[10px] text-amber-600">{entity.character.appearance}</div>
        </div>
      )}

      {/* Continuity Notes */}
      <div>
        <label className="text-[10px] font-semibold text-zinc-500 uppercase mb-1.5 block">Continuity Notes</label>
        <textarea
          value={instance.continuityNotes || ""}
          onChange={(e) => onUpdateField("continuityNotes", e.target.value)}
          placeholder="Notes for maintaining visual consistency across scenes..."
          className="w-full px-2.5 py-2 rounded-lg bg-white/60 border border-white/40 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          rows={2}
        />
      </div>

      {/* Wardrobe Picker Modal */}
      {showWardrobePicker && (
        <WardrobePicker
          characterEntityId={instance.entityId}
          characterName={instance.name}
          onSelectItem={handleSelectWardrobeItem}
          onClose={() => setShowWardrobePicker(false)}
        />
      )}
    </>
  );
}

// =====================================================
// CHARACTER INSTANCE CARD
// =====================================================
function CharacterInstanceCard({
  instance,
  entity,
  onChange,
  onRemove,
  isExpanded,
  onToggleExpand,
  index,
}: {
  instance: SceneCharacterInstance;
  entity?: Entity;
  onChange: (updated: SceneCharacterInstance) => void;
  onRemove: () => void;
  isExpanded: boolean;
  onToggleExpand: () => void;
  index: number;
}) {
  const [activeSection, setActiveSection] = useState<"position" | "appearance" | "action" | "dialog" | "wardrobe">("position");
  
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

  const thumbnailUrl = instance.thumbnailUrl || entity?.media?.thumbnailUrl;

  return (
    <div className="rounded-2xl bg-white/60 border border-white/40 overflow-hidden shadow-lg">
      {/* Header */}
      <div 
        onClick={onToggleExpand}
        className="flex items-center gap-3 p-3 cursor-pointer hover:bg-white/40 transition-all"
      >
        {/* Avatar */}
        <div className="relative">
          {thumbnailUrl ? (
            <img 
              src={thumbnailUrl} 
              alt={instance.name}
              className="w-12 h-12 rounded-xl object-cover border-2 border-white shadow-md"
            />
          ) : (
            <div className="w-12 h-12 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white shadow-md">
              <Icon name="character" className="h-6 w-6" />
            </div>
          )}
          {/* Priority badge */}
          <div className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-indigo-600 text-white text-[10px] font-bold flex items-center justify-center">
            {index + 1}
          </div>
        </div>
        
        <div className="flex-1 min-w-0">
          <div className="font-semibold text-zinc-900 truncate">{instance.name}</div>
          <div className="flex items-center gap-2 text-xs text-zinc-500">
            <span className="flex items-center gap-1">
              <Icon name="target" className="h-3 w-3" />
              {instance.position}
            </span>
            {instance.currentAction && (
              <span className="flex items-center gap-1">
                <Icon name="scene" className="h-3 w-3" />
                {instance.currentAction.slice(0, 15)}...
              </span>
            )}
            {instance.dialogLines.length > 0 && (
              <span className="flex items-center gap-1">
                <Icon name="mic" className="h-3 w-3" />
                {instance.dialogLines.length}
              </span>
            )}
          </div>
        </div>

        <div className="flex items-center gap-1">
          {/* Include in prompt toggle */}
          <button
            onClick={(e) => {
              e.stopPropagation();
              updateField("includeInPrompt", !instance.includeInPrompt);
            }}
            className={`p-1.5 rounded-lg transition-all ${
              instance.includeInPrompt 
                ? "bg-green-100 text-green-600" 
                : "bg-zinc-100 text-zinc-400"
            }`}
            title={instance.includeInPrompt ? "Included in prompt" : "Excluded from prompt"}
          >
            <Icon name={instance.includeInPrompt ? "check" : "x"} className="h-3.5 w-3.5" />
          </button>
          
          <button
            onClick={(e) => {
              e.stopPropagation();
              onRemove();
            }}
            className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-all"
          >
            <Icon name="trash" className="h-3.5 w-3.5" />
          </button>
          
          <Icon 
            name={isExpanded ? "chevronUp" : "chevronDown"} 
            className="h-4 w-4 text-zinc-400" 
          />
        </div>
      </div>

      {/* Expanded Content */}
      {isExpanded && (
        <div className="border-t border-white/40">
          {/* Section Tabs */}
          <div className="flex gap-1 p-2 bg-white/30 overflow-x-auto">
            {[
              { key: "position", icon: "target", label: "Position" },
              { key: "appearance", icon: "eye", label: "Look" },
              { key: "action", icon: "film", label: "Action" },
              { key: "dialog", icon: "mic", label: "Dialog" },
              { key: "wardrobe", icon: "star", label: "Wardrobe" },
            ].map((tab) => (
              <button
                key={tab.key}
                onClick={() => setActiveSection(tab.key as any)}
                className={`px-2.5 py-1.5 rounded-lg text-[10px] font-semibold transition-all flex items-center gap-1.5 whitespace-nowrap ${
                  activeSection === tab.key
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow"
                    : "bg-white/50 text-zinc-600 hover:bg-white"
                }`}
              >
                <Icon name={tab.icon as IconName} className="h-3 w-3" />
                {tab.label}
              </button>
            ))}
          </div>

          {/* Section Content */}
          <div className="p-3 space-y-3">
            {activeSection === "position" && (
              <>
                {/* Position Grid */}
                <div>
                  <label className="text-[10px] font-semibold text-zinc-500 uppercase mb-1.5 block">Position in Frame</label>
                  <div className="grid grid-cols-4 gap-1">
                    {POSITION_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => updateField("position", opt.value)}
                        className={`p-2 rounded-lg text-[10px] font-medium transition-all flex flex-col items-center gap-1 ${
                          instance.position === opt.value
                            ? "bg-indigo-600 text-white"
                            : "bg-white/50 text-zinc-600 hover:bg-white"
                        }`}
                      >
                        <Icon name={opt.icon as IconName} className="h-3.5 w-3.5" />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Facing */}
                <div>
                  <label className="text-[10px] font-semibold text-zinc-500 uppercase mb-1.5 block">Facing Direction</label>
                  <div className="grid grid-cols-4 gap-1">
                    {FACING_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => updateField("facing", instance.facing === opt.value ? undefined : opt.value)}
                        className={`p-2 rounded-lg text-[10px] font-medium transition-all flex flex-col items-center gap-1 ${
                          instance.facing === opt.value
                            ? "bg-indigo-600 text-white"
                            : "bg-white/50 text-zinc-600 hover:bg-white"
                        }`}
                      >
                        <Icon name={opt.icon as IconName} className="h-3.5 w-3.5" />
                        {opt.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Prompt Priority */}
                <div>
                  <label className="text-[10px] font-semibold text-zinc-500 uppercase mb-1.5 block">Prompt Priority</label>
                  <input
                    type="range"
                    min="1"
                    max="5"
                    value={instance.promptPriority}
                    onChange={(e) => updateField("promptPriority", parseInt(e.target.value))}
                    className="w-full"
                  />
                  <div className="flex justify-between text-[9px] text-zinc-400">
                    <span>Background</span>
                    <span>Main Focus</span>
                  </div>
                </div>
              </>
            )}

            {activeSection === "appearance" && (
              <>
                {/* Expression */}
                <div>
                  <label className="text-[10px] font-semibold text-zinc-500 uppercase mb-1.5 block">Expression</label>
                  <div className="flex flex-wrap gap-1 mb-2">
                    {EXPRESSION_PRESETS.slice(0, 10).map((expr) => (
                      <button
                        key={expr}
                        onClick={() => updateField("expression", instance.expression === expr ? undefined : expr)}
                        className={`px-2 py-1 rounded-lg text-[10px] font-medium transition-all ${
                          instance.expression === expr
                            ? "bg-indigo-600 text-white"
                            : "bg-white/50 text-zinc-600 hover:bg-white"
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
                    placeholder="Custom expression..."
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white/60 border border-white/40 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Pose */}
                <div>
                  <label className="text-[10px] font-semibold text-zinc-500 uppercase mb-1.5 block">Pose</label>
                  <input
                    type="text"
                    value={instance.pose || ""}
                    onChange={(e) => updateField("pose", e.target.value)}
                    placeholder="e.g., standing with arms crossed, sitting, leaning against wall..."
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white/60 border border-white/40 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Body Language */}
                <div>
                  <label className="text-[10px] font-semibold text-zinc-500 uppercase mb-1.5 block">Body Language</label>
                  <input
                    type="text"
                    value={instance.bodyLanguage || ""}
                    onChange={(e) => updateField("bodyLanguage", e.target.value)}
                    placeholder="e.g., tense, relaxed, defensive, open..."
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white/60 border border-white/40 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Emotional State */}
                <div>
                  <label className="text-[10px] font-semibold text-zinc-500 uppercase mb-1.5 block">Emotional State</label>
                  <input
                    type="text"
                    value={instance.emotionalState || ""}
                    onChange={(e) => updateField("emotionalState", e.target.value)}
                    placeholder="What is this character feeling internally?"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white/60 border border-white/40 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </>
            )}

            {activeSection === "action" && (
              <>
                {/* Current Action */}
                <div>
                  <label className="text-[10px] font-semibold text-zinc-500 uppercase mb-1.5 block">What is this character doing?</label>
                  <textarea
                    value={instance.currentAction || ""}
                    onChange={(e) => updateField("currentAction", e.target.value)}
                    placeholder="e.g., walking towards the door, reading a letter, arguing with another character..."
                    className="w-full px-2.5 py-2 rounded-lg bg-white/60 border border-white/40 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    rows={2}
                  />
                </div>

                {/* Action Intensity */}
                <div>
                  <label className="text-[10px] font-semibold text-zinc-500 uppercase mb-1.5 block">Action Intensity</label>
                  <div className="grid grid-cols-3 gap-1">
                    {ACTION_INTENSITY_OPTIONS.map((opt) => (
                      <button
                        key={opt.value}
                        onClick={() => updateField("actionIntensity", instance.actionIntensity === opt.value ? undefined : opt.value)}
                        className={`p-2 rounded-lg text-[10px] font-medium transition-all ${
                          instance.actionIntensity === opt.value
                            ? "bg-indigo-600 text-white"
                            : "bg-white/50 text-zinc-600 hover:bg-white"
                        }`}
                      >
                        <div className="font-semibold">{opt.label}</div>
                        <div className="text-[8px] opacity-70">{opt.description}</div>
                      </button>
                    ))}
                  </div>
                </div>

                {/* Props */}
                <div>
                  <label className="text-[10px] font-semibold text-zinc-500 uppercase mb-1.5 block">Props (items character is holding/using)</label>
                  <input
                    type="text"
                    value={instance.props?.join(", ") || ""}
                    onChange={(e) => updateField("props", e.target.value.split(",").map(s => s.trim()).filter(Boolean))}
                    placeholder="e.g., sword, book, phone, coffee cup..."
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white/60 border border-white/40 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>

                {/* Motivation */}
                <div>
                  <label className="text-[10px] font-semibold text-zinc-500 uppercase mb-1.5 block">Motivation in this scene</label>
                  <input
                    type="text"
                    value={instance.motivation || ""}
                    onChange={(e) => updateField("motivation", e.target.value)}
                    placeholder="What drives this character in this moment?"
                    className="w-full px-2.5 py-1.5 rounded-lg bg-white/60 border border-white/40 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
                  />
                </div>
              </>
            )}

            {activeSection === "dialog" && (
              <>
                {/* Dialog Lines */}
                <div className="space-y-2">
                  {instance.dialogLines.map((line, lineIndex) => (
                    <div key={line.id} className="p-2 rounded-xl bg-white/40 border border-white/30 space-y-2">
                      <div className="flex items-start gap-2">
                        <div className="w-6 h-6 rounded-full bg-indigo-100 text-indigo-600 flex items-center justify-center text-[10px] font-bold flex-shrink-0 mt-1">
                          {lineIndex + 1}
                        </div>
                        <div className="flex-1">
                          <textarea
                            value={line.text}
                            onChange={(e) => updateDialogLine(line.id, { text: e.target.value })}
                            placeholder="Dialog line..."
                            className="w-full px-2.5 py-2 rounded-lg bg-white/60 border border-white/40 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                            rows={2}
                          />
                          <div className="flex gap-2 mt-1">
                            <input
                              type="text"
                              value={line.emotion || ""}
                              onChange={(e) => updateDialogLine(line.id, { emotion: e.target.value })}
                              placeholder="Emotion..."
                              className="flex-1 px-2 py-1 rounded-lg bg-white/40 border border-white/30 text-[10px] focus:outline-none"
                            />
                            <input
                              type="text"
                              value={line.direction || ""}
                              onChange={(e) => updateDialogLine(line.id, { direction: e.target.value })}
                              placeholder="Direction..."
                              className="flex-1 px-2 py-1 rounded-lg bg-white/40 border border-white/30 text-[10px] focus:outline-none"
                            />
                          </div>
                        </div>
                        <button
                          onClick={() => removeDialogLine(line.id)}
                          className="p-1 rounded-lg hover:bg-red-100 text-red-500 transition-all flex-shrink-0"
                        >
                          <Icon name="x" className="h-3 w-3" />
                        </button>
                      </div>
                    </div>
                  ))}
                  
                  <button
                    onClick={addDialogLine}
                    className="w-full px-3 py-2 rounded-xl border-2 border-dashed border-indigo-300 text-indigo-600 text-xs font-medium hover:bg-indigo-50 transition-all flex items-center justify-center gap-1.5"
                  >
                    <Icon name="plus" className="h-3.5 w-3.5" />
                    Add Dialog Line
                  </button>
                </div>
              </>
            )}

            {activeSection === "wardrobe" && (
              <WardrobeSection
                instance={instance}
                entity={entity}
                onUpdateField={updateField}
              />
            )}
          </div>
        </div>
      )}
    </div>
  );
}

// =====================================================
// MAIN SCREENPLAY PANEL COMPONENT
// =====================================================
type ScreenplayPanelProps = {
  node: StoryNode | null;
  entities: Entity[];
  onUpdate: (nodeId: string, data: Partial<StoryNode>) => Promise<void>;
  saving?: boolean;
  previousNodes?: StoryNode[];
};

export function ScreenplayPanel({
  node,
  entities,
  onUpdate,
  saving = false,
  previousNodes = [],
}: ScreenplayPanelProps) {
  const [expandedCharacterId, setExpandedCharacterId] = useState<string | null>(null);
  const [generatedPrompt, setGeneratedPrompt] = useState<string>("");
  const [copied, setCopied] = useState(false);
  
  // Get or initialize screenplay data
  const screenplay: SceneScreenplay = useMemo(() => {
    if (node?.screenplay) return node.screenplay;
    return {
      sceneNodeId: node?._id || "",
      characterInstances: [],
      dialogSequence: [],
    };
  }, [node]);

  // Available characters (not yet in scene)
  const characters = useMemo(() => 
    entities.filter(e => e.type === "CHARACTER"),
    [entities]
  );

  const availableCharacters = useMemo(() => 
    characters.filter(c => 
      !screenplay.characterInstances.find(inst => inst.entityId === c._id)
    ),
    [characters, screenplay.characterInstances]
  );

  // Add character to scene
  const addCharacterToScene = useCallback(async (entityId: string) => {
    console.log("Adding character to scene:", entityId);
    if (!node) {
      console.error("No node selected");
      return;
    }
    
    const entity = characters.find(c => c._id === entityId);
    if (!entity) {
      console.error("Entity not found:", entityId);
      return;
    }

    console.log("Found entity:", entity.name, entity._id);

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

    const updatedScreenplay: SceneScreenplay = {
      ...screenplay,
      sceneNodeId: node._id,
      characterInstances: [...screenplay.characterInstances, newInstance],
    };

    console.log("Calling onUpdate with screenplay:", updatedScreenplay);
    try {
      await onUpdate(node._id, { screenplay: updatedScreenplay });
      console.log("onUpdate completed successfully");
      setExpandedCharacterId(newInstance.id);
    } catch (err) {
      console.error("Error in addCharacterToScene:", err);
    }
  }, [node, characters, screenplay, onUpdate]);

  // Update character instance
  const updateCharacterInstance = useCallback(async (updated: SceneCharacterInstance) => {
    if (!node) return;

    const updatedScreenplay: SceneScreenplay = {
      ...screenplay,
      characterInstances: screenplay.characterInstances.map(inst =>
        inst.id === updated.id ? updated : inst
      ),
    };

    await onUpdate(node._id, { screenplay: updatedScreenplay });
  }, [node, screenplay, onUpdate]);

  // Remove character from scene
  const removeCharacterFromScene = useCallback(async (instanceId: string) => {
    if (!node) return;

    const updatedScreenplay: SceneScreenplay = {
      ...screenplay,
      characterInstances: screenplay.characterInstances.filter(inst => inst.id !== instanceId),
      dialogSequence: screenplay.dialogSequence.filter(id => id !== instanceId),
    };

    await onUpdate(node._id, { screenplay: updatedScreenplay });
  }, [node, screenplay, onUpdate]);

  // Update scene direction
  const updateSceneDirection = useCallback(async (field: keyof SceneScreenplay, value: any) => {
    if (!node) return;

    const updatedScreenplay: SceneScreenplay = {
      ...screenplay,
      [field]: value,
    };

    await onUpdate(node._id, { screenplay: updatedScreenplay });
  }, [node, screenplay, onUpdate]);

  // Generate character prompt from screenplay
  const buildScreenplayPrompt = useCallback(() => {
    const parts: string[] = [];
    
    // Scene direction
    if (screenplay.sceneDirection) {
      parts.push(screenplay.sceneDirection);
    }

    // Characters (sorted by priority)
    const sortedInstances = [...screenplay.characterInstances]
      .filter(inst => inst.includeInPrompt)
      .sort((a, b) => b.promptPriority - a.promptPriority);

    sortedInstances.forEach(inst => {
      const charParts: string[] = [];
      
      // Name and position
      charParts.push(`${inst.name} (${inst.position.toLowerCase()})`);
      
      // Appearance
      if (inst.currentOutfitDescription) {
        charParts.push(`wearing ${inst.currentOutfitDescription}`);
      } else if (inst.baseAppearance) {
        charParts.push(inst.baseAppearance);
      }
      
      // Expression and pose
      if (inst.expression) charParts.push(`${inst.expression} expression`);
      if (inst.pose) charParts.push(inst.pose);
      if (inst.bodyLanguage) charParts.push(`${inst.bodyLanguage} body language`);
      
      // Action
      if (inst.currentAction) {
        charParts.push(inst.currentAction);
      }

      // Props
      if (inst.props?.length) {
        charParts.push(`holding ${inst.props.join(", ")}`);
      }

      parts.push(charParts.join(", "));
    });

    // Atmosphere
    if (screenplay.atmosphereNotes) {
      parts.push(screenplay.atmosphereNotes);
    }

    // Pacing/Tension hints
    if (screenplay.tension) {
      const tensionMap = {
        LOW: "calm atmosphere",
        BUILDING: "building tension",
        HIGH: "high tension",
        CLIMAX: "climactic moment",
        RELEASE: "tension release",
      };
      parts.push(tensionMap[screenplay.tension]);
    }

    return parts.filter(Boolean).join(". ");
  }, [screenplay]);

  // Generate prompt when screenplay changes
  useEffect(() => {
    setGeneratedPrompt(buildScreenplayPrompt());
  }, [buildScreenplayPrompt]);

  // Copy prompt
  const copyPrompt = async () => {
    await navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  if (!node) {
    return (
      <div className="flex-1 flex items-center justify-center p-6">
        <div className="text-center">
          <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-rose-500 to-orange-600 text-white">
            <Icon name="film" className="h-8 w-8" />
          </div>
          <h3 className="mb-2 text-lg font-semibold text-zinc-900">Screenplay</h3>
          <p className="text-sm text-zinc-600">Select a scene to manage characters and dialog</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-full">
      {/* Generated Prompt Output */}
      <div className="flex-shrink-0 p-3 border-b border-white/20 bg-gradient-to-br from-rose-500/10 to-orange-500/10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon name="sparkles" className="h-4 w-4 text-rose-600" />
            <span className="font-semibold text-sm text-zinc-900">Character Prompt</span>
            {screenplay.characterInstances.length > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-rose-600 text-white rounded-full">
                {screenplay.characterInstances.filter(i => i.includeInPrompt).length} chars
              </span>
            )}
          </div>
          <button
            onClick={copyPrompt}
            disabled={!generatedPrompt}
            className="p-1.5 rounded-lg bg-white/60 hover:bg-white text-zinc-700 transition-all disabled:opacity-50"
            title="Copy prompt"
          >
            <Icon name={copied ? "check" : "copy"} className="h-3.5 w-3.5" />
          </button>
        </div>
        <div className="bg-white/60 rounded-xl p-3 min-h-[50px] max-h-[80px] overflow-auto">
          {generatedPrompt ? (
            <p className="text-xs text-zinc-700 leading-relaxed">{generatedPrompt}</p>
          ) : (
            <p className="text-xs text-zinc-400 italic">Add characters below to generate screenplay prompt...</p>
          )}
        </div>
      </div>

      {/* Scrollable Content */}
      <div className="flex-1 overflow-auto p-3 space-y-3">
        {/* Scene Settings */}
        <div className="p-3 rounded-xl bg-white/40 border border-white/30 space-y-3">
          <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wide flex items-center gap-1.5">
            <Icon name="scene" className="h-3.5 w-3.5" />
            Scene Direction
          </h4>
          
          <textarea
            value={screenplay.sceneDirection || ""}
            onChange={(e) => updateSceneDirection("sceneDirection", e.target.value)}
            placeholder="Overall scene direction and staging notes..."
            className="w-full px-2.5 py-2 rounded-lg bg-white/60 border border-white/40 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500 resize-none"
            rows={2}
          />

          <div className="grid grid-cols-2 gap-2">
            {/* Pacing */}
            <div>
              <label className="text-[9px] font-semibold text-zinc-500 uppercase mb-1 block">Pacing</label>
              <div className="grid grid-cols-2 gap-1">
                {PACING_OPTIONS.map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => updateSceneDirection("pacing", screenplay.pacing === opt.value ? undefined : opt.value)}
                    className={`px-2 py-1 rounded-lg text-[9px] font-medium transition-all flex items-center gap-1 justify-center ${
                      screenplay.pacing === opt.value
                        ? "bg-rose-600 text-white"
                        : "bg-white/50 text-zinc-600 hover:bg-white"
                    }`}
                  >
                    <Icon name={opt.icon as IconName} className="h-3 w-3" />
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>

            {/* Tension */}
            <div>
              <label className="text-[9px] font-semibold text-zinc-500 uppercase mb-1 block">Tension</label>
              <div className="grid grid-cols-2 gap-1">
                {TENSION_OPTIONS.slice(0, 4).map((opt) => (
                  <button
                    key={opt.value}
                    onClick={() => updateSceneDirection("tension", screenplay.tension === opt.value ? undefined : opt.value)}
                    className={`px-2 py-1 rounded-lg text-[9px] font-medium transition-all ${
                      screenplay.tension === opt.value
                        ? `bg-${opt.color}-500 text-white`
                        : "bg-white/50 text-zinc-600 hover:bg-white"
                    }`}
                    style={{
                      backgroundColor: screenplay.tension === opt.value 
                        ? opt.color === "emerald" ? "#10b981" 
                          : opt.color === "yellow" ? "#eab308"
                          : opt.color === "orange" ? "#f97316"
                          : opt.color === "red" ? "#ef4444"
                          : "#3b82f6"
                        : undefined
                    }}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Atmosphere */}
          <div>
            <label className="text-[9px] font-semibold text-zinc-500 uppercase mb-1 block">Atmosphere Notes</label>
            <input
              type="text"
              value={screenplay.atmosphereNotes || ""}
              onChange={(e) => updateSceneDirection("atmosphereNotes", e.target.value)}
              placeholder="e.g., tense, intimate, chaotic..."
              className="w-full px-2.5 py-1.5 rounded-lg bg-white/60 border border-white/40 text-xs focus:outline-none focus:ring-2 focus:ring-rose-500"
            />
          </div>
        </div>

        {/* Characters Section */}
        <div className="space-y-2">
          <div className="flex items-center justify-between">
            <h4 className="text-xs font-bold text-zinc-700 uppercase tracking-wide flex items-center gap-1.5">
              <Icon name="users" className="h-3.5 w-3.5" />
              Characters in Scene
            </h4>
            {availableCharacters.length > 0 && (
              <select
                onChange={(e) => {
                  if (e.target.value) {
                    addCharacterToScene(e.target.value);
                    e.target.value = "";
                  }
                }}
                className="px-2 py-1 rounded-lg bg-rose-600 text-white text-xs font-medium focus:outline-none cursor-pointer"
                defaultValue=""
              >
                <option value="" disabled>+ Add Character</option>
                {availableCharacters.map((c) => (
                  <option key={c._id} value={c._id}>{c.name}</option>
                ))}
              </select>
            )}
          </div>

          {screenplay.characterInstances.length === 0 ? (
            <div className="p-6 rounded-xl border-2 border-dashed border-rose-200 bg-rose-50/50 text-center">
              <Icon name="users" className="h-8 w-8 text-rose-300 mx-auto mb-2" />
              <p className="text-sm text-rose-600 font-medium">No characters in this scene</p>
              <p className="text-xs text-rose-400 mt-1">Add characters from your entity library</p>
            </div>
          ) : (
            <div className="space-y-2">
              {screenplay.characterInstances.map((instance, index) => (
                <CharacterInstanceCard
                  key={instance.id}
                  instance={instance}
                  entity={entities.find(e => e._id === instance.entityId)}
                  onChange={updateCharacterInstance}
                  onRemove={() => removeCharacterFromScene(instance.id)}
                  isExpanded={expandedCharacterId === instance.id}
                  onToggleExpand={() => setExpandedCharacterId(
                    expandedCharacterId === instance.id ? null : instance.id
                  )}
                  index={index}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Saving Indicator */}
      {saving && (
        <div className="absolute bottom-2 right-2 px-2 py-1 rounded-lg bg-indigo-600 text-white text-[10px] font-medium flex items-center gap-1">
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          Saving...
        </div>
      )}
    </div>
  );
}

export default ScreenplayPanel;
