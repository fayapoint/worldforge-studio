"use client";

import { useState, useEffect, useMemo } from "react";
import { Icon, type IconName } from "@/lib/ui";
import { GlassCard, GlassButton } from "@/components/GlassCard";
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
  QUICK_PRESETS,
  buildCinematicPrompt,
  type CinematicOption,
  type QuickPreset,
} from "@/lib/cinematicPromptOptions";

// =====================================================
// TOOLTIP COMPONENT
// =====================================================
function Tooltip({ children, text }: { children: React.ReactNode; text: string }) {
  const [show, setShow] = useState(false);

  return (
    <div 
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
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
type CompactIconSelectorProps = {
  options: CinematicOption[];
  value: string;
  onChange: (value: string) => void;
  columns?: number;
};

function CompactIconSelector({ options, value, onChange, columns = 4 }: CompactIconSelectorProps) {
  return (
    <div className={`grid gap-1.5`} style={{ gridTemplateColumns: `repeat(${columns}, minmax(0, 1fr))` }}>
      {options.map((option) => (
        <Tooltip key={option.value} text={option.promptText}>
          <button
            onClick={() => onChange(value === option.value ? "" : option.value)}
            className={`group relative flex flex-col items-center justify-center p-2 rounded-xl transition-all ${
              value === option.value
                ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg scale-105"
                : "bg-white/40 hover:bg-white/70 text-zinc-700 hover:scale-105"
            }`}
          >
            <Icon name={option.icon as IconName} className="h-4 w-4 mb-0.5" />
            <span className="text-[9px] font-medium truncate w-full text-center leading-tight">{option.label}</span>
            {value === option.value && (
              <div className="absolute -top-1 -right-1 w-3 h-3 bg-green-500 rounded-full flex items-center justify-center">
                <Icon name="check" className="h-2 w-2 text-white" />
              </div>
            )}
          </button>
        </Tooltip>
      ))}
    </div>
  );
}

// =====================================================
// SECTION HEADER WITH COLLAPSE
// =====================================================
function SectionHeader({ 
  title, 
  icon, 
  expanded, 
  onToggle,
  hasSelection,
}: { 
  title: string; 
  icon: IconName; 
  expanded: boolean;
  onToggle: () => void;
  hasSelection?: boolean;
}) {
  return (
    <button
      onClick={onToggle}
      className="w-full flex items-center justify-between p-2 rounded-xl bg-white/30 hover:bg-white/50 transition-all"
    >
      <div className="flex items-center gap-2">
        <div className={`p-1.5 rounded-lg ${hasSelection ? 'bg-gradient-to-br from-indigo-600 to-purple-600 text-white' : 'bg-white/60 text-zinc-700'}`}>
          <Icon name={icon} className="h-3.5 w-3.5" />
        </div>
        <span className="font-semibold text-sm text-zinc-900">{title}</span>
        {hasSelection && (
          <span className="px-1.5 py-0.5 text-[9px] font-bold bg-green-500 text-white rounded-full">SET</span>
        )}
      </div>
      <Icon 
        name={expanded ? "chevronUp" : "chevronDown"} 
        className="h-4 w-4 text-zinc-500 transition-transform" 
      />
    </button>
  );
}

// =====================================================
// QUICK PRESET BUTTON
// =====================================================
function QuickPresetButton({ 
  preset, 
  selected,
  onClick 
}: { 
  preset: QuickPreset;
  selected: boolean;
  onClick: () => void;
}) {
  return (
    <Tooltip text={preset.tooltip}>
      <button
        onClick={onClick}
        className={`flex flex-col items-center justify-center p-3 rounded-xl transition-all ${
          selected
            ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg scale-105"
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
// MAIN CINEMATIC PROMPT BUILDER
// =====================================================
export type CinematicSelections = {
  shotAngle: string;
  shotFraming: string;
  focusDepth: string;
  lightingType: string;
  lightingDirection: string;
  lightingQuality: string;
  cameraType: string;
  lens: string;
  filmGrain: string;
  colorPalette: string;
  timeOfDay: string;
  weather: string;
  locationType: string;
  visualStyle: string;
  subjectExpression: string;
  subjectPose: string;
  atmosphere: string;
  imperfection: string;
};

type CinematicPromptBuilderProps = {
  nodeTitle?: string;
  nodeSynopsis?: string;
  nodeId?: string;
  onPromptGenerated?: (prompt: string) => void;
  onSelectionsChange?: (selections: CinematicSelections) => void;
  initialSelections?: Partial<CinematicSelections>;
  compact?: boolean;
};

export function CinematicPromptBuilder({
  nodeTitle,
  nodeSynopsis,
  nodeId,
  onPromptGenerated,
  onSelectionsChange,
  initialSelections,
  compact = false,
}: CinematicPromptBuilderProps) {
  // Selection state
  const [selections, setSelections] = useState<CinematicSelections>({
    shotAngle: "",
    shotFraming: "",
    focusDepth: "",
    lightingType: "",
    lightingDirection: "",
    lightingQuality: "",
    cameraType: "",
    lens: "",
    filmGrain: "",
    colorPalette: "",
    timeOfDay: "",
    weather: "",
    locationType: "",
    visualStyle: "",
    subjectExpression: "",
    subjectPose: "",
    atmosphere: "",
    imperfection: "",
  });

  // Reset selections when node changes
  useEffect(() => {
    setSelections({
      shotAngle: initialSelections?.shotAngle || "",
      shotFraming: initialSelections?.shotFraming || "",
      focusDepth: initialSelections?.focusDepth || "",
      lightingType: initialSelections?.lightingType || "",
      lightingDirection: initialSelections?.lightingDirection || "",
      lightingQuality: initialSelections?.lightingQuality || "",
      cameraType: initialSelections?.cameraType || "",
      lens: initialSelections?.lens || "",
      filmGrain: initialSelections?.filmGrain || "",
      colorPalette: initialSelections?.colorPalette || "",
      timeOfDay: initialSelections?.timeOfDay || "",
      weather: initialSelections?.weather || "",
      locationType: initialSelections?.locationType || "",
      visualStyle: initialSelections?.visualStyle || "",
      subjectExpression: initialSelections?.subjectExpression || "",
      subjectPose: initialSelections?.subjectPose || "",
      atmosphere: initialSelections?.atmosphere || "",
      imperfection: initialSelections?.imperfection || "",
    });
    setActivePreset("");
  }, [nodeId, initialSelections]);

  const [activePreset, setActivePreset] = useState<string>("");
  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(["quick-presets", "composition"]));
  const [copied, setCopied] = useState(false);

  // Generate prompt
  const generatedPrompt = useMemo(() => {
    let prompt = buildCinematicPrompt(selections);
    
    // Add node context if available
    if (nodeTitle || nodeSynopsis) {
      const context = [];
      if (nodeSynopsis) context.push(nodeSynopsis);
      if (nodeTitle) context.push(`scene: ${nodeTitle}`);
      if (context.length > 0) {
        prompt = context.join(", ") + (prompt ? ", " + prompt : "");
      }
    }
    
    return prompt;
  }, [selections, nodeTitle, nodeSynopsis]);

  // Notify parent of prompt changes
  useEffect(() => {
    if (onPromptGenerated) {
      onPromptGenerated(generatedPrompt);
    }
  }, [generatedPrompt, onPromptGenerated]);

  const updateSelection = (key: keyof CinematicSelections, value: string) => {
    const newSelections = { ...selections, [key]: value };
    setSelections(newSelections);
    setActivePreset(""); // Clear preset when manually selecting
    // Notify parent of changes for persistence
    if (onSelectionsChange) {
      onSelectionsChange(newSelections);
    }
  };

  const applyPreset = (presetId: string) => {
    const preset = QUICK_PRESETS.find(p => p.id === presetId);
    if (preset) {
      const newSelections = {
        ...selections,
        shotAngle: preset.selections.shotAngle || "",
        shotFraming: preset.selections.shotFraming || "",
        focusDepth: preset.selections.focusDepth || "",
        lightingType: preset.selections.lightingType || "",
        lightingDirection: preset.selections.lightingDirection || "",
        lightingQuality: preset.selections.lightingQuality || "",
        cameraType: preset.selections.cameraType || "",
        lens: preset.selections.lens || "",
        filmGrain: preset.selections.filmGrain || "",
        colorPalette: preset.selections.colorPalette || "",
        timeOfDay: preset.selections.timeOfDay || "",
        weather: preset.selections.weather || "",
        locationType: preset.selections.locationType || "",
        visualStyle: preset.selections.visualStyle || "",
        atmosphere: preset.selections.atmosphere || "",
        imperfection: preset.selections.imperfection || "",
      };
      setSelections(newSelections);
      setActivePreset(presetId);
      // Notify parent of changes for persistence
      if (onSelectionsChange) {
        onSelectionsChange(newSelections);
      }
    }
  };

  const clearAll = () => {
    const emptySelections = {
      shotAngle: "",
      shotFraming: "",
      focusDepth: "",
      lightingType: "",
      lightingDirection: "",
      lightingQuality: "",
      cameraType: "",
      lens: "",
      filmGrain: "",
      colorPalette: "",
      timeOfDay: "",
      weather: "",
      locationType: "",
      visualStyle: "",
      subjectExpression: "",
      subjectPose: "",
      atmosphere: "",
      imperfection: "",
    };
    setSelections(emptySelections);
    setActivePreset("");
    // Notify parent of changes for persistence
    if (onSelectionsChange) {
      onSelectionsChange(emptySelections);
    }
  };

  const copyPrompt = async () => {
    await navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const toggleSection = (section: string) => {
    setExpandedSections(prev => {
      const next = new Set(prev);
      if (next.has(section)) {
        next.delete(section);
      } else {
        next.add(section);
      }
      return next;
    });
  };

  const hasAnySelection = Object.values(selections).some(v => v !== "");
  const selectionCount = Object.values(selections).filter(v => v !== "").length;

  return (
    <div className="flex flex-col h-full">
      {/* Generated Prompt Output - Always Visible */}
      <div className="flex-shrink-0 p-3 border-b border-white/20 bg-gradient-to-br from-indigo-500/10 to-purple-500/10">
        <div className="flex items-center justify-between mb-2">
          <div className="flex items-center gap-2">
            <Icon name="image" className="h-4 w-4 text-indigo-600" />
            <span className="font-semibold text-sm text-zinc-900">Generated Prompt</span>
            {selectionCount > 0 && (
              <span className="px-2 py-0.5 text-[10px] font-bold bg-indigo-600 text-white rounded-full">
                {selectionCount} selected
              </span>
            )}
          </div>
          <div className="flex items-center gap-1">
            <button
              onClick={copyPrompt}
              className="p-1.5 rounded-lg bg-white/60 hover:bg-white text-zinc-700 transition-all"
              title="Copy prompt"
            >
              <Icon name={copied ? "check" : "copy"} className="h-3.5 w-3.5" />
            </button>
            {hasAnySelection && (
              <button
                onClick={clearAll}
                className="p-1.5 rounded-lg bg-red-100 hover:bg-red-200 text-red-600 transition-all"
                title="Clear all"
              >
                <Icon name="x" className="h-3.5 w-3.5" />
              </button>
            )}
          </div>
        </div>
        <div className="bg-white/60 rounded-xl p-3 min-h-[60px] max-h-[100px] overflow-auto">
          {generatedPrompt ? (
            <p className="text-xs text-zinc-700 leading-relaxed">{generatedPrompt}</p>
          ) : (
            <p className="text-xs text-zinc-400 italic">Select options below to build your cinematic prompt...</p>
          )}
        </div>
      </div>

      {/* Scrollable Options */}
      <div className="flex-1 overflow-auto p-3 space-y-2">
        {/* Quick Presets */}
        <div className="space-y-2">
          <SectionHeader 
            title="Quick Presets" 
            icon="sparkles" 
            expanded={expandedSections.has("quick-presets")}
            onToggle={() => toggleSection("quick-presets")}
            hasSelection={!!activePreset}
          />
          {expandedSections.has("quick-presets") && (
            <div className="grid grid-cols-4 gap-1.5 p-2 bg-white/20 rounded-xl">
              {QUICK_PRESETS.map(preset => (
                <QuickPresetButton
                  key={preset.id}
                  preset={preset}
                  selected={activePreset === preset.id}
                  onClick={() => applyPreset(preset.id)}
                />
              ))}
            </div>
          )}
        </div>

        {/* Visual Style */}
        <div className="space-y-2">
          <SectionHeader 
            title="Visual Style" 
            icon="eye" 
            expanded={expandedSections.has("style")}
            onToggle={() => toggleSection("style")}
            hasSelection={!!selections.visualStyle}
          />
          {expandedSections.has("style") && (
            <div className="p-2 bg-white/20 rounded-xl">
              <CompactIconSelector
                options={VISUAL_STYLE_OPTIONS}
                value={selections.visualStyle}
                onChange={(v) => updateSelection("visualStyle", v)}
                columns={5}
              />
            </div>
          )}
        </div>

        {/* Composition */}
        <div className="space-y-2">
          <SectionHeader 
            title="Shot & Composition" 
            icon="camera" 
            expanded={expandedSections.has("composition")}
            onToggle={() => toggleSection("composition")}
            hasSelection={!!(selections.shotAngle || selections.shotFraming || selections.focusDepth)}
          />
          {expandedSections.has("composition") && (
            <div className="space-y-3 p-2 bg-white/20 rounded-xl">
              <div>
                <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-1 block">Camera Angle</label>
                <CompactIconSelector
                  options={SHOT_ANGLE_OPTIONS}
                  value={selections.shotAngle}
                  onChange={(v) => updateSelection("shotAngle", v)}
                  columns={6}
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-1 block">Framing</label>
                <CompactIconSelector
                  options={SHOT_FRAMING_OPTIONS}
                  value={selections.shotFraming}
                  onChange={(v) => updateSelection("shotFraming", v)}
                  columns={4}
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-1 block">Depth of Field</label>
                <CompactIconSelector
                  options={FOCUS_DEPTH_OPTIONS}
                  value={selections.focusDepth}
                  onChange={(v) => updateSelection("focusDepth", v)}
                  columns={4}
                />
              </div>
            </div>
          )}
        </div>

        {/* Camera & Technical */}
        <div className="space-y-2">
          <SectionHeader 
            title="Camera & Technical" 
            icon="aperture" 
            expanded={expandedSections.has("camera")}
            onToggle={() => toggleSection("camera")}
            hasSelection={!!(selections.cameraType || selections.lens || selections.filmGrain)}
          />
          {expandedSections.has("camera") && (
            <div className="space-y-3 p-2 bg-white/20 rounded-xl">
              <div>
                <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-1 block">Camera Type</label>
                <CompactIconSelector
                  options={CAMERA_TYPE_OPTIONS}
                  value={selections.cameraType}
                  onChange={(v) => updateSelection("cameraType", v)}
                  columns={4}
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-1 block">Lens</label>
                <CompactIconSelector
                  options={LENS_OPTIONS}
                  value={selections.lens}
                  onChange={(v) => updateSelection("lens", v)}
                  columns={3}
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-1 block">Film Grain</label>
                <CompactIconSelector
                  options={FILM_GRAIN_OPTIONS}
                  value={selections.filmGrain}
                  onChange={(v) => updateSelection("filmGrain", v)}
                  columns={5}
                />
              </div>
            </div>
          )}
        </div>

        {/* Lighting */}
        <div className="space-y-2">
          <SectionHeader 
            title="Lighting" 
            icon="sun" 
            expanded={expandedSections.has("lighting")}
            onToggle={() => toggleSection("lighting")}
            hasSelection={!!(selections.lightingType || selections.lightingDirection || selections.lightingQuality)}
          />
          {expandedSections.has("lighting") && (
            <div className="space-y-3 p-2 bg-white/20 rounded-xl">
              <div>
                <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-1 block">Light Source</label>
                <CompactIconSelector
                  options={LIGHTING_TYPE_OPTIONS}
                  value={selections.lightingType}
                  onChange={(v) => updateSelection("lightingType", v)}
                  columns={4}
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-1 block">Light Direction</label>
                <CompactIconSelector
                  options={LIGHTING_DIRECTION_OPTIONS}
                  value={selections.lightingDirection}
                  onChange={(v) => updateSelection("lightingDirection", v)}
                  columns={4}
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-1 block">Light Quality</label>
                <CompactIconSelector
                  options={LIGHTING_QUALITY_OPTIONS}
                  value={selections.lightingQuality}
                  onChange={(v) => updateSelection("lightingQuality", v)}
                  columns={5}
                />
              </div>
            </div>
          )}
        </div>

        {/* Color & Tone */}
        <div className="space-y-2">
          <SectionHeader 
            title="Color & Tone" 
            icon="palette" 
            expanded={expandedSections.has("color")}
            onToggle={() => toggleSection("color")}
            hasSelection={!!selections.colorPalette}
          />
          {expandedSections.has("color") && (
            <div className="p-2 bg-white/20 rounded-xl">
              <CompactIconSelector
                options={COLOR_PALETTE_OPTIONS}
                value={selections.colorPalette}
                onChange={(v) => updateSelection("colorPalette", v)}
                columns={5}
              />
            </div>
          )}
        </div>

        {/* Environment */}
        <div className="space-y-2">
          <SectionHeader 
            title="Environment" 
            icon="world" 
            expanded={expandedSections.has("environment")}
            onToggle={() => toggleSection("environment")}
            hasSelection={!!(selections.timeOfDay || selections.weather || selections.locationType)}
          />
          {expandedSections.has("environment") && (
            <div className="space-y-3 p-2 bg-white/20 rounded-xl">
              <div>
                <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-1 block">Time of Day</label>
                <CompactIconSelector
                  options={TIME_OF_DAY_OPTIONS}
                  value={selections.timeOfDay}
                  onChange={(v) => updateSelection("timeOfDay", v)}
                  columns={4}
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-1 block">Weather</label>
                <CompactIconSelector
                  options={WEATHER_OPTIONS}
                  value={selections.weather}
                  onChange={(v) => updateSelection("weather", v)}
                  columns={6}
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-1 block">Location</label>
                <CompactIconSelector
                  options={LOCATION_TYPE_OPTIONS}
                  value={selections.locationType}
                  onChange={(v) => updateSelection("locationType", v)}
                  columns={5}
                />
              </div>
            </div>
          )}
        </div>

        {/* Subject/Character */}
        <div className="space-y-2">
          <SectionHeader 
            title="Subject" 
            icon="character" 
            expanded={expandedSections.has("subject")}
            onToggle={() => toggleSection("subject")}
            hasSelection={!!(selections.subjectExpression || selections.subjectPose)}
          />
          {expandedSections.has("subject") && (
            <div className="space-y-3 p-2 bg-white/20 rounded-xl">
              <div>
                <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-1 block">Expression</label>
                <CompactIconSelector
                  options={SUBJECT_EXPRESSION_OPTIONS}
                  value={selections.subjectExpression}
                  onChange={(v) => updateSelection("subjectExpression", v)}
                  columns={4}
                />
              </div>
              <div>
                <label className="text-[10px] font-semibold text-zinc-500 uppercase tracking-wide mb-1 block">Pose</label>
                <CompactIconSelector
                  options={SUBJECT_POSE_OPTIONS}
                  value={selections.subjectPose}
                  onChange={(v) => updateSelection("subjectPose", v)}
                  columns={4}
                />
              </div>
            </div>
          )}
        </div>

        {/* Atmosphere */}
        <div className="space-y-2">
          <SectionHeader 
            title="Atmosphere & Mood" 
            icon="cloud" 
            expanded={expandedSections.has("atmosphere")}
            onToggle={() => toggleSection("atmosphere")}
            hasSelection={!!selections.atmosphere}
          />
          {expandedSections.has("atmosphere") && (
            <div className="p-2 bg-white/20 rounded-xl">
              <CompactIconSelector
                options={ATMOSPHERE_OPTIONS}
                value={selections.atmosphere}
                onChange={(v) => updateSelection("atmosphere", v)}
                columns={4}
              />
            </div>
          )}
        </div>

        {/* Imperfections/Realism */}
        <div className="space-y-2">
          <SectionHeader 
            title="Lens Effects" 
            icon="aperture" 
            expanded={expandedSections.has("imperfection")}
            onToggle={() => toggleSection("imperfection")}
            hasSelection={!!selections.imperfection}
          />
          {expandedSections.has("imperfection") && (
            <div className="p-2 bg-white/20 rounded-xl">
              <CompactIconSelector
                options={IMPERFECTION_OPTIONS}
                value={selections.imperfection}
                onChange={(v) => updateSelection("imperfection", v)}
                columns={4}
              />
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default CinematicPromptBuilder;
