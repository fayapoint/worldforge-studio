"use client";

import { useState, useEffect, useCallback, useMemo } from "react";
import { Icon, type IconName } from "@/lib/ui";
import { apiFetch } from "@/lib/apiClient";
import type { 
  CommunityWardrobeItem, 
  WardrobeItemType, 
  WardrobeItemRarity,
  Entity,
} from "@/lib/models";

// =====================================================
// CONSTANTS
// =====================================================
const WARDROBE_TYPE_OPTIONS: { value: WardrobeItemType; label: string; icon: IconName }[] = [
  { value: "FULL_OUTFIT", label: "Full Outfit", icon: "character" },
  { value: "TOP", label: "Top", icon: "layers" },
  { value: "BOTTOM", label: "Bottom", icon: "layers" },
  { value: "DRESS", label: "Dress", icon: "star" },
  { value: "OUTERWEAR", label: "Outerwear", icon: "shield" },
  { value: "FOOTWEAR", label: "Footwear", icon: "target" },
  { value: "ACCESSORY", label: "Accessory", icon: "sparkles" },
  { value: "HEADWEAR", label: "Headwear", icon: "star" },
  { value: "JEWELRY", label: "Jewelry", icon: "sparkles" },
  { value: "BAG", label: "Bag", icon: "item" },
  { value: "EYEWEAR", label: "Eyewear", icon: "eye" },
  { value: "GLOVES", label: "Gloves", icon: "shield" },
  { value: "BELT", label: "Belt", icon: "target" },
  { value: "SCARF", label: "Scarf", icon: "wind" },
  { value: "UNIFORM", label: "Uniform", icon: "users" },
  { value: "COSTUME", label: "Costume", icon: "film" },
];

const RARITY_OPTIONS: { value: WardrobeItemRarity; label: string; color: string }[] = [
  { value: "COMMON", label: "Common", color: "zinc" },
  { value: "UNCOMMON", label: "Uncommon", color: "green" },
  { value: "RARE", label: "Rare", color: "blue" },
  { value: "UNIQUE", label: "Unique", color: "purple" },
  { value: "LEGENDARY", label: "Legendary", color: "amber" },
];

const CATEGORY_OPTIONS = [
  "casual", "formal", "workwear", "evening", "athletic", "sleepwear",
  "swimwear", "outerwear", "vintage", "modern", "futuristic", "fantasy",
  "historical", "military", "medical", "religious", "cultural",
];

const GENDER_OPTIONS = [
  { value: "UNISEX", label: "Unisex" },
  { value: "MALE", label: "Male" },
  { value: "FEMALE", label: "Female" },
];

// =====================================================
// WARDROBE ITEM CARD
// =====================================================
function WardrobeItemCard({
  item,
  onSelect,
  onEdit,
  onDelete,
  onFavorite,
  isFavorite,
  compact = false,
}: {
  item: CommunityWardrobeItem;
  onSelect?: (item: CommunityWardrobeItem) => void;
  onEdit?: (item: CommunityWardrobeItem) => void;
  onDelete?: (item: CommunityWardrobeItem) => void;
  onFavorite?: (item: CommunityWardrobeItem) => void;
  isFavorite?: boolean;
  compact?: boolean;
}) {
  const rarityColor = RARITY_OPTIONS.find(r => r.value === item.rarity)?.color || "zinc";
  const typeInfo = WARDROBE_TYPE_OPTIONS.find(t => t.value === item.type);

  const getRarityBgClass = () => {
    switch (item.rarity) {
      case "LEGENDARY": return "bg-amber-500";
      case "RARE": return "bg-purple-500";
      case "UNCOMMON": return "bg-blue-500";
      default: return "bg-zinc-500";
    }
  };

  return (
    <div 
      className={`group relative rounded-xl bg-white border border-zinc-200 overflow-hidden shadow-sm hover:shadow-xl hover:border-indigo-300 transition-all cursor-pointer ${
        compact ? "p-2" : "p-3"
      }`}
      onClick={() => onSelect?.(item)}
    >
      {/* Image or placeholder */}
      <div className={`relative rounded-lg overflow-hidden bg-gradient-to-br from-zinc-100 to-zinc-200 ${
        compact ? "h-20 mb-2" : "h-32 mb-3"
      }`}>
        {item.imageUrl || item.thumbnailUrl ? (
          <img 
            src={item.thumbnailUrl || item.imageUrl} 
            alt={item.name}
            className="w-full h-full object-cover transition-transform group-hover:scale-105"
            onError={(e) => {
              (e.target as HTMLImageElement).style.display = 'none';
              (e.target as HTMLImageElement).nextElementSibling?.classList.remove('hidden');
            }}
          />
        ) : null}
        <div className={`w-full h-full flex items-center justify-center ${item.imageUrl || item.thumbnailUrl ? 'hidden' : ''}`}>
          <Icon name={typeInfo?.icon || "star"} className={`text-zinc-300 ${compact ? "h-8 w-8" : "h-12 w-12"}`} />
        </div>
        
        {/* Rarity badge */}
        <div className={`absolute top-1.5 left-1.5 px-2 py-0.5 rounded-full text-[9px] font-bold uppercase ${getRarityBgClass()} text-white shadow-sm`}>
          {item.rarity}
        </div>

        {/* Character badge */}
        {item.characterName && (
          <div className="absolute bottom-1.5 left-1.5 px-2 py-0.5 rounded-full text-[9px] font-medium bg-indigo-600 text-white truncate max-w-[85%] shadow-sm">
            {item.characterName}
          </div>
        )}

        {/* Actions overlay */}
        <div className="absolute inset-0 bg-gradient-to-t from-black/70 via-black/30 to-transparent opacity-0 group-hover:opacity-100 transition-opacity flex items-end justify-end p-2 gap-1.5">
          {onEdit && (
            <button
              onClick={(e) => { e.stopPropagation(); onEdit(item); }}
              className="p-2 rounded-full bg-white/95 hover:bg-white text-indigo-600 transition-all shadow-lg"
              title="Edit"
            >
              <Icon name="edit" className="h-4 w-4" />
            </button>
          )}
          {onFavorite && (
            <button
              onClick={(e) => { e.stopPropagation(); onFavorite(item); }}
              className={`p-2 rounded-full transition-all shadow-lg ${
                isFavorite 
                  ? "bg-red-500 text-white hover:bg-red-600" 
                  : "bg-white/95 hover:bg-white text-zinc-600"
              }`}
              title={isFavorite ? "Remove from favorites" : "Add to favorites"}
            >
              <Icon name="heart" className="h-4 w-4" />
            </button>
          )}
          {onDelete && (
            <button
              onClick={(e) => { e.stopPropagation(); if (confirm(`Delete "${item.name}"?`)) onDelete(item); }}
              className="p-2 rounded-full bg-white/95 hover:bg-red-500 hover:text-white text-red-500 transition-all shadow-lg"
              title="Delete"
            >
              <Icon name="trash" className="h-4 w-4" />
            </button>
          )}
        </div>
      </div>

      {/* Info */}
      <div>
        <h4 className={`font-semibold text-zinc-900 truncate ${compact ? "text-xs" : "text-sm"}`}>
          {item.name}
        </h4>
        {!compact && (
          <>
            <p className="text-[10px] text-zinc-500 truncate mt-0.5">
              {item.description || item.promptText}
            </p>
            <div className="flex items-center gap-2 mt-1.5">
              <span className="flex items-center gap-0.5 text-[9px] text-zinc-400">
                <Icon name="eye" className="h-3 w-3" />
                {item.usageCount}
              </span>
              {item.tags?.length > 0 && (
                <span className="text-[9px] text-zinc-400 truncate">
                  {item.tags.slice(0, 2).join(", ")}
                </span>
              )}
            </div>
          </>
        )}
      </div>
    </div>
  );
}

// =====================================================
// ADD/EDIT WARDROBE ITEM MODAL
// =====================================================
function WardrobeItemModal({
  item,
  characters,
  onSave,
  onClose,
  onAnalyzeImage,
}: {
  item?: CommunityWardrobeItem;
  characters: Entity[];
  onSave: (data: Partial<CommunityWardrobeItem>) => Promise<void>;
  onClose: () => void;
  onAnalyzeImage?: (imageUrl: string) => Promise<{ description: string; suggestedPrompt: string }>;
}) {
  const [formData, setFormData] = useState<Partial<CommunityWardrobeItem>>({
    name: item?.name || "",
    type: item?.type || "TOP",
    description: item?.description || "",
    promptText: item?.promptText || "",
    negativePrompt: item?.negativePrompt || "",
    color: item?.color || "",
    pattern: item?.pattern || "",
    material: item?.material || "",
    style: item?.style || "",
    era: item?.era || "",
    tags: item?.tags || [],
    category: item?.category || "",
    gender: item?.gender || "UNISEX",
    rarity: item?.rarity || "COMMON",
    isPublic: item?.isPublic ?? true,
    characterEntityId: item?.characterEntityId || "",
    characterName: item?.characterName || "",
    imageUrl: item?.imageUrl || "",
  });
  const [saving, setSaving] = useState(false);
  const [analyzing, setAnalyzing] = useState(false);
  const [tagInput, setTagInput] = useState("");

  const updateField = <K extends keyof CommunityWardrobeItem>(field: K, value: CommunityWardrobeItem[K]) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const addTag = () => {
    if (tagInput.trim() && !formData.tags?.includes(tagInput.trim())) {
      updateField("tags", [...(formData.tags || []), tagInput.trim()]);
      setTagInput("");
    }
  };

  const removeTag = (tag: string) => {
    updateField("tags", formData.tags?.filter(t => t !== tag) || []);
  };

  const handleAnalyzeImage = async () => {
    if (!formData.imageUrl || !onAnalyzeImage) return;
    setAnalyzing(true);
    try {
      const result = await onAnalyzeImage(formData.imageUrl);
      setFormData(prev => ({
        ...prev,
        aiGeneratedDescription: result.description,
        aiSuggestedPrompt: result.suggestedPrompt,
        description: prev.description || result.description,
        promptText: prev.promptText || result.suggestedPrompt,
      }));
    } catch (err) {
      console.error("Failed to analyze image:", err);
    }
    setAnalyzing(false);
  };

  const handleSave = async () => {
    if (!formData.name || !formData.promptText) return;
    setSaving(true);
    try {
      await onSave(formData);
      onClose();
    } catch (err) {
      console.error("Failed to save:", err);
    }
    setSaving(false);
  };

  const handleCharacterSelect = (entityId: string) => {
    const character = characters.find(c => c._id === entityId);
    setFormData(prev => ({
      ...prev,
      characterEntityId: entityId,
      characterName: character?.name || "",
    }));
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
      <div className="w-full max-w-2xl max-h-[90vh] overflow-auto bg-white/95 backdrop-blur-xl rounded-2xl shadow-2xl">
        {/* Header */}
        <div className="sticky top-0 z-10 flex items-center justify-between p-4 border-b border-zinc-200 bg-white/95 backdrop-blur-xl rounded-t-2xl">
          <h2 className="text-lg font-bold text-zinc-900">
            {item ? "Edit Wardrobe Item" : "Add Wardrobe Item"}
          </h2>
          <button onClick={onClose} className="p-2 rounded-lg hover:bg-zinc-100 transition-all">
            <Icon name="x" className="h-5 w-5 text-zinc-500" />
          </button>
        </div>

        {/* Form */}
        <div className="p-4 space-y-4">
          {/* Image URL */}
          <div>
            <label className="text-xs font-semibold text-zinc-600 mb-1 block">Image URL</label>
            <div className="flex gap-2">
              <input
                type="text"
                value={formData.imageUrl || ""}
                onChange={(e) => updateField("imageUrl", e.target.value)}
                placeholder="https://... or paste image"
                className="flex-1 px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              {onAnalyzeImage && formData.imageUrl && (
                <button
                  onClick={handleAnalyzeImage}
                  disabled={analyzing}
                  className="px-4 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
                >
                  {analyzing ? (
                    <Icon name="refresh" className="h-4 w-4 animate-spin" />
                  ) : (
                    <Icon name="sparkles" className="h-4 w-4" />
                  )}
                  Analyze
                </button>
              )}
            </div>
            {formData.imageUrl && (
              <div className="mt-2 w-24 h-24 rounded-lg overflow-hidden bg-zinc-100">
                <img src={formData.imageUrl} alt="Preview" className="w-full h-full object-cover" />
              </div>
            )}
          </div>

          {/* Name & Type */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-600 mb-1 block">Name *</label>
              <input
                type="text"
                value={formData.name || ""}
                onChange={(e) => updateField("name", e.target.value)}
                placeholder="e.g., Vintage Leather Jacket"
                className="w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-600 mb-1 block">Type</label>
              <select
                value={formData.type || "TOP"}
                onChange={(e) => updateField("type", e.target.value as WardrobeItemType)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                {WARDROBE_TYPE_OPTIONS.map(opt => (
                  <option key={opt.value} value={opt.value}>{opt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Prompt Text */}
          <div>
            <label className="text-xs font-semibold text-zinc-600 mb-1 block">Prompt Text * (what gets added to prompts)</label>
            <textarea
              value={formData.promptText || ""}
              onChange={(e) => updateField("promptText", e.target.value)}
              placeholder="e.g., worn brown leather jacket with brass buttons, distressed vintage style, motorcycle jacket silhouette"
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={3}
            />
          </div>

          {/* Description */}
          <div>
            <label className="text-xs font-semibold text-zinc-600 mb-1 block">Description</label>
            <textarea
              value={formData.description || ""}
              onChange={(e) => updateField("description", e.target.value)}
              placeholder="Human-readable description for browsing..."
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 resize-none"
              rows={2}
            />
          </div>

          {/* Visual Attributes */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-600 mb-1 block">Color</label>
              <input
                type="text"
                value={formData.color || ""}
                onChange={(e) => updateField("color", e.target.value)}
                placeholder="e.g., brown"
                className="w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-600 mb-1 block">Material</label>
              <input
                type="text"
                value={formData.material || ""}
                onChange={(e) => updateField("material", e.target.value)}
                placeholder="e.g., leather"
                className="w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-600 mb-1 block">Pattern</label>
              <input
                type="text"
                value={formData.pattern || ""}
                onChange={(e) => updateField("pattern", e.target.value)}
                placeholder="e.g., solid, plaid"
                className="w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
          </div>

          {/* Style, Era, Category */}
          <div className="grid grid-cols-3 gap-3">
            <div>
              <label className="text-xs font-semibold text-zinc-600 mb-1 block">Style</label>
              <input
                type="text"
                value={formData.style || ""}
                onChange={(e) => updateField("style", e.target.value)}
                placeholder="e.g., casual, formal"
                className="w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-600 mb-1 block">Era</label>
              <input
                type="text"
                value={formData.era || ""}
                onChange={(e) => updateField("era", e.target.value)}
                placeholder="e.g., 1980s, modern"
                className="w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-600 mb-1 block">Category</label>
              <select
                value={formData.category || ""}
                onChange={(e) => updateField("category", e.target.value)}
                className="w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              >
                <option value="">Select...</option>
                {CATEGORY_OPTIONS.map(cat => (
                  <option key={cat} value={cat}>{cat}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Gender & Rarity */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="text-xs font-semibold text-zinc-600 mb-1 block">Gender</label>
              <div className="flex gap-2">
                {GENDER_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => updateField("gender", opt.value as "MALE" | "FEMALE" | "UNISEX")}
                    className={`flex-1 px-3 py-2 rounded-lg text-xs font-medium transition-all ${
                      formData.gender === opt.value
                        ? "bg-indigo-600 text-white"
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="text-xs font-semibold text-zinc-600 mb-1 block">Rarity</label>
              <div className="flex gap-1">
                {RARITY_OPTIONS.map(opt => (
                  <button
                    key={opt.value}
                    onClick={() => updateField("rarity", opt.value)}
                    className={`flex-1 px-2 py-2 rounded-lg text-[10px] font-medium transition-all ${
                      formData.rarity === opt.value
                        ? `bg-${opt.color}-500 text-white`
                        : "bg-zinc-100 text-zinc-600 hover:bg-zinc-200"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </div>
          </div>

          {/* Character Association */}
          <div>
            <label className="text-xs font-semibold text-zinc-600 mb-1 block">Associated Character (optional)</label>
            <select
              value={formData.characterEntityId || ""}
              onChange={(e) => handleCharacterSelect(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
            >
              <option value="">None - Community Item</option>
              {characters.map(char => (
                <option key={char._id} value={char._id}>{char.name}</option>
              ))}
            </select>
          </div>

          {/* Tags */}
          <div>
            <label className="text-xs font-semibold text-zinc-600 mb-1 block">Tags</label>
            <div className="flex gap-2 mb-2">
              <input
                type="text"
                value={tagInput}
                onChange={(e) => setTagInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && (e.preventDefault(), addTag())}
                placeholder="Add tag..."
                className="flex-1 px-3 py-2 rounded-lg bg-zinc-50 border border-zinc-200 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
              />
              <button
                onClick={addTag}
                className="px-4 py-2 rounded-lg bg-zinc-200 text-zinc-700 text-sm font-medium hover:bg-zinc-300"
              >
                Add
              </button>
            </div>
            <div className="flex flex-wrap gap-1">
              {formData.tags?.map(tag => (
                <span 
                  key={tag} 
                  className="inline-flex items-center gap-1 px-2 py-1 rounded-full bg-indigo-100 text-indigo-700 text-xs"
                >
                  {tag}
                  <button onClick={() => removeTag(tag)} className="hover:text-indigo-900">
                    <Icon name="x" className="h-3 w-3" />
                  </button>
                </span>
              ))}
            </div>
          </div>

          {/* Public toggle */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => updateField("isPublic", !formData.isPublic)}
              className={`relative w-12 h-6 rounded-full transition-colors ${
                formData.isPublic ? "bg-indigo-600" : "bg-zinc-300"
              }`}
            >
              <div className={`absolute top-1 w-4 h-4 rounded-full bg-white transition-transform ${
                formData.isPublic ? "left-7" : "left-1"
              }`} />
            </button>
            <span className="text-sm text-zinc-600">
              {formData.isPublic ? "Public - visible to all users" : "Private - only visible to you"}
            </span>
          </div>
        </div>

        {/* Footer */}
        <div className="sticky bottom-0 flex items-center justify-end gap-3 p-4 border-t border-zinc-200 bg-white/95 backdrop-blur-xl rounded-b-2xl">
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg bg-zinc-100 text-zinc-700 text-sm font-medium hover:bg-zinc-200"
          >
            Cancel
          </button>
          <button
            onClick={handleSave}
            disabled={saving || !formData.name || !formData.promptText}
            className="px-6 py-2 rounded-lg bg-indigo-600 text-white text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center gap-2"
          >
            {saving && <Icon name="refresh" className="h-4 w-4 animate-spin" />}
            {item ? "Update" : "Create"}
          </button>
        </div>
      </div>
    </div>
  );
}

// =====================================================
// MAIN WARDROBE MANAGER COMPONENT
// =====================================================
type WardrobeManagerProps = {
  characters?: Entity[];
  selectedCharacterId?: string;
  onSelectItem?: (item: CommunityWardrobeItem) => void;
  mode?: "browse" | "select" | "manage";
  compact?: boolean;
};

export function WardrobeManager({
  characters = [],
  selectedCharacterId,
  onSelectItem,
  mode = "browse",
  compact = false,
}: WardrobeManagerProps) {
  const [items, setItems] = useState<CommunityWardrobeItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchText, setSearchText] = useState("");
  const [selectedType, setSelectedType] = useState<WardrobeItemType | "">("");
  const [selectedRarity, setSelectedRarity] = useState<WardrobeItemRarity | "">("");
  const [showCharacterItems, setShowCharacterItems] = useState(false);
  const [editingItem, setEditingItem] = useState<CommunityWardrobeItem | undefined>();
  const [showAddModal, setShowAddModal] = useState(false);
  const [favoriteIds, setFavoriteIds] = useState<Set<string>>(new Set());

  const [error, setError] = useState<string | null>(null);

  // Fetch wardrobe items
  const fetchItems = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const params = new URLSearchParams();
      if (selectedType) params.set("type", selectedType);
      if (selectedRarity) params.set("rarity", selectedRarity);
      if (searchText) params.set("search", searchText);
      if (showCharacterItems && selectedCharacterId) {
        params.set("characterEntityId", selectedCharacterId);
      }

      const result = await apiFetch<{ items: CommunityWardrobeItem[]; count: number }>(`/api/wardrobe?${params.toString()}`);
      
      if (!result.ok) {
        setError(result.error.message);
        setItems([]);
      } else if (result.data.items) {
        setItems(result.data.items);
      } else {
        setError("No items in response");
        setItems([]);
      }
    } catch (err) {
      console.error("Failed to fetch wardrobe items:", err);
      setError(err instanceof Error ? err.message : "Failed to fetch");
      setItems([]);
    }
    setLoading(false);
  }, [selectedType, selectedRarity, searchText, showCharacterItems, selectedCharacterId]);

  useEffect(() => {
    fetchItems();
  }, [fetchItems]);

  // Filtered items
  const filteredItems = useMemo(() => {
    let result = items;
    
    if (searchText && !loading) {
      const search = searchText.toLowerCase();
      result = result.filter(item => 
        item.name.toLowerCase().includes(search) ||
        item.description?.toLowerCase().includes(search) ||
        item.promptText.toLowerCase().includes(search) ||
        item.tags?.some(t => t.toLowerCase().includes(search))
      );
    }

    return result;
  }, [items, searchText, loading]);

  // Handle save
  const handleSaveItem = async (data: Partial<CommunityWardrobeItem>) => {
    const url = editingItem ? `/api/wardrobe/${editingItem._id}` : "/api/wardrobe";
    const method = editingItem ? "PUT" : "POST";

    const result = await apiFetch(url, {
      method,
      body: JSON.stringify(data),
    });

    if (!result.ok) {
      throw new Error(result.error.message || "Failed to save");
    }

    await fetchItems();
  };

  // Handle select
  const handleSelect = (item: CommunityWardrobeItem) => {
    if (onSelectItem) {
      // Track usage
      apiFetch(`/api/wardrobe/${item._id}`, {
        method: "PATCH",
        body: JSON.stringify({ action: "use" }),
      });
      onSelectItem(item);
    }
  };

  // Handle favorite
  const handleFavorite = async (item: CommunityWardrobeItem) => {
    const isFav = favoriteIds.has(item._id);
    const action = isFav ? "unfavorite" : "favorite";
    
    await apiFetch(`/api/wardrobe/${item._id}`, {
      method: "PATCH",
      body: JSON.stringify({ action }),
    });

    setFavoriteIds(prev => {
      const next = new Set(prev);
      if (isFav) {
        next.delete(item._id);
      } else {
        next.add(item._id);
      }
      return next;
    });
  };

  // Handle delete
  const handleDelete = async (item: CommunityWardrobeItem) => {
    const result = await apiFetch(`/api/wardrobe/${item._id}`, {
      method: "DELETE",
    });
    
    if (result.ok) {
      await fetchItems();
    } else {
      alert("Failed to delete item: " + (result.error?.message || "Unknown error"));
    }
  };

  return (
    <div className={`flex flex-col h-full ${compact ? "" : "bg-white/40 backdrop-blur-xl rounded-2xl"}`}>
      {/* Header */}
      <div className={`flex-shrink-0 ${compact ? "p-2" : "p-4"} border-b border-white/20`}>
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            <div className="p-2 rounded-xl bg-gradient-to-br from-pink-500 to-rose-600 text-white">
              <Icon name="sparkles" className="h-5 w-5" />
            </div>
            <div>
              <h3 className={`font-bold text-zinc-900 ${compact ? "text-sm" : "text-lg"}`}>
                Community Wardrobe
              </h3>
              {!compact && (
                <p className="text-xs text-zinc-500">{filteredItems.length} items available</p>
              )}
            </div>
          </div>
          {mode === "manage" && (
            <button
              onClick={() => { setEditingItem(undefined); setShowAddModal(true); }}
              className="px-3 py-2 rounded-lg bg-indigo-600 text-white text-xs font-medium hover:bg-indigo-700 flex items-center gap-1.5"
            >
              <Icon name="plus" className="h-4 w-4" />
              Add Item
            </button>
          )}
        </div>

        {/* Search */}
        <div className="relative mb-3">
          <Icon name="search" className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-zinc-400" />
          <input
            type="text"
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            placeholder="Search wardrobe..."
            className={`w-full pl-9 pr-4 rounded-xl bg-white/60 border border-white/40 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 ${
              compact ? "py-2" : "py-2.5"
            }`}
          />
        </div>

        {/* Filters */}
        <div className="flex flex-wrap gap-2">
          {/* Type filter */}
          <select
            value={selectedType}
            onChange={(e) => setSelectedType(e.target.value as WardrobeItemType | "")}
            className="px-3 py-1.5 rounded-lg bg-white/60 border border-white/40 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Types</option>
            {WARDROBE_TYPE_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Rarity filter */}
          <select
            value={selectedRarity}
            onChange={(e) => setSelectedRarity(e.target.value as WardrobeItemRarity | "")}
            className="px-3 py-1.5 rounded-lg bg-white/60 border border-white/40 text-xs focus:outline-none focus:ring-2 focus:ring-indigo-500"
          >
            <option value="">All Rarities</option>
            {RARITY_OPTIONS.map(opt => (
              <option key={opt.value} value={opt.value}>{opt.label}</option>
            ))}
          </select>

          {/* Character items toggle */}
          {selectedCharacterId && (
            <button
              onClick={() => setShowCharacterItems(!showCharacterItems)}
              className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-all ${
                showCharacterItems
                  ? "bg-indigo-600 text-white"
                  : "bg-white/60 border border-white/40 text-zinc-600 hover:bg-white"
              }`}
            >
              <Icon name="character" className="h-3 w-3 inline mr-1" />
              Character Items
            </button>
          )}
        </div>
      </div>

      {/* Items Grid */}
      <div className={`flex-1 overflow-auto ${compact ? "p-2" : "p-4"}`}>
        {loading ? (
          <div className="flex items-center justify-center h-32">
            <Icon name="refresh" className="h-6 w-6 animate-spin text-zinc-400" />
          </div>
        ) : error ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <Icon name="alert" className="h-8 w-8 text-red-400 mb-2" />
            <p className="text-sm text-red-600 font-medium">Error loading wardrobe</p>
            <p className="text-xs text-red-500">{error}</p>
            <button 
              onClick={fetchItems}
              className="mt-3 px-4 py-2 rounded-lg bg-red-100 text-red-700 text-xs font-medium hover:bg-red-200"
            >
              Try Again
            </button>
          </div>
        ) : filteredItems.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-32 text-center">
            <Icon name="search" className="h-8 w-8 text-zinc-300 mb-2" />
            <p className="text-sm text-zinc-500">No wardrobe items found</p>
            <p className="text-xs text-zinc-400">Try adjusting your filters</p>
          </div>
        ) : (
          <div className={`grid gap-3 ${
            compact 
              ? "grid-cols-3" 
              : "grid-cols-2 sm:grid-cols-3 md:grid-cols-4"
          }`}>
            {filteredItems.map(item => (
              <WardrobeItemCard
                key={item._id}
                item={item}
                onSelect={handleSelect}
                onEdit={mode === "manage" ? (item) => { setEditingItem(item); setShowAddModal(true); } : undefined}
                onDelete={mode === "manage" ? handleDelete : undefined}
                onFavorite={handleFavorite}
                isFavorite={favoriteIds.has(item._id)}
                compact={compact}
              />
            ))}
          </div>
        )}
      </div>

      {/* Add/Edit Modal */}
      {showAddModal && (
        <WardrobeItemModal
          item={editingItem}
          characters={characters}
          onSave={handleSaveItem}
          onClose={() => { setShowAddModal(false); setEditingItem(undefined); }}
        />
      )}
    </div>
  );
}

export default WardrobeManager;
