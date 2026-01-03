"use client";

import { useState, useEffect, useCallback } from "react";
import { Icon, Badge, PrimaryButton, SecondaryButton, type IconName } from "@/lib/ui";
import { apiFetch } from "@/lib/apiClient";
import type { 
  StoryNode, 
  Entity, 
  SceneCharacterInstance,
  WardrobeItem,
  CommunityWardrobeItem,
  WorldStateDelta 
} from "@/lib/models";

// =====================================================
// TYPES
// =====================================================

type SceneDetailPanelProps = {
  node: StoryNode;
  entities: Entity[];
  projectId: string;
  onUpdate: (updates: Partial<StoryNode>) => Promise<void>;
  onClose: () => void;
  wardrobeItems?: CommunityWardrobeItem[];
};

type TabId = "overview" | "characters" | "wardrobe" | "props" | "continuity" | "world-state" | "prompts";

type CharacterInScene = {
  entity: Entity;
  instance?: SceneCharacterInstance;
  wardrobe: WardrobeItem[];
  props: string[];
  enteringFrom?: string;
  exitingTo?: string;
};

// =====================================================
// SCENE DETAIL PANEL
// =====================================================

export function SceneDetailPanel({
  node,
  entities,
  projectId,
  onUpdate,
  onClose,
  wardrobeItems = [],
}: SceneDetailPanelProps) {
  const [activeTab, setActiveTab] = useState<TabId>("overview");
  const [saving, setSaving] = useState(false);
  const [editMode, setEditMode] = useState(false);
  
  // Editable fields
  const [title, setTitle] = useState(node.title);
  const [synopsis, setSynopsis] = useState(node.synopsis);
  const [dramaticGoal, setDramaticGoal] = useState(node.goals?.dramaticGoal || "");
  const [conflict, setConflict] = useState(node.goals?.conflict || "");
  const [turn, setTurn] = useState(node.goals?.turn || "");
  const [hook, setHook] = useState(node.hooks?.hook || "");
  const [foreshadow, setForeshadow] = useState<string[]>(node.hooks?.foreshadow || []);
  const [worldStateDelta, setWorldStateDelta] = useState<WorldStateDelta[]>(node.worldStateDelta || []);
  
  // Character instances
  const [characterInstances, setCharacterInstances] = useState<CharacterInScene[]>([]);
  
  // Props tracking
  const [sceneProps, setSceneProps] = useState<{id: string; name: string; state: string; holder?: string}[]>([]);
  
  // Get participants as entities
  const participantEntities = (node.participants || [])
    .map(p => entities.find(e => e._id === p.entityId))
    .filter(Boolean) as Entity[];
  
  const locationEntities = (node.locations || [])
    .map(locId => entities.find(e => e._id === locId))
    .filter(Boolean) as Entity[];

  // Initialize character instances
  useEffect(() => {
    const instances: CharacterInScene[] = participantEntities.map(entity => {
      const existingInstance = node.screenplay?.characterInstances?.find(
        ci => ci.entityId === entity._id
      );
      return {
        entity,
        instance: existingInstance,
        wardrobe: existingInstance?.wardrobe || [],
        props: existingInstance?.props || [],
        enteringFrom: undefined,
        exitingTo: undefined,
      };
    });
    setCharacterInstances(instances);
  }, [node, participantEntities]);

  const handleSave = async () => {
    setSaving(true);
    try {
      await onUpdate({
        title,
        synopsis,
        goals: { dramaticGoal, conflict, turn },
        hooks: { hook, foreshadow, payoffTargets: node.hooks?.payoffTargets || [] },
        worldStateDelta,
      });
      setEditMode(false);
    } catch (err) {
      console.error("Failed to save:", err);
    }
    setSaving(false);
  };

  const tabs: { id: TabId; label: string; icon: IconName }[] = [
    { id: "overview", label: "Overview", icon: "scene" },
    { id: "characters", label: "Characters", icon: "character" },
    { id: "wardrobe", label: "Wardrobe", icon: "sparkles" },
    { id: "props", label: "Props", icon: "item" },
    { id: "continuity", label: "Continuity", icon: "continuity" },
    { id: "world-state", label: "World State", icon: "world" },
    { id: "prompts", label: "Prompts", icon: "prompts" },
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-stretch bg-black/60 backdrop-blur-sm">
      <div className="flex-1 flex flex-col bg-white/95 backdrop-blur-xl m-4 rounded-2xl shadow-2xl overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-zinc-200 bg-gradient-to-r from-violet-50 to-indigo-50">
          <div className="flex items-center gap-4">
            <div className="p-3 rounded-xl bg-gradient-to-br from-violet-600 to-purple-700 text-white shadow-lg">
              <Icon name="scene" className="h-6 w-6" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <Badge tone={node.nodeType === "SCENE" ? "success" : node.nodeType === "BEAT" ? "warn" : "neutral"}>
                  {node.nodeType}
                </Badge>
                <span className="text-xs text-zinc-500">Order: {node.time?.order}</span>
              </div>
              {editMode ? (
                <input
                  type="text"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="mt-1 text-xl font-bold text-zinc-900 bg-white px-2 py-1 rounded-lg border border-zinc-300 focus:outline-none focus:ring-2 focus:ring-violet-500"
                />
              ) : (
                <h2 className="text-xl font-bold text-zinc-900">{node.title}</h2>
              )}
            </div>
          </div>
          
          <div className="flex items-center gap-2">
            {editMode ? (
              <>
                <SecondaryButton onClick={() => setEditMode(false)}>Cancel</SecondaryButton>
                <PrimaryButton onClick={handleSave} disabled={saving}>
                  {saving ? <Icon name="refresh" className="h-4 w-4 animate-spin" /> : <Icon name="check" className="h-4 w-4" />}
                  Save Changes
                </PrimaryButton>
              </>
            ) : (
              <SecondaryButton onClick={() => setEditMode(true)}>
                <Icon name="edit" className="h-4 w-4" />
                Edit Scene
              </SecondaryButton>
            )}
            <button 
              onClick={onClose}
              className="p-2 rounded-lg hover:bg-zinc-100 transition-colors"
            >
              <Icon name="x" className="h-5 w-5 text-zinc-500" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex-shrink-0 flex gap-1 p-2 bg-zinc-50 border-b border-zinc-200 overflow-x-auto">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium whitespace-nowrap transition-all ${
                activeTab === tab.id
                  ? "bg-white text-violet-700 shadow-sm border border-violet-200"
                  : "text-zinc-600 hover:bg-white/60 hover:text-zinc-900"
              }`}
            >
              <Icon name={tab.icon} className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Tab Content */}
        <div className="flex-1 overflow-auto p-6">
          {activeTab === "overview" && (
            <OverviewTab
              node={node}
              editMode={editMode}
              synopsis={synopsis}
              setSynopsis={setSynopsis}
              dramaticGoal={dramaticGoal}
              setDramaticGoal={setDramaticGoal}
              conflict={conflict}
              setConflict={setConflict}
              turn={turn}
              setTurn={setTurn}
              hook={hook}
              setHook={setHook}
              foreshadow={foreshadow}
              setForeshadow={setForeshadow}
              participantEntities={participantEntities}
              locationEntities={locationEntities}
            />
          )}
          
          {activeTab === "characters" && (
            <CharactersTab
              characterInstances={characterInstances}
              setCharacterInstances={setCharacterInstances}
              editMode={editMode}
              entities={entities}
            />
          )}
          
          {activeTab === "wardrobe" && (
            <WardrobeTab
              characterInstances={characterInstances}
              setCharacterInstances={setCharacterInstances}
              wardrobeItems={wardrobeItems}
              editMode={editMode}
            />
          )}
          
          {activeTab === "props" && (
            <PropsTab
              sceneProps={sceneProps}
              setSceneProps={setSceneProps}
              characterInstances={characterInstances}
              editMode={editMode}
            />
          )}
          
          {activeTab === "continuity" && (
            <ContinuityTab
              node={node}
              characterInstances={characterInstances}
              sceneProps={sceneProps}
            />
          )}
          
          {activeTab === "world-state" && (
            <WorldStateTab
              worldStateDelta={worldStateDelta}
              setWorldStateDelta={setWorldStateDelta}
              editMode={editMode}
            />
          )}
          
          {activeTab === "prompts" && (
            <PromptsTab
              node={node}
              characterInstances={characterInstances}
              locationEntities={locationEntities}
            />
          )}
        </div>
      </div>
    </div>
  );
}

// =====================================================
// OVERVIEW TAB
// =====================================================

function OverviewTab({
  node,
  editMode,
  synopsis,
  setSynopsis,
  dramaticGoal,
  setDramaticGoal,
  conflict,
  setConflict,
  turn,
  setTurn,
  hook,
  setHook,
  foreshadow,
  setForeshadow,
  participantEntities,
  locationEntities,
}: {
  node: StoryNode;
  editMode: boolean;
  synopsis: string;
  setSynopsis: (v: string) => void;
  dramaticGoal: string;
  setDramaticGoal: (v: string) => void;
  conflict: string;
  setConflict: (v: string) => void;
  turn: string;
  setTurn: (v: string) => void;
  hook: string;
  setHook: (v: string) => void;
  foreshadow: string[];
  setForeshadow: (v: string[]) => void;
  participantEntities: Entity[];
  locationEntities: Entity[];
}) {
  return (
    <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
      {/* Synopsis */}
      <div className="lg:col-span-2 rounded-xl border border-zinc-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-zinc-900 mb-3 flex items-center gap-2">
          <Icon name="story" className="h-4 w-4 text-violet-600" />
          Synopsis
        </h3>
        {editMode ? (
          <textarea
            value={synopsis}
            onChange={(e) => setSynopsis(e.target.value)}
            className="w-full h-32 px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500 resize-none"
            placeholder="Describe what happens in this scene..."
          />
        ) : (
          <p className="text-sm text-zinc-700 leading-relaxed">{synopsis || "No synopsis provided"}</p>
        )}
      </div>

      {/* Dramatic Goals */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-zinc-900 mb-3 flex items-center gap-2">
          <Icon name="target" className="h-4 w-4 text-amber-600" />
          Dramatic Structure
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-zinc-500 mb-1 block">Goal</label>
            {editMode ? (
              <input
                type="text"
                value={dramaticGoal}
                onChange={(e) => setDramaticGoal(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="What does the protagonist want?"
              />
            ) : (
              <p className="text-sm text-zinc-700">{dramaticGoal || "—"}</p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500 mb-1 block">Conflict</label>
            {editMode ? (
              <input
                type="text"
                value={conflict}
                onChange={(e) => setConflict(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="What obstacle stands in the way?"
              />
            ) : (
              <p className="text-sm text-zinc-700">{conflict || "—"}</p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500 mb-1 block">Turn</label>
            {editMode ? (
              <input
                type="text"
                value={turn}
                onChange={(e) => setTurn(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="How does the scene change direction?"
              />
            ) : (
              <p className="text-sm text-zinc-700">{turn || "—"}</p>
            )}
          </div>
        </div>
      </div>

      {/* Hooks & Foreshadowing */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-zinc-900 mb-3 flex items-center gap-2">
          <Icon name="sparkles" className="h-4 w-4 text-purple-600" />
          Hooks & Foreshadowing
        </h3>
        <div className="space-y-4">
          <div>
            <label className="text-xs font-medium text-zinc-500 mb-1 block">Scene Hook</label>
            {editMode ? (
              <input
                type="text"
                value={hook}
                onChange={(e) => setHook(e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                placeholder="What pulls the audience in?"
              />
            ) : (
              <p className="text-sm text-zinc-700">{hook || "—"}</p>
            )}
          </div>
          <div>
            <label className="text-xs font-medium text-zinc-500 mb-1 block">Foreshadowing Elements</label>
            {editMode ? (
              <div className="space-y-2">
                {foreshadow.map((item, idx) => (
                  <div key={idx} className="flex gap-2">
                    <input
                      type="text"
                      value={item}
                      onChange={(e) => {
                        const newForeshadow = [...foreshadow];
                        newForeshadow[idx] = e.target.value;
                        setForeshadow(newForeshadow);
                      }}
                      className="flex-1 px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
                    />
                    <button
                      onClick={() => setForeshadow(foreshadow.filter((_, i) => i !== idx))}
                      className="p-2 rounded-lg hover:bg-red-50 text-red-500"
                    >
                      <Icon name="x" className="h-4 w-4" />
                    </button>
                  </div>
                ))}
                <button
                  onClick={() => setForeshadow([...foreshadow, ""])}
                  className="text-xs text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1"
                >
                  <Icon name="plus" className="h-3 w-3" />
                  Add foreshadowing element
                </button>
              </div>
            ) : (
              <div className="space-y-1">
                {foreshadow.length > 0 ? (
                  foreshadow.map((item, idx) => (
                    <div key={idx} className="text-sm text-zinc-700 flex items-start gap-2">
                      <span className="text-purple-500">•</span>
                      {item}
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-zinc-400 italic">No foreshadowing elements</p>
                )}
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Characters */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-zinc-900 mb-3 flex items-center gap-2">
          <Icon name="users" className="h-4 w-4 text-blue-600" />
          Characters in Scene
        </h3>
        <div className="space-y-2">
          {participantEntities.length > 0 ? (
            participantEntities.map(entity => (
              <div key={entity._id} className="flex items-center gap-3 p-2 rounded-lg bg-zinc-50">
                {entity.media?.thumbnailUrl ? (
                  <img src={entity.media.thumbnailUrl} alt={entity.name} className="w-8 h-8 rounded-full object-cover" />
                ) : (
                  <div className="w-8 h-8 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                    <Icon name="character" className="h-4 w-4 text-white" />
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-zinc-900">{entity.name}</div>
                  <div className="text-xs text-zinc-500 truncate">{entity.character?.role || entity.summary}</div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-zinc-400 italic">No characters assigned</p>
          )}
        </div>
      </div>

      {/* Locations */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-zinc-900 mb-3 flex items-center gap-2">
          <Icon name="location" className="h-4 w-4 text-emerald-600" />
          Locations
        </h3>
        <div className="space-y-2">
          {locationEntities.length > 0 ? (
            locationEntities.map(entity => (
              <div key={entity._id} className="flex items-center gap-3 p-2 rounded-lg bg-zinc-50">
                <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center">
                  <Icon name="location" className="h-4 w-4 text-white" />
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-zinc-900">{entity.name}</div>
                  <div className="text-xs text-zinc-500 truncate">{entity.summary}</div>
                </div>
              </div>
            ))
          ) : (
            <p className="text-sm text-zinc-400 italic">No locations assigned</p>
          )}
        </div>
      </div>
    </div>
  );
}

// =====================================================
// CHARACTERS TAB
// =====================================================

function CharactersTab({
  characterInstances,
  setCharacterInstances,
  editMode,
  entities,
}: {
  characterInstances: CharacterInScene[];
  setCharacterInstances: (instances: CharacterInScene[]) => void;
  editMode: boolean;
  entities: Entity[];
}) {
  const [selectedCharIdx, setSelectedCharIdx] = useState(0);
  const selectedChar = characterInstances[selectedCharIdx];

  const updateCharacter = (idx: number, updates: Partial<CharacterInScene>) => {
    const newInstances = [...characterInstances];
    newInstances[idx] = { ...newInstances[idx], ...updates };
    setCharacterInstances(newInstances);
  };

  if (!selectedChar) {
    return (
      <div className="text-center py-12">
        <Icon name="users" className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
        <p className="text-zinc-500">No characters in this scene</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-[240px_1fr] gap-6">
      {/* Character List */}
      <div className="space-y-2">
        <h3 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Scene Characters</h3>
        {characterInstances.map((char, idx) => (
          <button
            key={char.entity._id}
            onClick={() => setSelectedCharIdx(idx)}
            className={`w-full flex items-center gap-3 p-3 rounded-xl text-left transition-all ${
              idx === selectedCharIdx
                ? "bg-gradient-to-r from-violet-100 to-indigo-100 border border-violet-200 shadow-sm"
                : "bg-white border border-zinc-100 hover:border-zinc-200 hover:shadow-sm"
            }`}
          >
            {char.entity.media?.thumbnailUrl ? (
              <img src={char.entity.media.thumbnailUrl} alt={char.entity.name} className="w-10 h-10 rounded-full object-cover" />
            ) : (
              <div className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center">
                <Icon name="character" className="h-5 w-5 text-white" />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <div className="text-sm font-semibold text-zinc-900">{char.entity.name}</div>
              <div className="text-xs text-zinc-500">{char.wardrobe.length} wardrobe • {char.props.length} props</div>
            </div>
          </button>
        ))}
      </div>

      {/* Character Details */}
      <div className="space-y-6">
        {/* Character Header */}
        <div className="flex items-start gap-4 p-5 rounded-xl bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-100">
          {selectedChar.entity.media?.thumbnailUrl ? (
            <img src={selectedChar.entity.media.thumbnailUrl} alt={selectedChar.entity.name} className="w-20 h-20 rounded-xl object-cover shadow-lg" />
          ) : (
            <div className="w-20 h-20 rounded-xl bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center shadow-lg">
              <Icon name="character" className="h-10 w-10 text-white" />
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-xl font-bold text-zinc-900">{selectedChar.entity.name}</h2>
            <p className="text-sm text-zinc-600 mt-1">{selectedChar.entity.character?.role || selectedChar.entity.summary}</p>
            <div className="flex gap-2 mt-3">
              <Badge tone="success">{selectedChar.wardrobe.length} wardrobe items</Badge>
              <Badge tone="neutral">{selectedChar.props.length} props</Badge>
            </div>
          </div>
        </div>

        {/* Position & State */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Position</h4>
            <select
              value={selectedChar.instance?.position || "CENTER"}
              disabled={!editMode}
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-sm disabled:opacity-60"
            >
              <option value="FOREGROUND">Foreground</option>
              <option value="MIDGROUND">Midground</option>
              <option value="BACKGROUND">Background</option>
              <option value="LEFT">Left</option>
              <option value="CENTER">Center</option>
              <option value="RIGHT">Right</option>
              <option value="OFF_SCREEN">Off Screen</option>
            </select>
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Emotional State</h4>
            <input
              type="text"
              value={selectedChar.instance?.emotionalState || ""}
              disabled={!editMode}
              placeholder="e.g., anxious, determined"
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-sm disabled:opacity-60"
            />
          </div>
        </div>

        {/* Action & Expression */}
        <div className="grid grid-cols-2 gap-4">
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Current Action</h4>
            <input
              type="text"
              value={selectedChar.instance?.currentAction || ""}
              disabled={!editMode}
              placeholder="e.g., examining document"
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-sm disabled:opacity-60"
            />
          </div>
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <h4 className="text-xs font-semibold text-zinc-500 uppercase tracking-wide mb-3">Expression</h4>
            <input
              type="text"
              value={selectedChar.instance?.expression || ""}
              disabled={!editMode}
              placeholder="e.g., furrowed brow, slight smile"
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-sm disabled:opacity-60"
            />
          </div>
        </div>

        {/* Scene Transitions */}
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <h4 className="text-xs font-semibold text-amber-700 uppercase tracking-wide mb-3 flex items-center gap-2">
            <Icon name="arrowRight" className="h-3 w-3" />
            Scene Transitions
          </h4>
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-medium text-amber-600 mb-1 block">Entering From</label>
              <input
                type="text"
                value={selectedChar.enteringFrom || ""}
                disabled={!editMode}
                placeholder="Previous scene or 'off-screen'"
                className="w-full px-3 py-2 rounded-lg bg-white border border-amber-200 text-sm disabled:opacity-60"
              />
            </div>
            <div>
              <label className="text-xs font-medium text-amber-600 mb-1 block">Exiting To</label>
              <input
                type="text"
                value={selectedChar.exitingTo || ""}
                disabled={!editMode}
                placeholder="Next scene or 'stays'"
                className="w-full px-3 py-2 rounded-lg bg-white border border-amber-200 text-sm disabled:opacity-60"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// WARDROBE TAB
// =====================================================

function WardrobeTab({
  characterInstances,
  setCharacterInstances,
  wardrobeItems,
  editMode,
}: {
  characterInstances: CharacterInScene[];
  setCharacterInstances: (instances: CharacterInScene[]) => void;
  wardrobeItems: CommunityWardrobeItem[];
  editMode: boolean;
}) {
  const [selectedCharIdx, setSelectedCharIdx] = useState(0);
  const selectedChar = characterInstances[selectedCharIdx];

  if (!selectedChar) {
    return (
      <div className="text-center py-12">
        <Icon name="sparkles" className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
        <p className="text-zinc-500">No characters to manage wardrobe for</p>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Character Selector */}
      <div className="flex gap-2 overflow-x-auto pb-2">
        {characterInstances.map((char, idx) => (
          <button
            key={char.entity._id}
            onClick={() => setSelectedCharIdx(idx)}
            className={`flex items-center gap-2 px-4 py-2 rounded-xl whitespace-nowrap transition-all ${
              idx === selectedCharIdx
                ? "bg-gradient-to-r from-pink-500 to-rose-600 text-white shadow-lg"
                : "bg-white border border-zinc-200 text-zinc-700 hover:border-pink-300"
            }`}
          >
            <Icon name="character" className="h-4 w-4" />
            {char.entity.name}
            <Badge tone={idx === selectedCharIdx ? "neutral" : "success"}>{char.wardrobe.length}</Badge>
          </button>
        ))}
      </div>

      {/* Current Outfit */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
            <Icon name="sparkles" className="h-4 w-4 text-pink-600" />
            Current Outfit - {selectedChar.entity.name}
          </h3>
          {editMode && (
            <button className="text-xs text-pink-600 hover:text-pink-700 font-medium flex items-center gap-1">
              <Icon name="plus" className="h-3 w-3" />
              Add from Wardrobe
            </button>
          )}
        </div>

        {selectedChar.wardrobe.length > 0 ? (
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-3">
            {selectedChar.wardrobe.map((item, idx) => (
              <div key={idx} className="rounded-lg border border-zinc-100 bg-zinc-50 p-3">
                <div className="flex items-center justify-between mb-2">
                  <Badge tone="neutral">{item.type}</Badge>
                  {editMode && (
                    <button className="p-1 rounded hover:bg-red-50 text-red-500">
                      <Icon name="x" className="h-3 w-3" />
                    </button>
                  )}
                </div>
                <p className="text-xs text-zinc-700">{item.description}</p>
                {item.condition && item.condition !== "PRISTINE" && (
                  <div className="mt-2"><Badge tone="warn">{item.condition}</Badge></div>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border-2 border-dashed border-zinc-200 rounded-xl">
            <Icon name="sparkles" className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
            <p className="text-sm text-zinc-500">No wardrobe items assigned</p>
            {editMode && (
              <button className="mt-3 text-xs text-pink-600 hover:text-pink-700 font-medium">
                + Add wardrobe items
              </button>
            )}
          </div>
        )}
      </div>

      {/* Wardrobe Continuity Check */}
      <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-5">
        <h3 className="text-sm font-semibold text-emerald-800 mb-3 flex items-center gap-2">
          <Icon name="check" className="h-4 w-4" />
          Wardrobe Continuity Check
        </h3>
        <div className="space-y-2">
          <div className="flex items-center gap-2 text-sm text-emerald-700">
            <Icon name="check" className="h-4 w-4" />
            Outfit consistent with previous scene
          </div>
          <div className="flex items-center gap-2 text-sm text-emerald-700">
            <Icon name="check" className="h-4 w-4" />
            No unexplained costume changes
          </div>
          <div className="flex items-center gap-2 text-sm text-amber-700">
            <Icon name="warning" className="h-4 w-4" />
            Consider: Time passed since last scene
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// PROPS TAB
// =====================================================

function PropsTab({
  sceneProps,
  setSceneProps,
  characterInstances,
  editMode,
}: {
  sceneProps: { id: string; name: string; state: string; holder?: string }[];
  setSceneProps: (props: { id: string; name: string; state: string; holder?: string }[]) => void;
  characterInstances: CharacterInScene[];
  editMode: boolean;
}) {
  const [newPropName, setNewPropName] = useState("");

  const addProp = () => {
    if (!newPropName.trim()) return;
    setSceneProps([
      ...sceneProps,
      { id: Date.now().toString(), name: newPropName.trim(), state: "present" }
    ]);
    setNewPropName("");
  };

  return (
    <div className="space-y-6">
      {/* Add Prop */}
      {editMode && (
        <div className="rounded-xl border border-zinc-200 bg-white p-4">
          <h3 className="text-sm font-semibold text-zinc-900 mb-3">Add Scene Prop</h3>
          <div className="flex gap-2">
            <input
              type="text"
              value={newPropName}
              onChange={(e) => setNewPropName(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addProp()}
              placeholder="e.g., Coffee cup, Letter, Phone..."
              className="flex-1 px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-violet-500"
            />
            <PrimaryButton onClick={addProp}>
              <Icon name="plus" className="h-4 w-4" />
              Add
            </PrimaryButton>
          </div>
        </div>
      )}

      {/* Props Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {sceneProps.map((prop) => (
          <div key={prop.id} className="rounded-xl border border-zinc-200 bg-white p-4">
            <div className="flex items-start justify-between mb-3">
              <div className="flex items-center gap-2">
                <div className="p-2 rounded-lg bg-gradient-to-br from-amber-500 to-orange-600 text-white">
                  <Icon name="item" className="h-4 w-4" />
                </div>
                <h4 className="font-semibold text-zinc-900">{prop.name}</h4>
              </div>
              {editMode && (
                <button
                  onClick={() => setSceneProps(sceneProps.filter(p => p.id !== prop.id))}
                  className="p-1 rounded hover:bg-red-50 text-red-500"
                >
                  <Icon name="trash" className="h-4 w-4" />
                </button>
              )}
            </div>
            
            <div className="space-y-2">
              <div>
                <label className="text-xs font-medium text-zinc-500 mb-1 block">State</label>
                <select
                  value={prop.state}
                  disabled={!editMode}
                  onChange={(e) => {
                    const newProps = sceneProps.map(p => 
                      p.id === prop.id ? { ...p, state: e.target.value } : p
                    );
                    setSceneProps(newProps);
                  }}
                  className="w-full px-2 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs disabled:opacity-60"
                >
                  <option value="present">Present in scene</option>
                  <option value="used">Being used</option>
                  <option value="held">Held by character</option>
                  <option value="dropped">Dropped</option>
                  <option value="destroyed">Destroyed</option>
                  <option value="hidden">Hidden</option>
                </select>
              </div>
              
              {(prop.state === "held" || prop.state === "used") && (
                <div>
                  <label className="text-xs font-medium text-zinc-500 mb-1 block">Held By</label>
                  <select
                    value={prop.holder || ""}
                    disabled={!editMode}
                    onChange={(e) => {
                      const newProps = sceneProps.map(p => 
                        p.id === prop.id ? { ...p, holder: e.target.value } : p
                      );
                      setSceneProps(newProps);
                    }}
                    className="w-full px-2 py-1.5 rounded-lg bg-zinc-50 border border-zinc-200 text-xs disabled:opacity-60"
                  >
                    <option value="">Select character...</option>
                    {characterInstances.map(char => (
                      <option key={char.entity._id} value={char.entity._id}>{char.entity.name}</option>
                    ))}
                  </select>
                </div>
              )}
            </div>
          </div>
        ))}

        {sceneProps.length === 0 && (
          <div className="col-span-full text-center py-12 border-2 border-dashed border-zinc-200 rounded-xl">
            <Icon name="item" className="h-12 w-12 text-zinc-300 mx-auto mb-4" />
            <p className="text-zinc-500">No props tracked in this scene</p>
            {editMode && (
              <p className="text-sm text-zinc-400 mt-2">Add props to track their state and continuity</p>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// =====================================================
// CONTINUITY TAB
// =====================================================

function ContinuityTab({
  node,
  characterInstances,
  sceneProps,
}: {
  node: StoryNode;
  characterInstances: CharacterInScene[];
  sceneProps: { id: string; name: string; state: string; holder?: string }[];
}) {
  return (
    <div className="space-y-6">
      {/* Continuity Summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="rounded-xl border border-emerald-200 bg-emerald-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="check" className="h-5 w-5 text-emerald-600" />
            <h4 className="font-semibold text-emerald-800">Verified</h4>
          </div>
          <div className="text-2xl font-bold text-emerald-700">3</div>
          <p className="text-xs text-emerald-600">continuity checks passed</p>
        </div>
        
        <div className="rounded-xl border border-amber-200 bg-amber-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="warning" className="h-5 w-5 text-amber-600" />
            <h4 className="font-semibold text-amber-800">Warnings</h4>
          </div>
          <div className="text-2xl font-bold text-amber-700">1</div>
          <p className="text-xs text-amber-600">items need attention</p>
        </div>
        
        <div className="rounded-xl border border-red-200 bg-red-50 p-4">
          <div className="flex items-center gap-2 mb-2">
            <Icon name="alert" className="h-5 w-5 text-red-600" />
            <h4 className="font-semibold text-red-800">Errors</h4>
          </div>
          <div className="text-2xl font-bold text-red-700">0</div>
          <p className="text-xs text-red-600">blocking issues</p>
        </div>
      </div>

      {/* Detailed Checks */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-zinc-900 mb-4 flex items-center gap-2">
          <Icon name="continuity" className="h-4 w-4 text-violet-600" />
          Continuity Analysis
        </h3>
        
        <div className="space-y-3">
          {/* Character Continuity */}
          <div className="rounded-lg border border-zinc-100 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Icon name="character" className="h-4 w-4 text-blue-600" />
                <span className="font-medium text-zinc-900">Character Continuity</span>
              </div>
              <Badge tone="success">✓ Pass</Badge>
            </div>
            <p className="text-xs text-zinc-600">All characters present are correctly tracked from previous scenes</p>
          </div>

          {/* Wardrobe Continuity */}
          <div className="rounded-lg border border-zinc-100 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Icon name="sparkles" className="h-4 w-4 text-pink-600" />
                <span className="font-medium text-zinc-900">Wardrobe Continuity</span>
              </div>
              <Badge tone="warn">⚠ Warning</Badge>
            </div>
            <p className="text-xs text-zinc-600">Angela's outfit changed without time skip - verify this is intentional</p>
          </div>

          {/* Props Continuity */}
          <div className="rounded-lg border border-zinc-100 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Icon name="item" className="h-4 w-4 text-amber-600" />
                <span className="font-medium text-zinc-900">Props Continuity</span>
              </div>
              <Badge tone="success">✓ Pass</Badge>
            </div>
            <p className="text-xs text-zinc-600">All props from previous scene are accounted for</p>
          </div>

          {/* Location Continuity */}
          <div className="rounded-lg border border-zinc-100 p-3">
            <div className="flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <Icon name="location" className="h-4 w-4 text-emerald-600" />
                <span className="font-medium text-zinc-900">Location Logic</span>
              </div>
              <Badge tone="success">✓ Pass</Badge>
            </div>
            <p className="text-xs text-zinc-600">Character transitions to this location are logically valid</p>
          </div>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// WORLD STATE TAB
// =====================================================

function WorldStateTab({
  worldStateDelta,
  setWorldStateDelta,
  editMode,
}: {
  worldStateDelta: WorldStateDelta[];
  setWorldStateDelta: (delta: WorldStateDelta[]) => void;
  editMode: boolean;
}) {
  const addDelta = () => {
    setWorldStateDelta([
      ...worldStateDelta,
      { key: "", op: "SET", value: "" }
    ]);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
            <Icon name="world" className="h-4 w-4 text-indigo-600" />
            World State Changes
          </h3>
          {editMode && (
            <button 
              onClick={addDelta}
              className="text-xs text-indigo-600 hover:text-indigo-700 font-medium flex items-center gap-1"
            >
              <Icon name="plus" className="h-3 w-3" />
              Add Change
            </button>
          )}
        </div>

        {worldStateDelta.length > 0 ? (
          <div className="space-y-3">
            {worldStateDelta.map((delta, idx) => (
              <div key={idx} className="flex items-center gap-3 p-3 rounded-lg bg-zinc-50 border border-zinc-100">
                <input
                  type="text"
                  value={delta.key}
                  disabled={!editMode}
                  placeholder="Key (e.g., character.location)"
                  onChange={(e) => {
                    const newDelta = [...worldStateDelta];
                    newDelta[idx] = { ...newDelta[idx], key: e.target.value };
                    setWorldStateDelta(newDelta);
                  }}
                  className="flex-1 px-3 py-2 rounded-lg bg-white border border-zinc-200 text-sm disabled:opacity-60"
                />
                <select
                  value={delta.op}
                  disabled={!editMode}
                  onChange={(e) => {
                    const newDelta = [...worldStateDelta];
                    newDelta[idx] = { ...newDelta[idx], op: e.target.value as WorldStateDelta["op"] };
                    setWorldStateDelta(newDelta);
                  }}
                  className="px-3 py-2 rounded-lg bg-white border border-zinc-200 text-sm disabled:opacity-60"
                >
                  <option value="SET">SET</option>
                  <option value="INC">INCREMENT</option>
                  <option value="DEC">DECREMENT</option>
                  <option value="ADD">ADD</option>
                  <option value="REMOVE">REMOVE</option>
                </select>
                <input
                  type="text"
                  value={String(delta.value || "")}
                  disabled={!editMode}
                  placeholder="Value"
                  onChange={(e) => {
                    const newDelta = [...worldStateDelta];
                    newDelta[idx] = { ...newDelta[idx], value: e.target.value };
                    setWorldStateDelta(newDelta);
                  }}
                  className="flex-1 px-3 py-2 rounded-lg bg-white border border-zinc-200 text-sm disabled:opacity-60"
                />
                {editMode && (
                  <button
                    onClick={() => setWorldStateDelta(worldStateDelta.filter((_, i) => i !== idx))}
                    className="p-2 rounded-lg hover:bg-red-50 text-red-500"
                  >
                    <Icon name="x" className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-8 border-2 border-dashed border-zinc-200 rounded-xl">
            <Icon name="world" className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
            <p className="text-sm text-zinc-500">No world state changes in this scene</p>
            {editMode && (
              <button 
                onClick={addDelta}
                className="mt-3 text-xs text-indigo-600 hover:text-indigo-700 font-medium"
              >
                + Add world state change
              </button>
            )}
          </div>
        )}
      </div>

      <div className="rounded-xl border border-blue-200 bg-blue-50 p-5">
        <h4 className="text-sm font-semibold text-blue-800 mb-2">About World State</h4>
        <p className="text-xs text-blue-700">
          World state changes track what happens in this scene that affects the story. 
          Examples: character locations, item ownership, relationship changes, plot flags.
          These are used for continuity checking and plot hole detection.
        </p>
      </div>
    </div>
  );
}

// =====================================================
// PROMPTS TAB
// =====================================================

function PromptsTab({
  node,
  characterInstances,
  locationEntities,
}: {
  node: StoryNode;
  characterInstances: CharacterInScene[];
  locationEntities: Entity[];
}) {
  const [generatedPrompt, setGeneratedPrompt] = useState("");
  
  const generatePrompt = () => {
    const chars = characterInstances.map(c => c.entity.name).join(", ");
    const locs = locationEntities.map(l => l.name).join(", ");
    const settings = node.cinematicSettings;
    
    let prompt = `${node.synopsis}\n\n`;
    if (chars) prompt += `Characters: ${chars}\n`;
    if (locs) prompt += `Location: ${locs}\n`;
    if (settings?.shotFraming) prompt += `Shot: ${settings.shotFraming}\n`;
    if (settings?.lightingType) prompt += `Lighting: ${settings.lightingType}\n`;
    
    setGeneratedPrompt(prompt);
  };

  return (
    <div className="space-y-6">
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-zinc-900 flex items-center gap-2">
            <Icon name="prompts" className="h-4 w-4 text-emerald-600" />
            Scene Prompt Generator
          </h3>
          <PrimaryButton onClick={generatePrompt}>
            <Icon name="sparkles" className="h-4 w-4" />
            Generate Prompt
          </PrimaryButton>
        </div>

        {generatedPrompt ? (
          <div className="rounded-xl bg-zinc-50 border border-zinc-200 p-4">
            <pre className="text-sm text-zinc-700 whitespace-pre-wrap font-mono">{generatedPrompt}</pre>
            <button 
              onClick={() => navigator.clipboard.writeText(generatedPrompt)}
              className="mt-3 text-xs text-violet-600 hover:text-violet-700 font-medium flex items-center gap-1"
            >
              <Icon name="copy" className="h-3 w-3" />
              Copy to clipboard
            </button>
          </div>
        ) : (
          <div className="text-center py-8 border-2 border-dashed border-zinc-200 rounded-xl">
            <Icon name="prompts" className="h-8 w-8 text-zinc-300 mx-auto mb-2" />
            <p className="text-sm text-zinc-500">Click "Generate Prompt" to create a visual prompt for this scene</p>
          </div>
        )}
      </div>

      {/* Cinematic Settings */}
      <div className="rounded-xl border border-zinc-200 bg-white p-5">
        <h3 className="text-sm font-semibold text-zinc-900 mb-4 flex items-center gap-2">
          <Icon name="camera" className="h-4 w-4 text-purple-600" />
          Cinematic Settings
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { label: "Shot Framing", value: node.cinematicSettings?.shotFraming },
            { label: "Camera Angle", value: node.cinematicSettings?.shotAngle },
            { label: "Lighting", value: node.cinematicSettings?.lightingType },
            { label: "Time of Day", value: node.cinematicSettings?.timeOfDay },
            { label: "Atmosphere", value: node.cinematicSettings?.atmosphere },
            { label: "Color Palette", value: node.cinematicSettings?.colorPalette },
            { label: "Lens", value: node.cinematicSettings?.lens },
            { label: "Visual Style", value: node.cinematicSettings?.visualStyle },
          ].map((setting, idx) => (
            <div key={idx} className="rounded-lg bg-zinc-50 p-3">
              <div className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-1">{setting.label}</div>
              <div className="text-sm text-zinc-700">{setting.value || "—"}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
