"use client";

import { useState } from "react";
import type { CanonicalChapter, CanonicalEntity, ToneModifiers, UserEntityFork } from "@/lib/communityModels";
import { Badge, Card, Icon, PrimaryButton, SecondaryButton } from "@/lib/ui";

type ChapterContributionWizardProps = {
  insertionPoint: {
    afterChapter: CanonicalChapter | null;
    beforeChapter: CanonicalChapter | null;
    timelinePosition: number;
  };
  availableEntities: CanonicalEntity[];
  onComplete: (contribution: ChapterContributionData) => void;
  onCancel: () => void;
};

export type ChapterContributionData = {
  title: string;
  synopsis: string;
  toneModifiers: ToneModifiers;
  arcDirection: string;
  focusCharacters: string[];
  desiredLength: "SHORT" | "MEDIUM" | "LONG";
  entityModifications: { entityId: string; modifications: string }[];
  storyHints: string;
};

export function ChapterContributionWizard({
  insertionPoint,
  availableEntities,
  onComplete,
  onCancel,
}: ChapterContributionWizardProps) {
  const [currentStep, setCurrentStep] = useState(0);
  const [data, setData] = useState<Partial<ChapterContributionData>>({
    toneModifiers: { darkness: 50, humor: 50, tension: 50, romance: 50 },
    focusCharacters: [],
    desiredLength: "MEDIUM",
    entityModifications: [],
  });

  const steps = [
    { id: "context", title: "Story Context", icon: "book" },
    { id: "basics", title: "Chapter Basics", icon: "chapter" },
    { id: "tone", title: "Tone & Style", icon: "wand" },
    { id: "characters", title: "Characters", icon: "character" },
    { id: "direction", title: "Story Direction", icon: "target" },
  ];

  const updateData = (updates: Partial<ChapterContributionData>) => {
    setData((prev) => ({ ...prev, ...updates }));
  };

  const handleNext = () => {
    if (currentStep < steps.length - 1) {
      setCurrentStep((prev) => prev + 1);
    } else {
      onComplete(data as ChapterContributionData);
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep((prev) => prev - 1);
    }
  };

  const canProceed = () => {
    switch (currentStep) {
      case 0:
        return true;
      case 1:
        return data.title && data.synopsis;
      case 2:
        return true;
      case 3:
        return data.focusCharacters && data.focusCharacters.length > 0;
      case 4:
        return data.arcDirection;
      default:
        return false;
    }
  };

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900">Create Your Chapter</h3>
              <p className="text-sm text-zinc-600">
                Contributing to "They Can Hear" at timeline position {insertionPoint.timelinePosition}
              </p>
            </div>
            <Badge tone="neutral">
              Step {currentStep + 1} of {steps.length}
            </Badge>
          </div>

          <div className="mt-4 flex gap-1">
            {steps.map((_, idx) => (
              <div
                key={idx}
                className={`h-1.5 flex-1 rounded-full transition-colors ${
                  idx <= currentStep ? "bg-indigo-500" : "bg-zinc-200"
                }`}
              />
            ))}
          </div>
        </div>

        <div className="min-h-[400px]">
          {currentStep === 0 && (
            <ContextStep insertionPoint={insertionPoint} />
          )}
          {currentStep === 1 && (
            <BasicsStep data={data} updateData={updateData} />
          )}
          {currentStep === 2 && (
            <ToneStep data={data} updateData={updateData} />
          )}
          {currentStep === 3 && (
            <CharactersStep
              data={data}
              updateData={updateData}
              availableEntities={availableEntities}
            />
          )}
          {currentStep === 4 && (
            <DirectionStep data={data} updateData={updateData} />
          )}
        </div>

        <div className="mt-6 flex items-center justify-between gap-3 border-t border-zinc-200 pt-6">
          <div className="flex gap-2">
            <SecondaryButton onClick={onCancel}>Cancel</SecondaryButton>
            {currentStep > 0 && <SecondaryButton onClick={handleBack}>Back</SecondaryButton>}
          </div>
          <PrimaryButton onClick={handleNext} disabled={!canProceed()}>
            {currentStep === steps.length - 1 ? (
              <>
                <Icon name="sparkles" className="h-4 w-4" />
                Generate Chapter
              </>
            ) : (
              "Next"
            )}
          </PrimaryButton>
        </div>
      </Card>
    </div>
  );
}

function ContextStep({ insertionPoint }: { insertionPoint: any }) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold text-zinc-900">Insertion Point Context</h4>
        <p className="text-sm text-zinc-600">
          Understanding where your chapter fits in the story
        </p>
      </div>

      <div className="space-y-3">
        {insertionPoint.afterChapter && (
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <div className="text-xs font-medium text-zinc-500">AFTER</div>
            <div className="mt-1 font-semibold text-zinc-900">
              Chapter {insertionPoint.afterChapter.chapterNumber}: {insertionPoint.afterChapter.title}
            </div>
            <p className="mt-1 text-sm text-zinc-600">{insertionPoint.afterChapter.synopsis}</p>
            {insertionPoint.afterChapter.cliffhanger && (
              <div className="mt-2 rounded-lg bg-amber-50 px-3 py-2">
                <div className="text-xs font-medium text-amber-900">Cliffhanger to resolve:</div>
                <div className="text-xs text-amber-700">{insertionPoint.afterChapter.cliffhanger}</div>
              </div>
            )}
          </div>
        )}

        <div className="flex items-center justify-center">
          <div className="rounded-full border-2 border-indigo-500 bg-indigo-50 px-4 py-2">
            <div className="flex items-center gap-2">
              <Icon name="plus" className="h-4 w-4 text-indigo-600" />
              <span className="text-sm font-semibold text-indigo-900">Your Chapter Here</span>
            </div>
          </div>
        </div>

        {insertionPoint.beforeChapter && (
          <div className="rounded-xl border border-zinc-200 bg-white p-4">
            <div className="text-xs font-medium text-zinc-500">BEFORE</div>
            <div className="mt-1 font-semibold text-zinc-900">
              Chapter {insertionPoint.beforeChapter.chapterNumber}: {insertionPoint.beforeChapter.title}
            </div>
            <p className="mt-1 text-sm text-zinc-600">{insertionPoint.beforeChapter.synopsis}</p>
          </div>
        )}
      </div>

      <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
        <div className="flex items-start gap-3">
          <Icon name="sparkles" className="h-5 w-5 text-indigo-600 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-indigo-900">AI Assistance</div>
            <div className="text-sm text-indigo-700">
              The AI will use all canonical story context up to this point to ensure your chapter
              fits seamlessly into the narrative. It will maintain character consistency, world
              rules, and story continuity.
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

function BasicsStep({ data, updateData }: { data: Partial<ChapterContributionData>; updateData: (updates: Partial<ChapterContributionData>) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold text-zinc-900">Chapter Basics</h4>
        <p className="text-sm text-zinc-600">Give your chapter a title and brief synopsis</p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-900">
            Chapter Title <span className="text-red-500">*</span>
          </label>
          <input
            type="text"
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            value={data.title || ""}
            onChange={(e) => updateData({ title: e.target.value })}
            placeholder="e.g., The Whispers Begin"
          />
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-900">
            Synopsis <span className="text-red-500">*</span>
          </label>
          <textarea
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            value={data.synopsis || ""}
            onChange={(e) => updateData({ synopsis: e.target.value })}
            placeholder="Brief overview of what happens in this chapter..."
            rows={4}
          />
          <div className="mt-1 text-xs text-zinc-500">
            This helps the AI understand your vision for the chapter
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-900">Chapter Length</label>
          <div className="grid grid-cols-3 gap-2">
            {(["SHORT", "MEDIUM", "LONG"] as const).map((length) => (
              <button
                key={length}
                onClick={() => updateData({ desiredLength: length })}
                className={`rounded-lg border p-3 text-center transition-all ${
                  data.desiredLength === length
                    ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                    : "border-zinc-200 bg-white hover:border-indigo-300 hover:bg-indigo-50"
                }`}
              >
                <div className={`text-sm font-medium ${data.desiredLength === length ? "text-indigo-900" : "text-zinc-700"}`}>
                  {length}
                </div>
                <div className="text-xs text-zinc-500">
                  {length === "SHORT" && "~2-3k words"}
                  {length === "MEDIUM" && "~4-6k words"}
                  {length === "LONG" && "~7-10k words"}
                </div>
              </button>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}

function ToneStep({ data, updateData }: { data: Partial<ChapterContributionData>; updateData: (updates: Partial<ChapterContributionData>) => void }) {
  const toneModifiers = data.toneModifiers || { darkness: 50, humor: 50, tension: 50, romance: 50 };

  const updateTone = (key: keyof ToneModifiers, value: number) => {
    updateData({
      toneModifiers: { ...toneModifiers, [key]: value },
    });
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold text-zinc-900">Tone & Style</h4>
        <p className="text-sm text-zinc-600">Customize the emotional tone of your chapter</p>
      </div>

      <div className="space-y-4">
        <ToneSlider
          label="Darkness"
          value={toneModifiers.darkness}
          onChange={(v) => updateTone("darkness", v)}
          lowLabel="Light & Hopeful"
          highLabel="Dark & Grim"
          icon="eye"
        />
        <ToneSlider
          label="Humor"
          value={toneModifiers.humor}
          onChange={(v) => updateTone("humor", v)}
          lowLabel="Serious"
          highLabel="Comedic"
          icon="sparkles"
        />
        <ToneSlider
          label="Tension"
          value={toneModifiers.tension}
          onChange={(v) => updateTone("tension", v)}
          lowLabel="Relaxed"
          highLabel="Intense"
          icon="warning"
        />
        <ToneSlider
          label="Romance"
          value={toneModifiers.romance}
          onChange={(v) => updateTone("romance", v)}
          lowLabel="Platonic"
          highLabel="Romantic"
          icon="heart"
        />
      </div>

      <div className="rounded-xl border border-zinc-200 bg-zinc-50 p-4">
        <div className="text-xs font-medium text-zinc-700">Tone Preview</div>
        <div className="mt-2 text-sm text-zinc-600">
          Your chapter will be{" "}
          {toneModifiers.darkness > 70 ? "dark and intense" : toneModifiers.darkness > 30 ? "balanced" : "light and hopeful"}
          {toneModifiers.humor > 70 ? ", with comedic elements" : toneModifiers.humor > 30 ? ", with occasional humor" : ", maintaining a serious tone"}
          {toneModifiers.tension > 70 ? ", highly suspenseful" : toneModifiers.tension > 30 ? ", moderately tense" : ", relaxed"}
          {toneModifiers.romance > 70 ? ", with strong romantic themes" : toneModifiers.romance > 30 ? ", with subtle romantic undertones" : ", focused on other themes"}.
        </div>
      </div>
    </div>
  );
}

function ToneSlider({
  label,
  value,
  onChange,
  lowLabel,
  highLabel,
  icon,
}: {
  label: string;
  value: number;
  onChange: (value: number) => void;
  lowLabel: string;
  highLabel: string;
  icon: string;
}) {
  return (
    <div className="space-y-2">
      <div className="flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Icon name={icon as any} className="h-4 w-4 text-zinc-500" />
          <label className="text-sm font-medium text-zinc-900">{label}</label>
        </div>
        <span className="text-sm font-semibold text-indigo-600">{value}</span>
      </div>
      <input
        type="range"
        min="0"
        max="100"
        value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        className="w-full"
      />
      <div className="flex justify-between text-xs text-zinc-500">
        <span>{lowLabel}</span>
        <span>{highLabel}</span>
      </div>
    </div>
  );
}

function CharactersStep({
  data,
  updateData,
  availableEntities,
}: {
  data: Partial<ChapterContributionData>;
  updateData: (updates: Partial<ChapterContributionData>) => void;
  availableEntities: CanonicalEntity[];
}) {
  const characters = availableEntities.filter((e) => e.type === "CHARACTER");
  const focusCharacters = data.focusCharacters || [];

  const toggleCharacter = (entityId: string) => {
    if (focusCharacters.includes(entityId)) {
      updateData({ focusCharacters: focusCharacters.filter((id) => id !== entityId) });
    } else {
      updateData({ focusCharacters: [...focusCharacters, entityId] });
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold text-zinc-900">Focus Characters</h4>
        <p className="text-sm text-zinc-600">
          Select which characters will be featured in your chapter (select at least one)
        </p>
      </div>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        {characters.map((character) => (
          <button
            key={character._id}
            onClick={() => toggleCharacter(character._id)}
            className={`flex flex-col items-center gap-2 rounded-xl border p-3 text-center transition-all ${
              focusCharacters.includes(character._id)
                ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                : "border-zinc-200 bg-white hover:border-indigo-300 hover:bg-indigo-50"
            }`}
          >
            {character.media?.thumbnailUrl ? (
              <img
                src={character.media.thumbnailUrl}
                alt={character.name}
                className="h-16 w-16 rounded-lg object-cover"
              />
            ) : (
              <div className="flex h-16 w-16 items-center justify-center rounded-lg bg-zinc-100">
                <Icon name="character" className="h-8 w-8 text-zinc-400" />
              </div>
            )}
            <div className="text-sm font-medium text-zinc-900">{character.name}</div>
            {character.character?.role && (
              <div className="text-xs text-zinc-500">{character.character.role}</div>
            )}
            {focusCharacters.includes(character._id) && (
              <div className="absolute right-2 top-2">
                <div className="flex h-5 w-5 items-center justify-center rounded-full bg-indigo-500">
                  <Icon name="check" className="h-3 w-3 text-white" />
                </div>
              </div>
            )}
          </button>
        ))}
      </div>

      {focusCharacters.length > 0 && (
        <div className="rounded-xl border border-indigo-200 bg-indigo-50 p-4">
          <div className="text-sm font-semibold text-indigo-900">
            {focusCharacters.length} character{focusCharacters.length !== 1 ? "s" : ""} selected
          </div>
          <div className="text-sm text-indigo-700">
            The AI will feature these characters prominently and maintain their canonical
            personalities and relationships.
          </div>
        </div>
      )}
    </div>
  );
}

function DirectionStep({ data, updateData }: { data: Partial<ChapterContributionData>; updateData: (updates: Partial<ChapterContributionData>) => void }) {
  return (
    <div className="space-y-4">
      <div>
        <h4 className="font-semibold text-zinc-900">Story Direction</h4>
        <p className="text-sm text-zinc-600">Guide the AI on where you want the story to go</p>
      </div>

      <div className="space-y-3">
        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-900">
            Arc Direction <span className="text-red-500">*</span>
          </label>
          <textarea
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            value={data.arcDirection || ""}
            onChange={(e) => updateData({ arcDirection: e.target.value })}
            placeholder="e.g., The protagonist discovers a hidden truth about their past, leading to a moral dilemma..."
            rows={4}
          />
          <div className="mt-1 text-xs text-zinc-500">
            Describe the main story arc or character development you want to explore
          </div>
        </div>

        <div>
          <label className="mb-2 block text-sm font-medium text-zinc-900">
            Additional Story Hints (Optional)
          </label>
          <textarea
            className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-300 focus:ring-2 focus:ring-indigo-100"
            value={data.storyHints || ""}
            onChange={(e) => updateData({ storyHints: e.target.value })}
            placeholder="Any specific scenes, dialogue, or plot points you'd like to include..."
            rows={4}
          />
        </div>
      </div>

      <div className="rounded-xl border border-green-200 bg-green-50 p-4">
        <div className="flex items-start gap-3">
          <Icon name="check" className="h-5 w-5 text-green-600 mt-0.5" />
          <div>
            <div className="text-sm font-semibold text-green-900">Ready to Generate</div>
            <div className="text-sm text-green-700">
              Click "Generate Chapter" to create your contribution. The AI will use all canonical
              context, your tone preferences, and story direction to craft a chapter that fits
              seamlessly into "They Can Hear".
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
