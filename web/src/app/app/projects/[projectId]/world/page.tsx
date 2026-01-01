"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/apiClient";
import type { CharacterDetails, Entity, EntityMedia, EntityType, Project } from "@/lib/models";
import { Badge, Card, CardHint, CardTitle, Icon, PrimaryButton, SectionHeader, SecondaryButton } from "@/lib/ui";
import { EntityWizard } from "@/components/EntityWizard";
import { EntityExportEnhanced } from "@/components/EntityExportEnhanced";
import { ImageGalleryModal } from "@/components/ImageGalleryModal";
import { SeedTCHButton } from "@/components/SeedTCHButton";
import { getTransformedUrl } from "@/lib/cloudinaryUtils";

type AIField = "personality" | "appearance" | "backstory" | "motivation" | "voiceNotes" | "summary" | "all";

const AI_FIELD_CONFIG: Record<AIField, { label: string; icon: string; description: string }> = {
  personality: { label: "Personality", icon: "brain", description: "Generate personality traits and behavior patterns" },
  appearance: { label: "Appearance", icon: "eye", description: "Generate physical description for image prompts" },
  backstory: { label: "Backstory", icon: "book", description: "Generate formative history and key events" },
  motivation: { label: "Motivation", icon: "target", description: "Generate goals, desires and fears" },
  voiceNotes: { label: "Voice", icon: "mic", description: "Generate speech patterns and dialogue tips" },
  summary: { label: "Summary", icon: "sparkles", description: "Generate a memorable one-paragraph essence" },
  all: { label: "Generate All", icon: "wand", description: "AI generates all character fields at once" },
};

function typeIcon(type: EntityType) {
  switch (type) {
    case "CHARACTER":
      return "character" as const;
    case "LOCATION":
      return "location" as const;
    case "FACTION":
      return "faction" as const;
    case "ITEM":
      return "item" as const;
    case "RULE":
      return "rule" as const;
    case "LORE":
      return "lore" as const;
  }
}

function safeParseJson(text: string): { ok: true; value: any } | { ok: false; error: string } {
  try {
    return { ok: true, value: text.trim() ? JSON.parse(text) : {} };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : "Invalid JSON" };
  }
}

function parseCsvList(input: string): string[] {
  return input
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);
}

function normalizeUrl(u: string): string | undefined {
  const t = u.trim();
  return t ? t : undefined;
}

export default function WorldPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;

  const [items, setItems] = useState<Entity[]>([]);
  const [query, setQuery] = useState("");
  const [type, setType] = useState<EntityType | "">("");
  const [error, setError] = useState<string | null>(null);

  const [newType, setNewType] = useState<EntityType>("CHARACTER");
  const [newName, setNewName] = useState("");
  const [newSummary, setNewSummary] = useState("");

  const [selectedId, setSelectedId] = useState<string | null>(null);
  const selected = useMemo(() => items.find((e) => e._id === selectedId) ?? null, [items, selectedId]);

  const [editSummary, setEditSummary] = useState("");
  const [editAttributes, setEditAttributes] = useState("{}");
  const [editMedia, setEditMedia] = useState<EntityMedia>({});
  const [editCharacter, setEditCharacter] = useState<CharacterDetails>({});

  const thumbInputRef = useRef<HTMLInputElement | null>(null);
  const faceInputRef = useRef<HTMLInputElement | null>(null);
  const poseInputRef = useRef<HTMLInputElement | null>(null);
  const refInputRef = useRef<HTMLInputElement | null>(null);

  const [linkToId, setLinkToId] = useState("");
  const [linkRelType, setLinkRelType] = useState("");

  const [aiLoading, setAiLoading] = useState<AIField | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);

  const [showWizard, setShowWizard] = useState(false);
  const [wizardType, setWizardType] = useState<EntityType>("CHARACTER");
  const [wizardEditEntity, setWizardEditEntity] = useState<Entity | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [showGallery, setShowGallery] = useState(false);
  const [galleryInitialUrl, setGalleryInitialUrl] = useState<string | undefined>();
  const [project, setProject] = useState<Project | null>(null);
  const [wizardGenerating, setWizardGenerating] = useState(false);

  const load = useCallback(async () => {
    setError(null);
    const qs = new URLSearchParams();
    if (query.trim()) qs.set("query", query.trim());
    if (type) qs.set("type", type);

    const res = await apiFetch<{ items: Entity[] }>(`/api/projects/${projectId}/entities?${qs.toString()}`);
    if (!res.ok) {
      setError(`${res.error.code}: ${res.error.message}`);
      return;
    }
    setItems(res.data.items);
  }, [projectId, query, type]);

  useEffect(() => {
    void load();
  }, [load]);

  useEffect(() => {
    async function loadProject() {
      const res = await apiFetch<{ project: Project }>(`/api/projects/${projectId}`);
      if (res.ok) {
        setProject(res.data.project);
      }
    }
    void loadProject();
  }, [projectId]);

  useEffect(() => {
    if (selected) {
      setEditSummary(selected.summary ?? "");
      setEditAttributes(JSON.stringify(selected.attributes ?? {}, null, 2));
      setEditMedia((selected.media ?? {}) as EntityMedia);
      setEditCharacter((selected.character ?? {}) as CharacterDetails);
    }
  }, [selected]);

  async function create() {
    setError(null);
    const res = await apiFetch<{ entity: Entity }>(`/api/projects/${projectId}/entities`, {
      method: "POST",
      body: JSON.stringify({
        type: newType,
        name: newName,
        summary: newSummary,
        attributes: {},
        relationships: [],
      }),
    });

    if (!res.ok) {
      setError(`${res.error.code}: ${res.error.message}`);
      return;
    }

    setNewName("");
    setNewSummary("");
    await load();
  }

  async function cloudinaryUpload(file: File, slot: "thumbnail" | "face" | "pose" | "reference") {
    if (!selected) return;
    setError(null);

    const folder = `tch/${projectId}/entities/${selected._id}`;
    const res = await apiFetch<{
      cloudName: string;
      apiKey: string;
      timestamp: number;
      signature: string;
      folder: string;
      publicId: string;
      tags: string[];
      overwrite: boolean;
    }>(`/api/projects/${projectId}/cloudinary/sign`, {
      method: "POST",
      body: JSON.stringify({
        folder,
        tags: ["tch", projectId, selected._id, slot],
        overwrite: true,
      }),
    });

    if (!res.ok) {
      setError(`${res.error.code}: ${res.error.message}`);
      return;
    }

    const fd = new FormData();
    fd.set("file", file);
    fd.set("api_key", res.data.apiKey);
    fd.set("timestamp", String(res.data.timestamp));
    fd.set("signature", res.data.signature);
    if (res.data.folder) fd.set("folder", res.data.folder);
    if (res.data.publicId) fd.set("public_id", res.data.publicId);
    if (res.data.tags?.length) fd.set("tags", res.data.tags.join(","));
    fd.set("overwrite", res.data.overwrite ? "true" : "false");

    const up = await fetch(`https://api.cloudinary.com/v1_1/${res.data.cloudName}/image/upload`, {
      method: "POST",
      body: fd,
    });

    const json = (await up.json()) as any;
    if (!up.ok) {
      setError(`CLOUDINARY_ERROR: ${json?.error?.message ?? "upload failed"}`);
      return;
    }

    const secureUrl = String(json.secure_url ?? json.url ?? "");
    const publicId = String(json.public_id ?? "");

    if (!secureUrl || !publicId) {
      setError("CLOUDINARY_ERROR: missing secure_url/public_id");
      return;
    }

    const cur = editMedia ?? {};
    let newMedia: EntityMedia;

    if (slot === "thumbnail") {
      newMedia = { ...cur, thumbnailUrl: secureUrl, thumbnailPublicId: publicId };
    } else if (slot === "face") {
      newMedia = { ...cur, faceUrl: secureUrl, facePublicId: publicId };
    } else if (slot === "pose") {
      newMedia = {
        ...cur,
        poseUrls: [...(cur.poseUrls ?? []), secureUrl],
        posePublicIds: [...(cur.posePublicIds ?? []), publicId],
      };
    } else {
      newMedia = {
        ...cur,
        referenceUrls: [...(cur.referenceUrls ?? []), secureUrl],
        referencePublicIds: [...(cur.referencePublicIds ?? []), publicId],
      };
    }

    setEditMedia(newMedia);

    // Auto-save the media to database
    const saveRes = await apiFetch<{ entity: Entity }>(
      `/api/projects/${projectId}/entities/${selected._id}`,
      {
        method: "PATCH",
        body: JSON.stringify({ media: newMedia }),
      },
    );

    if (!saveRes.ok) {
      setError(`${saveRes.error.code}: ${saveRes.error.message}`);
    }
  }

  async function save() {
    if (!selected) return;

    const parsed = safeParseJson(editAttributes);
    if (!parsed.ok) {
      setError(`VALIDATION_ERROR: ${parsed.error}`);
      return;
    }

    const res = await apiFetch<{ entity: Entity }>(
      `/api/projects/${projectId}/entities/${selected._id}`,
      {
        method: "PATCH",
        body: JSON.stringify({
          summary: editSummary,
          media: editMedia,
          character: selected.type === "CHARACTER" ? editCharacter : undefined,
          attributes: parsed.value,
        }),
      },
    );

    if (!res.ok) {
      setError(`${res.error.code}: ${res.error.message}`);
      return;
    }

    await load();
  }

  async function deleteEntity(entityId: string) {
    if (!confirm(`Delete this entity? This action cannot be undone.`)) return;
    
    setError(null);
    const res = await apiFetch<{ deleted: boolean }>(
      `/api/projects/${projectId}/entities/${entityId}`,
      { method: "DELETE" },
    );

    if (!res.ok) {
      setError(`${res.error.code}: ${res.error.message}`);
      return;
    }

    setSelectedId(null);
    await load();
  }

  async function link() {
    if (!selected) return;
    if (!linkToId || !linkRelType) {
      setError("VALIDATION_ERROR: toEntityId and relType are required");
      return;
    }

    const res = await apiFetch<{ entity: Entity }>(
      `/api/projects/${projectId}/entities/${selected._id}/link`,
      { method: "POST", body: JSON.stringify({ toEntityId: linkToId, relType: linkRelType }) },
    );

    if (!res.ok) {
      setError(`${res.error.code}: ${res.error.message}`);
      return;
    }

    setLinkToId("");
    setLinkRelType("");
    await load();
  }

  async function handleWizardComplete(wizardData: Record<string, any>) {
    setWizardGenerating(true);
    setError(null);

    try {
      const generateRes = await apiFetch<{ generated: Record<string, string> }>(
        `/api/projects/${projectId}/ai/generate`,
        {
          method: "POST",
          body: JSON.stringify({
            mode: "wizard-complete",
            entityType: wizardType,
            wizardData,
          }),
        }
      );

      if (!generateRes.ok) {
        setError(`${generateRes.error.code}: ${generateRes.error.message}`);
        setWizardGenerating(false);
        return;
      }

      const generated = generateRes.data.generated || {};

      const entityPayload: any = {
        type: wizardType,
        name: wizardData.name || "Unnamed",
        summary: generated.summary || wizardData.backstorySummary || "",
        attributes: wizardData,
        relationships: [],
      };

      if (wizardType === "CHARACTER") {
        entityPayload.character = {
          fullName: wizardData.fullName,
          aliases: typeof wizardData.aliases === 'string' ? wizardData.aliases.split(',').map((s: string) => s.trim()) : wizardData.aliases,
          pronouns: wizardData.pronouns,
          age: wizardData.age || wizardData.ageRange,
          role: wizardData.role,
          occupation: wizardData.occupation,
          archetype: wizardData.archetype,
          personality: generated.personality,
          appearance: generated.appearance,
          backstory: generated.backstory,
          motivation: generated.motivation,
          skills: typeof wizardData.strengths === 'string' ? wizardData.strengths.split(',').map((s: string) => s.trim()) : wizardData.strengths,
          weaknesses: typeof wizardData.weaknesses === 'string' ? wizardData.weaknesses.split(',').map((s: string) => s.trim()) : wizardData.weaknesses,
          voiceNotes: generated.voiceNotes,
        };
      }

      // If editing existing entity, use PATCH, otherwise POST
      if (wizardEditEntity) {
        const updateRes = await apiFetch<{ entity: Entity }>(
          `/api/projects/${projectId}/entities/${wizardEditEntity._id}`,
          {
            method: "PATCH",
            body: JSON.stringify({
              name: entityPayload.name,
              summary: entityPayload.summary,
              attributes: entityPayload.attributes,
              character: entityPayload.character,
            }),
          }
        );

        if (!updateRes.ok) {
          setError(`${updateRes.error.code}: ${updateRes.error.message}`);
          setWizardGenerating(false);
          return;
        }

        setShowWizard(false);
        setWizardEditEntity(null);
        setWizardGenerating(false);
        await load();
      } else {
        const createRes = await apiFetch<{ entity: Entity }>(
          `/api/projects/${projectId}/entities`,
          {
            method: "POST",
            body: JSON.stringify(entityPayload),
          }
        );

        if (!createRes.ok) {
          setError(`${createRes.error.code}: ${createRes.error.message}`);
          setWizardGenerating(false);
          return;
        }

        setShowWizard(false);
        setWizardEditEntity(null);
        setWizardGenerating(false);
        await load();
        setSelectedId(createRes.data.entity._id);
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create entity");
      setWizardGenerating(false);
    }
  }

  function openWizard(type: EntityType, existingEntity?: Entity) {
    setWizardType(type);
    setWizardEditEntity(existingEntity || null);
    setShowWizard(true);
  }

  async function aiComplete(field: AIField) {
    if (!selected) return;
    setAiLoading(field);
    setAiError(null);

    const context: Record<string, unknown> = {
      name: selected.name,
      type: selected.type,
      summary: editSummary,
      ...editCharacter,
    };

    const res = await apiFetch<{ field: string; result: string | Record<string, string> }>(
      `/api/projects/${projectId}/ai/complete`,
      {
        method: "POST",
        body: JSON.stringify({
          entityId: selected._id,
          field,
          context,
        }),
      },
    );

    setAiLoading(null);

    if (!res.ok) {
      setAiError(`${res.error.code}: ${res.error.message}`);
      return;
    }

    if (field === "all" && typeof res.data.result === "object") {
      const r = res.data.result as Record<string, string>;
      setEditCharacter((c) => ({
        ...c,
        personality: r.personality || c.personality,
        appearance: r.appearance || c.appearance,
        backstory: r.backstory || c.backstory,
        motivation: r.motivation || c.motivation,
        voiceNotes: r.voiceNotes || c.voiceNotes,
      }));
      if (r.summary) setEditSummary(r.summary);
    } else if (field === "summary") {
      setEditSummary(String(res.data.result));
    } else {
      setEditCharacter((c) => ({
        ...c,
        [field]: String(res.data.result),
      }));
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <SectionHeader
          title="World Bible"
          subtitle="Entidades, relações e atributos. Tudo aqui alimenta continuidade e prompts." 
          icon="world"
        />
        <SeedTCHButton projectId={projectId} onComplete={load} />
      </div>

      {error ? (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">{error}</div>
      ) : null}

      <div className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_1fr]">
        <div className="space-y-4">
          <Card className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Search</CardTitle>
                <CardHint>Busca por texto e filtro por tipo.</CardHint>
              </div>
              <Badge>Index</Badge>
            </div>

            <div className="mt-3 space-y-3">
              <div className="relative w-full">
                <div className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 text-zinc-500">
                  <Icon name="search" className="h-4 w-4" />
                </div>
                <input
                  className="w-full rounded-lg border border-zinc-200 bg-white py-2 pl-9 pr-3 text-sm shadow-sm"
                  value={query}
                  onChange={(e) => setQuery(e.target.value)}
                  placeholder="Search text"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setType("")}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all ${
                    type === ""
                      ? "border-indigo-500 bg-indigo-50 text-indigo-900 font-semibold"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-indigo-300 hover:bg-indigo-50"
                  }`}
                >
                  <Icon name="world" className="h-4 w-4" />
                  All
                </button>
                <button
                  onClick={() => setType("CHARACTER")}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all ${
                    type === "CHARACTER"
                      ? "border-indigo-500 bg-indigo-50 text-indigo-900 font-semibold"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-indigo-300 hover:bg-indigo-50"
                  }`}
                >
                  <Icon name="character" className="h-4 w-4" />
                  Char
                </button>
                <button
                  onClick={() => setType("LOCATION")}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all ${
                    type === "LOCATION"
                      ? "border-indigo-500 bg-indigo-50 text-indigo-900 font-semibold"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-indigo-300 hover:bg-indigo-50"
                  }`}
                >
                  <Icon name="location" className="h-4 w-4" />
                  Loc
                </button>
                <button
                  onClick={() => setType("FACTION")}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all ${
                    type === "FACTION"
                      ? "border-indigo-500 bg-indigo-50 text-indigo-900 font-semibold"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-indigo-300 hover:bg-indigo-50"
                  }`}
                >
                  <Icon name="faction" className="h-4 w-4" />
                  Fact
                </button>
                <button
                  onClick={() => setType("ITEM")}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all ${
                    type === "ITEM"
                      ? "border-indigo-500 bg-indigo-50 text-indigo-900 font-semibold"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-indigo-300 hover:bg-indigo-50"
                  }`}
                >
                  <Icon name="item" className="h-4 w-4" />
                  Item
                </button>
                <button
                  onClick={() => setType("RULE")}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all ${
                    type === "RULE"
                      ? "border-indigo-500 bg-indigo-50 text-indigo-900 font-semibold"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-indigo-300 hover:bg-indigo-50"
                  }`}
                >
                  <Icon name="rule" className="h-4 w-4" />
                  Rule
                </button>
                <button
                  onClick={() => setType("LORE")}
                  className={`flex items-center justify-center gap-2 rounded-lg border px-3 py-2 text-sm transition-all ${
                    type === "LORE"
                      ? "border-indigo-500 bg-indigo-50 text-indigo-900 font-semibold"
                      : "border-zinc-200 bg-white text-zinc-700 hover:border-indigo-300 hover:bg-indigo-50"
                  }`}
                >
                  <Icon name="lore" className="h-4 w-4" />
                  Lore
                </button>
              </div>
              
              <SecondaryButton onClick={load} className="w-full">
                Refresh
              </SecondaryButton>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Create Entity</CardTitle>
                <CardHint>Use the wizard for guided creation with AI assistance</CardHint>
              </div>
              <Badge tone="success">Wizard</Badge>
            </div>

            <div className="mt-3 space-y-2">
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => openWizard("CHARACTER")}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-zinc-200 bg-white p-3 text-center shadow-sm transition-all hover:border-indigo-300 hover:bg-indigo-50"
                >
                  <Icon name="character" className="h-5 w-5 text-zinc-600" />
                  <span className="text-xs font-medium text-zinc-700">Character</span>
                </button>
                <button
                  onClick={() => openWizard("LOCATION")}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-zinc-200 bg-white p-3 text-center shadow-sm transition-all hover:border-indigo-300 hover:bg-indigo-50"
                >
                  <Icon name="location" className="h-5 w-5 text-zinc-600" />
                  <span className="text-xs font-medium text-zinc-700">Location</span>
                </button>
                <button
                  onClick={() => openWizard("FACTION")}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-zinc-200 bg-white p-3 text-center shadow-sm transition-all hover:border-indigo-300 hover:bg-indigo-50"
                >
                  <Icon name="faction" className="h-5 w-5 text-zinc-600" />
                  <span className="text-xs font-medium text-zinc-700">Faction</span>
                </button>
                <button
                  onClick={() => openWizard("ITEM")}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-zinc-200 bg-white p-3 text-center shadow-sm transition-all hover:border-indigo-300 hover:bg-indigo-50"
                >
                  <Icon name="item" className="h-5 w-5 text-zinc-600" />
                  <span className="text-xs font-medium text-zinc-700">Item</span>
                </button>
                <button
                  onClick={() => openWizard("RULE")}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-zinc-200 bg-white p-3 text-center shadow-sm transition-all hover:border-indigo-300 hover:bg-indigo-50"
                >
                  <Icon name="rule" className="h-5 w-5 text-zinc-600" />
                  <span className="text-xs font-medium text-zinc-700">Rule</span>
                </button>
                <button
                  onClick={() => openWizard("LORE")}
                  className="flex flex-col items-center gap-1.5 rounded-xl border border-zinc-200 bg-white p-3 text-center shadow-sm transition-all hover:border-indigo-300 hover:bg-indigo-50"
                >
                  <Icon name="lore" className="h-5 w-5 text-zinc-600" />
                  <span className="text-xs font-medium text-zinc-700">Lore</span>
                </button>
              </div>
            </div>
          </Card>

          <Card className="p-4">
            <div className="flex items-start justify-between gap-3">
              <div>
                <CardTitle>Entities</CardTitle>
                <CardHint>Selecione uma entidade para editar e linkar relacionamentos.</CardHint>
              </div>
              <Badge tone={items.length ? "success" : "neutral"}>{items.length}</Badge>
            </div>

            <div className="mt-3 max-h-[480px] space-y-2 overflow-auto">
              {items.length === 0 ? (
                <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-600">
                  Crie sua primeira entidade (Character/Location/etc.).
                </div>
              ) : null}
              {items.map((e) => (
                <button
                  key={e._id}
                  onClick={() => setSelectedId(e._id)}
                  className={`w-full rounded-xl border px-3 py-2 text-left text-sm shadow-sm transition-colors ${
                    e._id === selectedId ? "border-zinc-900 bg-zinc-50" : "border-zinc-200 bg-white hover:bg-zinc-50"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex items-center gap-2">
                        {e.media?.thumbnailUrl ? (
                          <img
                            src={e.media.thumbnailUrl}
                            alt={e.name}
                            className="h-8 w-8 rounded-lg border border-zinc-200 object-cover"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-lg border border-zinc-200 bg-white">
                            <Icon name={typeIcon(e.type)} className="h-4 w-4 text-zinc-700" />
                          </div>
                        )}
                        <div className="min-w-0">
                          <div className="truncate font-medium">{e.name}</div>
                          <div className="mt-0.5 text-xs text-zinc-500">{e.type}</div>
                        </div>
                      </div>
                    </div>
                    <Badge tone="neutral">Draft</Badge>
                  </div>
                </button>
              ))}
            </div>
          </Card>
        </div>

        <Card className="p-4">
          {!selected ? (
            <div className="rounded-2xl border border-dashed border-zinc-200 bg-zinc-50 p-6 text-sm text-zinc-600">
              Selecione uma entidade à esquerda para editar.
            </div>
          ) : (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-xs text-zinc-500">{selected.type}</div>
                  <div className="text-lg font-semibold">{selected.name}</div>
                </div>
                <div className="flex gap-2">
                  <PrimaryButton onClick={() => openWizard(selected.type, selected)} className="!px-3 !py-1.5">
                    <Icon name="wand" className="h-3.5 w-3.5" />
                    Edit with Wizard
                  </PrimaryButton>
                  <SecondaryButton onClick={() => setShowExport(true)} className="!px-3 !py-1.5">
                    <Icon name="exports" className="h-3.5 w-3.5" />
                    Export
                  </SecondaryButton>
                  <button
                    onClick={() => deleteEntity(selected._id)}
                    className="inline-flex items-center gap-1.5 rounded-lg border border-red-200 bg-red-50 px-3 py-1.5 text-sm font-medium text-red-700 hover:bg-red-100 transition-colors"
                  >
                    <Icon name="trash" className="h-3.5 w-3.5" />
                    Delete
                  </button>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="space-y-2">
                  <div className="text-sm font-medium">Thumbnail URL</div>
                  <input
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm"
                    value={editMedia.thumbnailUrl ?? ""}
                    onChange={(e) => setEditMedia((m) => ({ ...(m ?? {}), thumbnailUrl: normalizeUrl(e.target.value) }))}
                    placeholder="https://..."
                  />
                  <div className="flex items-center gap-2">
                    <SecondaryButton
                      onClick={() => thumbInputRef.current?.click()}
                      className="!px-3 !py-2"
                    >
                      Upload
                    </SecondaryButton>
                    <div className="text-xs text-zinc-500">
                      {editMedia.thumbnailPublicId ? "Cloudinary OK" : "No publicId"}
                    </div>
                  </div>
                  <input
                    ref={thumbInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      void cloudinaryUpload(f, "thumbnail");
                      e.target.value = "";
                    }}
                  />
                </div>
                <div className="space-y-2">
                  <div className="text-sm font-medium">Face URL</div>
                  <input
                    className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm"
                    value={editMedia.faceUrl ?? ""}
                    onChange={(e) => setEditMedia((m) => ({ ...(m ?? {}), faceUrl: normalizeUrl(e.target.value) }))}
                    placeholder="https://..."
                  />
                  <div className="flex items-center gap-2">
                    <SecondaryButton
                      onClick={() => faceInputRef.current?.click()}
                      className="!px-3 !py-2"
                    >
                      Upload
                    </SecondaryButton>
                    <div className="text-xs text-zinc-500">
                      {editMedia.facePublicId ? "Cloudinary OK" : "No publicId"}
                    </div>
                  </div>
                  <input
                    ref={faceInputRef}
                    type="file"
                    accept="image/*"
                    className="hidden"
                    onChange={(e) => {
                      const f = e.target.files?.[0];
                      if (!f) return;
                      void cloudinaryUpload(f, "face");
                      e.target.value = "";
                    }}
                  />
                </div>
              </div>

              {(editMedia.thumbnailUrl || editMedia.faceUrl) ? (
                <div className="grid grid-cols-2 gap-3">
                  <div className="rounded-xl border border-zinc-200 bg-white p-2 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-medium text-zinc-700">Thumbnail preview</div>
                      {editMedia.thumbnailUrl && (
                        <button
                          onClick={() => {
                            setGalleryInitialUrl(editMedia.thumbnailUrl);
                            setShowGallery(true);
                          }}
                          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800"
                        >
                          <Icon name="maximize" className="h-3 w-3" />
                          Expand
                        </button>
                      )}
                    </div>
                    {editMedia.thumbnailUrl ? (
                      <img
                        src={getTransformedUrl(editMedia.thumbnailUrl, { width: 400, height: 300, crop: "fill", gravity: "auto" })}
                        alt="thumbnail"
                        className="mt-2 h-36 w-full cursor-pointer rounded-lg border border-zinc-200 object-cover transition-all hover:border-indigo-300 hover:shadow-md"
                        onClick={() => {
                          setGalleryInitialUrl(editMedia.thumbnailUrl);
                          setShowGallery(true);
                        }}
                      />
                    ) : (
                      <div className="mt-2 h-36 w-full rounded-lg border border-dashed border-zinc-200 bg-zinc-50" />
                    )}
                  </div>
                  <div className="rounded-xl border border-zinc-200 bg-white p-2 shadow-sm">
                    <div className="flex items-center justify-between">
                      <div className="text-xs font-medium text-zinc-700">Face preview</div>
                      {editMedia.faceUrl && (
                        <button
                          onClick={() => {
                            setGalleryInitialUrl(editMedia.faceUrl);
                            setShowGallery(true);
                          }}
                          className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800"
                        >
                          <Icon name="maximize" className="h-3 w-3" />
                          Expand
                        </button>
                      )}
                    </div>
                    {editMedia.faceUrl ? (
                      <img
                        src={getTransformedUrl(editMedia.faceUrl, { width: 400, height: 300, crop: "fill", gravity: "face" })}
                        alt="face"
                        className="mt-2 h-36 w-full cursor-pointer rounded-lg border border-zinc-200 object-cover transition-all hover:border-indigo-300 hover:shadow-md"
                        onClick={() => {
                          setGalleryInitialUrl(editMedia.faceUrl);
                          setShowGallery(true);
                        }}
                      />
                    ) : (
                      <div className="mt-2 h-36 w-full rounded-lg border border-dashed border-zinc-200 bg-zinc-50" />
                    )}
                  </div>
                </div>
              ) : null}

              <div className="space-y-2">
                <div className="text-sm font-medium">Pose URLs (comma-separated)</div>
                <input
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm"
                  value={(editMedia.poseUrls ?? []).join(", ")}
                  onChange={(e) => setEditMedia((m) => ({ ...(m ?? {}), poseUrls: parseCsvList(e.target.value) }))}
                  placeholder="https://..., https://..."
                />
                <div className="flex items-center gap-2">
                  <SecondaryButton onClick={() => poseInputRef.current?.click()} className="!px-3 !py-2">
                    Add pose (upload)
                  </SecondaryButton>
                  <div className="text-xs text-zinc-500">{(editMedia.posePublicIds ?? []).length} publicIds</div>
                </div>
                <input
                  ref={poseInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    void cloudinaryUpload(f, "pose");
                    e.target.value = "";
                  }}
                />
              </div>

              <div className="space-y-2">
                <div className="text-sm font-medium">Reference URLs (comma-separated)</div>
                <input
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm"
                  value={(editMedia.referenceUrls ?? []).join(", ")}
                  onChange={(e) => setEditMedia((m) => ({ ...(m ?? {}), referenceUrls: parseCsvList(e.target.value) }))}
                  placeholder="https://..., https://..."
                />
                <div className="flex items-center gap-2">
                  <SecondaryButton onClick={() => refInputRef.current?.click()} className="!px-3 !py-2">
                    Add reference (upload)
                  </SecondaryButton>
                  <div className="text-xs text-zinc-500">{(editMedia.referencePublicIds ?? []).length} publicIds</div>
                </div>
                <input
                  ref={refInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) => {
                    const f = e.target.files?.[0];
                    if (!f) return;
                    void cloudinaryUpload(f, "reference");
                    e.target.value = "";
                  }}
                />
              </div>

              {(editMedia.poseUrls?.length || editMedia.referenceUrls?.length) ? (
                <div className="rounded-xl border border-zinc-200 bg-white p-3 shadow-sm">
                  <div className="flex items-center justify-between">
                    <div className="text-sm font-medium">Reference gallery</div>
                    <button
                      onClick={() => {
                        const firstUrl = editMedia.poseUrls?.[0] || editMedia.referenceUrls?.[0];
                        if (firstUrl) {
                          setGalleryInitialUrl(firstUrl);
                          setShowGallery(true);
                        }
                      }}
                      className="flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-800"
                    >
                      <Icon name="fullscreen" className="h-3 w-3" />
                      Open Gallery
                    </button>
                  </div>
                  <div className="mt-2 grid grid-cols-3 gap-2">
                    {[...(editMedia.poseUrls ?? []), ...(editMedia.referenceUrls ?? [])].slice(0, 12).map((u) => (
                      <img
                        key={u}
                        src={getTransformedUrl(u, { width: 200, height: 200, crop: "fill", gravity: "auto" })}
                        alt="ref"
                        className="h-24 w-full cursor-pointer rounded-lg border border-zinc-200 object-cover transition-all hover:border-indigo-300 hover:shadow-md"
                        onClick={() => {
                          setGalleryInitialUrl(u);
                          setShowGallery(true);
                        }}
                      />
                    ))}
                  </div>
                </div>
              ) : null}

              <div>
                <div className="mb-1 text-sm font-medium">Summary</div>
                <textarea
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm"
                  value={editSummary}
                  onChange={(e) => setEditSummary(e.target.value)}
                  rows={4}
                />
              </div>

              {selected.type === "CHARACTER" ? (
                <div className="space-y-4">
                  {/* AI Auto-Complete Section */}
                  <div className="rounded-2xl border border-indigo-200 bg-gradient-to-br from-indigo-50 via-purple-50 to-white p-4 shadow-sm">
                    <div className="flex items-center justify-between gap-3">
                      <div>
                        <div className="flex items-center gap-2 text-sm font-semibold text-indigo-900">
                          <Icon name="sparkles" className="h-4 w-4" />
                          AI Character Assistant
                        </div>
                        <div className="mt-0.5 text-xs text-indigo-700">
                          Click any button to auto-generate that field using AI
                        </div>
                      </div>
                      {aiLoading ? (
                        <Badge tone="warn">
                          <span className="animate-pulse">Generating {AI_FIELD_CONFIG[aiLoading]?.label}...</span>
                        </Badge>
                      ) : null}
                    </div>

                    {aiError ? (
                      <div className="mt-2 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-xs text-red-800">
                        {aiError}
                      </div>
                    ) : null}

                    <div className="mt-3 grid grid-cols-3 gap-2 sm:grid-cols-4">
                      {(Object.keys(AI_FIELD_CONFIG) as AIField[]).map((field) => {
                        const cfg = AI_FIELD_CONFIG[field];
                        const isAll = field === "all";
                        return (
                          <button
                            key={field}
                            type="button"
                            disabled={aiLoading !== null}
                            onClick={() => aiComplete(field)}
                            className={`group relative flex flex-col items-center gap-1.5 rounded-xl border px-3 py-2.5 text-center shadow-sm transition-all disabled:opacity-50 ${
                              isAll
                                ? "col-span-3 border-indigo-300 bg-gradient-to-br from-indigo-100 to-purple-100 hover:from-indigo-200 hover:to-purple-200 sm:col-span-4"
                                : "border-zinc-200 bg-white hover:border-indigo-300 hover:bg-indigo-50"
                            } ${aiLoading === field ? "ring-2 ring-indigo-400" : ""}`}
                            title={cfg.description}
                          >
                            <Icon
                              name={cfg.icon as any}
                              className={`h-5 w-5 ${isAll ? "text-indigo-700" : "text-zinc-600 group-hover:text-indigo-600"}`}
                            />
                            <span className={`text-xs font-medium ${isAll ? "text-indigo-900" : "text-zinc-700"}`}>
                              {cfg.label}
                            </span>
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* Character Sheet */}
                  <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                      <Icon name="character" className="h-4 w-4" />
                      Character Sheet
                    </div>

                    {/* Basic Info Grid */}
                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <div className="text-xs font-medium text-zinc-700">Full name</div>
                        <input
                          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200"
                          value={editCharacter.fullName ?? ""}
                          onChange={(e) => setEditCharacter((c) => ({ ...(c ?? {}), fullName: e.target.value || undefined }))}
                          placeholder="Character's full name"
                        />
                      </div>
                      <div className="space-y-1.5">
                        <div className="text-xs font-medium text-zinc-700">Aliases (csv)</div>
                        <input
                          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200"
                          value={(editCharacter.aliases ?? []).join(", ")}
                          onChange={(e) => setEditCharacter((c) => ({ ...(c ?? {}), aliases: parseCsvList(e.target.value) }))}
                          placeholder="Nickname, alias..."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <div className="text-xs font-medium text-zinc-700">Role</div>
                        <input
                          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200"
                          value={editCharacter.role ?? ""}
                          onChange={(e) => setEditCharacter((c) => ({ ...(c ?? {}), role: e.target.value || undefined }))}
                          placeholder="Protagonist, antagonist..."
                        />
                      </div>
                      <div className="space-y-1.5">
                        <div className="text-xs font-medium text-zinc-700">Pronouns</div>
                        <input
                          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200"
                          value={editCharacter.pronouns ?? ""}
                          onChange={(e) => setEditCharacter((c) => ({ ...(c ?? {}), pronouns: e.target.value || undefined }))}
                          placeholder="he/him, she/her..."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <div className="text-xs font-medium text-zinc-700">Age</div>
                        <input
                          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200"
                          value={editCharacter.age ?? ""}
                          onChange={(e) => setEditCharacter((c) => ({ ...(c ?? {}), age: e.target.value || undefined }))}
                          placeholder="25, mid-30s..."
                        />
                      </div>
                      <div className="space-y-1.5">
                        <div className="text-xs font-medium text-zinc-700">Occupation</div>
                        <input
                          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200"
                          value={editCharacter.occupation ?? ""}
                          onChange={(e) => setEditCharacter((c) => ({ ...(c ?? {}), occupation: e.target.value || undefined }))}
                          placeholder="Detective, teacher..."
                        />
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div className="space-y-1.5">
                        <div className="text-xs font-medium text-zinc-700">Archetype</div>
                        <input
                          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200"
                          value={editCharacter.archetype ?? ""}
                          onChange={(e) => setEditCharacter((c) => ({ ...(c ?? {}), archetype: e.target.value || undefined }))}
                          placeholder="Hero, mentor, trickster..."
                        />
                      </div>
                      <div className="space-y-1.5">
                        <div className="text-xs font-medium text-zinc-700">Skills (csv)</div>
                        <input
                          className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200"
                          value={(editCharacter.skills ?? []).join(", ")}
                          onChange={(e) => setEditCharacter((c) => ({ ...(c ?? {}), skills: parseCsvList(e.target.value) }))}
                          placeholder="Combat, negotiation..."
                        />
                      </div>
                    </div>

                    <div className="space-y-1.5">
                      <div className="text-xs font-medium text-zinc-700">Weaknesses (csv)</div>
                      <input
                        className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200"
                        value={(editCharacter.weaknesses ?? []).join(", ")}
                        onChange={(e) => setEditCharacter((c) => ({ ...(c ?? {}), weaknesses: parseCsvList(e.target.value) }))}
                        placeholder="Fear of heights, trusts too easily..."
                      />
                    </div>
                  </div>

                  {/* AI-Generated Fields */}
                  <div className="space-y-3 rounded-2xl border border-zinc-200 bg-white p-4 shadow-sm">
                    <div className="flex items-center gap-2 text-sm font-semibold text-zinc-900">
                      <Icon name="edit" className="h-4 w-4" />
                      Character Depth
                      <span className="ml-1 text-xs font-normal text-zinc-500">(AI can generate these)</span>
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-700">
                          <Icon name="brain" className="h-3.5 w-3.5 text-indigo-500" />
                          Personality
                        </div>
                        <button
                          type="button"
                          disabled={aiLoading !== null}
                          onClick={() => aiComplete("personality")}
                          className="flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
                        >
                          <Icon name="sparkles" className="h-3 w-3" />
                          Generate
                        </button>
                      </div>
                      <textarea
                        className="min-h-[80px] w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200"
                        value={editCharacter.personality ?? ""}
                        onChange={(e) => setEditCharacter((c) => ({ ...(c ?? {}), personality: e.target.value || undefined }))}
                        placeholder="Describe personality traits, behaviors, quirks..."
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-700">
                          <Icon name="eye" className="h-3.5 w-3.5 text-emerald-500" />
                          Appearance
                        </div>
                        <button
                          type="button"
                          disabled={aiLoading !== null}
                          onClick={() => aiComplete("appearance")}
                          className="flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
                        >
                          <Icon name="sparkles" className="h-3 w-3" />
                          Generate
                        </button>
                      </div>
                      <textarea
                        className="min-h-[80px] w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200"
                        value={editCharacter.appearance ?? ""}
                        onChange={(e) => setEditCharacter((c) => ({ ...(c ?? {}), appearance: e.target.value || undefined }))}
                        placeholder="Physical appearance for image generation..."
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-700">
                          <Icon name="book" className="h-3.5 w-3.5 text-amber-500" />
                          Backstory
                        </div>
                        <button
                          type="button"
                          disabled={aiLoading !== null}
                          onClick={() => aiComplete("backstory")}
                          className="flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
                        >
                          <Icon name="sparkles" className="h-3 w-3" />
                          Generate
                        </button>
                      </div>
                      <textarea
                        className="min-h-[80px] w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200"
                        value={editCharacter.backstory ?? ""}
                        onChange={(e) => setEditCharacter((c) => ({ ...(c ?? {}), backstory: e.target.value || undefined }))}
                        placeholder="Character history and formative events..."
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-700">
                          <Icon name="target" className="h-3.5 w-3.5 text-rose-500" />
                          Motivation
                        </div>
                        <button
                          type="button"
                          disabled={aiLoading !== null}
                          onClick={() => aiComplete("motivation")}
                          className="flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
                        >
                          <Icon name="sparkles" className="h-3 w-3" />
                          Generate
                        </button>
                      </div>
                      <textarea
                        className="min-h-[80px] w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200"
                        value={editCharacter.motivation ?? ""}
                        onChange={(e) => setEditCharacter((c) => ({ ...(c ?? {}), motivation: e.target.value || undefined }))}
                        placeholder="Goals, desires, fears..."
                      />
                    </div>

                    <div className="space-y-1.5">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-1.5 text-xs font-medium text-zinc-700">
                          <Icon name="mic" className="h-3.5 w-3.5 text-sky-500" />
                          Voice Notes
                        </div>
                        <button
                          type="button"
                          disabled={aiLoading !== null}
                          onClick={() => aiComplete("voiceNotes")}
                          className="flex items-center gap-1 rounded-md border border-indigo-200 bg-indigo-50 px-2 py-0.5 text-[10px] font-medium text-indigo-700 hover:bg-indigo-100 disabled:opacity-50"
                        >
                          <Icon name="sparkles" className="h-3 w-3" />
                          Generate
                        </button>
                      </div>
                      <textarea
                        className="min-h-[60px] w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm focus:border-indigo-300 focus:ring-1 focus:ring-indigo-200"
                        value={editCharacter.voiceNotes ?? ""}
                        onChange={(e) => setEditCharacter((c) => ({ ...(c ?? {}), voiceNotes: e.target.value || undefined }))}
                        placeholder="Speech patterns, accent, vocabulary..."
                      />
                    </div>
                  </div>
                </div>
              ) : null}

              <div>
                <div className="mb-1 text-sm font-medium">Attributes (JSON)</div>
                <textarea
                  className="w-full rounded-lg border border-zinc-200 bg-white px-3 py-2 font-mono text-xs shadow-sm"
                  value={editAttributes}
                  onChange={(e) => setEditAttributes(e.target.value)}
                  rows={10}
                />
              </div>

              <PrimaryButton onClick={save}>
                Save
              </PrimaryButton>

              <div className="border-t border-zinc-200 pt-4">
                <div className="mb-2 text-sm font-medium">Relationships</div>
                <div className="space-y-2">
                  <div className="grid grid-cols-1 gap-2 md:grid-cols-2">
                    <input
                      className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm"
                      value={linkToId}
                      onChange={(e) => setLinkToId(e.target.value)}
                      placeholder="toEntityId"
                    />
                    <input
                      className="rounded-lg border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm"
                      value={linkRelType}
                      onChange={(e) => setLinkRelType(e.target.value)}
                      placeholder="relType"
                    />
                  </div>
                  <SecondaryButton onClick={link}>
                    Add link
                  </SecondaryButton>
                </div>

                <div className="mt-3 space-y-1">
                  {(selected.relationships ?? []).length === 0 ? (
                    <div className="text-sm text-zinc-500">No relationships yet.</div>
                  ) : null}
                  {(selected.relationships ?? []).map((r, idx) => (
                    <div key={idx} className="rounded-xl border border-zinc-200 bg-white px-3 py-2 text-sm shadow-sm">
                      <div className="font-mono text-xs">{r.toEntityId}</div>
                      <div className="text-xs text-zinc-600">{r.relType}</div>
                      {r.note ? <div className="text-xs text-zinc-500">{r.note}</div> : null}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>

      {showWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-auto">
            {wizardGenerating ? (
              <Card className="p-8">
                <div className="flex flex-col items-center gap-4">
                  <div className="h-12 w-12 animate-spin rounded-full border-4 border-indigo-200 border-t-indigo-600" />
                  <div className="text-center">
                    <div className="text-lg font-semibold text-zinc-900">Generating with AI...</div>
                    <div className="text-sm text-zinc-600">Creating your {wizardType.toLowerCase()} with full details</div>
                  </div>
                </div>
              </Card>
            ) : (
              <EntityWizard
                entityType={wizardType}
                existingEntity={wizardEditEntity}
                onComplete={handleWizardComplete}
                onCancel={() => {
                  setShowWizard(false);
                  setWizardEditEntity(null);
                }}
              />
            )}
          </div>
        </div>
      )}

      {showExport && selected && project && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-auto">
            <EntityExportEnhanced
              entity={selected}
              project={project}
              relatedEntities={items.filter((e) =>
                selected.relationships?.some((r) => r.toEntityId === e._id)
              )}
              onClose={() => setShowExport(false)}
            />
          </div>
        </div>
      )}

      {showGallery && selected && (
        <ImageGalleryModal
          entity={selected}
          entities={items}
          initialImageUrl={galleryInitialUrl}
          onClose={() => {
            setShowGallery(false);
            setGalleryInitialUrl(undefined);
          }}
          onEntityChange={(e) => setSelectedId(e._id)}
        />
      )}
    </div>
  );
}
