"use client";

import { useState, useEffect } from "react";
import { Icon, type IconName } from "@/lib/ui";
import type { StoryNode, StoryNodeCinematicSettings } from "@/lib/models";
import { IconOption } from "@/components/GlassCard";
import {
  MOOD_OPTIONS,
  PACING_OPTIONS,
  FOCUS_OPTIONS,
  DRAMATIC_GOAL_OPTIONS,
  CONFLICT_OPTIONS,
  TURN_OPTIONS,
} from "@/lib/storyGraphIcons";
import {
  SHOT_ANGLE_OPTIONS,
  SHOT_FRAMING_OPTIONS,
  FOCUS_DEPTH_OPTIONS,
  LIGHTING_TYPE_OPTIONS,
  LIGHTING_DIRECTION_OPTIONS,
  LIGHTING_QUALITY_OPTIONS,
  CAMERA_TYPE_OPTIONS,
  LENS_OPTIONS,
  FILM_GRAIN_OPTIONS,
  COLOR_PALETTE_OPTIONS,
  TIME_OF_DAY_OPTIONS,
  WEATHER_OPTIONS,
  LOCATION_TYPE_OPTIONS,
  VISUAL_STYLE_OPTIONS,
  SUBJECT_EXPRESSION_OPTIONS,
  SUBJECT_POSE_OPTIONS,
  ATMOSPHERE_OPTIONS,
  IMPERFECTION_OPTIONS,
  type CinematicOption,
} from "@/lib/cinematicPromptOptions";

type ScenePreviewModalProps = {
  node: StoryNode;
  prompt: string;
  onClose: () => void;
  onUpdate: (nodeId: string, data: Partial<StoryNode>) => Promise<void>;
  saving?: boolean;
};

// Compact Icon Selector for cinematic options with highlighting support
function CompactSelector({ 
  options, 
  value, 
  onChange, 
  columns = 4,
  highlightKey,
  onHighlight,
}: { 
  options: CinematicOption[]; 
  value: string; 
  onChange: (v: string) => void; 
  columns?: number;
  highlightKey?: string;
  onHighlight?: (key: string | null) => void;
}) {
  return (
    <div 
      className="grid gap-1.5" 
      style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}
      onMouseEnter={() => onHighlight?.(highlightKey || null)}
      onMouseLeave={() => onHighlight?.(null)}
    >
      {options.map((opt) => (
        <button
          key={opt.value}
          onClick={() => onChange(value === opt.value ? "" : opt.value)}
          title={opt.promptText}
          className={`group relative flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
            value === opt.value
              ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg scale-105"
              : "bg-white/40 hover:bg-white/70 text-zinc-700 hover:scale-105"
          }`}
        >
          <Icon name={opt.icon as IconName} className="h-4 w-4 mb-0.5" />
          <span className="text-[9px] font-medium truncate w-full text-center leading-tight">{opt.label}</span>
          {value === opt.value && (
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
              <Icon name="check" className="h-2 w-2 text-white" />
            </div>
          )}
        </button>
      ))}
    </div>
  );
}

export function ScenePreviewModal({
  node,
  prompt,
  onClose,
  onUpdate,
  saving = false,
}: ScenePreviewModalProps) {
  // Story props selections (for icon-based UI)
  const [selectedMood, setSelectedMood] = useState<string>("");
  const [selectedPacing, setSelectedPacing] = useState<string>("");
  const [selectedFocus, setSelectedFocus] = useState<string>("");
  const [selectedGoal, setSelectedGoal] = useState<string>("");
  const [selectedConflict, setSelectedConflict] = useState<string>("");
  const [selectedTurn, setSelectedTurn] = useState<string>("");
  
  const [editedNode, setEditedNode] = useState<Partial<StoryNode>>({
    title: node.title,
    synopsis: node.synopsis,
    goals: { ...node.goals },
    hooks: { ...node.hooks },
  });
  const [editedSettings, setEditedSettings] = useState<StoryNodeCinematicSettings>(
    node.cinematicSettings || {}
  );
  const [activeSection, setActiveSection] = useState<'overview' | 'cinematic' | 'prompt'>('overview');
  const [hasChanges, setHasChanges] = useState(false);
  const [highlightedPromptSection, setHighlightedPromptSection] = useState<string | null>(null);

  // Build live prompt from selections
  const buildLivePrompt = () => {
    const parts: { key: string; text: string }[] = [];
    
    // Story props
    if (editedNode.goals?.dramaticGoal) {
      parts.push({ key: 'dramaticGoal', text: `Dramatic goal: ${editedNode.goals.dramaticGoal}` });
    }
    if (editedNode.goals?.conflict) {
      parts.push({ key: 'conflict', text: `Conflict: ${editedNode.goals.conflict}` });
    }
    if (editedNode.goals?.turn) {
      parts.push({ key: 'turn', text: `Turn: ${editedNode.goals.turn}` });
    }
    if (editedNode.hooks?.hook) {
      parts.push({ key: 'hook', text: `Hook: ${editedNode.hooks.hook}` });
    }
    
    // Cinematic settings
    if (editedSettings.shotAngle) parts.push({ key: 'shotAngle', text: editedSettings.shotAngle });
    if (editedSettings.shotFraming) parts.push({ key: 'shotFraming', text: `${editedSettings.shotFraming} shot` });
    if (editedSettings.cameraType) parts.push({ key: 'cameraType', text: `shot on ${editedSettings.cameraType}` });
    if (editedSettings.lens) parts.push({ key: 'lens', text: `${editedSettings.lens} lens` });
    if (editedSettings.focusDepth) parts.push({ key: 'focusDepth', text: `${editedSettings.focusDepth} depth of field` });
    if (editedSettings.lightingType) parts.push({ key: 'lightingType', text: editedSettings.lightingType });
    if (editedSettings.lightingDirection) parts.push({ key: 'lightingDirection', text: `${editedSettings.lightingDirection} lighting` });
    if (editedSettings.lightingQuality) parts.push({ key: 'lightingQuality', text: `${editedSettings.lightingQuality} light` });
    if (editedSettings.timeOfDay) parts.push({ key: 'timeOfDay', text: editedSettings.timeOfDay });
    if (editedSettings.weather) parts.push({ key: 'weather', text: `${editedSettings.weather} weather` });
    if (editedSettings.colorPalette) parts.push({ key: 'colorPalette', text: `${editedSettings.colorPalette} color palette` });
    if (editedSettings.atmosphere) parts.push({ key: 'atmosphere', text: `${editedSettings.atmosphere} atmosphere` });
    if (editedSettings.filmGrain) parts.push({ key: 'filmGrain', text: editedSettings.filmGrain });
    if (editedSettings.visualStyle) parts.push({ key: 'visualStyle', text: `${editedSettings.visualStyle} style` });
    if (editedSettings.imperfection) parts.push({ key: 'imperfection', text: editedSettings.imperfection });
    
    return parts;
  };
  
  const livePromptParts = buildLivePrompt();

  // Initialize selections from node data
  useEffect(() => {
    setEditedNode({
      title: node.title,
      synopsis: node.synopsis,
      goals: { ...node.goals },
      hooks: { ...node.hooks },
    });
    setEditedSettings(node.cinematicSettings || {});
    
    // Try to match existing values to presets
    if (node.goals?.dramaticGoal) {
      const match = DRAMATIC_GOAL_OPTIONS.find(o => 
        node.goals?.dramaticGoal?.toLowerCase().includes(o.value.toLowerCase())
      );
      if (match) setSelectedGoal(match.value);
    }
    if (node.goals?.conflict) {
      const match = CONFLICT_OPTIONS.find(o => 
        node.goals?.conflict?.toLowerCase().includes(o.value.toLowerCase())
      );
      if (match) setSelectedConflict(match.value);
    }
    if (node.goals?.turn) {
      const match = TURN_OPTIONS.find(o => 
        node.goals?.turn?.toLowerCase().includes(o.value.toLowerCase())
      );
      if (match) setSelectedTurn(match.value);
    }
  }, [node]);

  const handleSave = async () => {
    await onUpdate(node._id, {
      ...editedNode,
      cinematicSettings: editedSettings,
    });
    setHasChanges(false);
  };

  const updateField = (field: string, value: any) => {
    setEditedNode(prev => ({ ...prev, [field]: value }));
    setHasChanges(true);
  };

  const updateGoals = (field: string, value: string) => {
    setEditedNode(prev => ({
      ...prev,
      goals: { ...prev.goals, [field]: value } as any,
    }));
    setHasChanges(true);
  };

  const updateHooks = (field: string, value: string) => {
    setEditedNode(prev => ({
      ...prev,
      hooks: { ...prev.hooks, [field]: value } as any,
    }));
    setHasChanges(true);
  };

  const updateSetting = (key: string, value: string) => {
    setEditedSettings(prev => ({ ...prev, [key]: value }));
    setHasChanges(true);
  };

  const activeVersion = node.versionHistory?.versions.find(
    v => v.versionNumber === node.versionHistory?.activeVersionNumber
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 p-4 backdrop-blur-sm">
      <div className="w-full max-w-6xl max-h-[90vh] overflow-hidden rounded-3xl bg-white/95 backdrop-blur-xl shadow-2xl border border-white/50">
        {/* Header */}
        <div className="flex items-center justify-between p-4 border-b border-zinc-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
              <Icon name="eye" className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-xl font-bold text-zinc-900">Scene Preview</h2>
              <p className="text-sm text-zinc-500">{node.title}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {hasChanges && (
              <button
                onClick={handleSave}
                disabled={saving}
                className="px-4 py-2 rounded-xl bg-gradient-to-r from-emerald-500 to-teal-500 text-white font-medium shadow-lg hover:scale-[1.02] transition-all disabled:opacity-50 flex items-center gap-2"
              >
                <Icon name="save" className="h-4 w-4" />
                {saving ? 'Saving...' : 'Save Changes'}
              </button>
            )}
            <button
              onClick={onClose}
              className="p-2 rounded-xl hover:bg-zinc-100 transition-all"
            >
              <Icon name="x" className="h-5 w-5 text-zinc-500" />
            </button>
          </div>
        </div>

        {/* Tab Navigation */}
        <div className="flex items-center gap-1 p-2 bg-zinc-50 border-b border-zinc-200">
          <button
            onClick={() => setActiveSection('overview')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeSection === 'overview'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-zinc-600 hover:bg-white/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon name="file" className="h-4 w-4" />
              Overview
            </div>
          </button>
          <button
            onClick={() => setActiveSection('cinematic')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeSection === 'cinematic'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-zinc-600 hover:bg-white/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon name="camera" className="h-4 w-4" />
              Cinematic Settings
            </div>
          </button>
          <button
            onClick={() => setActiveSection('prompt')}
            className={`px-4 py-2 rounded-lg text-sm font-medium transition-all ${
              activeSection === 'prompt'
                ? 'bg-white text-indigo-600 shadow-sm'
                : 'text-zinc-600 hover:bg-white/50'
            }`}
          >
            <div className="flex items-center gap-2">
              <Icon name="sparkles" className="h-4 w-4" />
              Output Prompt
            </div>
          </button>
        </div>

        {/* Main Layout: Content + Persistent Prompt Preview */}
        <div className="flex flex-col" style={{ height: 'calc(90vh - 120px)' }}>
          {/* Content Area */}
          <div className="flex-1 overflow-auto p-6">
          {activeSection === 'overview' && (
            <div className="grid grid-cols-2 gap-6">
              {/* Left Column - Images & Basic Info */}
              <div className="space-y-4">
                {/* Thumbnail */}
                {node.thumbnail?.url && (
                  <div className="rounded-2xl overflow-hidden shadow-lg">
                    <img 
                      src={node.thumbnail.url} 
                      alt="Scene thumbnail" 
                      className="w-full aspect-video object-cover"
                    />
                  </div>
                )}

                {/* Frame Images */}
                {activeVersion && (activeVersion.firstFrame || activeVersion.lastFrame) && (
                  <div className="grid grid-cols-2 gap-3">
                    {activeVersion.firstFrame && (
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-zinc-500 uppercase">First Frame</label>
                        <img 
                          src={activeVersion.firstFrame.url} 
                          alt="First frame" 
                          className="w-full rounded-xl object-cover aspect-video"
                        />
                      </div>
                    )}
                    {activeVersion.lastFrame && (
                      <div className="space-y-1">
                        <label className="text-xs font-semibold text-zinc-500 uppercase">Last Frame</label>
                        <img 
                          src={activeVersion.lastFrame.url} 
                          alt="Last frame" 
                          className="w-full rounded-xl object-cover aspect-video"
                        />
                      </div>
                    )}
                  </div>
                )}

                {/* Version Info */}
                {activeVersion && (
                  <div className="p-4 rounded-xl bg-violet-50 border border-violet-200">
                    <div className="flex items-center gap-2 mb-2">
                      <Icon name="layers" className="h-4 w-4 text-violet-600" />
                      <span className="font-semibold text-violet-700">Active Version {activeVersion.versionNumber}</span>
                    </div>
                    <p className="text-xs text-violet-600">
                      Created: {new Date(activeVersion.createdAt).toLocaleString()}
                    </p>
                  </div>
                )}

                {/* Prompt Gallery */}
                <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-200">
                  <div className="flex items-center justify-between mb-3">
                    <h4 className="font-semibold text-emerald-900 flex items-center gap-2">
                      <Icon name="sparkles" className="h-4 w-4" />
                      Prompt Gallery
                    </h4>
                    <span className="text-[10px] text-emerald-600 bg-emerald-100 px-2 py-1 rounded-full font-medium">
                      Public Prompts
                    </span>
                  </div>
                  
                  {/* Sample Prompts - These would be fetched from a gallery API */}
                  <div className="space-y-2">
                    <button 
                      className="w-full p-3 rounded-xl bg-white/70 hover:bg-white border border-emerald-100 text-left transition-all group"
                      onClick={() => {
                        const samplePrompt = "Cinematic still, dramatic lighting, shallow depth of field, ARRI Alexa camera, anamorphic lens flares, film grain texture";
                        navigator.clipboard.writeText(samplePrompt);
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <Icon name="scene" className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-zinc-700">Cinematic Drama</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-2">Dramatic lighting, shallow DoF, anamorphic lens...</p>
                        </div>
                        <Icon name="copy" className="h-3 w-3 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                      </div>
                    </button>
                    
                    <button 
                      className="w-full p-3 rounded-xl bg-white/70 hover:bg-white border border-emerald-100 text-left transition-all group"
                      onClick={() => {
                        const samplePrompt = "Documentary style, natural lighting, handheld camera movement, 35mm film stock, raw and authentic feel";
                        navigator.clipboard.writeText(samplePrompt);
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <Icon name="camera" className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-zinc-700">Documentary Feel</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-2">Natural lighting, handheld, 35mm film stock...</p>
                        </div>
                        <Icon name="copy" className="h-3 w-3 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                      </div>
                    </button>
                    
                    <button 
                      className="w-full p-3 rounded-xl bg-white/70 hover:bg-white border border-emerald-100 text-left transition-all group"
                      onClick={() => {
                        const samplePrompt = "Noir aesthetic, high contrast black and white, venetian blind shadows, low-key lighting, mysterious atmosphere";
                        navigator.clipboard.writeText(samplePrompt);
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <Icon name="eye" className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-zinc-700">Film Noir</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-2">High contrast B&W, venetian blind shadows...</p>
                        </div>
                        <Icon name="copy" className="h-3 w-3 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                      </div>
                    </button>
                    
                    <button 
                      className="w-full p-3 rounded-xl bg-white/70 hover:bg-white border border-emerald-100 text-left transition-all group"
                      onClick={() => {
                        const samplePrompt = "Golden hour magic, warm sunset tones, backlit subjects, lens flare, ethereal glow, romantic atmosphere";
                        navigator.clipboard.writeText(samplePrompt);
                      }}
                    >
                      <div className="flex items-start gap-2">
                        <Icon name="star" className="h-4 w-4 text-emerald-600 mt-0.5 flex-shrink-0" />
                        <div>
                          <p className="text-xs font-medium text-zinc-700">Golden Hour Magic</p>
                          <p className="text-[10px] text-zinc-500 mt-0.5 line-clamp-2">Warm sunset tones, backlit, ethereal glow...</p>
                        </div>
                        <Icon name="copy" className="h-3 w-3 text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity ml-auto" />
                      </div>
                    </button>
                  </div>
                  
                  <button className="w-full mt-3 py-2 text-xs font-medium text-emerald-700 hover:text-emerald-900 flex items-center justify-center gap-1 transition-colors">
                    <Icon name="plus" className="h-3 w-3" />
                    Browse More Prompts
                  </button>
                </div>
              </div>

              {/* Right Column - Icon-Based Selectors */}
              <div className="space-y-4">
                {/* Title */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-500 uppercase">Title</label>
                  <input
                    type="text"
                    value={editedNode.title || ''}
                    onChange={(e) => updateField('title', e.target.value)}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-900"
                  />
                </div>

                {/* Synopsis */}
                <div className="space-y-2">
                  <label className="text-xs font-semibold text-zinc-500 uppercase">Synopsis</label>
                  <textarea
                    value={editedNode.synopsis || ''}
                    onChange={(e) => updateField('synopsis', e.target.value)}
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl bg-white border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-900 resize-none"
                  />
                </div>

                {/* Dramatic Goal - Icon Selector + Editable */}
                <div 
                  className="space-y-2 p-3 rounded-xl transition-all hover:bg-indigo-50/50"
                  onMouseEnter={() => setHighlightedPromptSection('dramaticGoal')}
                  onMouseLeave={() => setHighlightedPromptSection(null)}
                >
                  <label className="text-xs font-semibold text-zinc-500 uppercase flex items-center gap-2">
                    <Icon name="target" className="h-3 w-3" />
                    Dramatic Goal
                    {highlightedPromptSection === 'dramaticGoal' && (
                      <span className="ml-auto text-[10px] text-indigo-600 bg-indigo-100 px-2 py-0.5 rounded-full">Highlighted in prompt</span>
                    )}
                  </label>
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {DRAMATIC_GOAL_OPTIONS.map((option) => (
                      <IconOption
                        key={option.value}
                        icon={<Icon name={option.icon as IconName} className="h-5 w-5" />}
                        label={option.label}
                        selected={selectedGoal === option.value}
                        onClick={() => {
                          const newVal = selectedGoal === option.value ? "" : option.value;
                          setSelectedGoal(newVal);
                          updateGoals('dramaticGoal', newVal ? option.description : "");
                        }}
                      />
                    ))}
                  </div>
                  <input
                    type="text"
                    value={editedNode.goals?.dramaticGoal || ''}
                    onChange={(e) => updateGoals('dramaticGoal', e.target.value)}
                    placeholder="Or type custom dramatic goal..."
                    className="w-full px-3 py-2 rounded-lg bg-white/80 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-sm text-zinc-900"
                  />
                </div>

                {/* Conflict - Icon Selector + Editable */}
                <div 
                  className="space-y-2 p-3 rounded-xl transition-all hover:bg-amber-50/50"
                  onMouseEnter={() => setHighlightedPromptSection('conflict')}
                  onMouseLeave={() => setHighlightedPromptSection(null)}
                >
                  <label className="text-xs font-semibold text-zinc-500 uppercase flex items-center gap-2">
                    <Icon name="warning" className="h-3 w-3" />
                    Conflict Type
                    {highlightedPromptSection === 'conflict' && (
                      <span className="ml-auto text-[10px] text-amber-600 bg-amber-100 px-2 py-0.5 rounded-full">Highlighted in prompt</span>
                    )}
                  </label>
                  <div className="grid grid-cols-3 gap-2 mb-2">
                    {CONFLICT_OPTIONS.map((option) => (
                      <IconOption
                        key={option.value}
                        icon={<Icon name={option.icon as IconName} className="h-5 w-5" />}
                        label={option.label}
                        selected={selectedConflict === option.value}
                        onClick={() => {
                          const newVal = selectedConflict === option.value ? "" : option.value;
                          setSelectedConflict(newVal);
                          updateGoals('conflict', newVal ? option.description : "");
                        }}
                      />
                    ))}
                  </div>
                  <input
                    type="text"
                    value={editedNode.goals?.conflict || ''}
                    onChange={(e) => updateGoals('conflict', e.target.value)}
                    placeholder="Or type custom conflict..."
                    className="w-full px-3 py-2 rounded-lg bg-white/80 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-amber-500 text-sm text-zinc-900"
                  />
                </div>

                {/* Turn - Icon Selector + Editable */}
                <div 
                  className="space-y-2 p-3 rounded-xl transition-all hover:bg-purple-50/50"
                  onMouseEnter={() => setHighlightedPromptSection('turn')}
                  onMouseLeave={() => setHighlightedPromptSection(null)}
                >
                  <label className="text-xs font-semibold text-zinc-500 uppercase flex items-center gap-2">
                    <Icon name="wand" className="h-3 w-3" />
                    Story Turn
                    {highlightedPromptSection === 'turn' && (
                      <span className="ml-auto text-[10px] text-purple-600 bg-purple-100 px-2 py-0.5 rounded-full">Highlighted in prompt</span>
                    )}
                  </label>
                  <div className="grid grid-cols-4 gap-2 mb-2">
                    {TURN_OPTIONS.map((option) => (
                      <IconOption
                        key={option.value}
                        icon={<Icon name={option.icon as IconName} className="h-5 w-5" />}
                        label={option.label}
                        selected={selectedTurn === option.value}
                        onClick={() => {
                          const newVal = selectedTurn === option.value ? "" : option.value;
                          setSelectedTurn(newVal);
                          updateGoals('turn', newVal ? option.description : "");
                        }}
                      />
                    ))}
                  </div>
                  <input
                    type="text"
                    value={editedNode.goals?.turn || ''}
                    onChange={(e) => updateGoals('turn', e.target.value)}
                    placeholder="Or type custom story turn..."
                    className="w-full px-3 py-2 rounded-lg bg-white/80 border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-purple-500 text-sm text-zinc-900"
                  />
                </div>

                {/* Hook */}
                <div 
                  className="space-y-2 p-3 rounded-xl transition-all hover:bg-emerald-50/50"
                  onMouseEnter={() => setHighlightedPromptSection('hook')}
                  onMouseLeave={() => setHighlightedPromptSection(null)}
                >
                  <label className="text-xs font-semibold text-zinc-500 uppercase flex items-center gap-2">
                    <Icon name="star" className="h-3 w-3" />
                    Hook
                    {highlightedPromptSection === 'hook' && (
                      <span className="ml-auto text-[10px] text-emerald-600 bg-emerald-100 px-2 py-0.5 rounded-full">Highlighted in prompt</span>
                    )}
                  </label>
                  <input
                    type="text"
                    value={editedNode.hooks?.hook || ''}
                    onChange={(e) => updateHooks('hook', e.target.value)}
                    placeholder="What grabs the audience's attention?"
                    className="w-full px-4 py-3 rounded-xl bg-white border border-zinc-200 focus:outline-none focus:ring-2 focus:ring-indigo-500 text-zinc-900"
                  />
                </div>
              </div>
            </div>
          )}

          {activeSection === 'cinematic' && (
            <div className="space-y-6">
              {/* Camera & Composition */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-100">
                <h3 className="text-sm font-bold text-indigo-900 mb-3 flex items-center gap-2">
                  <Icon name="camera" className="h-4 w-4" />
                  Camera & Composition
                </h3>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase">Shot Angle</label>
                    <CompactSelector
                      options={SHOT_ANGLE_OPTIONS}
                      value={editedSettings.shotAngle || ''}
                      onChange={(v) => updateSetting('shotAngle', v)}
                      columns={3}
                      highlightKey="shotAngle"
                      onHighlight={setHighlightedPromptSection}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase">Shot Framing</label>
                    <CompactSelector
                      options={SHOT_FRAMING_OPTIONS}
                      value={editedSettings.shotFraming || ''}
                      onChange={(v) => updateSetting('shotFraming', v)}
                      columns={4}
                      highlightKey="shotFraming"
                      onHighlight={setHighlightedPromptSection}
                    />
                  </div>
                </div>
              </div>

              {/* Technical Settings */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-blue-50 to-cyan-50 border border-blue-100">
                <h3 className="text-sm font-bold text-blue-900 mb-3 flex items-center gap-2">
                  <Icon name="settings" className="h-4 w-4" />
                  Technical Settings
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase">Camera</label>
                    <CompactSelector
                      options={CAMERA_TYPE_OPTIONS}
                      value={editedSettings.cameraType || ''}
                      onChange={(v) => updateSetting('cameraType', v)}
                      columns={2}
                      highlightKey="cameraType"
                      onHighlight={setHighlightedPromptSection}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase">Lens</label>
                    <CompactSelector
                      options={LENS_OPTIONS}
                      value={editedSettings.lens || ''}
                      onChange={(v) => updateSetting('lens', v)}
                      columns={3}
                      highlightKey="lens"
                      onHighlight={setHighlightedPromptSection}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase">Focus Depth</label>
                    <CompactSelector
                      options={FOCUS_DEPTH_OPTIONS}
                      value={editedSettings.focusDepth || ''}
                      onChange={(v) => updateSetting('focusDepth', v)}
                      columns={2}
                      highlightKey="focusDepth"
                      onHighlight={setHighlightedPromptSection}
                    />
                  </div>
                </div>
              </div>

              {/* Lighting */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-amber-50 to-orange-50 border border-amber-100">
                <h3 className="text-sm font-bold text-amber-900 mb-3 flex items-center gap-2">
                  <Icon name="star" className="h-4 w-4" />
                  Lighting
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase">Type</label>
                    <CompactSelector
                      options={LIGHTING_TYPE_OPTIONS}
                      value={editedSettings.lightingType || ''}
                      onChange={(v) => updateSetting('lightingType', v)}
                      columns={2}
                      highlightKey="lightingType"
                      onHighlight={setHighlightedPromptSection}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase">Direction</label>
                    <CompactSelector
                      options={LIGHTING_DIRECTION_OPTIONS}
                      value={editedSettings.lightingDirection || ''}
                      onChange={(v) => updateSetting('lightingDirection', v)}
                      columns={2}
                      highlightKey="lightingDirection"
                      onHighlight={setHighlightedPromptSection}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase">Quality</label>
                    <CompactSelector
                      options={LIGHTING_QUALITY_OPTIONS}
                      value={editedSettings.lightingQuality || ''}
                      onChange={(v) => updateSetting('lightingQuality', v)}
                      columns={2}
                      highlightKey="lightingQuality"
                      onHighlight={setHighlightedPromptSection}
                    />
                  </div>
                </div>
              </div>

              {/* Environment & Style */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-emerald-50 to-teal-50 border border-emerald-100">
                <h3 className="text-sm font-bold text-emerald-900 mb-3 flex items-center gap-2">
                  <Icon name="world" className="h-4 w-4" />
                  Environment & Style
                </h3>
                <div className="grid grid-cols-4 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase">Time of Day</label>
                    <CompactSelector
                      options={TIME_OF_DAY_OPTIONS}
                      value={editedSettings.timeOfDay || ''}
                      onChange={(v) => updateSetting('timeOfDay', v)}
                      columns={2}
                      highlightKey="timeOfDay"
                      onHighlight={setHighlightedPromptSection}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase">Weather</label>
                    <CompactSelector
                      options={WEATHER_OPTIONS}
                      value={editedSettings.weather || ''}
                      onChange={(v) => updateSetting('weather', v)}
                      columns={2}
                      highlightKey="weather"
                      onHighlight={setHighlightedPromptSection}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase">Color Palette</label>
                    <CompactSelector
                      options={COLOR_PALETTE_OPTIONS}
                      value={editedSettings.colorPalette || ''}
                      onChange={(v) => updateSetting('colorPalette', v)}
                      columns={2}
                      highlightKey="colorPalette"
                      onHighlight={setHighlightedPromptSection}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase">Atmosphere</label>
                    <CompactSelector
                      options={ATMOSPHERE_OPTIONS}
                      value={editedSettings.atmosphere || ''}
                      onChange={(v) => updateSetting('atmosphere', v)}
                      columns={2}
                      highlightKey="atmosphere"
                      onHighlight={setHighlightedPromptSection}
                    />
                  </div>
                </div>
              </div>

              {/* Visual Effects */}
              <div className="p-4 rounded-2xl bg-gradient-to-br from-pink-50 to-rose-50 border border-pink-100">
                <h3 className="text-sm font-bold text-pink-900 mb-3 flex items-center gap-2">
                  <Icon name="sparkles" className="h-4 w-4" />
                  Visual Effects
                </h3>
                <div className="grid grid-cols-3 gap-4">
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase">Film Grain</label>
                    <CompactSelector
                      options={FILM_GRAIN_OPTIONS}
                      value={editedSettings.filmGrain || ''}
                      onChange={(v) => updateSetting('filmGrain', v)}
                      columns={2}
                      highlightKey="filmGrain"
                      onHighlight={setHighlightedPromptSection}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase">Visual Style</label>
                    <CompactSelector
                      options={VISUAL_STYLE_OPTIONS}
                      value={editedSettings.visualStyle || ''}
                      onChange={(v) => updateSetting('visualStyle', v)}
                      columns={2}
                      highlightKey="visualStyle"
                      onHighlight={setHighlightedPromptSection}
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-[10px] font-semibold text-zinc-500 uppercase">Imperfection</label>
                    <CompactSelector
                      options={IMPERFECTION_OPTIONS}
                      value={editedSettings.imperfection || ''}
                      onChange={(v) => updateSetting('imperfection', v)}
                      columns={2}
                      highlightKey="imperfection"
                      onHighlight={setHighlightedPromptSection}
                    />
                  </div>
                </div>
              </div>
            </div>
          )}

          {activeSection === 'prompt' && (
            <div className="space-y-4">
              {/* Current Generated Prompt */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <label className="text-xs font-semibold text-zinc-500 uppercase">Generated Prompt</label>
                  <button
                    onClick={() => navigator.clipboard.writeText(prompt || '')}
                    className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-xs text-zinc-600 transition-all"
                  >
                    <Icon name="copy" className="h-3 w-3" />
                    Copy
                  </button>
                </div>
                <div className="p-4 rounded-xl bg-gradient-to-br from-indigo-50 to-purple-50 border border-indigo-200">
                  <p className="text-sm text-zinc-700 whitespace-pre-wrap font-mono">
                    {prompt || 'No prompt generated yet. Go to the Cinematic tab to generate a prompt.'}
                  </p>
                </div>
              </div>

              {/* Version's Stored Prompt */}
              {activeVersion?.prompt && activeVersion.prompt !== prompt && (
                <div className="space-y-2">
                  <div className="flex items-center justify-between">
                    <label className="text-xs font-semibold text-zinc-500 uppercase">
                      Version {activeVersion.versionNumber} Stored Prompt
                    </label>
                    <button
                      onClick={() => navigator.clipboard.writeText(activeVersion.prompt || '')}
                      className="flex items-center gap-1 px-2 py-1 rounded-lg bg-zinc-100 hover:bg-zinc-200 text-xs text-zinc-600 transition-all"
                    >
                      <Icon name="copy" className="h-3 w-3" />
                      Copy
                    </button>
                  </div>
                  <div className="p-4 rounded-xl bg-amber-50 border border-amber-200">
                    <p className="text-sm text-zinc-700 whitespace-pre-wrap font-mono">
                      {activeVersion.prompt}
                    </p>
                  </div>
                  <p className="text-xs text-amber-600 flex items-center gap-1">
                    <Icon name="warning" className="h-3 w-3" />
                    The current prompt differs from this version's stored prompt
                  </p>
                </div>
              )}

              {/* Quick Reference */}
              <div className="p-4 rounded-xl bg-zinc-50 border border-zinc-200">
                <h4 className="font-semibold text-zinc-700 mb-3 flex items-center gap-2">
                  <Icon name="info" className="h-4 w-4" />
                  Quick Reference
                </h4>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <span className="text-zinc-500">Shot Framing:</span>
                    <span className="ml-2 text-zinc-700">{editedSettings.shotFraming || '-'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Camera:</span>
                    <span className="ml-2 text-zinc-700">{editedSettings.cameraType || '-'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Lighting:</span>
                    <span className="ml-2 text-zinc-700">{editedSettings.lightingType || '-'}</span>
                  </div>
                  <div>
                    <span className="text-zinc-500">Visual Style:</span>
                    <span className="ml-2 text-zinc-700">{editedSettings.visualStyle || '-'}</span>
                  </div>
                </div>
              </div>
            </div>
          )}
          </div>

          {/* Persistent Prompt Preview Panel - Always Visible */}
          <div className="border-t border-zinc-200 bg-gradient-to-r from-zinc-50 to-indigo-50/50 p-4">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-semibold text-zinc-800 flex items-center gap-2">
                <Icon name="sparkles" className="h-4 w-4 text-indigo-600" />
                Live Prompt Preview
              </h4>
              <button
                onClick={() => {
                  const fullPrompt = livePromptParts.map(p => p.text).join(', ');
                  navigator.clipboard.writeText(fullPrompt);
                }}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-indigo-100 hover:bg-indigo-200 text-xs font-medium text-indigo-700 transition-all"
              >
                <Icon name="copy" className="h-3 w-3" />
                Copy Prompt
              </button>
            </div>
            <div className="p-3 rounded-xl bg-white/80 border border-indigo-100 min-h-[60px] max-h-[100px] overflow-auto">
              {livePromptParts.length > 0 ? (
                <p className="text-sm text-zinc-700 font-mono leading-relaxed">
                  {livePromptParts.map((part, idx) => (
                    <span key={part.key}>
                      <span 
                        className={`transition-all duration-300 ${
                          highlightedPromptSection === part.key 
                            ? 'bg-yellow-200 text-yellow-900 px-1 rounded font-semibold' 
                            : ''
                        }`}
                      >
                        {part.text}
                      </span>
                      {idx < livePromptParts.length - 1 && <span className="text-zinc-400">, </span>}
                    </span>
                  ))}
                </p>
              ) : (
                <p className="text-sm text-zinc-400 italic">
                  Select options above to build your prompt...
                </p>
              )}
            </div>
            {livePromptParts.length > 0 && (
              <p className="text-[10px] text-zinc-500 mt-1 flex items-center gap-1">
                <Icon name="info" className="h-3 w-3" />
                {livePromptParts.length} elements in prompt • Hover options to see which part they affect
              </p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}

export default ScenePreviewModal;
