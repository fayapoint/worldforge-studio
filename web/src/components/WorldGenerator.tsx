"use client";

import { useState } from "react";
import { Icon } from "@/lib/ui";

type StorySegment = {
  id: string;
  title: string;
  description: string;
  duration: string;
  icon: string;
  mood: string;
};

type WorldGeneratorProps = {
  projectId: string;
  onGenerate: (config: WorldGenerationConfig) => void;
};

export type WorldGenerationConfig = {
  mode: "instant" | "custom";
  segmentId?: string;
  userPreferences?: {
    tone: string;
    focus: string[];
    customEntities: string[];
  };
};

const STORY_SEGMENTS: StorySegment[] = [
  {
    id: "opening",
    title: "The Awakening",
    description: "Where it all begins - the first whispers are heard",
    duration: "~1 min",
    icon: "sparkles",
    mood: "mysterious",
  },
  {
    id: "discovery",
    title: "Hidden Truths",
    description: "Uncovering secrets that change everything",
    duration: "~1 min",
    icon: "eye",
    mood: "tense",
  },
  {
    id: "confrontation",
    title: "Face to Face",
    description: "The moment of truth arrives",
    duration: "~1 min",
    icon: "warning",
    mood: "intense",
  },
  {
    id: "revelation",
    title: "The Truth Revealed",
    description: "Everything comes into focus",
    duration: "~1 min",
    icon: "book",
    mood: "dramatic",
  },
];

export function WorldGenerator({ projectId, onGenerate }: WorldGeneratorProps) {
  const [mode, setMode] = useState<"choice" | "instant" | "custom">("choice");
  const [selectedSegment, setSelectedSegment] = useState<string | null>(null);
  const [generating, setGenerating] = useState(false);

  const handleInstantGenerate = () => {
    setGenerating(true);
    onGenerate({ mode: "instant" });
  };

  const handleCustomGenerate = () => {
    if (!selectedSegment) return;
    setGenerating(true);
    onGenerate({
      mode: "custom",
      segmentId: selectedSegment,
    });
  };

  if (generating) {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50">
        <div className="text-center">
          <div className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-full bg-white/40 backdrop-blur-xl">
            <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
          </div>
          <h2 className="mb-2 text-2xl font-bold text-zinc-900">Generating Your World</h2>
          <p className="text-zinc-600">Creating a unique story just for you...</p>
        </div>
      </div>
    );
  }

  if (mode === "choice") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
        <div className="w-full max-w-4xl">
          <div className="mb-8 text-center">
            <h1 className="mb-3 text-4xl font-bold text-zinc-900">Generate Your World</h1>
            <p className="text-lg text-zinc-600">
              Create a personalized story world from "They Can Hear"
            </p>
          </div>

          <div className="grid gap-6 md:grid-cols-2">
            {/* Instant Generate */}
            <button
              onClick={handleInstantGenerate}
              className="group relative overflow-hidden rounded-3xl bg-white/40 p-8 backdrop-blur-xl transition-all hover:scale-105 hover:bg-white/60"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/10 to-purple-500/10 opacity-0 transition-opacity group-hover:opacity-100" />
              
              <div className="relative">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white shadow-lg">
                  <Icon name="sparkles" className="h-8 w-8" />
                </div>
                
                <h3 className="mb-2 text-2xl font-bold text-zinc-900">One-Click Magic</h3>
                <p className="mb-4 text-zinc-600">
                  Let AI surprise you with a complete world. Random segment, perfectly crafted story.
                </p>
                
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-indigo-600">
                  <span>Generate Instantly</span>
                  <Icon name="arrowRight" className="h-4 w-4" />
                </div>
              </div>
            </button>

            {/* Customize */}
            <button
              onClick={() => setMode("custom")}
              className="group relative overflow-hidden rounded-3xl bg-white/40 p-8 backdrop-blur-xl transition-all hover:scale-105 hover:bg-white/60"
            >
              <div className="absolute inset-0 bg-gradient-to-br from-purple-500/10 to-pink-500/10 opacity-0 transition-opacity group-hover:opacity-100" />
              
              <div className="relative">
                <div className="mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-purple-500 to-pink-600 text-white shadow-lg">
                  <Icon name="wand" className="h-8 w-8" />
                </div>
                
                <h3 className="mb-2 text-2xl font-bold text-zinc-900">Customize First</h3>
                <p className="mb-4 text-zinc-600">
                  Choose your story segment and preferences before generation.
                </p>
                
                <div className="inline-flex items-center gap-2 text-sm font-semibold text-purple-600">
                  <span>Customize & Generate</span>
                  <Icon name="arrowRight" className="h-4 w-4" />
                </div>
              </div>
            </button>
          </div>

          <div className="mt-8 rounded-2xl bg-white/40 p-6 backdrop-blur-xl">
            <div className="flex items-start gap-4">
              <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-100">
                <Icon name="sparkles" className="h-5 w-5 text-indigo-600" />
              </div>
              <div>
                <h4 className="mb-1 font-semibold text-zinc-900">What You'll Get</h4>
                <p className="text-sm text-zinc-600">
                  A complete story world with characters, locations, and a cohesive ~1-minute narrative
                  segment from "They Can Hear". Mix of canonical entities and your custom additions.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  if (mode === "custom") {
    return (
      <div className="flex min-h-screen items-center justify-center bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
        <div className="w-full max-w-5xl">
          <div className="mb-8">
            <button
              onClick={() => setMode("choice")}
              className="mb-4 inline-flex items-center gap-2 text-sm font-medium text-zinc-600 hover:text-zinc-900"
            >
              <Icon name="arrowRight" className="h-4 w-4 rotate-180" />
              Back
            </button>
            <h1 className="mb-3 text-4xl font-bold text-zinc-900">Choose Your Story</h1>
            <p className="text-lg text-zinc-600">
              Select which part of "They Can Hear" you want to experience
            </p>
          </div>

          <div className="mb-8 grid gap-4 md:grid-cols-2">
            {STORY_SEGMENTS.map((segment) => (
              <button
                key={segment.id}
                onClick={() => setSelectedSegment(segment.id)}
                className={`group relative overflow-hidden rounded-2xl p-6 text-left transition-all ${
                  selectedSegment === segment.id
                    ? "bg-white/80 shadow-xl ring-2 ring-indigo-500 backdrop-blur-xl"
                    : "bg-white/40 backdrop-blur-xl hover:bg-white/60"
                }`}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
                
                <div className="relative">
                  <div className="mb-3 flex items-start justify-between">
                    <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                      <Icon name={segment.icon as any} className="h-6 w-6" />
                    </div>
                    <div className="rounded-full bg-indigo-100 px-3 py-1 text-xs font-medium text-indigo-700">
                      {segment.duration}
                    </div>
                  </div>
                  
                  <h3 className="mb-2 text-xl font-bold text-zinc-900">{segment.title}</h3>
                  <p className="mb-3 text-sm text-zinc-600">{segment.description}</p>
                  
                  <div className="inline-flex items-center gap-2 rounded-full bg-zinc-100 px-3 py-1 text-xs font-medium text-zinc-700">
                    <span className="h-2 w-2 rounded-full bg-indigo-500" />
                    {segment.mood}
                  </div>
                </div>

                {selectedSegment === segment.id && (
                  <div className="absolute right-4 top-4">
                    <div className="flex h-6 w-6 items-center justify-center rounded-full bg-indigo-500">
                      <Icon name="check" className="h-4 w-4 text-white" />
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>

          <div className="flex justify-end">
            <button
              onClick={handleCustomGenerate}
              disabled={!selectedSegment}
              className="inline-flex items-center gap-2 rounded-2xl bg-gradient-to-r from-indigo-600 to-purple-600 px-8 py-4 text-lg font-semibold text-white shadow-lg transition-all hover:scale-105 hover:shadow-xl disabled:opacity-50 disabled:hover:scale-100"
            >
              <Icon name="sparkles" className="h-5 w-5" />
              Generate My World
            </button>
          </div>
        </div>
      </div>
    );
  }

  return null;
}
