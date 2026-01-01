"use client";

import { useState, useMemo } from "react";
import { Icon, type IconName } from "@/lib/ui";
import { GlassCard, GlassButton, GlassInput, IconOption } from "./GlassCard";
import {
  NODE_TYPE_OPTIONS,
  MOOD_OPTIONS,
  PACING_OPTIONS,
  DRAMATIC_GOAL_OPTIONS,
  CONFLICT_OPTIONS,
} from "@/lib/storyGraphIcons";
import type { StoryNode, Entity } from "@/lib/models";

// Quick presets for common scene types
const SCENE_PRESETS = [
  { 
    id: "action", 
    label: "Action Scene", 
    icon: "flame" as IconName,
    description: "Fast-paced action sequence",
    color: "from-red-500 to-orange-600",
    defaults: { mood: "action", pacing: "fast", goal: "survive", conflict: "physical" }
  },
  { 
    id: "dialogue", 
    label: "Dialogue Scene", 
    icon: "mic" as IconName,
    description: "Character conversation",
    color: "from-blue-500 to-cyan-600",
    defaults: { mood: "dramatic", pacing: "medium", goal: "convince", conflict: "interpersonal" }
  },
  { 
    id: "revelation", 
    label: "Revelation", 
    icon: "eye" as IconName,
    description: "Truth is discovered",
    color: "from-purple-500 to-indigo-600",
    defaults: { mood: "mysterious", pacing: "slow", goal: "discover", conflict: "internal" }
  },
  { 
    id: "tension", 
    label: "Tension Build", 
    icon: "warning" as IconName,
    description: "Suspense and stakes",
    color: "from-amber-500 to-yellow-600",
    defaults: { mood: "tense", pacing: "slow", goal: "survive", conflict: "external" }
  },
  { 
    id: "emotional", 
    label: "Emotional Beat", 
    icon: "heart" as IconName,
    description: "Character moment",
    color: "from-pink-500 to-rose-600",
    defaults: { mood: "emotional", pacing: "slow", goal: "transform", conflict: "internal" }
  },
  { 
    id: "confrontation", 
    label: "Confrontation", 
    icon: "target" as IconName,
    description: "Characters clash",
    color: "from-emerald-500 to-teal-600",
    defaults: { mood: "dramatic", pacing: "fast", goal: "confront", conflict: "interpersonal" }
  },
];

type WizardStep = "type" | "preset" | "customize" | "details";

interface InsertNodeWizardProps {
  isOpen: boolean;
  onClose: () => void;
  sourceNode: StoryNode | null;
  targetNode: StoryNode | null;
  edgeId: string;
  entities: Entity[];
  onInsert: (data: {
    nodeType: "BEAT" | "SCENE" | "CHAPTER";
    title: string;
    preset?: string;
    mood?: string;
    pacing?: string;
    dramaticGoal?: string;
    conflict?: string;
    participants?: string[];
    locations?: string[];
  }) => Promise<void>;
}

export function InsertNodeWizard({
  isOpen,
  onClose,
  sourceNode,
  targetNode,
  edgeId,
  entities,
  onInsert,
}: InsertNodeWizardProps) {
  const [step, setStep] = useState<WizardStep>("type");
  const [nodeType, setNodeType] = useState<"BEAT" | "SCENE" | "CHAPTER">("SCENE");
  const [selectedPreset, setSelectedPreset] = useState<string | null>(null);
  const [title, setTitle] = useState("");
  const [mood, setMood] = useState("");
  const [pacing, setPacing] = useState("");
  const [dramaticGoal, setDramaticGoal] = useState("");
  const [conflict, setConflict] = useState("");
  const [selectedParticipants, setSelectedParticipants] = useState<string[]>([]);
  const [selectedLocations, setSelectedLocations] = useState<string[]>([]);
  const [inserting, setInserting] = useState(false);

  const characters = useMemo(() => entities.filter(e => e.type === "CHARACTER"), [entities]);
  const locations = useMemo(() => entities.filter(e => e.type === "LOCATION"), [entities]);

  const handlePresetSelect = (presetId: string) => {
    setSelectedPreset(presetId);
    const preset = SCENE_PRESETS.find(p => p.id === presetId);
    if (preset) {
      setMood(preset.defaults.mood);
      setPacing(preset.defaults.pacing);
      setDramaticGoal(preset.defaults.goal);
      setConflict(preset.defaults.conflict);
    }
  };

  const handleInsert = async () => {
    if (!title.trim()) return;
    
    setInserting(true);
    try {
      await onInsert({
        nodeType,
        title: title.trim(),
        preset: selectedPreset || undefined,
        mood: mood || undefined,
        pacing: pacing || undefined,
        dramaticGoal: dramaticGoal || undefined,
        conflict: conflict || undefined,
        participants: selectedParticipants.length > 0 ? selectedParticipants : undefined,
        locations: selectedLocations.length > 0 ? selectedLocations : undefined,
      });
      onClose();
    } finally {
      setInserting(false);
    }
  };

  const reset = () => {
    setStep("type");
    setNodeType("SCENE");
    setSelectedPreset(null);
    setTitle("");
    setMood("");
    setPacing("");
    setDramaticGoal("");
    setConflict("");
    setSelectedParticipants([]);
    setSelectedLocations([]);
  };

  const handleClose = () => {
    reset();
    onClose();
  };

  if (!isOpen) return null;

  const renderStepIndicator = () => (
    <div className="flex items-center justify-center gap-2 mb-6">
      {(["type", "preset", "customize", "details"] as WizardStep[]).map((s, idx) => (
        <div key={s} className="flex items-center gap-2">
          <button
            onClick={() => {
              if (idx < ["type", "preset", "customize", "details"].indexOf(step)) {
                setStep(s);
              }
            }}
            className={`flex h-8 w-8 items-center justify-center rounded-full text-xs font-bold transition-all ${
              step === s
                ? "bg-gradient-to-br from-indigo-600 to-purple-600 text-white shadow-lg scale-110"
                : idx < ["type", "preset", "customize", "details"].indexOf(step)
                ? "bg-indigo-100 text-indigo-700 hover:bg-indigo-200 cursor-pointer"
                : "bg-zinc-100 text-zinc-400"
            }`}
          >
            {idx + 1}
          </button>
          {idx < 3 && (
            <div className={`w-8 h-0.5 ${
              idx < ["type", "preset", "customize", "details"].indexOf(step)
                ? "bg-indigo-400"
                : "bg-zinc-200"
            }`} />
          )}
        </div>
      ))}
    </div>
  );

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 backdrop-blur-sm p-4">
      <div className="w-full max-w-3xl max-h-[90vh] overflow-auto">
        <GlassCard className="p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-xl bg-gradient-to-br from-indigo-600 to-purple-600 text-white">
                <Icon name="plus" className="h-5 w-5" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-zinc-900">Insert New Node</h2>
                <p className="text-sm text-zinc-500">
                  Between "{sourceNode?.title || "?"}" and "{targetNode?.title || "?"}"
                </p>
              </div>
            </div>
            <button
              onClick={handleClose}
              className="p-2 rounded-xl hover:bg-white/60 transition-all"
            >
              <Icon name="x" className="h-5 w-5 text-zinc-500" />
            </button>
          </div>

          {renderStepIndicator()}

          {/* Step 1: Select Node Type */}
          {step === "type" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-zinc-900 text-center">
                What type of node?
              </h3>
              <div className="grid grid-cols-3 gap-4">
                {NODE_TYPE_OPTIONS.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => {
                      setNodeType(option.value);
                      setStep("preset");
                    }}
                    className={`group relative p-6 rounded-2xl border-2 transition-all hover:scale-[1.02] ${
                      nodeType === option.value
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-white/40 bg-white/40 hover:border-indigo-300"
                    }`}
                  >
                    <div className={`mx-auto mb-3 flex h-16 w-16 items-center justify-center rounded-2xl shadow-lg ${
                      option.value === "CHAPTER" 
                        ? "bg-gradient-to-br from-purple-500 to-indigo-600" 
                        : option.value === "SCENE" 
                          ? "bg-gradient-to-br from-blue-500 to-cyan-600"
                          : "bg-gradient-to-br from-emerald-500 to-teal-600"
                    } text-white`}>
                      <Icon name={option.icon as IconName} className="h-8 w-8" />
                    </div>
                    <div className="text-lg font-bold text-zinc-900">{option.label}</div>
                    <div className="text-sm text-zinc-500 mt-1">{option.description}</div>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Step 2: Select Preset or Custom */}
          {step === "preset" && (
            <div className="space-y-4">
              <h3 className="text-lg font-semibold text-zinc-900 text-center">
                Quick Presets
              </h3>
              <p className="text-sm text-zinc-500 text-center">
                Choose a preset to get started quickly, or customize from scratch
              </p>
              
              <div className="grid grid-cols-3 gap-3">
                {SCENE_PRESETS.map((preset) => (
                  <button
                    key={preset.id}
                    onClick={() => {
                      handlePresetSelect(preset.id);
                      setStep("details");
                    }}
                    className={`group p-4 rounded-xl border-2 transition-all hover:scale-[1.02] ${
                      selectedPreset === preset.id
                        ? "border-indigo-500 bg-indigo-50"
                        : "border-white/40 bg-white/40 hover:border-indigo-300"
                    }`}
                  >
                    <div className={`mx-auto mb-2 flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br ${preset.color} text-white shadow-lg`}>
                      <Icon name={preset.icon} className="h-6 w-6" />
                    </div>
                    <div className="font-semibold text-zinc-900 text-sm">{preset.label}</div>
                    <div className="text-xs text-zinc-500 mt-0.5">{preset.description}</div>
                  </button>
                ))}
              </div>

              <div className="relative py-4">
                <div className="absolute inset-0 flex items-center">
                  <div className="w-full border-t border-zinc-200" />
                </div>
                <div className="relative flex justify-center">
                  <span className="bg-white px-4 text-sm text-zinc-500">or</span>
                </div>
              </div>

              <button
                onClick={() => setStep("customize")}
                className="w-full p-4 rounded-xl border-2 border-dashed border-zinc-300 hover:border-indigo-400 hover:bg-indigo-50/50 transition-all flex items-center justify-center gap-3"
              >
                <Icon name="settings" className="h-5 w-5 text-zinc-500" />
                <span className="font-medium text-zinc-700">Customize from Scratch</span>
              </button>
            </div>
          )}

          {/* Step 3: Customize (optional) */}
          {step === "customize" && (
            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-zinc-900 text-center">
                Customize Your Scene
              </h3>

              {/* Mood */}
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-2">Mood</label>
                <div className="grid grid-cols-4 gap-2">
                  {MOOD_OPTIONS.slice(0, 8).map((option) => (
                    <IconOption
                      key={option.value}
                      icon={<Icon name={option.icon as IconName} className="h-4 w-4" />}
                      label={option.label}
                      selected={mood === option.value}
                      onClick={() => setMood(option.value)}
                    />
                  ))}
                </div>
              </div>

              {/* Pacing */}
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-2">Pacing</label>
                <div className="grid grid-cols-4 gap-2">
                  {PACING_OPTIONS.map((option) => (
                    <IconOption
                      key={option.value}
                      icon={<Icon name={option.icon as IconName} className="h-4 w-4" />}
                      label={option.label}
                      selected={pacing === option.value}
                      onClick={() => setPacing(option.value)}
                    />
                  ))}
                </div>
              </div>

              {/* Dramatic Goal */}
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-2">Dramatic Goal</label>
                <div className="grid grid-cols-4 gap-2">
                  {DRAMATIC_GOAL_OPTIONS.map((option) => (
                    <IconOption
                      key={option.value}
                      icon={<Icon name={option.icon as IconName} className="h-4 w-4" />}
                      label={option.label}
                      selected={dramaticGoal === option.value}
                      onClick={() => setDramaticGoal(option.value)}
                    />
                  ))}
                </div>
              </div>

              {/* Conflict */}
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-2">Conflict Type</label>
                <div className="grid grid-cols-3 gap-2">
                  {CONFLICT_OPTIONS.map((option) => (
                    <IconOption
                      key={option.value}
                      icon={<Icon name={option.icon as IconName} className="h-4 w-4" />}
                      label={option.label}
                      selected={conflict === option.value}
                      onClick={() => setConflict(option.value)}
                    />
                  ))}
                </div>
              </div>

              <div className="flex justify-between pt-4">
                <GlassButton variant="ghost" onClick={() => setStep("preset")}>
                  <Icon name="chevronLeft" className="h-4 w-4" />
                  Back
                </GlassButton>
                <GlassButton onClick={() => setStep("details")}>
                  Continue
                  <Icon name="chevronRight" className="h-4 w-4" />
                </GlassButton>
              </div>
            </div>
          )}

          {/* Step 4: Title & Entities */}
          {step === "details" && (
            <div className="space-y-5">
              <h3 className="text-lg font-semibold text-zinc-900 text-center">
                Final Details
              </h3>

              {/* Selected preset indicator */}
              {selectedPreset && (
                <div className="flex items-center justify-center gap-2 p-3 rounded-xl bg-indigo-50 border border-indigo-200">
                  <Icon name={SCENE_PRESETS.find(p => p.id === selectedPreset)?.icon || "scene"} className="h-5 w-5 text-indigo-600" />
                  <span className="font-medium text-indigo-700">
                    {SCENE_PRESETS.find(p => p.id === selectedPreset)?.label} preset selected
                  </span>
                </div>
              )}

              {/* Title */}
              <div>
                <label className="block text-sm font-semibold text-zinc-700 mb-2">
                  Title <span className="text-red-500">*</span>
                </label>
                <GlassInput
                  value={title}
                  onChange={setTitle}
                  placeholder={`Enter ${nodeType.toLowerCase()} title...`}
                />
              </div>

              {/* Characters */}
              {characters.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-2">
                    Characters (optional)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {characters.map((char) => (
                      <button
                        key={char._id}
                        onClick={() => {
                          setSelectedParticipants(prev =>
                            prev.includes(char._id)
                              ? prev.filter(id => id !== char._id)
                              : [...prev, char._id]
                          );
                        }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
                          selectedParticipants.includes(char._id)
                            ? "bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500"
                            : "bg-white/60 text-zinc-700 hover:bg-white"
                        }`}
                      >
                        {char.media?.thumbnailUrl ? (
                          <img
                            src={char.media.thumbnailUrl}
                            className="h-5 w-5 rounded-full object-cover"
                            alt={char.name}
                          />
                        ) : (
                          <Icon name="character" className="h-4 w-4" />
                        )}
                        <span className="text-sm font-medium">{char.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Locations */}
              {locations.length > 0 && (
                <div>
                  <label className="block text-sm font-semibold text-zinc-700 mb-2">
                    Locations (optional)
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {locations.map((loc) => (
                      <button
                        key={loc._id}
                        onClick={() => {
                          setSelectedLocations(prev =>
                            prev.includes(loc._id)
                              ? prev.filter(id => id !== loc._id)
                              : [...prev, loc._id]
                          );
                        }}
                        className={`flex items-center gap-2 px-3 py-1.5 rounded-full transition-all ${
                          selectedLocations.includes(loc._id)
                            ? "bg-indigo-100 text-indigo-700 ring-2 ring-indigo-500"
                            : "bg-white/60 text-zinc-700 hover:bg-white"
                        }`}
                      >
                        <Icon name="location" className="h-4 w-4" />
                        <span className="text-sm font-medium">{loc.name}</span>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              <div className="flex justify-between pt-4 border-t border-white/20">
                <GlassButton variant="ghost" onClick={() => setStep(selectedPreset ? "preset" : "customize")}>
                  <Icon name="chevronLeft" className="h-4 w-4" />
                  Back
                </GlassButton>
                <GlassButton 
                  onClick={handleInsert} 
                  disabled={!title.trim() || inserting}
                >
                  <Icon name="sparkles" className="h-4 w-4" />
                  {inserting ? "Inserting..." : "Insert & Generate"}
                </GlassButton>
              </div>
            </div>
          )}
        </GlassCard>
      </div>
    </div>
  );
}
