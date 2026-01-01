"use client";

import { useState, useMemo } from "react";
import type { Entity, Project, EntityType } from "@/lib/models";
import { Badge, Card, Icon, PrimaryButton, SecondaryButton } from "@/lib/ui";
import { generatePrompt, type ExportMode } from "@/lib/promptGeneration";
import { WIZARD_CONFIGS, QUICK_SELECT_OPTIONS, type WizardFieldOption } from "@/lib/wizardConfig";

type EntityExportEnhancedProps = {
  entity: Entity;
  project: Project;
  relatedEntities?: Entity[];
  onClose: () => void;
};

type ExportTab = "json" | "prompt" | "attributes";

type AttributeCategory = {
  id: string;
  label: string;
  icon: string;
  fields: AttributeField[];
};

type AttributeField = {
  key: string;
  label: string;
  icon: string;
  value: any;
  included: boolean;
};

const ENTITY_ATTRIBUTE_CATEGORIES: Record<EntityType, AttributeCategory[]> = {
  CHARACTER: [
    {
      id: "identity",
      label: "Identity",
      icon: "character",
      fields: [
        { key: "name", label: "Name", icon: "character", value: null, included: true },
        { key: "fullName", label: "Full Name", icon: "character", value: null, included: true },
        { key: "aliases", label: "Aliases", icon: "users", value: null, included: true },
        { key: "pronouns", label: "Pronouns", icon: "character", value: null, included: true },
        { key: "age", label: "Age", icon: "clock", value: null, included: true },
      ],
    },
    {
      id: "role",
      label: "Story Role",
      icon: "star",
      fields: [
        { key: "role", label: "Role", icon: "star", value: null, included: true },
        { key: "archetype", label: "Archetype", icon: "shield", value: null, included: true },
        { key: "occupation", label: "Occupation", icon: "book", value: null, included: true },
      ],
    },
    {
      id: "appearance",
      label: "Appearance",
      icon: "eye",
      fields: [
        { key: "build", label: "Build", icon: "character", value: null, included: true },
        { key: "height", label: "Height", icon: "character", value: null, included: true },
        { key: "hairColor", label: "Hair Color", icon: "palette", value: null, included: true },
        { key: "hairStyle", label: "Hair Style", icon: "palette", value: null, included: true },
        { key: "eyeColor", label: "Eye Color", icon: "eye", value: null, included: true },
        { key: "skinTone", label: "Skin Tone", icon: "palette", value: null, included: true },
        { key: "distinguishingFeatures", label: "Features", icon: "star", value: null, included: true },
        { key: "appearance", label: "Description", icon: "edit", value: null, included: true },
      ],
    },
    {
      id: "personality",
      label: "Personality",
      icon: "brain",
      fields: [
        { key: "personalityTraits", label: "Traits", icon: "brain", value: null, included: true },
        { key: "personality", label: "Description", icon: "edit", value: null, included: true },
        { key: "strengths", label: "Strengths", icon: "shield", value: null, included: true },
        { key: "weaknesses", label: "Weaknesses", icon: "alert", value: null, included: true },
        { key: "skills", label: "Skills", icon: "star", value: null, included: true },
      ],
    },
    {
      id: "background",
      label: "Background",
      icon: "book",
      fields: [
        { key: "backstorySummary", label: "Summary", icon: "book", value: null, included: true },
        { key: "backstory", label: "Full Story", icon: "edit", value: null, included: true },
        { key: "primaryGoal", label: "Goal", icon: "target", value: null, included: true },
        { key: "primaryFear", label: "Fear", icon: "skull", value: null, included: true },
        { key: "internalConflict", label: "Conflict", icon: "flame", value: null, included: true },
        { key: "motivation", label: "Motivation", icon: "heart", value: null, included: true },
      ],
    },
    {
      id: "voice",
      label: "Voice & Dialog",
      icon: "mic",
      fields: [
        { key: "voiceNotes", label: "Voice Notes", icon: "mic", value: null, included: true },
      ],
    },
    {
      id: "media",
      label: "Media",
      icon: "image",
      fields: [
        { key: "thumbnailUrl", label: "Thumbnail", icon: "image", value: null, included: true },
        { key: "faceUrl", label: "Face", icon: "character", value: null, included: true },
        { key: "poseUrls", label: "Poses", icon: "camera", value: null, included: true },
        { key: "referenceUrls", label: "References", icon: "layers", value: null, included: true },
      ],
    },
  ],
  LOCATION: [
    {
      id: "basics",
      label: "Basic Info",
      icon: "location",
      fields: [
        { key: "name", label: "Name", icon: "location", value: null, included: true },
        { key: "locationType", label: "Type", icon: "layers", value: null, included: true },
        { key: "region", label: "Region", icon: "world", value: null, included: true },
      ],
    },
    {
      id: "description",
      label: "Description",
      icon: "eye",
      fields: [
        { key: "atmosphere", label: "Atmosphere", icon: "cloud", value: null, included: true },
        { key: "visualDescription", label: "Visual", icon: "eye", value: null, included: true },
        { key: "keyFeatures", label: "Features", icon: "star", value: null, included: true },
      ],
    },
    {
      id: "context",
      label: "Context",
      icon: "book",
      fields: [
        { key: "significance", label: "Significance", icon: "target", value: null, included: true },
        { key: "inhabitants", label: "Inhabitants", icon: "users", value: null, included: true },
      ],
    },
  ],
  FACTION: [
    {
      id: "basics",
      label: "Basic Info",
      icon: "faction",
      fields: [
        { key: "name", label: "Name", icon: "faction", value: null, included: true },
        { key: "factionType", label: "Type", icon: "layers", value: null, included: true },
        { key: "alignment", label: "Alignment", icon: "balance", value: null, included: true },
      ],
    },
    {
      id: "identity",
      label: "Identity",
      icon: "target",
      fields: [
        { key: "purpose", label: "Purpose", icon: "target", value: null, included: true },
        { key: "ideology", label: "Ideology", icon: "brain", value: null, included: true },
        { key: "methods", label: "Methods", icon: "shield", value: null, included: true },
      ],
    },
    {
      id: "structure",
      label: "Structure",
      icon: "users",
      fields: [
        { key: "leadership", label: "Leadership", icon: "star", value: null, included: true },
        { key: "size", label: "Size", icon: "users", value: null, included: true },
        { key: "resources", label: "Resources", icon: "item", value: null, included: true },
      ],
    },
  ],
  ITEM: [
    {
      id: "basics",
      label: "Basic Info",
      icon: "item",
      fields: [
        { key: "name", label: "Name", icon: "item", value: null, included: true },
        { key: "itemType", label: "Type", icon: "layers", value: null, included: true },
        { key: "rarity", label: "Rarity", icon: "star", value: null, included: true },
      ],
    },
    {
      id: "description",
      label: "Description",
      icon: "eye",
      fields: [
        { key: "appearance", label: "Appearance", icon: "eye", value: null, included: true },
        { key: "properties", label: "Properties", icon: "sparkles", value: null, included: true },
      ],
    },
    {
      id: "history",
      label: "History",
      icon: "book",
      fields: [
        { key: "origin", label: "Origin", icon: "history", value: null, included: true },
        { key: "significance", label: "Significance", icon: "target", value: null, included: true },
      ],
    },
  ],
  RULE: [
    {
      id: "basics",
      label: "Basic Info",
      icon: "rule",
      fields: [
        { key: "name", label: "Name", icon: "rule", value: null, included: true },
        { key: "category", label: "Category", icon: "layers", value: null, included: true },
      ],
    },
    {
      id: "mechanics",
      label: "Mechanics",
      icon: "settings",
      fields: [
        { key: "description", label: "Description", icon: "edit", value: null, included: true },
        { key: "limitations", label: "Limitations", icon: "alert", value: null, included: true },
      ],
    },
    {
      id: "impact",
      label: "Impact",
      icon: "target",
      fields: [
        { key: "storyImplications", label: "Implications", icon: "book", value: null, included: true },
      ],
    },
  ],
  LORE: [
    {
      id: "basics",
      label: "Basic Info",
      icon: "lore",
      fields: [
        { key: "name", label: "Name", icon: "lore", value: null, included: true },
        { key: "category", label: "Category", icon: "layers", value: null, included: true },
      ],
    },
    {
      id: "content",
      label: "Content",
      icon: "book",
      fields: [
        { key: "content", label: "Content", icon: "edit", value: null, included: true },
        { key: "truthLevel", label: "Truth Level", icon: "eye", value: null, included: true },
      ],
    },
    {
      id: "relevance",
      label: "Relevance",
      icon: "target",
      fields: [
        { key: "relevance", label: "Relevance", icon: "target", value: null, included: true },
      ],
    },
  ],
};

export function EntityExportEnhanced({ entity, project, relatedEntities, onClose }: EntityExportEnhancedProps) {
  const [activeTab, setActiveTab] = useState<ExportTab>("json");
  const [promptMode, setPromptMode] = useState<ExportMode>("text-generation");
  const [generatedPrompt, setGeneratedPrompt] = useState<string>("");
  const [copied, setCopied] = useState(false);

  // Build initial categories with values from entity
  const initialCategories = useMemo(() => {
    const baseCats = ENTITY_ATTRIBUTE_CATEGORIES[entity.type] || [];
    return baseCats.map((cat) => ({
      ...cat,
      fields: cat.fields.map((field) => {
        let value: any = null;
        
        // Check entity root
        if (field.key === "name") value = entity.name;
        else if (field.key === "summary") value = entity.summary;
        // Check character details
        else if (entity.character && field.key in entity.character) {
          value = (entity.character as any)[field.key];
        }
        // Check media
        else if (entity.media && field.key in entity.media) {
          value = (entity.media as any)[field.key];
        }
        // Check attributes (wizard data)
        else if (entity.attributes && field.key in entity.attributes) {
          value = entity.attributes[field.key];
        }

        return { ...field, value, included: value != null && value !== "" && (!Array.isArray(value) || value.length > 0) };
      }),
    }));
  }, [entity]);

  const [categories, setCategories] = useState(initialCategories);

  // Toggle field inclusion
  const toggleField = (catId: string, fieldKey: string) => {
    setCategories((cats) =>
      cats.map((cat) =>
        cat.id === catId
          ? {
              ...cat,
              fields: cat.fields.map((f) =>
                f.key === fieldKey ? { ...f, included: !f.included } : f
              ),
            }
          : cat
      )
    );
  };

  // Toggle all in category
  const toggleCategory = (catId: string, include: boolean) => {
    setCategories((cats) =>
      cats.map((cat) =>
        cat.id === catId
          ? { ...cat, fields: cat.fields.map((f) => ({ ...f, included: f.value != null && include })) }
          : cat
      )
    );
  };

  // Build JSON export based on selected fields
  const buildExportJson = () => {
    const result: Record<string, any> = {
      _type: entity.type,
      _exportedAt: new Date().toISOString(),
      _project: project.title,
    };

    categories.forEach((cat) => {
      cat.fields.forEach((field) => {
        if (field.included && field.value != null) {
          result[field.key] = field.value;
        }
      });
    });

    // Add summary if exists
    if (entity.summary) {
      result.summary = entity.summary;
    }

    // Add relationships
    if (entity.relationships?.length) {
      result.relationships = entity.relationships.map((rel) => {
        const related = relatedEntities?.find((e) => e._id === rel.toEntityId);
        return {
          type: rel.relType,
          entity: related?.name || rel.toEntityId,
          note: rel.note,
        };
      });
    }

    return result;
  };

  const exportJson = useMemo(() => JSON.stringify(buildExportJson(), null, 2), [categories, entity, project]);

  // Count included fields
  const includedCount = categories.reduce(
    (acc, cat) => acc + cat.fields.filter((f) => f.included && f.value != null).length,
    0
  );
  const totalCount = categories.reduce(
    (acc, cat) => acc + cat.fields.filter((f) => f.value != null).length,
    0
  );

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  const handleDownload = (content: string, filename: string) => {
    const blob = new Blob([content], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  };

  const handleGeneratePrompt = () => {
    const prompt = generatePrompt(
      { project, entity, relatedEntities, wizardData: entity.attributes },
      promptMode
    );
    setGeneratedPrompt(prompt);
  };

  const promptModes: { value: ExportMode; label: string; icon: string; description: string }[] = [
    { value: "text-generation", label: "Text Gen", icon: "edit", description: "For AI story writing" },
    { value: "image-generation", label: "Image Gen", icon: "image", description: "For AI image creation" },
    { value: "full-profile", label: "Full Profile", icon: "file", description: "Complete entity data" },
  ];

  const tabs = [
    { id: "json" as const, label: "JSON Export", icon: "exports" },
    { id: "attributes" as const, label: "Select Fields", icon: "settings" },
    { id: "prompt" as const, label: "AI Prompts", icon: "sparkles" },
  ];

  return (
    <div className="space-y-4">
      <Card className="p-6">
        {/* Header */}
        <div className="mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-100 to-purple-100">
                <Icon name={entity.type.toLowerCase() as any} className="h-6 w-6 text-indigo-700" />
              </div>
              <div>
                <h3 className="text-lg font-semibold text-zinc-900">{entity.name}</h3>
                <p className="text-sm text-zinc-600">Export & Customize</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Badge tone="neutral">{entity.type}</Badge>
              <Badge tone="success">{includedCount}/{totalCount} fields</Badge>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <div className="mb-6 flex gap-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "border-indigo-500 bg-indigo-50 text-indigo-900"
                  : "border-zinc-200 bg-white text-zinc-700 hover:border-indigo-300 hover:bg-indigo-50"
              }`}
            >
              <Icon name={tab.icon as any} className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* JSON Export Tab */}
        {activeTab === "json" && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <label className="text-sm font-medium text-zinc-900">Structured JSON Export</label>
              <div className="flex gap-2">
                <SecondaryButton onClick={() => handleCopy(exportJson)} className="!px-3 !py-1.5">
                  {copied ? (
                    <>
                      <Icon name="check" className="h-3.5 w-3.5" />
                      Copied!
                    </>
                  ) : (
                    <>
                      <Icon name="copy" className="h-3.5 w-3.5" />
                      Copy
                    </>
                  )}
                </SecondaryButton>
                <SecondaryButton
                  onClick={() => handleDownload(exportJson, `${entity.name.replace(/\s+/g, "_")}.json`)}
                  className="!px-3 !py-1.5"
                >
                  <Icon name="download" className="h-3.5 w-3.5" />
                  Download
                </SecondaryButton>
              </div>
            </div>
            <div className="relative">
              <textarea
                className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 font-mono text-xs text-zinc-800 shadow-sm"
                value={exportJson}
                readOnly
                rows={20}
              />
            </div>
            <p className="text-xs text-zinc-500">
              Use the "Select Fields" tab to customize which attributes are included in the export.
            </p>
          </div>
        )}

        {/* Attributes Selection Tab */}
        {activeTab === "attributes" && (
          <div className="space-y-4">
            <p className="text-sm text-zinc-600">
              Select which attributes to include in your export. Click on any field to toggle it.
            </p>

            <div className="space-y-4">
              {categories.map((cat) => {
                const catFieldsWithValue = cat.fields.filter((f) => f.value != null);
                const catIncluded = catFieldsWithValue.filter((f) => f.included).length;
                const allIncluded = catIncluded === catFieldsWithValue.length && catFieldsWithValue.length > 0;

                if (catFieldsWithValue.length === 0) return null;

                return (
                  <div key={cat.id} className="rounded-xl border border-zinc-200 bg-white p-4">
                    <div className="mb-3 flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-indigo-100">
                          <Icon name={cat.icon as any} className="h-4 w-4 text-indigo-700" />
                        </div>
                        <span className="text-sm font-semibold text-zinc-900">{cat.label}</span>
                        <Badge tone={catIncluded > 0 ? "success" : "neutral"}>
                          {catIncluded}/{catFieldsWithValue.length}
                        </Badge>
                      </div>
                      <button
                        onClick={() => toggleCategory(cat.id, !allIncluded)}
                        className="text-xs text-indigo-600 hover:text-indigo-800"
                      >
                        {allIncluded ? "Deselect all" : "Select all"}
                      </button>
                    </div>

                    <div className="grid grid-cols-2 gap-2 sm:grid-cols-3 md:grid-cols-4">
                      {catFieldsWithValue.map((field) => (
                        <button
                          key={field.key}
                          onClick={() => toggleField(cat.id, field.key)}
                          className={`flex items-center gap-2 rounded-xl border p-3 text-left transition-all ${
                            field.included
                              ? "border-indigo-500 bg-indigo-50 ring-1 ring-indigo-200"
                              : "border-zinc-200 bg-zinc-50 hover:border-zinc-300"
                          }`}
                        >
                          <div
                            className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-lg ${
                              field.included ? "bg-indigo-500 text-white" : "bg-zinc-200 text-zinc-600"
                            }`}
                          >
                            <Icon name={field.icon as any} className="h-4 w-4" />
                          </div>
                          <div className="min-w-0 flex-1">
                            <div className={`text-xs font-medium ${field.included ? "text-indigo-900" : "text-zinc-700"}`}>
                              {field.label}
                            </div>
                            <div className="truncate text-[10px] text-zinc-500">
                              {Array.isArray(field.value)
                                ? `${field.value.length} items`
                                : typeof field.value === "string"
                                  ? field.value.slice(0, 30) + (field.value.length > 30 ? "..." : "")
                                  : String(field.value)}
                            </div>
                          </div>
                          {field.included && (
                            <Icon name="check" className="h-4 w-4 flex-shrink-0 text-indigo-500" />
                          )}
                        </button>
                      ))}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Prompt Generation Tab */}
        {activeTab === "prompt" && (
          <div className="space-y-6">
            <div>
              <label className="mb-3 block text-sm font-medium text-zinc-900">Prompt Type</label>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-3">
                {promptModes.map((mode) => (
                  <button
                    key={mode.value}
                    type="button"
                    onClick={() => {
                      setPromptMode(mode.value);
                      setGeneratedPrompt("");
                    }}
                    className={`flex flex-col items-start gap-2 rounded-xl border p-4 text-left transition-all ${
                      promptMode === mode.value
                        ? "border-indigo-500 bg-indigo-50 ring-2 ring-indigo-200"
                        : "border-zinc-200 bg-white hover:border-indigo-300 hover:bg-indigo-50"
                    }`}
                  >
                    <div className="flex items-center gap-2">
                      <div
                        className={`flex h-8 w-8 items-center justify-center rounded-lg ${
                          promptMode === mode.value
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
              <PrimaryButton onClick={handleGeneratePrompt} className="w-full">
                <Icon name="sparkles" className="h-4 w-4" />
                Generate {promptModes.find((m) => m.value === promptMode)?.label} Prompt
              </PrimaryButton>
            ) : (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <label className="text-sm font-medium text-zinc-900">Generated Prompt</label>
                  <div className="flex gap-2">
                    <SecondaryButton onClick={() => handleCopy(generatedPrompt)} className="!px-3 !py-1.5">
                      {copied ? "Copied!" : "Copy"}
                    </SecondaryButton>
                    <SecondaryButton
                      onClick={() =>
                        handleDownload(generatedPrompt, `${entity.name.replace(/\s+/g, "_")}_${promptMode}.txt`)
                      }
                      className="!px-3 !py-1.5"
                    >
                      Download
                    </SecondaryButton>
                  </div>
                </div>
                <textarea
                  className="w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 py-3 font-mono text-xs text-zinc-800 shadow-sm"
                  value={generatedPrompt}
                  readOnly
                  rows={18}
                />
                <SecondaryButton onClick={() => setGeneratedPrompt("")} className="w-full">
                  Generate Different Type
                </SecondaryButton>
              </div>
            )}
          </div>
        )}

        {/* Footer */}
        <div className="mt-6 flex justify-end gap-2 border-t border-zinc-200 pt-6">
          <SecondaryButton onClick={onClose}>Close</SecondaryButton>
        </div>
      </Card>
    </div>
  );
}
