"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import { useParams } from "next/navigation";
import { apiFetch } from "@/lib/apiClient";
import {
  Badge,
  Card,
  CardHint,
  CardTitle,
  Icon,
  IconName,
  PrimaryButton,
  SecondaryButton,
  SectionHeader,
} from "@/lib/ui";
import {
  PROMPT_CATEGORIES,
  RARITY_INFO,
  PLACEMENT_INFO,
  type PromptCategory,
  type PromptPlacement,
  type PromptRarity,
  type PromptLibraryItem,
  type PromptPreset,
  type CategoryInfo,
} from "@/lib/promptLibrary";

type TabId = "library" | "presets" | "import-export" | "quick-access";

type LibraryItem = {
  _id: string;
  name: string;
  slug: string;
  description: string;
  promptText: string;
  negativePrompt?: string;
  category: PromptCategory;
  subcategory?: string;
  tags: string[];
  icon: IconName;
  color?: string;
  visibility: "PUBLIC" | "PRIVATE" | "SHARED";
  isBuiltIn: boolean;
  isFavorite: boolean;
  rarity: PromptRarity;
  suggestedPlacements: PromptPlacement[];
  usageCount: number;
  createdAt: string;
};

type Preset = {
  _id: string;
  name: string;
  description: string;
  icon: IconName;
  color: string;
  promptIds: string[];
  placements: PromptPlacement[];
  showInQuickAccess: boolean;
  category: PromptCategory;
  usageCount: number;
};

export default function PromptManagerPage() {
  const params = useParams<{ projectId: string }>();
  const projectId = params.projectId;

  // State
  const [activeTab, setActiveTab] = useState<TabId>("library");
  const [items, setItems] = useState<LibraryItem[]>([]);
  const [presets, setPresets] = useState<Preset[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [selectedCategory, setSelectedCategory] = useState<PromptCategory | null>(null);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [showFavoritesOnly, setShowFavoritesOnly] = useState(false);
  const [selectedVisibility, setSelectedVisibility] = useState<"ALL" | "PUBLIC" | "PRIVATE">("ALL");

  // Create/Edit modal
  const [showCreateModal, setShowCreateModal] = useState(false);
  const [editingItem, setEditingItem] = useState<LibraryItem | null>(null);
  const [selectedItem, setSelectedItem] = useState<LibraryItem | null>(null);

  // Preset creation
  const [showPresetModal, setShowPresetModal] = useState(false);
  const [selectedForPreset, setSelectedForPreset] = useState<string[]>([]);

  // Load data
  const loadLibrary = useCallback(async () => {
    setLoading(true);
    setError(null);

    const queryParams = new URLSearchParams();
    if (selectedCategory) queryParams.set("category", selectedCategory);
    if (selectedSubcategory) queryParams.set("subcategory", selectedSubcategory);
    if (showFavoritesOnly) queryParams.set("favorites", "true");
    if (searchQuery) queryParams.set("search", searchQuery);
    if (selectedVisibility !== "ALL") queryParams.set("visibility", selectedVisibility);
    queryParams.set("projectId", projectId);

    const res = await apiFetch<{ items: LibraryItem[] }>(
      `/api/prompts/library?${queryParams.toString()}`
    );

    setLoading(false);
    if (!res.ok) {
      setError(`${res.error.code}: ${res.error.message}`);
      return;
    }

    setItems(res.data.items);
  }, [projectId, selectedCategory, selectedSubcategory, showFavoritesOnly, searchQuery, selectedVisibility]);

  const loadPresets = useCallback(async () => {
    const res = await apiFetch<{ items: Preset[] }>(
      `/api/prompts/presets?projectId=${projectId}`
    );

    if (res.ok) {
      setPresets(res.data.items);
    }
  }, [projectId]);

  useEffect(() => {
    void loadLibrary();
    void loadPresets();
  }, [loadLibrary, loadPresets]);

  // Filter items
  const filteredItems = useMemo(() => {
    let result = items;

    if (searchQuery) {
      const q = searchQuery.toLowerCase();
      result = result.filter(
        (item) =>
          item.name.toLowerCase().includes(q) ||
          item.description.toLowerCase().includes(q) ||
          item.promptText.toLowerCase().includes(q) ||
          item.tags.some((t) => t.toLowerCase().includes(q))
      );
    }

    return result;
  }, [items, searchQuery]);

  // Get current category info
  const currentCategoryInfo = useMemo(() => {
    if (!selectedCategory) return null;
    return PROMPT_CATEGORIES.find((c) => c.id === selectedCategory);
  }, [selectedCategory]);

  // Actions
  async function toggleFavorite(itemId: string, isFavorite: boolean) {
    const action = isFavorite ? "unfavorite" : "favorite";
    await apiFetch(`/api/prompts/library/${itemId}?action=${action}`, { method: "POST" });
    void loadLibrary();
  }

  async function copyPrompt(promptText: string) {
    try {
      await navigator.clipboard.writeText(promptText);
    } catch {
      setError("Failed to copy to clipboard");
    }
  }

  async function usePrompt(itemId: string) {
    await apiFetch(`/api/prompts/library/${itemId}?action=use`, { method: "POST" });
    void loadLibrary();
  }

  async function deletePrompt(itemId: string) {
    if (!confirm("Are you sure you want to delete this prompt?")) return;
    const res = await apiFetch(`/api/prompts/library/${itemId}`, { method: "DELETE" });
    if (res.ok) {
      void loadLibrary();
      setSelectedItem(null);
    }
  }

  function exportPrompts() {
    const exportData = {
      version: "1.0",
      exportedAt: new Date().toISOString(),
      prompts: items.map((item) => ({
        name: item.name,
        description: item.description,
        promptText: item.promptText,
        negativePrompt: item.negativePrompt,
        category: item.category,
        subcategory: item.subcategory,
        tags: item.tags,
        icon: item.icon,
        rarity: item.rarity,
      })),
    };

    const blob = new Blob([JSON.stringify(exportData, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `worldforge-prompts-${new Date().toISOString().split("T")[0]}.json`;
    a.click();
    URL.revokeObjectURL(url);
  }

  async function importPrompts(file: File) {
    try {
      const text = await file.text();
      const data = JSON.parse(text);

      if (!data.prompts || !Array.isArray(data.prompts)) {
        setError("Invalid import file format");
        return;
      }

      for (const prompt of data.prompts) {
        await apiFetch("/api/prompts/library", {
          method: "POST",
          body: JSON.stringify({
            ...prompt,
            visibility: "PRIVATE",
            projectId,
          }),
        });
      }

      void loadLibrary();
    } catch {
      setError("Failed to import prompts");
    }
  }

  const tabs: { id: TabId; label: string; icon: IconName }[] = [
    { id: "library", label: "Library", icon: "layers" },
    { id: "presets", label: "Presets", icon: "sparkles" },
    { id: "quick-access", label: "Quick Access", icon: "flame" },
    { id: "import-export", label: "Import/Export", icon: "download" },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="rounded-2xl border border-zinc-200 bg-gradient-to-br from-white to-zinc-50 p-5">
        <div className="flex items-start justify-between gap-4">
          <div className="flex items-start gap-3">
            <div className="rounded-xl border border-zinc-200 bg-gradient-to-br from-violet-500 to-purple-600 p-2 shadow-sm">
              <Icon name="wand" className="h-6 w-6 text-white" />
            </div>
            <div className="min-w-0">
              <h1 className="text-xl font-semibold text-zinc-900">Prompt Manager</h1>
              <p className="text-sm text-zinc-600">
                Your complete prompt library — manage, organize, and deploy prompts everywhere
              </p>
            </div>
          </div>
          <div className="flex gap-2">
            <SecondaryButton onClick={() => setShowCreateModal(true)}>
              <Icon name="plus" className="h-4 w-4" />
              New Prompt
            </SecondaryButton>
            <PrimaryButton onClick={() => setShowPresetModal(true)} disabled={selectedForPreset.length === 0}>
              <Icon name="sparkles" className="h-4 w-4" />
              Create Preset ({selectedForPreset.length})
            </PrimaryButton>
          </div>
        </div>

        {/* Tabs */}
        <div className="mt-4 flex gap-1 border-t border-zinc-100 pt-4">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 rounded-lg px-4 py-2 text-sm font-medium transition-all ${
                activeTab === tab.id
                  ? "bg-zinc-900 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              <Icon name={tab.icon} className="h-4 w-4" />
              {tab.label}
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
          {error}
        </div>
      )}

      {/* LIBRARY TAB */}
      {activeTab === "library" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-[280px_1fr_340px]">
          {/* Categories Sidebar */}
          <div className="space-y-4">
            <Card className="p-4">
              <CardTitle>Categories</CardTitle>
              <CardHint>Browse prompts by type</CardHint>

              <div className="mt-4 space-y-1">
                <button
                  onClick={() => {
                    setSelectedCategory(null);
                    setSelectedSubcategory(null);
                  }}
                  className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-all ${
                    !selectedCategory
                      ? "bg-zinc-900 text-white"
                      : "text-zinc-700 hover:bg-zinc-100"
                  }`}
                >
                  <Icon name="layers" className="h-4 w-4" />
                  All Prompts
                  <span className="ml-auto">
                    <Badge tone="neutral">{items.length}</Badge>
                  </span>
                </button>

                {PROMPT_CATEGORIES.map((cat) => (
                  <div key={cat.id}>
                    <button
                      onClick={() => {
                        setSelectedCategory(cat.id);
                        setSelectedSubcategory(null);
                      }}
                      className={`w-full flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm transition-all ${
                        selectedCategory === cat.id
                          ? `bg-gradient-to-r ${cat.color} text-white`
                          : "text-zinc-700 hover:bg-zinc-100"
                      }`}
                    >
                      <Icon name={cat.icon} className="h-4 w-4" />
                      {cat.name}
                    </button>

                    {selectedCategory === cat.id && (
                      <div className="ml-4 mt-1 space-y-0.5 border-l-2 border-zinc-200 pl-3">
                        {cat.subcategories.map((sub) => (
                          <button
                            key={sub.id}
                            onClick={() => setSelectedSubcategory(sub.id)}
                            className={`w-full flex items-center gap-2 rounded-lg px-2 py-1.5 text-left text-xs transition-all ${
                              selectedSubcategory === sub.id
                                ? "bg-zinc-200 text-zinc-900 font-medium"
                                : "text-zinc-600 hover:bg-zinc-100"
                            }`}
                          >
                            <Icon name={sub.icon} className="h-3 w-3" />
                            {sub.name}
                          </button>
                        ))}
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </Card>

            {/* Filters */}
            <Card className="p-4">
              <CardTitle>Filters</CardTitle>
              <div className="mt-3 space-y-3">
                <div>
                  <label className="text-xs font-medium text-zinc-600">Search</label>
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Search prompts..."
                    className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                  />
                </div>

                <div>
                  <label className="text-xs font-medium text-zinc-600">Visibility</label>
                  <select
                    value={selectedVisibility}
                    onChange={(e) => setSelectedVisibility(e.target.value as "ALL" | "PUBLIC" | "PRIVATE")}
                    className="mt-1 w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                  >
                    <option value="ALL">All</option>
                    <option value="PUBLIC">Public Library</option>
                    <option value="PRIVATE">My Prompts</option>
                  </select>
                </div>

                <label className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={showFavoritesOnly}
                    onChange={(e) => setShowFavoritesOnly(e.target.checked)}
                    className="rounded border-zinc-300"
                  />
                  <span className="text-sm text-zinc-700">Favorites only</span>
                </label>
              </div>
            </Card>
          </div>

          {/* Main Grid */}
          <div className="space-y-4">
            {/* Category Header */}
            {currentCategoryInfo && (
              <div className={`rounded-xl bg-gradient-to-r ${currentCategoryInfo.color} p-4 text-white`}>
                <div className="flex items-center gap-3">
                  <Icon name={currentCategoryInfo.icon} className="h-6 w-6" />
                  <div>
                    <h2 className="font-semibold">{currentCategoryInfo.name}</h2>
                    <p className="text-sm opacity-90">{currentCategoryInfo.description}</p>
                  </div>
                </div>
              </div>
            )}

            {/* Results count */}
            <div className="flex items-center justify-between">
              <p className="text-sm text-zinc-500">
                {filteredItems.length} prompt{filteredItems.length !== 1 ? "s" : ""}
              </p>
              <div className="flex gap-2">
                <button
                  onClick={() => setSelectedForPreset(filteredItems.map((i) => i._id))}
                  className="text-xs text-zinc-500 hover:text-zinc-700"
                >
                  Select All
                </button>
                <button
                  onClick={() => setSelectedForPreset([])}
                  className="text-xs text-zinc-500 hover:text-zinc-700"
                >
                  Clear
                </button>
              </div>
            </div>

            {loading ? (
              <div className="flex items-center justify-center p-12">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-zinc-900" />
              </div>
            ) : filteredItems.length === 0 ? (
              <Card className="p-12 text-center">
                <Icon name="search" className="mx-auto h-12 w-12 text-zinc-300" />
                <p className="mt-4 text-zinc-500">No prompts found</p>
                <p className="text-sm text-zinc-400">Try adjusting your filters or create a new prompt</p>
              </Card>
            ) : (
              <div className="grid grid-cols-1 gap-3 md:grid-cols-2">
                {filteredItems.map((item) => (
                  <div
                    key={item._id}
                    onClick={() => setSelectedItem(item)}
                    className={`group relative rounded-xl border bg-white p-4 shadow-sm transition-all cursor-pointer hover:shadow-md ${
                      selectedItem?._id === item._id ? "ring-2 ring-violet-500 border-violet-200" : "border-zinc-200"
                    }`}
                  >
                    {/* Selection checkbox */}
                    <div
                      className="absolute top-3 left-3"
                      onClick={(e) => {
                        e.stopPropagation();
                        setSelectedForPreset((prev) =>
                          prev.includes(item._id)
                            ? prev.filter((id) => id !== item._id)
                            : [...prev, item._id]
                        );
                      }}
                    >
                      <div
                        className={`h-5 w-5 rounded border-2 flex items-center justify-center transition-all ${
                          selectedForPreset.includes(item._id)
                            ? "bg-violet-500 border-violet-500"
                            : "border-zinc-300 group-hover:border-zinc-400"
                        }`}
                      >
                        {selectedForPreset.includes(item._id) && (
                          <Icon name="check" className="h-3 w-3 text-white" />
                        )}
                      </div>
                    </div>

                    {/* Favorite button */}
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleFavorite(item._id, item.isFavorite);
                      }}
                      className="absolute top-3 right-3 opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      <Icon
                        name="heart"
                        className={`h-5 w-5 ${item.isFavorite ? "text-red-500 fill-current" : "text-zinc-400"}`}
                      />
                    </button>

                    <div className="flex items-start gap-3 pl-7">
                      <div
                        className={`rounded-lg p-2 ${
                          item.color
                            ? `bg-gradient-to-br ${item.color} text-white`
                            : "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        <Icon name={item.icon} className="h-4 w-4" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-2">
                          <h3 className="font-medium text-zinc-900 truncate">{item.name}</h3>
                          <span className={`text-[10px] px-1.5 py-0.5 rounded ${RARITY_INFO[item.rarity].bgClass} ${RARITY_INFO[item.rarity].color}`}>
                            {RARITY_INFO[item.rarity].label}
                          </span>
                        </div>
                        <p className="mt-1 text-xs text-zinc-500 line-clamp-2">{item.description || item.promptText}</p>
                        <div className="mt-2 flex items-center gap-2">
                          <Badge tone={item.visibility === "PUBLIC" ? "success" : "neutral"}>
                            {item.visibility.toLowerCase()}
                          </Badge>
                          {item.tags.slice(0, 2).map((tag) => (
                            <span key={tag} className="text-[10px] text-zinc-500">
                              #{tag}
                            </span>
                          ))}
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Detail Panel */}
          <div className="space-y-4">
            {selectedItem ? (
              <>
                <Card className="p-4">
                  <div className="flex items-start justify-between gap-3">
                    <div className="flex items-start gap-3">
                      <div
                        className={`rounded-xl p-3 ${
                          selectedItem.color
                            ? `bg-gradient-to-br ${selectedItem.color} text-white`
                            : "bg-zinc-100 text-zinc-600"
                        }`}
                      >
                        <Icon name={selectedItem.icon} className="h-6 w-6" />
                      </div>
                      <div>
                        <h2 className="font-semibold text-zinc-900">{selectedItem.name}</h2>
                        <p className="text-xs text-zinc-500">{selectedItem.category}</p>
                      </div>
                    </div>
                    <button
                      onClick={() => toggleFavorite(selectedItem._id, selectedItem.isFavorite)}
                    >
                      <Icon
                        name="heart"
                        className={`h-5 w-5 ${selectedItem.isFavorite ? "text-red-500" : "text-zinc-400"}`}
                      />
                    </button>
                  </div>

                  {selectedItem.description && (
                    <p className="mt-3 text-sm text-zinc-600">{selectedItem.description}</p>
                  )}

                  <div className="mt-4 flex flex-wrap gap-1">
                    {selectedItem.tags.map((tag) => (
                      <span
                        key={tag}
                        className="px-2 py-1 rounded-lg bg-zinc-100 text-xs text-zinc-600"
                      >
                        #{tag}
                      </span>
                    ))}
                  </div>
                </Card>

                {/* Prompt Text */}
                <Card className="p-4">
                  <div className="flex items-center justify-between mb-2">
                    <CardTitle>Prompt Text</CardTitle>
                    <button
                      onClick={() => copyPrompt(selectedItem.promptText)}
                      className="text-xs text-zinc-500 hover:text-zinc-700 flex items-center gap-1"
                    >
                      <Icon name="copy" className="h-3 w-3" />
                      Copy
                    </button>
                  </div>
                  <div className="rounded-xl bg-zinc-50 border border-zinc-100 p-3">
                    <pre className="text-xs text-zinc-800 whitespace-pre-wrap font-mono">
                      {selectedItem.promptText}
                    </pre>
                  </div>
                </Card>

                {selectedItem.negativePrompt && (
                  <Card className="p-4">
                    <div className="flex items-center justify-between mb-2">
                      <CardTitle>Negative Prompt</CardTitle>
                      <button
                        onClick={() => copyPrompt(selectedItem.negativePrompt || "")}
                        className="text-xs text-zinc-500 hover:text-zinc-700 flex items-center gap-1"
                      >
                        <Icon name="copy" className="h-3 w-3" />
                        Copy
                      </button>
                    </div>
                    <div className="rounded-xl bg-red-50 border border-red-100 p-3">
                      <pre className="text-xs text-red-700 whitespace-pre-wrap font-mono">
                        {selectedItem.negativePrompt}
                      </pre>
                    </div>
                  </Card>
                )}

                {/* Placements */}
                {selectedItem.suggestedPlacements.length > 0 && (
                  <Card className="p-4">
                    <CardTitle>Available In</CardTitle>
                    <div className="mt-2 space-y-1">
                      {selectedItem.suggestedPlacements.map((placement) => (
                        <div key={placement} className="flex items-center gap-2 text-xs text-zinc-600">
                          <Icon name={PLACEMENT_INFO[placement].icon} className="h-3 w-3" />
                          {PLACEMENT_INFO[placement].label}
                        </div>
                      ))}
                    </div>
                  </Card>
                )}

                {/* Actions */}
                <div className="flex gap-2">
                  <PrimaryButton
                    onClick={() => {
                      copyPrompt(selectedItem.promptText);
                      usePrompt(selectedItem._id);
                    }}
                    className="flex-1"
                  >
                    <Icon name="copy" className="h-4 w-4" />
                    Use Prompt
                  </PrimaryButton>
                  {!selectedItem.isBuiltIn && (
                    <SecondaryButton onClick={() => deletePrompt(selectedItem._id)}>
                      <Icon name="trash" className="h-4 w-4" />
                    </SecondaryButton>
                  )}
                </div>
              </>
            ) : (
              <Card className="p-8 text-center">
                <Icon name="eye" className="mx-auto h-12 w-12 text-zinc-300" />
                <p className="mt-4 text-zinc-500">Select a prompt to view details</p>
              </Card>
            )}
          </div>
        </div>
      )}

      {/* PRESETS TAB */}
      {activeTab === "presets" && (
        <div className="grid grid-cols-1 gap-6 lg:grid-cols-3">
          {presets.length === 0 ? (
            <Card className="col-span-3 p-12 text-center">
              <Icon name="sparkles" className="mx-auto h-12 w-12 text-zinc-300" />
              <p className="mt-4 text-zinc-500">No presets yet</p>
              <p className="text-sm text-zinc-400">
                Select prompts from the library and create a preset
              </p>
            </Card>
          ) : (
            presets.map((preset) => (
              <Card key={preset._id} className="p-4">
                <div className="flex items-start gap-3">
                  <div className={`rounded-xl p-3 bg-gradient-to-br ${preset.color} text-white`}>
                    <Icon name={preset.icon} className="h-6 w-6" />
                  </div>
                  <div className="min-w-0 flex-1">
                    <h3 className="font-semibold text-zinc-900">{preset.name}</h3>
                    <p className="text-xs text-zinc-500 line-clamp-2">{preset.description}</p>
                    <div className="mt-2 flex items-center gap-2">
                      <Badge tone="neutral">{preset.promptIds.length} prompts</Badge>
                      {preset.showInQuickAccess && (
                        <Badge tone="success">Quick Access</Badge>
                      )}
                    </div>
                  </div>
                </div>

                <div className="mt-4 flex gap-2">
                  <SecondaryButton className="flex-1 text-xs">
                    <Icon name="eye" className="h-3 w-3" />
                    View
                  </SecondaryButton>
                  <PrimaryButton className="flex-1 text-xs">
                    <Icon name="copy" className="h-3 w-3" />
                    Apply
                  </PrimaryButton>
                </div>
              </Card>
            ))
          )}
        </div>
      )}

      {/* QUICK ACCESS TAB */}
      {activeTab === "quick-access" && (
        <div className="space-y-6">
          <Card className="p-6">
            <CardTitle>Quick Access Toolbar</CardTitle>
            <CardHint>
              Drag prompts and presets here to add them to your quick access toolbar.
              They will appear in the scene composer, shot builder, and other places.
            </CardHint>

            <div className="mt-4 rounded-xl border-2 border-dashed border-zinc-200 p-8 text-center">
              <Icon name="plus" className="mx-auto h-8 w-8 text-zinc-300" />
              <p className="mt-2 text-sm text-zinc-500">
                Drag prompts here or select them from the library
              </p>
            </div>

            <div className="mt-6">
              <h3 className="text-sm font-medium text-zinc-700 mb-3">Current Quick Access Items</h3>
              <div className="grid grid-cols-2 gap-2 md:grid-cols-4">
                {presets
                  .filter((p) => p.showInQuickAccess)
                  .map((preset) => (
                    <div
                      key={preset._id}
                      className={`rounded-lg p-3 bg-gradient-to-br ${preset.color} text-white text-center`}
                    >
                      <Icon name={preset.icon} className="mx-auto h-5 w-5" />
                      <p className="mt-1 text-xs font-medium truncate">{preset.name}</p>
                    </div>
                  ))}
              </div>
            </div>
          </Card>
        </div>
      )}

      {/* IMPORT/EXPORT TAB */}
      {activeTab === "import-export" && (
        <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
          <Card className="p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-emerald-100 p-3">
                <Icon name="download" className="h-6 w-6 text-emerald-600" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900">Export Prompts</h3>
                <p className="text-sm text-zinc-500">
                  Download your prompts as a JSON file for backup or sharing
                </p>
              </div>
            </div>

            <div className="mt-4 space-y-3">
              <div className="rounded-xl bg-zinc-50 p-4">
                <p className="text-sm text-zinc-600">
                  <strong>{items.length}</strong> prompts will be exported
                </p>
              </div>

              <PrimaryButton onClick={exportPrompts} className="w-full">
                <Icon name="download" className="h-4 w-4" />
                Export All Prompts
              </PrimaryButton>
            </div>
          </Card>

          <Card className="p-6">
            <div className="flex items-start gap-3">
              <div className="rounded-xl bg-blue-100 p-3">
                <Icon name="file" className="h-6 w-6 text-blue-600" />
              </div>
              <div>
                <h3 className="font-semibold text-zinc-900">Import Prompts</h3>
                <p className="text-sm text-zinc-500">
                  Upload a JSON file to import prompts into your library
                </p>
              </div>
            </div>

            <div className="mt-4">
              <label className="block">
                <div className="rounded-xl border-2 border-dashed border-zinc-200 p-8 text-center cursor-pointer hover:border-zinc-300 hover:bg-zinc-50 transition-colors">
                  <Icon name="file" className="mx-auto h-8 w-8 text-zinc-300" />
                  <p className="mt-2 text-sm text-zinc-500">
                    Click to select a JSON file
                  </p>
                  <p className="text-xs text-zinc-400">or drag and drop</p>
                </div>
                <input
                  type="file"
                  accept=".json"
                  className="hidden"
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) importPrompts(file);
                  }}
                />
              </label>
            </div>
          </Card>
        </div>
      )}

      {/* Create Prompt Modal */}
      {showCreateModal && (
        <CreatePromptModal
          onClose={() => setShowCreateModal(false)}
          onCreated={() => {
            setShowCreateModal(false);
            void loadLibrary();
          }}
          projectId={projectId}
        />
      )}

      {/* Create Preset Modal */}
      {showPresetModal && (
        <CreatePresetModal
          selectedPromptIds={selectedForPreset}
          onClose={() => setShowPresetModal(false)}
          onCreated={() => {
            setShowPresetModal(false);
            setSelectedForPreset([]);
            void loadPresets();
          }}
          projectId={projectId}
        />
      )}
    </div>
  );
}

// =====================================================
// CREATE PROMPT MODAL
// =====================================================
function CreatePromptModal({
  onClose,
  onCreated,
  projectId,
}: {
  onClose: () => void;
  onCreated: () => void;
  projectId: string;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [promptText, setPromptText] = useState("");
  const [negativePrompt, setNegativePrompt] = useState("");
  const [category, setCategory] = useState<PromptCategory>("CUSTOM");
  const [tags, setTags] = useState("");
  const [icon, setIcon] = useState<IconName>("sparkles");
  const [visibility, setVisibility] = useState<"PUBLIC" | "PRIVATE">("PRIVATE");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await apiFetch("/api/prompts/library", {
      method: "POST",
      body: JSON.stringify({
        name,
        description,
        promptText,
        negativePrompt: negativePrompt || undefined,
        category,
        tags: tags.split(",").map((t) => t.trim()).filter(Boolean),
        icon,
        visibility,
        projectId,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      setError(`${res.error.code}: ${res.error.message}`);
      return;
    }

    onCreated();
  }

  const iconOptions: IconName[] = [
    "sparkles", "star", "heart", "flame", "eye", "camera", "scene",
    "character", "location", "layers", "wand", "palette", "book",
    "target", "shield", "warning", "skull", "smile", "sun", "moon",
  ];

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-y-auto rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Create New Prompt</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Name</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                required
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                placeholder="e.g., Cinematic Close-up"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Category</label>
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value as PromptCategory)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              >
                {PROMPT_CATEGORIES.map((cat) => (
                  <option key={cat.id} value={cat.id}>
                    {cat.name}
                  </option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              placeholder="Brief description of this prompt"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Prompt Text</label>
            <textarea
              value={promptText}
              onChange={(e) => setPromptText(e.target.value)}
              required
              rows={4}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm font-mono"
              placeholder="The actual prompt text..."
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">
              Negative Prompt (optional)
            </label>
            <textarea
              value={negativePrompt}
              onChange={(e) => setNegativePrompt(e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm font-mono"
              placeholder="What to avoid..."
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Tags</label>
              <input
                type="text"
                value={tags}
                onChange={(e) => setTags(e.target.value)}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
                placeholder="comma, separated, tags"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-zinc-700 mb-1">Visibility</label>
              <select
                value={visibility}
                onChange={(e) => setVisibility(e.target.value as "PUBLIC" | "PRIVATE")}
                className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              >
                <option value="PRIVATE">Private (only you)</option>
                <option value="PUBLIC">Public (shared library)</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-2">Icon</label>
            <div className="flex flex-wrap gap-2">
              {iconOptions.map((iconName) => (
                <button
                  key={iconName}
                  type="button"
                  onClick={() => setIcon(iconName)}
                  className={`rounded-lg p-2 transition-all ${
                    icon === iconName
                      ? "bg-violet-500 text-white"
                      : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                  }`}
                >
                  <Icon name={iconName} className="h-4 w-4" />
                </button>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
            <SecondaryButton type="button" onClick={onClose}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={loading || !name || !promptText}>
              {loading ? "Creating..." : "Create Prompt"}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}

// =====================================================
// CREATE PRESET MODAL
// =====================================================
function CreatePresetModal({
  selectedPromptIds,
  onClose,
  onCreated,
  projectId,
}: {
  selectedPromptIds: string[];
  onClose: () => void;
  onCreated: () => void;
  projectId: string;
}) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [category, setCategory] = useState<PromptCategory>("CUSTOM");
  const [showInQuickAccess, setShowInQuickAccess] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const res = await apiFetch("/api/prompts/presets", {
      method: "POST",
      body: JSON.stringify({
        name,
        description,
        category,
        promptIds: selectedPromptIds,
        showInQuickAccess,
        placements: showInQuickAccess ? ["QUICK_ACTIONS", "SCENE_COMPOSER"] : [],
        projectId,
      }),
    });

    setLoading(false);

    if (!res.ok) {
      setError(`${res.error.code}: ${res.error.message}`);
      return;
    }

    onCreated();
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="w-full max-w-md rounded-2xl bg-white p-6 shadow-xl">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold">Create Preset</h2>
          <button onClick={onClose} className="text-zinc-400 hover:text-zinc-600">
            <Icon name="x" className="h-5 w-5" />
          </button>
        </div>

        <p className="text-sm text-zinc-500 mb-4">
          Creating preset with <strong>{selectedPromptIds.length}</strong> prompts
        </p>

        {error && (
          <div className="mb-4 rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-800">
            {error}
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Name</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              placeholder="e.g., Horror Scene Pack"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Description</label>
            <input
              type="text"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
              placeholder="What this preset is for"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-zinc-700 mb-1">Category</label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value as PromptCategory)}
              className="w-full rounded-lg border border-zinc-200 px-3 py-2 text-sm"
            >
              {PROMPT_CATEGORIES.map((cat) => (
                <option key={cat.id} value={cat.id}>
                  {cat.name}
                </option>
              ))}
            </select>
          </div>

          <label className="flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={showInQuickAccess}
              onChange={(e) => setShowInQuickAccess(e.target.checked)}
              className="rounded border-zinc-300"
            />
            <span className="text-sm text-zinc-700">Show in Quick Access toolbar</span>
          </label>

          <div className="flex justify-end gap-3 pt-4 border-t border-zinc-100">
            <SecondaryButton type="button" onClick={onClose}>
              Cancel
            </SecondaryButton>
            <PrimaryButton type="submit" disabled={loading || !name}>
              {loading ? "Creating..." : "Create Preset"}
            </PrimaryButton>
          </div>
        </form>
      </div>
    </div>
  );
}
