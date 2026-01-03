"use client";

import { useState, useEffect } from "react";
import { Icon, type IconName } from "@/lib/ui";
import type { StoryNode, Entity, ExportedPrompt } from "@/lib/models";

type StoryMetadataPanelProps = {
  node: StoryNode;
  entities: Entity[];
  exportedPrompts: ExportedPrompt[];
  onUpdate: (data: Partial<StoryNode>) => Promise<void>;
  onDelete: () => void;
  collapsed: boolean;
  onToggleCollapse: () => void;
  saving: boolean;
};

const TABS = [
  { id: "content", label: "Content", icon: "edit" as IconName },
  { id: "dramatic", label: "Dramatic", icon: "star" as IconName },
  { id: "cinematic", label: "Cinematic", icon: "camera" as IconName },
  { id: "characters", label: "Characters", icon: "users" as IconName },
  { id: "prompts", label: "Prompts", icon: "wand" as IconName },
];

export function StoryMetadataPanel({
  node,
  entities,
  exportedPrompts,
  onUpdate,
  onDelete,
  collapsed,
  onToggleCollapse,
  saving,
}: StoryMetadataPanelProps) {
  const [activeTab, setActiveTab] = useState("content");
  const [localTitle, setLocalTitle] = useState(node.title);
  const [localSynopsis, setLocalSynopsis] = useState(node.synopsis || "");

  useEffect(() => {
    setLocalTitle(node.title);
    setLocalSynopsis(node.synopsis || "");
  }, [node._id, node.title, node.synopsis]);

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
      <div className="h-full flex flex-col items-center py-4 bg-white/60 backdrop-blur-xl border-l border-zinc-200/50">
        <button
          onClick={onToggleCollapse}
          className="p-2 rounded-lg hover:bg-zinc-100 transition-all"
          title="Expand Properties"
        >
          <Icon name="chevronLeft" className="h-5 w-5 text-zinc-600" />
        </button>
        <div className={`mt-4 flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${colorMap[node.nodeType]} text-white`}>
          <Icon name={iconMap[node.nodeType]} className="h-5 w-5" />
        </div>
      </div>
    );
  }

  return (
    <div className="h-full flex flex-col bg-white/60 backdrop-blur-xl border-l border-zinc-200/50">
      {/* Header */}
      <div className="flex-shrink-0 p-4 border-b border-zinc-200/50">
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-3">
            <div className={`flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br ${colorMap[node.nodeType]} text-white shadow-lg`}>
              <Icon name={iconMap[node.nodeType]} className="h-5 w-5" />
            </div>
            <div>
              <div className="font-semibold text-zinc-900 text-sm">{node.title}</div>
              <div className="text-[10px] text-zinc-500 uppercase">{node.nodeType}</div>
            </div>
          </div>
          <button onClick={onToggleCollapse} className="p-1.5 rounded-lg hover:bg-zinc-100">
            <Icon name="chevronRight" className="h-4 w-4 text-zinc-500" />
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 overflow-x-auto">
          {TABS.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-indigo-100 text-indigo-700"
                  : "text-zinc-600 hover:bg-zinc-100"
              }`}
            >
              <Icon name={tab.icon} className="h-3.5 w-3.5" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {/* Tab Content */}
      <div className="flex-1 overflow-auto p-4">
        {activeTab === "content" && (
          <ContentTab
            node={node}
            localTitle={localTitle}
            setLocalTitle={setLocalTitle}
            localSynopsis={localSynopsis}
            setLocalSynopsis={setLocalSynopsis}
            onUpdate={onUpdate}
            saving={saving}
          />
        )}
        {activeTab === "dramatic" && (
          <DramaticTab node={node} onUpdate={onUpdate} saving={saving} />
        )}
        {activeTab === "cinematic" && (
          <CinematicTab node={node} onUpdate={onUpdate} saving={saving} />
        )}
        {activeTab === "characters" && (
          <CharactersTab node={node} entities={entities} onUpdate={onUpdate} saving={saving} />
        )}
        {activeTab === "prompts" && (
          <PromptsTab node={node} exportedPrompts={exportedPrompts} />
        )}
      </div>

      {/* Footer Actions */}
      <div className="flex-shrink-0 p-4 border-t border-zinc-200/50 space-y-2">
        {saving && (
          <div className="flex items-center gap-2 px-3 py-2 rounded-lg bg-amber-50 border border-amber-200 text-xs text-amber-700">
            <div className="h-2 w-2 rounded-full bg-amber-500 animate-pulse" />
            Saving changes...
          </div>
        )}
        <button
          onClick={onDelete}
          className="w-full flex items-center justify-center gap-2 px-4 py-2 rounded-xl bg-red-50 text-red-600 font-medium hover:bg-red-100 transition-all"
        >
          <Icon name="trash" className="h-4 w-4" />
          Delete {node.nodeType.toLowerCase()}
        </button>
      </div>
    </div>
  );
}

// =====================================================
// CONTENT TAB
// =====================================================
function ContentTab({
  node,
  localTitle,
  setLocalTitle,
  localSynopsis,
  setLocalSynopsis,
  onUpdate,
  saving,
}: {
  node: StoryNode;
  localTitle: string;
  setLocalTitle: (v: string) => void;
  localSynopsis: string;
  setLocalSynopsis: (v: string) => void;
  onUpdate: (data: Partial<StoryNode>) => Promise<void>;
  saving: boolean;
}) {
  const saveTitle = () => {
    if (localTitle !== node.title) {
      onUpdate({ title: localTitle });
    }
  };

  const saveSynopsis = () => {
    if (localSynopsis !== node.synopsis) {
      onUpdate({ synopsis: localSynopsis });
    }
  };

  return (
    <div className="space-y-4">
      {/* Title */}
      <div>
        <label className="text-xs font-semibold text-zinc-500 uppercase mb-1.5 block">Title</label>
        <input
          type="text"
          value={localTitle}
          onChange={(e) => setLocalTitle(e.target.value)}
          onBlur={saveTitle}
          className="w-full px-3 py-2 rounded-lg bg-white border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>

      {/* Synopsis */}
      <div>
        <label className="text-xs font-semibold text-zinc-500 uppercase mb-1.5 block">Synopsis</label>
        <textarea
          value={localSynopsis}
          onChange={(e) => setLocalSynopsis(e.target.value)}
          onBlur={saveSynopsis}
          rows={6}
          className="w-full px-3 py-2 rounded-lg bg-white border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
          placeholder="Write a synopsis..."
        />
      </div>

      {/* Scene Direction (for scenes) */}
      {node.nodeType === "SCENE" && (
        <div>
          <label className="text-xs font-semibold text-zinc-500 uppercase mb-1.5 block">Scene Direction</label>
          <textarea
            value={node.screenplay?.sceneDirection || ""}
            onChange={(e) => onUpdate({
              screenplay: {
                ...node.screenplay,
                sceneNodeId: node._id,
                sceneDirection: e.target.value,
                characterInstances: node.screenplay?.characterInstances || [],
                dialogSequence: node.screenplay?.dialogSequence || [],
              },
            })}
            rows={3}
            className="w-full px-3 py-2 rounded-lg bg-white border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
            placeholder="Stage directions, atmosphere notes..."
          />
        </div>
      )}

      {/* Order */}
      <div>
        <label className="text-xs font-semibold text-zinc-500 uppercase mb-1.5 block">Order</label>
        <input
          type="number"
          value={node.time?.order || 0}
          onChange={(e) => onUpdate({ time: { ...node.time, order: parseInt(e.target.value) || 0 } })}
          className="w-full px-3 py-2 rounded-lg bg-white border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
    </div>
  );
}

// =====================================================
// DRAMATIC TAB
// =====================================================
function DramaticTab({
  node,
  onUpdate,
  saving,
}: {
  node: StoryNode;
  onUpdate: (data: Partial<StoryNode>) => Promise<void>;
  saving: boolean;
}) {
  return (
    <div className="space-y-4">
      {/* Dramatic Goal */}
      <div>
        <label className="text-xs font-semibold text-zinc-500 uppercase mb-1.5 block">
          <Icon name="target" className="inline h-3.5 w-3.5 mr-1" />
          Dramatic Goal
        </label>
        <textarea
          value={node.goals?.dramaticGoal || ""}
          onChange={(e) => onUpdate({ goals: { ...node.goals, dramaticGoal: e.target.value, conflict: node.goals?.conflict || "", turn: node.goals?.turn || "" } })}
          rows={2}
          className="w-full px-3 py-2 rounded-lg bg-white border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 resize-none"
          placeholder="What is the dramatic goal?"
        />
      </div>

      {/* Conflict */}
      <div>
        <label className="text-xs font-semibold text-zinc-500 uppercase mb-1.5 block">
          <Icon name="warning" className="inline h-3.5 w-3.5 mr-1" />
          Conflict
        </label>
        <textarea
          value={node.goals?.conflict || ""}
          onChange={(e) => onUpdate({ goals: { ...node.goals, dramaticGoal: node.goals?.dramaticGoal || "", conflict: e.target.value, turn: node.goals?.turn || "" } })}
          rows={2}
          className="w-full px-3 py-2 rounded-lg bg-white border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-red-500 resize-none"
          placeholder="What is the conflict?"
        />
      </div>

      {/* Turn */}
      <div>
        <label className="text-xs font-semibold text-zinc-500 uppercase mb-1.5 block">
          <Icon name="refresh" className="inline h-3.5 w-3.5 mr-1" />
          Turn / Reversal
        </label>
        <textarea
          value={node.goals?.turn || ""}
          onChange={(e) => onUpdate({ goals: { ...node.goals, dramaticGoal: node.goals?.dramaticGoal || "", conflict: node.goals?.conflict || "", turn: e.target.value } })}
          rows={2}
          className="w-full px-3 py-2 rounded-lg bg-white border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-orange-500 resize-none"
          placeholder="What is the turn or reversal?"
        />
      </div>

      {/* Hook */}
      <div>
        <label className="text-xs font-semibold text-zinc-500 uppercase mb-1.5 block">
          <Icon name="sparkles" className="inline h-3.5 w-3.5 mr-1" />
          Hook
        </label>
        <textarea
          value={node.hooks?.hook || ""}
          onChange={(e) => onUpdate({ hooks: { ...node.hooks, hook: e.target.value, foreshadow: node.hooks?.foreshadow || [], payoffTargets: node.hooks?.payoffTargets || [] } })}
          rows={2}
          className="w-full px-3 py-2 rounded-lg bg-white border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-amber-500 resize-none"
          placeholder="What hooks the audience?"
        />
      </div>
    </div>
  );
}

// =====================================================
// CINEMATIC TAB
// =====================================================
function CinematicTab({
  node,
  onUpdate,
  saving,
}: {
  node: StoryNode;
  onUpdate: (data: Partial<StoryNode>) => Promise<void>;
  saving: boolean;
}) {
  const settings = node.cinematicSettings || {};

  const updateSetting = (key: string, value: string) => {
    onUpdate({
      cinematicSettings: {
        ...settings,
        [key]: value,
      },
    });
  };

  const settingFields = [
    { key: "shotFraming", label: "Shot Framing", options: ["Wide Shot", "Medium Shot", "Close-up", "Extreme Close-up", "Over-the-shoulder", "Two-shot"] },
    { key: "shotAngle", label: "Shot Angle", options: ["Eye Level", "Low Angle", "High Angle", "Dutch Angle", "Bird's Eye", "Worm's Eye"] },
    { key: "lightingType", label: "Lighting", options: ["Natural", "Studio", "Dramatic", "Soft", "Hard", "Cinematic", "Moody"] },
    { key: "timeOfDay", label: "Time of Day", options: ["Dawn", "Morning", "Noon", "Afternoon", "Sunset", "Dusk", "Night", "Blue Hour", "Golden Hour"] },
    { key: "weather", label: "Weather", options: ["Clear", "Cloudy", "Overcast", "Rainy", "Stormy", "Foggy", "Snowy"] },
    { key: "atmosphere", label: "Atmosphere", options: ["Peaceful", "Tense", "Mysterious", "Romantic", "Eerie", "Chaotic", "Melancholic"] },
    { key: "colorPalette", label: "Color Palette", options: ["Warm", "Cool", "Neutral", "Muted", "Vibrant", "Desaturated", "High Contrast"] },
  ];

  return (
    <div className="space-y-4">
      {settingFields.map(field => (
        <div key={field.key}>
          <label className="text-xs font-semibold text-zinc-500 uppercase mb-1.5 block">{field.label}</label>
          <select
            value={(settings as Record<string, string>)[field.key] || ""}
            onChange={(e) => updateSetting(field.key, e.target.value)}
            className="w-full px-3 py-2 rounded-lg bg-white border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">Select...</option>
            {field.options.map(opt => (
              <option key={opt} value={opt}>{opt}</option>
            ))}
          </select>
        </div>
      ))}
    </div>
  );
}

// =====================================================
// CHARACTERS TAB
// =====================================================
function CharactersTab({
  node,
  entities,
  onUpdate,
  saving,
}: {
  node: StoryNode;
  entities: Entity[];
  onUpdate: (data: Partial<StoryNode>) => Promise<void>;
  saving: boolean;
}) {
  const characters = entities.filter(e => e.type === "CHARACTER");
  const currentParticipants = node.participants || [];

  const toggleCharacter = (entityId: string) => {
    const exists = currentParticipants.some(p => p.entityId === entityId);
    const updated = exists
      ? currentParticipants.filter(p => p.entityId !== entityId)
      : [...currentParticipants, { entityId, role: "SUPPORT" as const }];
    onUpdate({ participants: updated });
  };

  return (
    <div className="space-y-3">
      <div className="text-xs text-zinc-500 mb-2">
        Select characters that appear in this {node.nodeType.toLowerCase()}
      </div>

      {characters.length === 0 ? (
        <div className="text-center py-8 text-zinc-400 text-sm">
          No characters in project yet
        </div>
      ) : (
        <div className="space-y-2">
          {characters.map(char => {
            const isSelected = currentParticipants.some(p => p.entityId === char._id);
            return (
              <button
                key={char._id}
                onClick={() => toggleCharacter(char._id)}
                className={`w-full flex items-center gap-3 p-3 rounded-xl transition-all ${
                  isSelected
                    ? "bg-emerald-100 border-2 border-emerald-300"
                    : "bg-white border-2 border-zinc-200 hover:border-zinc-300"
                }`}
              >
                {char.media?.thumbnailUrl ? (
                  <img src={char.media.thumbnailUrl} alt="" className="h-10 w-10 rounded-full object-cover" />
                ) : (
                  <div className="h-10 w-10 rounded-full bg-zinc-200 flex items-center justify-center">
                    <Icon name="character" className="h-5 w-5 text-zinc-500" />
                  </div>
                )}
                <div className="flex-1 text-left">
                  <div className="font-medium text-zinc-900">{char.name}</div>
                  <div className="text-xs text-zinc-500">{char.character?.role || "Character"}</div>
                </div>
                {isSelected && (
                  <Icon name="check" className="h-5 w-5 text-emerald-600" />
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}

// =====================================================
// PROMPTS TAB
// =====================================================
function PromptsTab({
  node,
  exportedPrompts,
}: {
  node: StoryNode;
  exportedPrompts: ExportedPrompt[];
}) {
  return (
    <div className="space-y-4">
      <div className="text-xs text-zinc-500 mb-2">
        Prompts generated for this {node.nodeType.toLowerCase()}
      </div>

      {exportedPrompts.length === 0 ? (
        <div className="text-center py-8 text-zinc-400 text-sm">
          No prompts exported yet
        </div>
      ) : (
        <div className="space-y-3">
          {exportedPrompts.map(prompt => (
            <div key={prompt._id} className="p-3 rounded-xl bg-white border border-zinc-200">
              <div className="flex items-center gap-2 mb-2">
                <span className={`px-2 py-0.5 text-[10px] font-medium rounded-full ${
                  prompt.type === "IMAGE" ? "bg-indigo-100 text-indigo-700" : "bg-purple-100 text-purple-700"
                }`}>
                  {prompt.type}
                </span>
                <span className="text-xs text-zinc-500">{prompt.title}</span>
              </div>
              <div className="text-xs text-zinc-700 font-mono line-clamp-4 bg-zinc-50 p-2 rounded-lg">
                {prompt.finalPrompt}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
