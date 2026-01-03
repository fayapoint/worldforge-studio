// =====================================================
// UNIFIED PROMPT LIBRARY SYSTEM
// Central hub for ALL prompts across WorldForge Studio
// =====================================================

import type { IconName } from "./ui";

// =====================================================
// PROMPT CATEGORIES - All sections that have prompts
// =====================================================
export type PromptCategory =
  | "CINEMATIC"      // Camera, lighting, composition
  | "WARDROBE"       // Clothing, accessories, costumes
  | "PROPS"          // Objects, items, set dressing
  | "CHARACTER"      // Character descriptions, appearances
  | "LOCATION"       // Environment, setting descriptions
  | "ATMOSPHERE"     // Mood, tone, feeling
  | "ACTION"         // Movement, behavior, activity
  | "DIALOGUE"       // Speech patterns, voice
  | "SCREENPLAY"     // Scene directions, beats
  | "CONTINUITY"     // Identity locks, consistency rules
  | "NEGATIVE"       // What to avoid
  | "STYLE"          // Visual style, aesthetic
  | "CUSTOM";        // User-defined

export type PromptVisibility = "PUBLIC" | "PRIVATE" | "SHARED";

export type PromptRarity = "COMMON" | "UNCOMMON" | "RARE" | "EPIC" | "LEGENDARY";

// =====================================================
// UNIFIED PROMPT ITEM - The core data structure
// =====================================================
export type PromptLibraryItem = {
  _id: string;
  
  // Identity
  name: string;
  slug: string; // URL-friendly identifier
  description: string;
  
  // The actual prompt content
  promptText: string;
  negativePrompt?: string;
  
  // Categorization
  category: PromptCategory;
  subcategory?: string;
  tags: string[];
  
  // Visual representation
  icon: IconName;
  color?: string; // Gradient or solid color class
  thumbnailUrl?: string;
  previewImageUrl?: string;
  
  // Visibility & Access
  visibility: PromptVisibility;
  isBuiltIn: boolean; // System-provided vs user-created
  isLocked: boolean; // Cannot be edited
  isFavorite: boolean;
  
  // Rarity for gamification
  rarity: PromptRarity;
  
  // Context hints - where this prompt works best
  suggestedPlacements: PromptPlacement[];
  compatibleWith?: string[]; // Other prompt IDs that work well together
  conflictsWith?: string[]; // Prompts that don't work well together
  
  // Usage tracking
  usageCount: number;
  lastUsedAt?: Date;
  favoriteCount: number;
  
  // Variables/templating
  variables?: PromptVariable[];
  
  // Ownership
  tenantId?: string;
  projectId?: string; // If project-specific
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
  
  // Version history
  previousVersions?: {
    promptText: string;
    updatedAt: Date;
    updatedBy: string;
    reason?: string;
  }[];
};

// =====================================================
// PROMPT VARIABLES - For templating
// =====================================================
export type PromptVariableType = "TEXT" | "SELECT" | "NUMBER" | "COLOR" | "ENTITY";

export type PromptVariable = {
  key: string;
  label: string;
  type: PromptVariableType;
  defaultValue?: string;
  options?: string[]; // For SELECT type
  placeholder?: string;
  required: boolean;
};

// =====================================================
// PROMPT PLACEMENT - Where prompts can appear
// =====================================================
export type PromptPlacement =
  | "SCENE_COMPOSER"      // Main scene prompt builder
  | "SHOT_BUILDER"        // Individual shot prompts
  | "CHARACTER_CARD"      // Character appearance
  | "WARDROBE_PICKER"     // Clothing selection
  | "LOCATION_CARD"       // Location descriptions
  | "CONTINUITY_PANEL"    // Continuity locks
  | "EXPORT_MODAL"        // Final export prompts
  | "QUICK_ACTIONS"       // Quick-access toolbar
  | "SCREENPLAY_PANEL"    // Screenplay directions
  | "STYLE_BIBLE"         // Project style guide
  | "NEGATIVE_DEFAULTS"   // Default negative prompts
  | "EVERYWHERE";         // Available globally

// =====================================================
// PROMPT PRESET - Collection of prompts
// =====================================================
export type PromptPreset = {
  _id: string;
  name: string;
  description: string;
  icon: IconName;
  color: string;
  
  // What prompts are included
  promptIds: string[];
  
  // Order and structure
  promptOrder: { promptId: string; weight: number }[];
  
  // Where this preset appears
  placements: PromptPlacement[];
  showInQuickAccess: boolean;
  quickAccessOrder?: number;
  
  // Keyboard shortcut
  shortcut?: string;
  
  // Categorization
  category: PromptCategory;
  tags: string[];
  
  // Visibility
  visibility: PromptVisibility;
  isBuiltIn: boolean;
  
  // Usage
  usageCount: number;
  
  // Ownership
  tenantId?: string;
  projectId?: string;
  createdBy: string;
  createdAt: Date;
  updatedAt: Date;
};

// =====================================================
// PROMPT COLLECTION - Folder/group of prompts
// =====================================================
export type PromptCollection = {
  _id: string;
  name: string;
  description: string;
  icon: IconName;
  color: string;
  
  // Contents
  promptIds: string[];
  childCollectionIds: string[];
  
  // Hierarchy
  parentCollectionId?: string;
  depth: number;
  path: string; // e.g., "/Cinematic/Horror/Jump Scares"
  
  // Display
  sortOrder: number;
  isExpanded: boolean;
  
  // Visibility
  visibility: PromptVisibility;
  
  // Ownership
  tenantId?: string;
  projectId?: string;
  createdBy: string;
  createdAt: Date;
};

// =====================================================
// CATEGORY METADATA - Display info for categories
// =====================================================
export type CategoryInfo = {
  id: PromptCategory;
  name: string;
  description: string;
  icon: IconName;
  color: string;
  subcategories: { id: string; name: string; icon: IconName }[];
};

export const PROMPT_CATEGORIES: CategoryInfo[] = [
  {
    id: "CINEMATIC",
    name: "Cinematic",
    description: "Camera, lighting, and composition settings",
    icon: "scene",
    color: "from-violet-600 to-purple-700",
    subcategories: [
      { id: "shot-angle", name: "Shot Angles", icon: "eye" },
      { id: "shot-framing", name: "Framing", icon: "maximize" },
      { id: "lighting", name: "Lighting", icon: "star" },
      { id: "camera", name: "Camera/Lens", icon: "scene" },
      { id: "color", name: "Color Palette", icon: "palette" },
      { id: "movement", name: "Camera Movement", icon: "arrowRight" },
    ],
  },
  {
    id: "WARDROBE",
    name: "Wardrobe",
    description: "Clothing, accessories, and costumes",
    icon: "layers",
    color: "from-pink-600 to-rose-700",
    subcategories: [
      { id: "tops", name: "Tops", icon: "character" },
      { id: "bottoms", name: "Bottoms", icon: "character" },
      { id: "outerwear", name: "Outerwear", icon: "character" },
      { id: "accessories", name: "Accessories", icon: "star" },
      { id: "footwear", name: "Footwear", icon: "character" },
      { id: "full-outfits", name: "Full Outfits", icon: "sparkles" },
    ],
  },
  {
    id: "PROPS",
    name: "Props",
    description: "Objects, items, and set dressing",
    icon: "layers",
    color: "from-amber-600 to-orange-700",
    subcategories: [
      { id: "handheld", name: "Handheld Items", icon: "wand" },
      { id: "furniture", name: "Furniture", icon: "location" },
      { id: "technology", name: "Technology", icon: "sparkles" },
      { id: "weapons", name: "Weapons", icon: "flame" },
      { id: "vehicles", name: "Vehicles", icon: "arrowRight" },
      { id: "food-drink", name: "Food & Drink", icon: "heart" },
    ],
  },
  {
    id: "CHARACTER",
    name: "Character",
    description: "Character appearances and traits",
    icon: "character",
    color: "from-cyan-600 to-blue-700",
    subcategories: [
      { id: "appearance", name: "Physical Appearance", icon: "eye" },
      { id: "expression", name: "Expressions", icon: "smile" },
      { id: "pose", name: "Poses", icon: "character" },
      { id: "age", name: "Age Descriptors", icon: "clock" },
      { id: "ethnicity", name: "Ethnicity", icon: "world" },
      { id: "body-type", name: "Body Types", icon: "character" },
    ],
  },
  {
    id: "LOCATION",
    name: "Location",
    description: "Environments and settings",
    icon: "location",
    color: "from-emerald-600 to-green-700",
    subcategories: [
      { id: "interior", name: "Interiors", icon: "location" },
      { id: "exterior", name: "Exteriors", icon: "world" },
      { id: "nature", name: "Nature", icon: "world" },
      { id: "urban", name: "Urban", icon: "location" },
      { id: "fantasy", name: "Fantasy", icon: "star" },
      { id: "scifi", name: "Sci-Fi", icon: "sparkles" },
    ],
  },
  {
    id: "ATMOSPHERE",
    name: "Atmosphere",
    description: "Mood, tone, and feeling",
    icon: "sparkles",
    color: "from-indigo-600 to-violet-700",
    subcategories: [
      { id: "mood", name: "Mood", icon: "heart" },
      { id: "tension", name: "Tension Levels", icon: "warning" },
      { id: "weather", name: "Weather", icon: "world" },
      { id: "time", name: "Time of Day", icon: "clock" },
      { id: "genre", name: "Genre Vibes", icon: "scene" },
    ],
  },
  {
    id: "ACTION",
    name: "Action",
    description: "Movement, behavior, and activity",
    icon: "flame",
    color: "from-red-600 to-rose-700",
    subcategories: [
      { id: "movement", name: "Movement", icon: "arrowRight" },
      { id: "interaction", name: "Interactions", icon: "users" },
      { id: "combat", name: "Combat", icon: "flame" },
      { id: "emotional", name: "Emotional Actions", icon: "heart" },
      { id: "daily", name: "Daily Activities", icon: "clock" },
    ],
  },
  {
    id: "SCREENPLAY",
    name: "Screenplay",
    description: "Scene directions and dramatic beats",
    icon: "book",
    color: "from-slate-600 to-zinc-700",
    subcategories: [
      { id: "goals", name: "Dramatic Goals", icon: "target" },
      { id: "conflicts", name: "Conflicts", icon: "warning" },
      { id: "turns", name: "Turns & Twists", icon: "arrowRight" },
      { id: "hooks", name: "Hooks", icon: "eye" },
      { id: "pacing", name: "Pacing", icon: "clock" },
    ],
  },
  {
    id: "CONTINUITY",
    name: "Continuity",
    description: "Identity locks and consistency rules",
    icon: "continuity",
    color: "from-yellow-600 to-amber-700",
    subcategories: [
      { id: "identity", name: "Identity Locks", icon: "shield" },
      { id: "wardrobe", name: "Wardrobe Locks", icon: "layers" },
      { id: "environment", name: "Environment Locks", icon: "location" },
      { id: "style", name: "Style Locks", icon: "scene" },
    ],
  },
  {
    id: "NEGATIVE",
    name: "Negative",
    description: "What to avoid in generation",
    icon: "warning",
    color: "from-gray-600 to-zinc-800",
    subcategories: [
      { id: "quality", name: "Quality Issues", icon: "warning" },
      { id: "anatomy", name: "Anatomy Issues", icon: "character" },
      { id: "artifacts", name: "Artifacts", icon: "eye" },
      { id: "style", name: "Style Avoidance", icon: "scene" },
    ],
  },
  {
    id: "STYLE",
    name: "Style",
    description: "Visual style and aesthetic",
    icon: "palette",
    color: "from-fuchsia-600 to-pink-700",
    subcategories: [
      { id: "art-style", name: "Art Styles", icon: "palette" },
      { id: "film-style", name: "Film Styles", icon: "scene" },
      { id: "era", name: "Era/Period", icon: "history" },
      { id: "genre", name: "Genre Aesthetics", icon: "star" },
    ],
  },
  {
    id: "CUSTOM",
    name: "Custom",
    description: "Your custom prompts",
    icon: "wand",
    color: "from-teal-600 to-cyan-700",
    subcategories: [
      { id: "favorites", name: "Favorites", icon: "heart" },
      { id: "recent", name: "Recently Used", icon: "history" },
      { id: "project", name: "Project Specific", icon: "file" },
    ],
  },
];

// =====================================================
// RARITY DISPLAY INFO
// =====================================================
export const RARITY_INFO: Record<PromptRarity, { label: string; color: string; bgClass: string }> = {
  COMMON: { label: "Common", color: "text-zinc-600", bgClass: "bg-zinc-100" },
  UNCOMMON: { label: "Uncommon", color: "text-green-600", bgClass: "bg-green-100" },
  RARE: { label: "Rare", color: "text-blue-600", bgClass: "bg-blue-100" },
  EPIC: { label: "Epic", color: "text-purple-600", bgClass: "bg-purple-100" },
  LEGENDARY: { label: "Legendary", color: "text-amber-600", bgClass: "bg-gradient-to-r from-amber-100 to-orange-100" },
};

// =====================================================
// PLACEMENT DISPLAY INFO
// =====================================================
export const PLACEMENT_INFO: Record<PromptPlacement, { label: string; icon: IconName; description: string }> = {
  SCENE_COMPOSER: { label: "Scene Composer", icon: "scene", description: "Main scene building interface" },
  SHOT_BUILDER: { label: "Shot Builder", icon: "eye", description: "Individual shot prompts" },
  CHARACTER_CARD: { label: "Character Cards", icon: "character", description: "Character appearance section" },
  WARDROBE_PICKER: { label: "Wardrobe Picker", icon: "layers", description: "Clothing selection modal" },
  LOCATION_CARD: { label: "Location Cards", icon: "location", description: "Location description section" },
  CONTINUITY_PANEL: { label: "Continuity Panel", icon: "continuity", description: "Continuity locks section" },
  EXPORT_MODAL: { label: "Export Modal", icon: "exports", description: "Final export prompts" },
  QUICK_ACTIONS: { label: "Quick Actions", icon: "sparkles", description: "Quick-access toolbar" },
  SCREENPLAY_PANEL: { label: "Screenplay Panel", icon: "book", description: "Screenplay directions" },
  STYLE_BIBLE: { label: "Style Bible", icon: "palette", description: "Project style guide" },
  NEGATIVE_DEFAULTS: { label: "Negative Defaults", icon: "warning", description: "Default negative prompts" },
  EVERYWHERE: { label: "Everywhere", icon: "world", description: "Available in all contexts" },
};

// =====================================================
// HELPER FUNCTIONS
// =====================================================

export function getCategoryInfo(category: PromptCategory): CategoryInfo | undefined {
  return PROMPT_CATEGORIES.find(c => c.id === category);
}

export function getSubcategories(category: PromptCategory): { id: string; name: string; icon: IconName }[] {
  return getCategoryInfo(category)?.subcategories ?? [];
}

export function interpolatePrompt(promptText: string, variables: Record<string, string>): string {
  let result = promptText;
  for (const [key, value] of Object.entries(variables)) {
    result = result.replace(new RegExp(`\\{${key}\\}`, 'g'), value);
  }
  return result;
}

export function generateSlug(name: string): string {
  return name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

export function combinePrompts(prompts: PromptLibraryItem[], separator = ", "): string {
  return prompts.map(p => p.promptText).join(separator);
}

export function sortPromptsByUsage(prompts: PromptLibraryItem[]): PromptLibraryItem[] {
  return [...prompts].sort((a, b) => b.usageCount - a.usageCount);
}

export function filterPromptsByCategory(
  prompts: PromptLibraryItem[],
  category: PromptCategory,
  subcategory?: string
): PromptLibraryItem[] {
  return prompts.filter(p => 
    p.category === category && 
    (!subcategory || p.subcategory === subcategory)
  );
}

export function searchPrompts(
  prompts: PromptLibraryItem[],
  query: string
): PromptLibraryItem[] {
  const q = query.toLowerCase();
  return prompts.filter(p =>
    p.name.toLowerCase().includes(q) ||
    p.description.toLowerCase().includes(q) ||
    p.promptText.toLowerCase().includes(q) ||
    p.tags.some(t => t.toLowerCase().includes(q))
  );
}
