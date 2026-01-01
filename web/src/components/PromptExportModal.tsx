"use client";

import { useState, useEffect, useMemo } from "react";
import { Icon, type IconName } from "@/lib/ui";
import type { 
  StoryNode, 
  Entity, 
  CinematicSettings, 
  VideoMotionSettings,
  CharacterInScene,
  LocationInScene,
  ExportedPrompt,
} from "@/lib/models";
import {
  MOTION_TYPE_OPTIONS,
  MOTION_DIRECTION_OPTIONS,
  MOTION_SPEED_OPTIONS,
  MOTION_INTENSITY_OPTIONS,
  TRANSITION_OPTIONS,
  CHARACTER_POSITION_OPTIONS,
  VIDEO_PRESETS,
  buildFinalImagePrompt,
  buildFinalVideoPrompt,
  buildNegativePrompt,
  extractCharactersFromEntities,
  extractLocationsFromEntities,
  generateContinuityTags,
  type MotionOption,
  type VideoPreset,
} from "@/lib/promptExportGenerator";
import { CinematicPromptBuilder } from "./CinematicPromptBuilder";

// =====================================================
// TOOLTIP
// =====================================================
function Tooltip({ children, text }: { children: React.ReactNode; text: string }) {
  const [show, setShow] = useState(false);
  return (
    <div className="relative inline-block" onMouseEnter={() => setShow(true)} onMouseLeave={() => setShow(false)}>
      {children}
      {show && (
        <div className="absolute z-50 bottom-full left-1/2 -translate-x-1/2 mb-2 px-3 py-2 bg-zinc-900 text-white text-xs rounded-lg shadow-xl max-w-xs whitespace-normal">
          {text}
          <div className="absolute top-full left-1/2 -translate-x-1/2 border-4 border-transparent border-t-zinc-900" />
        </div>
      )}
    </div>
  );
}

// =====================================================
// COMPACT ICON SELECTOR
// =====================================================
function CompactIconSelector({ 
  options, 
  value, 
  onChange, 
  columns = 4 
}: { 
  options: MotionOption[]; 
  value: string; 
  onChange: (v: string) => void; 
  columns?: number;
}) {
  return (
    <div className="grid gap-1.5" style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {options.map((opt) => (
        <Tooltip key={opt.value} text={opt.promptText}>
          <button
            onClick={() => onChange(value === opt.value ? "" : opt.value)}
            className={`flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
              value === opt.value
                ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg scale-105"
                : "bg-white/40 hover:bg-white/70 text-zinc-700 hover:scale-105"
            }`}
          >
            <Icon name={opt.icon as IconName} className="h-4 w-4 mb-0.5" />
            <span className="text-[9px] font-medium truncate w-full text-center">{opt.label}</span>
          </button>
        </Tooltip>
      ))}
    </div>
  );
}

// =====================================================
// CHARACTER EDITOR CARD
// =====================================================
function CharacterEditorCard({
  character,
  onChange,
  onRemove,
}: {
  character: CharacterInScene;
  onChange: (updated: CharacterInScene) => void;
  onRemove: () => void;
}) {
  return (
    <div className="p-3 rounded-xl bg-white/40 border border-white/20 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center text-white">
            <Icon name="character" className="h-4 w-4" />
          </div>
          <span className="font-semibold text-sm text-zinc-900">{character.name}</span>
        </div>
        <button onClick={onRemove} className="p-1 rounded-lg hover:bg-red-100 text-red-500 transition-all">
          <Icon name="x" className="h-4 w-4" />
        </button>
      </div>
      
      {/* Expression */}
      <div>
        <label className="text-[10px] font-semibold text-zinc-500 uppercase mb-1 block">Expression</label>
        <input
          type="text"
          value={character.expression || ""}
          onChange={(e) => onChange({ ...character, expression: e.target.value })}
          placeholder="e.g., determined, fearful, hopeful..."
          className="w-full px-2 py-1.5 rounded-lg bg-white/60 border border-white/40 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      
      {/* Action */}
      <div>
        <label className="text-[10px] font-semibold text-zinc-500 uppercase mb-1 block">Action</label>
        <input
          type="text"
          value={character.action || ""}
          onChange={(e) => onChange({ ...character, action: e.target.value })}
          placeholder="e.g., running, looking at camera..."
          className="w-full px-2 py-1.5 rounded-lg bg-white/60 border border-white/40 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      
      {/* Position */}
      <div>
        <label className="text-[10px] font-semibold text-zinc-500 uppercase mb-1 block">Position</label>
        <div className="grid grid-cols-6 gap-1">
          {CHARACTER_POSITION_OPTIONS.map((pos) => (
            <button
              key={pos.value}
              onClick={() => onChange({ ...character, position: character.position === pos.value ? undefined : pos.value as CharacterInScene["position"] })}
              className={`p-1.5 rounded-lg text-[9px] font-medium transition-all ${
                character.position === pos.value
                  ? "bg-indigo-600 text-white"
                  : "bg-white/40 text-zinc-600 hover:bg-white/60"
              }`}
            >
              {pos.label}
            </button>
          ))}
        </div>
      </div>
    </div>
  );
}

// =====================================================
// LOCATION EDITOR CARD
// =====================================================
function LocationEditorCard({
  location,
  onChange,
  onRemove,
}: {
  location: LocationInScene;
  onChange: (updated: LocationInScene) => void;
  onRemove: () => void;
}) {
  return (
    <div className="p-3 rounded-xl bg-white/40 border border-white/20 space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center text-white">
            <Icon name="location" className="h-4 w-4" />
          </div>
          <span className="font-semibold text-sm text-zinc-900">{location.name}</span>
        </div>
        <button onClick={onRemove} className="p-1 rounded-lg hover:bg-red-100 text-red-500 transition-all">
          <Icon name="x" className="h-4 w-4" />
        </button>
      </div>
      
      {/* Time of Day */}
      <div>
        <label className="text-[10px] font-semibold text-zinc-500 uppercase mb-1 block">Time of Day</label>
        <input
          type="text"
          value={location.timeOfDay || ""}
          onChange={(e) => onChange({ ...location, timeOfDay: e.target.value })}
          placeholder="e.g., golden hour, night, dawn..."
          className="w-full px-2 py-1.5 rounded-lg bg-white/60 border border-white/40 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      
      {/* Weather */}
      <div>
        <label className="text-[10px] font-semibold text-zinc-500 uppercase mb-1 block">Weather</label>
        <input
          type="text"
          value={location.weather || ""}
          onChange={(e) => onChange({ ...location, weather: e.target.value })}
          placeholder="e.g., rainy, foggy, clear..."
          className="w-full px-2 py-1.5 rounded-lg bg-white/60 border border-white/40 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
      
      {/* Atmosphere */}
      <div>
        <label className="text-[10px] font-semibold text-zinc-500 uppercase mb-1 block">Atmosphere</label>
        <input
          type="text"
          value={location.atmosphere || ""}
          onChange={(e) => onChange({ ...location, atmosphere: e.target.value })}
          placeholder="e.g., tense, peaceful, mysterious..."
          className="w-full px-2 py-1.5 rounded-lg bg-white/60 border border-white/40 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
        />
      </div>
    </div>
  );
}

// =====================================================
// VIDEO PRESET BUTTON
// =====================================================
function VideoPresetButton({ 
  preset, 
  selected, 
  onClick 
}: { 
  preset: VideoPreset; 
  selected: boolean; 
  onClick: () => void;
}) {
  return (
    <Tooltip text={preset.description}>
      <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all ${
          selected
            ? "bg-gradient-to-br from-rose-600 to-orange-600 text-white shadow-lg scale-105"
            : "bg-white/50 hover:bg-white/80 text-zinc-700 hover:scale-105"
        }`}
      >
        <Icon name={preset.icon as IconName} className="h-5 w-5 mb-1" />
        <span className="text-[10px] font-semibold text-center leading-tight">{preset.name}</span>
      </button>
    </Tooltip>
  );
}

// =====================================================
// MAIN EXPORT MODAL
// =====================================================
type PromptExportModalProps = {
  isOpen: boolean;
  onClose: () => void;
  node: StoryNode;
  entities: Entity[];
  cinematicSettings?: CinematicSettings;
  onExport: (exportedPrompt: Partial<ExportedPrompt>) => Promise<void>;
  previousPrompts?: ExportedPrompt[];
};

export function PromptExportModal({
  isOpen,
  onClose,
  node,
  entities,
  cinematicSettings: initialCinematicSettings,
  onExport,
  previousPrompts = [],
}: PromptExportModalProps) {
  // Export type
  const [exportType, setExportType] = useState<"IMAGE" | "VIDEO">("IMAGE");
  
  // Active step
  const [activeStep, setActiveStep] = useState<"setup" | "characters" | "cinematic" | "video" | "preview">("setup");
  
  // Scene description
  const [sceneDescription, setSceneDescription] = useState(node.synopsis || "");
  
  // Dramatic context
  const [dramaticContext, setDramaticContext] = useState({
    goal: node.goals?.dramaticGoal || "",
    conflict: node.goals?.conflict || "",
    turn: node.goals?.turn || "",
    mood: "",
  });
  
  // Characters
  const [characters, setCharacters] = useState<CharacterInScene[]>(() => 
    extractCharactersFromEntities(node, entities)
  );
  
  // Locations
  const [locations, setLocations] = useState<LocationInScene[]>(() => 
    extractLocationsFromEntities(node, entities)
  );
  
  // Cinematic settings
  const [cinematicSettings, setCinematicSettings] = useState<CinematicSettings>(
    initialCinematicSettings || {}
  );
  
  // Video settings
  const [videoSettings, setVideoSettings] = useState<VideoMotionSettings>({
    motionType: "STATIC",
    motionSpeed: "MEDIUM",
    motionIntensity: "MODERATE",
  });
  const [activeVideoPreset, setActiveVideoPreset] = useState<string>("");
  
  // From-To tracking for video
  const [fromPromptId, setFromPromptId] = useState<string>("");
  
  // Export state
  const [exporting, setExporting] = useState(false);
  const [copied, setCopied] = useState(false);
  
  // Save options
  const [saveToGallery, setSaveToGallery] = useState(true);
  const [saveToStory, setSaveToStory] = useState(true);
  
  // Reset when node changes
  useEffect(() => {
    setSceneDescription(node.synopsis || "");
    setDramaticContext({
      goal: node.goals?.dramaticGoal || "",
      conflict: node.goals?.conflict || "",
      turn: node.goals?.turn || "",
      mood: "",
    });
    setCharacters(extractCharactersFromEntities(node, entities));
    setLocations(extractLocationsFromEntities(node, entities));
    setActiveStep("setup");
  }, [node, entities]);
  
  // Generate final prompt
  const finalPrompt = useMemo(() => {
    if (exportType === "IMAGE") {
      return buildFinalImagePrompt({
        sceneDescription,
        dramaticContext,
        characters,
        locations,
        cinematicSettings,
      });
    } else {
      return buildFinalVideoPrompt({
        sceneDescription,
        dramaticContext,
        characters,
        locations,
        cinematicSettings,
        videoSettings,
      });
    }
  }, [exportType, sceneDescription, dramaticContext, characters, locations, cinematicSettings, videoSettings]);
  
  const negativePrompt = useMemo(() => buildNegativePrompt(exportType), [exportType]);
  
  const continuityTags = useMemo(() => generateContinuityTags({
    characters,
    locations,
    cinematicSettings,
  }), [characters, locations, cinematicSettings]);
  
  // Apply video preset
  const applyVideoPreset = (presetId: string) => {
    const preset = VIDEO_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setVideoSettings(prev => ({
        ...prev,
        ...preset.settings,
      }));
      setActiveVideoPreset(presetId);
    }
  };
  
  // Copy to clipboard
  const copyPrompt = async () => {
    await navigator.clipboard.writeText(finalPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };
  
  // Export
  const handleExport = async () => {
    setExporting(true);
    try {
      await onExport({
        nodeId: node._id,
        type: exportType,
        title: `${node.title} - ${exportType}`,
        sceneDescription,
        dramaticContext,
        characters,
        locations,
        cinematicSettings,
        videoSettings: exportType === "VIDEO" ? videoSettings : undefined,
        finalPrompt,
        negativePrompt,
        continuityTags,
        previousPromptId: fromPromptId || undefined,
        timelineOrder: node.time?.order || 0,
        usedInGallery: saveToGallery,
        usedInStory: saveToStory,
      });
      onClose();
    } catch (error) {
      console.error("Export failed:", error);
    } finally {
      setExporting(false);
    }
  };
  
  // Available characters/locations not yet added
  const availableCharacters = entities.filter(
    e => e.type === "CHARACTER" && !characters.find(c => c.entityId === e._id)
  );
  const availableLocations = entities.filter(
    e => e.type === "LOCATION" && !locations.find(l => l.entityId === e._id)
  );
  
  if (!isOpen) return null;
  
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm">
      <div className="bg-gradient-to-br from-white/95 to-white/90 backdrop-blur-xl rounded-2xl shadow-2xl w-[95vw] max-w-6xl h-[90vh] flex flex-col overflow-hidden">
        {/* Header */}
        <div className="flex-shrink-0 px-6 py-4 border-b border-white/20 bg-gradient-to-r from-indigo-500/10 to-purple-500/10">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 flex items-center justify-center text-white">
                <Icon name={exportType === "IMAGE" ? "image" : "scene"} className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-lg font-bold text-zinc-900">Export Prompt</h2>
                <p className="text-xs text-zinc-500">{node.title}</p>
              </div>
            </div>
            
            {/* Export Type Toggle */}
            <div className="flex items-center gap-2">
              <div className="flex bg-white/40 rounded-xl p-1">
                <button
                  onClick={() => setExportType("IMAGE")}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                    exportType === "IMAGE"
                      ? "bg-gradient-to-r from-indigo-600 to-purple-600 text-white shadow-lg"
                      : "text-zinc-600 hover:bg-white/50"
                  }`}
                >
                  <Icon name="image" className="h-4 w-4" />
                  Image
                </button>
                <button
                  onClick={() => setExportType("VIDEO")}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-all flex items-center gap-2 ${
                    exportType === "VIDEO"
                      ? "bg-gradient-to-r from-rose-600 to-orange-600 text-white shadow-lg"
                      : "text-zinc-600 hover:bg-white/50"
                  }`}
                >
                  <Icon name="scene" className="h-4 w-4" />
                  Video
                </button>
              </div>
              
              <button onClick={onClose} className="p-2 rounded-xl hover:bg-white/40 transition-all">
                <Icon name="x" className="h-5 w-5 text-zinc-500" />
              </button>
            </div>
          </div>
          
          {/* Step Tabs */}
          <div className="flex gap-1 mt-4">
            {["setup", "characters", "cinematic", ...(exportType === "VIDEO" ? ["video"] : []), "preview"].map((step, i) => (
              <button
                key={step}
                onClick={() => setActiveStep(step as typeof activeStep)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all flex items-center gap-1.5 ${
                  activeStep === step
                    ? "bg-white text-zinc-900 shadow-lg"
                    : "text-zinc-600 hover:bg-white/50"
                }`}
              >
                <span className={`w-5 h-5 rounded-full flex items-center justify-center text-[10px] font-bold ${
                  activeStep === step ? "bg-indigo-600 text-white" : "bg-white/60"
                }`}>
                  {i + 1}
                </span>
                {step.charAt(0).toUpperCase() + step.slice(1)}
              </button>
            ))}
          </div>
        </div>
        
        {/* Content */}
        <div className="flex-1 overflow-hidden flex">
          {/* Left Panel - Editor */}
          <div className="flex-1 overflow-auto p-4">
            {activeStep === "setup" && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <Icon name="edit" className="h-4 w-4 text-indigo-600" />
                  Scene Setup
                </h3>
                
                {/* Scene Description */}
                <div>
                  <label className="text-xs font-semibold text-zinc-500 uppercase mb-1.5 block">Scene Description</label>
                  <textarea
                    value={sceneDescription}
                    onChange={(e) => setSceneDescription(e.target.value)}
                    placeholder="Describe what's happening in this scene..."
                    className="w-full px-3 py-2.5 rounded-xl bg-white/60 border border-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
                    rows={4}
                  />
                </div>
                
                {/* Dramatic Context */}
                <div className="grid grid-cols-2 gap-3">
                  <div>
                    <label className="text-xs font-semibold text-zinc-500 uppercase mb-1.5 block">Goal</label>
                    <input
                      type="text"
                      value={dramaticContext.goal}
                      onChange={(e) => setDramaticContext(prev => ({ ...prev, goal: e.target.value }))}
                      placeholder="What's the goal?"
                      className="w-full px-3 py-2 rounded-xl bg-white/60 border border-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-500 uppercase mb-1.5 block">Conflict</label>
                    <input
                      type="text"
                      value={dramaticContext.conflict}
                      onChange={(e) => setDramaticContext(prev => ({ ...prev, conflict: e.target.value }))}
                      placeholder="What's the conflict?"
                      className="w-full px-3 py-2 rounded-xl bg-white/60 border border-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-500 uppercase mb-1.5 block">Turn/Twist</label>
                    <input
                      type="text"
                      value={dramaticContext.turn}
                      onChange={(e) => setDramaticContext(prev => ({ ...prev, turn: e.target.value }))}
                      placeholder="Any twist?"
                      className="w-full px-3 py-2 rounded-xl bg-white/60 border border-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-500 uppercase mb-1.5 block">Mood</label>
                    <input
                      type="text"
                      value={dramaticContext.mood}
                      onChange={(e) => setDramaticContext(prev => ({ ...prev, mood: e.target.value }))}
                      placeholder="e.g., tense, hopeful..."
                      className="w-full px-3 py-2 rounded-xl bg-white/60 border border-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                    />
                  </div>
                </div>
                
                {/* Video: From Previous Shot */}
                {exportType === "VIDEO" && previousPrompts.length > 0 && (
                  <div className="p-3 rounded-xl bg-rose-50 border border-rose-200">
                    <label className="text-xs font-semibold text-rose-700 uppercase mb-2 flex items-center gap-1.5">
                      <Icon name="history" className="h-3.5 w-3.5" />
                      Continue From Previous Shot
                    </label>
                    <select
                      value={fromPromptId}
                      onChange={(e) => setFromPromptId(e.target.value)}
                      className="w-full px-3 py-2 rounded-lg bg-white border border-rose-200 text-sm focus:outline-none focus:ring-2 focus:ring-rose-500"
                    >
                      <option value="">Start fresh (no continuity)</option>
                      {previousPrompts.map(p => (
                        <option key={p._id} value={p._id}>
                          #{p.timelineOrder} - {p.title}
                        </option>
                      ))}
                    </select>
                    <p className="text-[10px] text-rose-600 mt-1">
                      Selecting a previous shot helps maintain visual continuity
                    </p>
                  </div>
                )}
              </div>
            )}
            
            {activeStep === "characters" && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <Icon name="users" className="h-4 w-4 text-indigo-600" />
                  Characters & Locations
                </h3>
                
                {/* Characters */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-zinc-500 uppercase">Characters in Scene</label>
                    {availableCharacters.length > 0 && (
                      <select
                        onChange={(e) => {
                          const entity = availableCharacters.find(c => c._id === e.target.value);
                          if (entity) {
                            setCharacters(prev => [...prev, {
                              entityId: entity._id,
                              name: entity.name,
                              appearance: entity.character?.appearance || entity.summary,
                            }]);
                          }
                          e.target.value = "";
                        }}
                        className="px-2 py-1 rounded-lg bg-white/60 border border-white/40 text-xs focus:outline-none"
                        defaultValue=""
                      >
                        <option value="" disabled>+ Add Character</option>
                        {availableCharacters.map(c => (
                          <option key={c._id} value={c._id}>{c.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  
                  {characters.length === 0 ? (
                    <div className="p-4 rounded-xl bg-white/30 text-center text-zinc-500 text-sm">
                      No characters added. Add characters from your entities.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {characters.map((char, i) => (
                        <CharacterEditorCard
                          key={char.entityId}
                          character={char}
                          onChange={(updated) => {
                            setCharacters(prev => prev.map((c, j) => j === i ? updated : c));
                          }}
                          onRemove={() => {
                            setCharacters(prev => prev.filter((_, j) => j !== i));
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
                
                {/* Locations */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-zinc-500 uppercase">Locations</label>
                    {availableLocations.length > 0 && (
                      <select
                        onChange={(e) => {
                          const entity = availableLocations.find(l => l._id === e.target.value);
                          if (entity) {
                            setLocations(prev => [...prev, {
                              entityId: entity._id,
                              name: entity.name,
                              description: entity.summary,
                            }]);
                          }
                          e.target.value = "";
                        }}
                        className="px-2 py-1 rounded-lg bg-white/60 border border-white/40 text-xs focus:outline-none"
                        defaultValue=""
                      >
                        <option value="" disabled>+ Add Location</option>
                        {availableLocations.map(l => (
                          <option key={l._id} value={l._id}>{l.name}</option>
                        ))}
                      </select>
                    )}
                  </div>
                  
                  {locations.length === 0 ? (
                    <div className="p-4 rounded-xl bg-white/30 text-center text-zinc-500 text-sm">
                      No locations added. Add locations from your entities.
                    </div>
                  ) : (
                    <div className="space-y-2">
                      {locations.map((loc, i) => (
                        <LocationEditorCard
                          key={loc.entityId}
                          location={loc}
                          onChange={(updated) => {
                            setLocations(prev => prev.map((l, j) => j === i ? updated : l));
                          }}
                          onRemove={() => {
                            setLocations(prev => prev.filter((_, j) => j !== i));
                          }}
                        />
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
            
            {activeStep === "cinematic" && (
              <div className="h-full">
                <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2 mb-3">
                  <Icon name="camera" className="h-4 w-4 text-indigo-600" />
                  Cinematic Settings
                </h3>
                <div className="h-[calc(100%-2rem)] overflow-auto -mx-4 px-4">
                  <CinematicPromptBuilder
                    initialSelections={cinematicSettings}
                    onPromptGenerated={() => {}}
                    compact
                  />
                </div>
              </div>
            )}
            
            {activeStep === "video" && exportType === "VIDEO" && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <Icon name="scene" className="h-4 w-4 text-rose-600" />
                  Camera Motion
                </h3>
                
                {/* Video Presets */}
                <div>
                  <label className="text-xs font-semibold text-zinc-500 uppercase mb-2 block">Quick Presets</label>
                  <div className="grid grid-cols-4 gap-2">
                    {VIDEO_PRESETS.map(preset => (
                      <VideoPresetButton
                        key={preset.id}
                        preset={preset}
                        selected={activeVideoPreset === preset.id}
                        onClick={() => applyVideoPreset(preset.id)}
                      />
                    ))}
                  </div>
                </div>
                
                {/* Motion Type */}
                <div>
                  <label className="text-xs font-semibold text-zinc-500 uppercase mb-2 block">Motion Type</label>
                  <CompactIconSelector
                    options={MOTION_TYPE_OPTIONS}
                    value={videoSettings.motionType}
                    onChange={(v) => {
                      setVideoSettings(prev => ({ ...prev, motionType: v as VideoMotionSettings["motionType"] }));
                      setActiveVideoPreset("");
                    }}
                    columns={4}
                  />
                </div>
                
                {/* Direction */}
                {videoSettings.motionType !== "STATIC" && (
                  <div>
                    <label className="text-xs font-semibold text-zinc-500 uppercase mb-2 block">Direction</label>
                    <CompactIconSelector
                      options={MOTION_DIRECTION_OPTIONS}
                      value={videoSettings.motionDirection || ""}
                      onChange={(v) => setVideoSettings(prev => ({ ...prev, motionDirection: v as VideoMotionSettings["motionDirection"] }))}
                      columns={4}
                    />
                  </div>
                )}
                
                {/* Speed & Intensity */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-xs font-semibold text-zinc-500 uppercase mb-2 block">Speed</label>
                    <CompactIconSelector
                      options={MOTION_SPEED_OPTIONS}
                      value={videoSettings.motionSpeed}
                      onChange={(v) => setVideoSettings(prev => ({ ...prev, motionSpeed: v as VideoMotionSettings["motionSpeed"] }))}
                      columns={3}
                    />
                  </div>
                  <div>
                    <label className="text-xs font-semibold text-zinc-500 uppercase mb-2 block">Intensity</label>
                    <CompactIconSelector
                      options={MOTION_INTENSITY_OPTIONS}
                      value={videoSettings.motionIntensity}
                      onChange={(v) => setVideoSettings(prev => ({ ...prev, motionIntensity: v as VideoMotionSettings["motionIntensity"] }))}
                      columns={3}
                    />
                  </div>
                </div>
                
                {/* Transition */}
                <div>
                  <label className="text-xs font-semibold text-zinc-500 uppercase mb-2 block">Transition (from previous)</label>
                  <CompactIconSelector
                    options={TRANSITION_OPTIONS}
                    value={videoSettings.transitionType || ""}
                    onChange={(v) => setVideoSettings(prev => ({ ...prev, transitionType: v as VideoMotionSettings["transitionType"] }))}
                    columns={5}
                  />
                </div>
              </div>
            )}
            
            {activeStep === "preview" && (
              <div className="space-y-4">
                <h3 className="text-sm font-bold text-zinc-900 flex items-center gap-2">
                  <Icon name="eye" className="h-4 w-4 text-indigo-600" />
                  Final Preview
                </h3>
                
                {/* Final Prompt */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="text-xs font-semibold text-zinc-500 uppercase">Generated Prompt</label>
                    <button
                      onClick={copyPrompt}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-white/60 hover:bg-white text-xs font-medium text-zinc-700 transition-all"
                    >
                      <Icon name={copied ? "check" : "copy"} className="h-3.5 w-3.5" />
                      {copied ? "Copied!" : "Copy"}
                    </button>
                  </div>
                  <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200">
                    <p className="text-sm text-zinc-800 leading-relaxed whitespace-pre-wrap">{finalPrompt}</p>
                  </div>
                </div>
                
                {/* Negative Prompt */}
                <div>
                  <label className="text-xs font-semibold text-zinc-500 uppercase mb-2 block">Negative Prompt</label>
                  <div className="p-3 rounded-xl bg-red-50 border border-red-200">
                    <p className="text-xs text-red-700">{negativePrompt}</p>
                  </div>
                </div>
                
                {/* Continuity Tags */}
                <div>
                  <label className="text-xs font-semibold text-zinc-500 uppercase mb-2 block">Continuity Tags</label>
                  <div className="flex flex-wrap gap-1.5">
                    {continuityTags.map(tag => (
                      <span key={tag} className="px-2 py-1 rounded-lg bg-emerald-100 text-emerald-700 text-[10px] font-medium">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
                
                {/* Save Options */}
                <div className="p-3 rounded-xl bg-white/50 border border-white/40 space-y-2">
                  <label className="text-xs font-semibold text-zinc-500 uppercase block">Save To</label>
                  <div className="flex gap-4">
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={saveToGallery}
                        onChange={(e) => setSaveToGallery(e.target.checked)}
                        className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-zinc-700">Gallery</span>
                    </label>
                    <label className="flex items-center gap-2 cursor-pointer">
                      <input
                        type="checkbox"
                        checked={saveToStory}
                        onChange={(e) => setSaveToStory(e.target.checked)}
                        className="rounded border-zinc-300 text-indigo-600 focus:ring-indigo-500"
                      />
                      <span className="text-sm text-zinc-700">Story Timeline</span>
                    </label>
                  </div>
                </div>
              </div>
            )}
          </div>
          
          {/* Right Panel - Live Preview */}
          <div className="w-80 flex-shrink-0 border-l border-white/20 p-4 bg-gradient-to-br from-zinc-900 to-zinc-800 text-white overflow-auto">
            <h4 className="text-xs font-semibold text-zinc-400 uppercase mb-3">Live Preview</h4>
            
            {/* Scene Info */}
            <div className="mb-4 p-3 rounded-xl bg-white/10">
              <div className="text-xs text-zinc-400 mb-1">Scene</div>
              <div className="text-sm font-medium">{node.title}</div>
            </div>
            
            {/* Characters Count */}
            <div className="flex gap-2 mb-4">
              <div className="flex-1 p-2 rounded-xl bg-indigo-500/20 text-center">
                <div className="text-lg font-bold text-indigo-400">{characters.length}</div>
                <div className="text-[10px] text-indigo-300 uppercase">Characters</div>
              </div>
              <div className="flex-1 p-2 rounded-xl bg-emerald-500/20 text-center">
                <div className="text-lg font-bold text-emerald-400">{locations.length}</div>
                <div className="text-[10px] text-emerald-300 uppercase">Locations</div>
              </div>
            </div>
            
            {/* Export Type Badge */}
            <div className={`mb-4 p-3 rounded-xl ${
              exportType === "IMAGE" 
                ? "bg-gradient-to-r from-indigo-500/20 to-purple-500/20" 
                : "bg-gradient-to-r from-rose-500/20 to-orange-500/20"
            }`}>
              <div className="flex items-center gap-2">
                <Icon name={exportType === "IMAGE" ? "image" : "scene"} className="h-5 w-5" />
                <span className="font-semibold">{exportType} Export</span>
              </div>
              {exportType === "VIDEO" && videoSettings.motionType !== "STATIC" && (
                <div className="mt-2 text-xs text-zinc-300">
                  {MOTION_TYPE_OPTIONS.find(m => m.value === videoSettings.motionType)?.label}
                  {videoSettings.motionDirection && ` → ${videoSettings.motionDirection}`}
                </div>
              )}
            </div>
            
            {/* Prompt Preview */}
            <div>
              <div className="text-xs text-zinc-400 uppercase mb-2">Prompt Preview</div>
              <div className="p-3 rounded-xl bg-white/5 max-h-[300px] overflow-auto">
                <p className="text-xs text-zinc-300 leading-relaxed">
                  {finalPrompt.slice(0, 500)}{finalPrompt.length > 500 ? "..." : ""}
                </p>
              </div>
            </div>
          </div>
        </div>
        
        {/* Footer */}
        <div className="flex-shrink-0 px-6 py-4 border-t border-white/20 bg-white/50 flex items-center justify-between">
          <div className="flex items-center gap-2">
            {activeStep !== "setup" && (
              <button
                onClick={() => {
                  const steps = ["setup", "characters", "cinematic", ...(exportType === "VIDEO" ? ["video"] : []), "preview"];
                  const currentIndex = steps.indexOf(activeStep);
                  if (currentIndex > 0) {
                    setActiveStep(steps[currentIndex - 1] as typeof activeStep);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-white/60 text-zinc-700 font-medium hover:bg-white transition-all flex items-center gap-2"
              >
                <Icon name="chevronLeft" className="h-4 w-4" />
                Back
              </button>
            )}
          </div>
          
          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-2 rounded-xl bg-white/60 text-zinc-700 font-medium hover:bg-white transition-all"
            >
              Cancel
            </button>
            
            {activeStep !== "preview" ? (
              <button
                onClick={() => {
                  const steps = ["setup", "characters", "cinematic", ...(exportType === "VIDEO" ? ["video"] : []), "preview"];
                  const currentIndex = steps.indexOf(activeStep);
                  if (currentIndex < steps.length - 1) {
                    setActiveStep(steps[currentIndex + 1] as typeof activeStep);
                  }
                }}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 text-white font-medium hover:scale-105 transition-all flex items-center gap-2"
              >
                Next
                <Icon name="chevronRight" className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleExport}
                disabled={exporting}
                className={`px-6 py-2.5 rounded-xl font-semibold transition-all flex items-center gap-2 ${
                  exportType === "IMAGE"
                    ? "bg-gradient-to-r from-indigo-600 to-purple-600 hover:scale-105"
                    : "bg-gradient-to-r from-rose-600 to-orange-600 hover:scale-105"
                } text-white disabled:opacity-50 disabled:hover:scale-100`}
              >
                {exporting ? (
                  <>
                    <Icon name="clock" className="h-4 w-4 animate-spin" />
                    Exporting...
                  </>
                ) : (
                  <>
                    <Icon name="check" className="h-4 w-4" />
                    Export & Save
                  </>
                )}
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default PromptExportModal;
