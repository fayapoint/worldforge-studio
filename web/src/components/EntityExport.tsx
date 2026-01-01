"use client";

import { useState } from "react";
import type { Entity, Project } from "@/lib/models";
import { Badge, Card, Icon, PrimaryButton, SecondaryButton } from "@/lib/ui";
import { generatePrompt, type ExportMode } from "@/lib/promptGeneration";

type EntityExportProps = {
  entity: Entity;
  project: Project;
  relatedEntities?: Entity[];
  onClose: () => void;
};

export function EntityExport({ entity, project, relatedEntities, onClose }: EntityExportProps) {
  const [selectedMode, setSelectedMode] = useState<ExportMode>("text-generation");
  const [generatedPrompt, setGeneratedPrompt] = useState<string>("");
  const [copied, setCopied] = useState(false);

  const modes: { value: ExportMode; label: string; icon: string; description: string }[] = [
    {
      value: "text-generation",
      label: "Text Generation",
      icon: "edit",
      description: "Optimized prompt for AI text/story generation tools",
    },
    {
      value: "image-generation",
      label: "Image Generation",
      icon: "image",
      description: "Detailed visual prompt for AI image generators",
    },
    {
      value: "full-profile",
      label: "Full Profile",
      icon: "file",
      description: "Complete entity profile for reference or export",
    },
  ];

  const handleGenerate = () => {
    const prompt = generatePrompt(
      {
        project,
        entity,
        relatedEntities,
      },
      selectedMode
    );
    setGeneratedPrompt(prompt);
  };

  const handleCopy = async () => {
    await navigator.clipboard.writeText(generatedPrompt);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = () => {
    const blob = new Blob([generatedPrompt], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `${entity.name.replace(/\s+/g, "_")}_${selectedMode}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  return (
    <div className="space-y-4">
      <Card className="p-6">
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-lg font-semibold text-zinc-900">Export Entity</h3>
              <p className="text-sm text-zinc-600">
                Generate optimized prompts for different AI tools
              </p>
            </div>
            <Badge tone="neutral">{entity.type}</Badge>
          </div>
        </div>

        <div className="space-y-6">
          <div>
            <label className="mb-3 block text-sm font-medium text-zinc-900">
              Export Mode
            </label>
            <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
              {modes.map((mode) => (
                <button
                  key={mode.value}
                  type="button"
                  onClick={() => setSelectedMode(mode.value)}
                  className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all ${
                    selectedMode === mode.value
                      ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                      : "border-zinc-200 bg-white hover:border-indigo-300 hover:bg-indigo-50"
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <div
                      className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                        selectedMode === mode.value
                          ? "bg-indigo-500 text-white"
                          : "bg-zinc-100 text-zinc-600"
                      }`}
                    >
                      <Icon name={mode.icon as any} className="h-4 w-4" />
                    </div>
                    <div className="text-sm font-medium text-zinc-900">{mode.label}</div>
                  </div>
                  <div className="text-xs text-zinc-600">{mode.description}</div>
                </button>
              ))}
            </div>
          </div>

          {!generatedPrompt ? (
            <PrimaryButton onClick={handleGenerate} className="w-full">
              <Icon name="sparkles" className="h-4 w-4" />
              Generate Prompt
            </PrimaryButton>
          ) : (
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-zinc-900">Generated Prompt</label>
                <div className="flex gap-2">
                  <SecondaryButton onClick={handleCopy} className="!px-3 !py-1.5">
                    {copied ? (
                      <>
                        <Icon name="check" className="h-3.5 w-3.5" />
                        Copied!
                      </>
                    ) : (
                      "Copy"
                    )}
                  </SecondaryButton>
                  <SecondaryButton onClick={handleDownload} className="!px-3 !py-1.5">
                    Download
                  </SecondaryButton>
                </div>
              </div>
              <div className="relative">
                <textarea
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-3 font-mono text-xs shadow-sm"
                  value={generatedPrompt}
                  readOnly
                  rows={20}
                />
              </div>
              <SecondaryButton onClick={() => setGeneratedPrompt("")} className="w-full">
                Generate Different Mode
              </SecondaryButton>
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end gap-2 border-t border-zinc-200 pt-6">
          <SecondaryButton onClick={onClose}>Close</SecondaryButton>
        </div>
      </Card>
    </div>
  );
}
