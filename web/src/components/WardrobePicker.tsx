"use client";

import { useState, useEffect, useCallback } from "react";
import { Icon, type IconName } from "@/lib/ui";
import { apiFetch } from "@/lib/apiClient";
import type { CommunityWardrobeItem, WardrobeItemType, Entity } from "@/lib/models";

// =====================================================
// WARDROBE PICKER - Compact selector for screenplay/character use
// =====================================================

const TYPE_ICONS: Record<WardrobeItemType, IconName> = {
  FULL_OUTFIT: "character",
  TOP: "layers",
  BOTTOM: "layers",
  DRESS: "star",
  OUTERWEAR: "shield",
  FOOTWEAR: "target",
  ACCESSORY: "sparkles",
  HEADWEAR: "star",
  JEWELRY: "sparkles",
  BAG: "item",
  EYEWEAR: "eye",
  GLOVES: "shield",
  BELT: "target",
  SCARF: "wind",
  UNIFORM: "users",
  COSTUME: "film",
};

type WardrobePickerProps = {
  characterEntityId?: string;
  characterName?: string;
  onSelectItem: (item: CommunityWardrobeItem) => void;
  onClose: () => void;
  initialType?: WardrobeItemType;
};

export function WardrobePicker({
  characterEntityId,
  characterName,
  onSelectItem,
  onClose,
  initialType,
}: WardrobePickerProps) {
  const [items, setItems] = useState<CommunityWardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [selectedType, setSelectedType] = useState<WardrobeItemType | "">(initialType || "");
  const [showCharacterOnly, setShowCharacterOnly] = useState(false);

  // Fetch items
  const fetchItems = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams();
      if (selectedType) params.set("type", selectedType);
      if (searchText) params.set("search", searchText);
      if (showCharacterOnly && characterEntityId) {
        params.set("characterEntityId", characterEntityId);
      }

      const result = await apiFetch<{ items: CommunityWardrobeItem[] }>(`/api/wardrobe?${params.toString()}`);
      if (result.ok && result.data.items) {
        setItems(result.data.items);
      }
    } catch (err) {
      console.error("Failed to fetch wardrobe:", err);
    }
    setLoading(false);
  }, [selectedType, searchText, showCharacterOnly, characterEntityId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  const handleSelect = (item: CommunityWardrobeItem) => {
    // Track usage
    apiFetch(`/api/wardrobe/${item._id}`, {
      method: "PATCH",
      body: JSON.stringify({ action: "use" }),
    });
    onSelectItem(item);
  };

  const filteredItems = items.filter(item => {
    if (!searchText) return true;
    const search = searchText.toLowerCase();
    return (
      item.name.toLowerCase().includes(search) ||
      item.description?.toLowerCase().includes(search) ||
      item.promptText.toLowerCase().includes(search) ||
      item.tags?.some(t => t.toLowerCase().includes(search))
    );
  });

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[80vh] overflow-hidden bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl flex flex-col">
        {/* Header */}
        <div className="flex-shrink-0 flex items-center justify-between p-4 border-b border-zinc-200">
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 text-white">
              <Icon name="sparkles" className="h-5 w-5" />
            </div>
            <div>
              <h2 className="text-lg font-bold text-zinc-900">Select Wardrobe Item</h2>
              {characterName && (
                <p className="text-xs text-zinc-500">for {characterName}</p>
              )}
            </div>
          </div>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-zinc-100 transition-all">
            <Icon name="x" className="h-5 w-5 text-zinc-500" />
          </button>
        </div>

        {/* Search and Filters */}
        <div className="flex-shrink-0 p-4 border-b border-zinc-100 space-y-3">
          {/* Search */}
          <div className="relative">
            <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
            <input
              type="text"
              value={searchText}
              onChange={(e) => setSearchText(e.target.value)}
              placeholder="Search wardrobe items..."
              className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-zinc-50 border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              autoFocus
            />
          </div>

          {/* Type Filter Pills */}
          <div className="flex flex-wrap gap-2">
            <button
              onClick={() => setSelectedType("")}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                !selectedType
                  ? "bg-indigo-600 text-white"
                  : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
              }`}
            >
              All
            </button>
            {(["FULL_OUTFIT", "TOP", "BOTTOM", "OUTERWEAR", "FOOTWEAR", "ACCESSORY", "HEADWEAR"] as WardrobeItemType[]).map(type => (
              <button
                key={type}
                onClick={() => setSelectedType(selectedType === type ? "" : type)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1 ${
                  selectedType === type
                    ? "bg-indigo-600 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                <Icon name={TYPE_ICONS[type]} className="h-3 w-3" />
                {type.replace("_", " ")}
              </button>
            ))}
          </div>

          {/* Character filter */}
          {characterEntityId && (
            <div className="flex items-center gap-2">
              <button
                onClick={() => setShowCharacterOnly(!showCharacterOnly)}
                className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all flex items-center gap-1.5 ${
                  showCharacterOnly
                    ? "bg-purple-600 text-white"
                    : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                }`}
              >
                <Icon name="character" className="h-3 w-3" />
                {characterName}&apos;s Items Only
              </button>
            </div>
          )}
        </div>

        {/* Items Grid */}
        <div className="flex-1 overflow-auto p-4">
          {loading ? (
            <div className="flex items-center justify-center h-32">
              <Icon name="refresh" className="h-6 w-6 animate-spin text-zinc-400" />
            </div>
          ) : filteredItems.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-32 text-center">
              <Icon name="search" className="h-8 w-8 text-zinc-300 mb-2" />
              <p className="text-sm text-zinc-500">No items found</p>
            </div>
          ) : (
            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
              {filteredItems.map(item => (
                <button
                  key={item._id}
                  onClick={() => handleSelect(item)}
                  className="group p-3 rounded-xl bg-zinc-50 border border-zinc-200 hover:border-indigo-300 hover:bg-indigo-50 transition-all text-left"
                >
                  <div className="flex items-start gap-2 mb-2">
                    {item.thumbnailUrl || item.imageUrl ? (
                      <img
                        src={item.thumbnailUrl || item.imageUrl}
                        alt={item.name}
                        className="w-10 h-10 rounded-lg object-cover"
                      />
                    ) : (
                      <div className="w-10 h-10 rounded-lg bg-zinc-200 flex items-center justify-center">
                        <Icon name={TYPE_ICONS[item.type] || "star"} className="h-5 w-5 text-zinc-400" />
                      </div>
                    )}
                    <div className="flex-1 min-w-0">
                      <h4 className="font-semibold text-xs text-zinc-900 truncate group-hover:text-indigo-700">
                        {item.name}
                      </h4>
                      <p className="text-[10px] text-zinc-500">{item.type.replace("_", " ")}</p>
                    </div>
                  </div>
                  <p className="text-[10px] text-zinc-600 line-clamp-2">{item.promptText}</p>
                  {item.characterName && (
                    <div className="mt-2 px-1.5 py-0.5 rounded bg-purple-100 text-purple-700 text-[9px] font-medium inline-block">
                      {item.characterName}
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        {/* Footer hint */}
        <div className="flex-shrink-0 px-4 py-3 bg-zinc-50 border-t border-zinc-200 text-center">
          <p className="text-xs text-zinc-500">
            Click an item to add its prompt text to the outfit description
          </p>
        </div>
      </div>
    </div>
  );
}

export default WardrobePicker;
