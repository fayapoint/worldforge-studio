"use client";

import { useCallback, useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/apiClient";
import type { Entity, EntityType, Project } from "@/lib/models";
import { Icon } from "@/lib/ui";
import { GlassCard, GlassButton, IconOption, GlassInput } from "@/components/GlassCard";
import { EntityWizard } from "@/components/EntityWizard";
import { EntityExport } from "@/components/EntityExport";

const ENTITY_TYPES: { type: EntityType; label: string; icon: string; description: string }[] = [
  { type: "CHARACTER", label: "Character", icon: "character", description: "People in your story" },
  { type: "LOCATION", label: "Location", icon: "location", description: "Places and settings" },
  { type: "FACTION", label: "Faction", icon: "faction", description: "Groups and organizations" },
  { type: "ITEM", label: "Item", icon: "item", description: "Objects and artifacts" },
  { type: "RULE", label: "Rule", icon: "rule", description: "World rules and systems" },
  { type: "LORE", label: "Lore", icon: "lore", description: "History and knowledge" },
];

export default function WorldBiblePage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;

  const [entities, setEntities] = useState<Entity[]>([]);
  const [project, setProject] = useState<Project | null>(null);
  const [selectedType, setSelectedType] = useState<EntityType | "ALL">("ALL");
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedEntity, setSelectedEntity] = useState<Entity | null>(null);
  const [showWizard, setShowWizard] = useState(false);
  const [wizardType, setWizardType] = useState<EntityType>("CHARACTER");
  const [editingEntity, setEditingEntity] = useState<Entity | null>(null);
  const [showExport, setShowExport] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const loadEntities = useCallback(async () => {
    const res = await apiFetch<{ items: Entity[] }>(`/api/projects/${projectId}/entities`);
    if (res.ok) {
      setEntities(res.data.items);
    }
  }, [projectId]);

  const loadProject = useCallback(async () => {
    const res = await apiFetch<{ project: Project }>(`/api/projects/${projectId}`);
    if (res.ok) {
      setProject(res.data.project);
    }
  }, [projectId]);

  useEffect(() => {
    void loadEntities();
    void loadProject();
  }, [loadEntities, loadProject]);

  const filteredEntities = entities.filter((e) => {
    if (selectedType !== "ALL" && e.type !== selectedType) return false;
    if (searchQuery && !e.name.toLowerCase().includes(searchQuery.toLowerCase())) return false;
    return true;
  });

  const handleWizardComplete = async (wizardData: Record<string, any>) => {
    // If editing existing entity, update it
    if (editingEntity) {
      // TODO: Implement entity update with wizard data
      setEditingEntity(null);
      setShowWizard(false);
      await loadEntities();
      return;
    }

    // Create new entity
    const res = await apiFetch<{ entity: Entity }>(`/api/projects/${projectId}/entities`, {
      method: "POST",
      body: JSON.stringify({
        type: wizardType,
        name: wizardData.name || "Unnamed",
        summary: wizardData.backstorySummary || "",
        attributes: wizardData,
        relationships: [],
      }),
    });

    if (res.ok) {
      setShowWizard(false);
      await loadEntities();
      setSelectedEntity(res.data.entity);
    }
  };

  const openWizardForNew = (type: EntityType) => {
    setWizardType(type);
    setEditingEntity(null);
    setShowWizard(true);
  };

  const openWizardForEdit = (entity: Entity) => {
    setWizardType(entity.type);
    setEditingEntity(entity);
    setShowWizard(true);
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-indigo-50 via-purple-50 to-pink-50 p-6">
      <div className="mx-auto max-w-7xl space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="mb-2 text-4xl font-bold text-zinc-900">World Bible</h1>
          <p className="text-lg text-zinc-600">
            Your story's entities, relationships, and world details
          </p>
        </div>

        {error && (
          <GlassCard className="p-4">
            <div className="text-sm text-red-600">{error}</div>
          </GlassCard>
        )}

        {/* Search and Filter */}
        <GlassCard className="p-6">
          <div className="mb-4">
            <GlassInput
              value={searchQuery}
              onChange={setSearchQuery}
              placeholder="Search entities..."
            />
          </div>

          <div className="grid grid-cols-2 gap-3 sm:grid-cols-4 lg:grid-cols-7">
            <IconOption
              icon={<Icon name="world" className="h-6 w-6" />}
              label="All"
              selected={selectedType === "ALL"}
              onClick={() => setSelectedType("ALL")}
            />
            {ENTITY_TYPES.map((et) => (
              <IconOption
                key={et.type}
                icon={<Icon name={et.icon as any} className="h-6 w-6" />}
                label={et.label}
                description={`${entities.filter((e) => e.type === et.type).length}`}
                selected={selectedType === et.type}
                onClick={() => setSelectedType(et.type)}
              />
            ))}
          </div>
        </GlassCard>

        {/* Create New Entity */}
        <GlassCard className="p-6">
          <h3 className="mb-4 text-lg font-semibold text-zinc-900">Create New Entity</h3>
          <div className="grid grid-cols-2 gap-3 sm:grid-cols-3 lg:grid-cols-6">
            {ENTITY_TYPES.map((et) => (
              <button
                key={et.type}
                onClick={() => openWizardForNew(et.type)}
                className="group relative overflow-hidden rounded-2xl bg-white/40 p-4 backdrop-blur-xl transition-all hover:scale-105 hover:bg-white/60"
              >
                <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-purple-500/5 opacity-0 transition-opacity group-hover:opacity-100" />
                <div className="relative">
                  <div className="mb-2 inline-flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
                    <Icon name={et.icon as any} className="h-6 w-6" />
                  </div>
                  <div className="text-sm font-semibold text-zinc-900">{et.label}</div>
                  <div className="text-xs text-zinc-600">{et.description}</div>
                </div>
              </button>
            ))}
          </div>
        </GlassCard>

        {/* Entity Grid */}
        <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
          {filteredEntities.map((entity) => (
            <GlassCard
              key={entity._id}
              hover
              selected={selectedEntity?._id === entity._id}
              onClick={() => setSelectedEntity(entity)}
              className="p-4"
            >
              <div className="flex items-start gap-3">
                {entity.media?.thumbnailUrl ? (
                  <img
                    src={entity.media.thumbnailUrl}
                    alt={entity.name}
                    className="h-16 w-16 rounded-xl object-cover"
                  />
                ) : (
                  <div className="flex h-16 w-16 items-center justify-center rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600">
                    <Icon
                      name={ENTITY_TYPES.find((t) => t.type === entity.type)?.icon as any}
                      className="h-8 w-8 text-white"
                    />
                  </div>
                )}
                <div className="min-w-0 flex-1">
                  <div className="font-semibold text-zinc-900">{entity.name}</div>
                  <div className="mt-1 text-xs text-zinc-600">{entity.type}</div>
                  {entity.summary && (
                    <div className="mt-2 line-clamp-2 text-xs text-zinc-700">
                      {entity.summary}
                    </div>
                  )}
                </div>
              </div>
            </GlassCard>
          ))}
        </div>

        {filteredEntities.length === 0 && (
          <GlassCard className="p-12 text-center">
            <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600 text-white">
              <Icon name="world" className="h-8 w-8" />
            </div>
            <h3 className="mb-2 text-lg font-semibold text-zinc-900">No entities yet</h3>
            <p className="text-zinc-600">Create your first entity to start building your world</p>
          </GlassCard>
        )}

        {/* Entity Detail Panel */}
        {selectedEntity && (
          <GlassCard className="p-6">
            <div className="mb-4 flex items-start justify-between">
              <div className="flex items-start gap-4">
                {selectedEntity.media?.thumbnailUrl ? (
                  <img
                    src={selectedEntity.media.thumbnailUrl}
                    alt={selectedEntity.name}
                    className="h-24 w-24 rounded-2xl object-cover"
                  />
                ) : (
                  <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500 to-purple-600">
                    <Icon
                      name={ENTITY_TYPES.find((t) => t.type === selectedEntity.type)?.icon as any}
                      className="h-12 w-12 text-white"
                    />
                  </div>
                )}
                <div>
                  <h2 className="text-2xl font-bold text-zinc-900">{selectedEntity.name}</h2>
                  <div className="mt-1 inline-flex items-center gap-2 rounded-full bg-indigo-100 px-3 py-1 text-sm font-medium text-indigo-700">
                    {selectedEntity.type}
                  </div>
                </div>
              </div>
              <div className="flex gap-2">
                <GlassButton
                  variant="secondary"
                  size="sm"
                  onClick={() => openWizardForEdit(selectedEntity)}
                >
                  <Icon name="edit" className="h-4 w-4" />
                  Edit with Wizard
                </GlassButton>
                <GlassButton
                  variant="secondary"
                  size="sm"
                  onClick={() => setShowExport(true)}
                >
                  <Icon name="exports" className="h-4 w-4" />
                  Export
                </GlassButton>
                <GlassButton
                  variant="ghost"
                  size="sm"
                  onClick={() => setSelectedEntity(null)}
                >
                  Close
                </GlassButton>
              </div>
            </div>

            {selectedEntity.summary && (
              <div className="mb-4">
                <h3 className="mb-2 font-semibold text-zinc-900">Summary</h3>
                <p className="text-zinc-700">{selectedEntity.summary}</p>
              </div>
            )}

            {selectedEntity.character && (
              <div className="space-y-4">
                {selectedEntity.character.personality && (
                  <div>
                    <h3 className="mb-2 font-semibold text-zinc-900">Personality</h3>
                    <p className="text-sm text-zinc-700">{selectedEntity.character.personality}</p>
                  </div>
                )}
                {selectedEntity.character.appearance && (
                  <div>
                    <h3 className="mb-2 font-semibold text-zinc-900">Appearance</h3>
                    <p className="text-sm text-zinc-700">{selectedEntity.character.appearance}</p>
                  </div>
                )}
              </div>
            )}
          </GlassCard>
        )}
      </div>

      {/* Wizard Modal */}
      {showWizard && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-3xl overflow-auto">
            <EntityWizard
              entityType={wizardType}
              existingEntity={editingEntity}
              onComplete={handleWizardComplete}
              onCancel={() => {
                setShowWizard(false);
                setEditingEntity(null);
              }}
            />
          </div>
        </div>
      )}

      {/* Export Modal */}
      {showExport && selectedEntity && project && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm">
          <div className="max-h-[90vh] w-full max-w-4xl overflow-auto">
            <EntityExport
              entity={selectedEntity}
              project={project}
              relatedEntities={entities.filter((e) =>
                selectedEntity.relationships?.some((r) => r.toEntityId === e._id)
              )}
              onClose={() => setShowExport(false)}
            />
          </div>
        </div>
      )}
    </div>
  );
}
