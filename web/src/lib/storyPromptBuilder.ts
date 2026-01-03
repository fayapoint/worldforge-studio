// =====================================================
// UNIFIED STORY PROMPT BUILDER
// Generates prompts with highlighted sections showing data sources
// Used across Story Editor, Scene Editor, and Export
// =====================================================

import type {
  StoryNode,
  Entity,
  SceneScreenplay,
  SceneCharacterInstance,
  StoryNodeCinematicSettings,
  CommunityWardrobeItem,
} from "./models";
import type { PromptLibraryItem } from "./promptLibrary";

// =====================================================
// TYPES - Prompt Sections with Source Tracking
// =====================================================

export type PromptSourceType =
  | "SCENE_DIRECTION"
  | "SCENE_SYNOPSIS"
  | "CHARACTER_BASE"
  | "CHARACTER_POSITION"
  | "CHARACTER_EXPRESSION"
  | "CHARACTER_POSE"
  | "CHARACTER_ACTION"
  | "CHARACTER_WARDROBE"
  | "CHARACTER_PROPS"
  | "CINEMATIC_SHOT"
  | "CINEMATIC_LIGHTING"
  | "CINEMATIC_ATMOSPHERE"
  | "CINEMATIC_TIME"
  | "CINEMATIC_STYLE"
  | "LOCATION"
  | "DRAMATIC_GOAL"
  | "DRAMATIC_CONFLICT"
  | "PROMPT_LIBRARY"
  | "CUSTOM";

export type PromptSection = {
  id: string;
  sourceType: PromptSourceType;
  sourceLabel: string; // Human-readable label
  sourceEntityId?: string; // If from a specific entity (character, location)
  sourceEntityName?: string;
  text: string;
  color: string; // Tailwind color class for highlighting
  icon: string; // Icon name for visual identification
  editable: boolean; // Can this section be edited inline?
  editPath?: string; // Path to edit this data (e.g., "screenplay.sceneDirection")
  priority: number; // Order priority (higher = earlier in prompt)
  isEmpty: boolean; // Is this section empty/missing data?
};

export type HighlightedPrompt = {
  sections: PromptSection[];
  fullPrompt: string;
  negativePrompt: string;
  missingDataWarnings: string[];
  characterCount: number;
  wordCount: number;
};

// =====================================================
// COLOR & ICON MAPPING
// =====================================================

const SOURCE_STYLES: Record<PromptSourceType, { color: string; icon: string; label: string }> = {
  SCENE_DIRECTION: { color: "bg-indigo-100 text-indigo-700 border-indigo-300", icon: "film", label: "Scene Direction" },
  SCENE_SYNOPSIS: { color: "bg-slate-100 text-slate-700 border-slate-300", icon: "book", label: "Synopsis" },
  CHARACTER_BASE: { color: "bg-cyan-100 text-cyan-700 border-cyan-300", icon: "character", label: "Character" },
  CHARACTER_POSITION: { color: "bg-blue-100 text-blue-700 border-blue-300", icon: "target", label: "Position" },
  CHARACTER_EXPRESSION: { color: "bg-pink-100 text-pink-700 border-pink-300", icon: "smile", label: "Expression" },
  CHARACTER_POSE: { color: "bg-violet-100 text-violet-700 border-violet-300", icon: "character", label: "Pose" },
  CHARACTER_ACTION: { color: "bg-orange-100 text-orange-700 border-orange-300", icon: "flame", label: "Action" },
  CHARACTER_WARDROBE: { color: "bg-rose-100 text-rose-700 border-rose-300", icon: "sparkles", label: "Wardrobe" },
  CHARACTER_PROPS: { color: "bg-amber-100 text-amber-700 border-amber-300", icon: "item", label: "Props" },
  CINEMATIC_SHOT: { color: "bg-purple-100 text-purple-700 border-purple-300", icon: "camera", label: "Camera" },
  CINEMATIC_LIGHTING: { color: "bg-yellow-100 text-yellow-700 border-yellow-300", icon: "sun", label: "Lighting" },
  CINEMATIC_ATMOSPHERE: { color: "bg-teal-100 text-teal-700 border-teal-300", icon: "cloud", label: "Atmosphere" },
  CINEMATIC_TIME: { color: "bg-sky-100 text-sky-700 border-sky-300", icon: "clock", label: "Time" },
  CINEMATIC_STYLE: { color: "bg-fuchsia-100 text-fuchsia-700 border-fuchsia-300", icon: "palette", label: "Style" },
  LOCATION: { color: "bg-emerald-100 text-emerald-700 border-emerald-300", icon: "location", label: "Location" },
  DRAMATIC_GOAL: { color: "bg-purple-100 text-purple-700 border-purple-300", icon: "target", label: "Goal" },
  DRAMATIC_CONFLICT: { color: "bg-red-100 text-red-700 border-red-300", icon: "warning", label: "Conflict" },
  PROMPT_LIBRARY: { color: "bg-gradient-to-r from-violet-100 to-purple-100 text-purple-700 border-purple-300", icon: "wand", label: "Library" },
  CUSTOM: { color: "bg-zinc-100 text-zinc-700 border-zinc-300", icon: "edit", label: "Custom" },
};

// =====================================================
// HELPER: Generate unique ID
// =====================================================
function generateSectionId(): string {
  return `section-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`;
}

// =====================================================
// BUILD SCENE DIRECTION SECTION
// =====================================================
function buildSceneDirectionSection(screenplay?: SceneScreenplay): PromptSection | null {
  if (!screenplay?.sceneDirection) return null;
  
  const style = SOURCE_STYLES.SCENE_DIRECTION;
  return {
    id: generateSectionId(),
    sourceType: "SCENE_DIRECTION",
    sourceLabel: style.label,
    text: screenplay.sceneDirection,
    color: style.color,
    icon: style.icon,
    editable: true,
    editPath: "screenplay.sceneDirection",
    priority: 100,
    isEmpty: false,
  };
}

// =====================================================
// BUILD CHARACTER SECTIONS
// =====================================================
function buildCharacterSections(
  instance: SceneCharacterInstance,
  entity?: Entity,
): PromptSection[] {
  const sections: PromptSection[] = [];
  const charName = instance.name;

  // Base character name and position
  const positionMap: Record<string, string> = {
    FOREGROUND: "in the foreground",
    MIDGROUND: "in the midground",
    BACKGROUND: "in the background",
    LEFT: "on the left",
    CENTER: "in the center",
    RIGHT: "on the right",
    OFF_SCREEN: "",
  };

  if (instance.position && instance.position !== "OFF_SCREEN") {
    sections.push({
      id: generateSectionId(),
      sourceType: "CHARACTER_POSITION",
      sourceLabel: `${charName} - Position`,
      sourceEntityId: instance.entityId,
      sourceEntityName: charName,
      text: `${charName} ${positionMap[instance.position] || instance.position.toLowerCase()}`,
      color: SOURCE_STYLES.CHARACTER_POSITION.color,
      icon: SOURCE_STYLES.CHARACTER_POSITION.icon,
      editable: true,
      editPath: `screenplay.characterInstances.${instance.id}.position`,
      priority: 80,
      isEmpty: false,
    });
  }

  // Facing direction
  if (instance.facing) {
    const facingMap: Record<string, string> = {
      CAMERA: "facing the camera",
      AWAY: "facing away",
      LEFT: "looking left",
      RIGHT: "looking right",
    };
    if (facingMap[instance.facing]) {
      sections.push({
        id: generateSectionId(),
        sourceType: "CHARACTER_POSITION",
        sourceLabel: `${charName} - Facing`,
        sourceEntityId: instance.entityId,
        sourceEntityName: charName,
        text: facingMap[instance.facing],
        color: SOURCE_STYLES.CHARACTER_POSITION.color,
        icon: "eye",
        editable: true,
        editPath: `screenplay.characterInstances.${instance.id}.facing`,
        priority: 79,
        isEmpty: false,
      });
    }
  }

  // Expression
  if (instance.expression) {
    sections.push({
      id: generateSectionId(),
      sourceType: "CHARACTER_EXPRESSION",
      sourceLabel: `${charName} - Expression`,
      sourceEntityId: instance.entityId,
      sourceEntityName: charName,
      text: `${instance.expression} expression`,
      color: SOURCE_STYLES.CHARACTER_EXPRESSION.color,
      icon: SOURCE_STYLES.CHARACTER_EXPRESSION.icon,
      editable: true,
      editPath: `screenplay.characterInstances.${instance.id}.expression`,
      priority: 75,
      isEmpty: false,
    });
  }

  // Pose
  if (instance.pose) {
    sections.push({
      id: generateSectionId(),
      sourceType: "CHARACTER_POSE",
      sourceLabel: `${charName} - Pose`,
      sourceEntityId: instance.entityId,
      sourceEntityName: charName,
      text: instance.pose,
      color: SOURCE_STYLES.CHARACTER_POSE.color,
      icon: SOURCE_STYLES.CHARACTER_POSE.icon,
      editable: true,
      editPath: `screenplay.characterInstances.${instance.id}.pose`,
      priority: 74,
      isEmpty: false,
    });
  }

  // Body language
  if (instance.bodyLanguage) {
    sections.push({
      id: generateSectionId(),
      sourceType: "CHARACTER_POSE",
      sourceLabel: `${charName} - Body Language`,
      sourceEntityId: instance.entityId,
      sourceEntityName: charName,
      text: `${instance.bodyLanguage} body language`,
      color: SOURCE_STYLES.CHARACTER_POSE.color,
      icon: "character",
      editable: true,
      editPath: `screenplay.characterInstances.${instance.id}.bodyLanguage`,
      priority: 73,
      isEmpty: false,
    });
  }

  // Wardrobe/Outfit
  if (instance.currentOutfitDescription) {
    sections.push({
      id: generateSectionId(),
      sourceType: "CHARACTER_WARDROBE",
      sourceLabel: `${charName} - Outfit`,
      sourceEntityId: instance.entityId,
      sourceEntityName: charName,
      text: `wearing ${instance.currentOutfitDescription}`,
      color: SOURCE_STYLES.CHARACTER_WARDROBE.color,
      icon: SOURCE_STYLES.CHARACTER_WARDROBE.icon,
      editable: true,
      editPath: `screenplay.characterInstances.${instance.id}.currentOutfitDescription`,
      priority: 70,
      isEmpty: false,
    });
  } else if (instance.baseAppearance) {
    // Fall back to base appearance if no outfit specified
    sections.push({
      id: generateSectionId(),
      sourceType: "CHARACTER_BASE",
      sourceLabel: `${charName} - Base Appearance`,
      sourceEntityId: instance.entityId,
      sourceEntityName: charName,
      text: instance.baseAppearance,
      color: SOURCE_STYLES.CHARACTER_BASE.color,
      icon: SOURCE_STYLES.CHARACTER_BASE.icon,
      editable: false,
      priority: 70,
      isEmpty: false,
    });
  }

  // Action
  if (instance.currentAction) {
    let actionText = instance.currentAction;
    if (instance.actionIntensity) {
      const intensityMap: Record<string, string> = {
        SUBTLE: "subtly",
        MODERATE: "",
        DRAMATIC: "dramatically",
      };
      if (intensityMap[instance.actionIntensity]) {
        actionText = `${intensityMap[instance.actionIntensity]} ${actionText}`;
      }
    }
    sections.push({
      id: generateSectionId(),
      sourceType: "CHARACTER_ACTION",
      sourceLabel: `${charName} - Action`,
      sourceEntityId: instance.entityId,
      sourceEntityName: charName,
      text: actionText,
      color: SOURCE_STYLES.CHARACTER_ACTION.color,
      icon: SOURCE_STYLES.CHARACTER_ACTION.icon,
      editable: true,
      editPath: `screenplay.characterInstances.${instance.id}.currentAction`,
      priority: 65,
      isEmpty: false,
    });
  }

  // Props
  if (instance.props && instance.props.length > 0) {
    sections.push({
      id: generateSectionId(),
      sourceType: "CHARACTER_PROPS",
      sourceLabel: `${charName} - Props`,
      sourceEntityId: instance.entityId,
      sourceEntityName: charName,
      text: `holding ${instance.props.join(" and ")}`,
      color: SOURCE_STYLES.CHARACTER_PROPS.color,
      icon: SOURCE_STYLES.CHARACTER_PROPS.icon,
      editable: true,
      editPath: `screenplay.characterInstances.${instance.id}.props`,
      priority: 60,
      isEmpty: false,
    });
  }

  return sections;
}

// =====================================================
// BUILD CINEMATIC SECTIONS
// =====================================================
function buildCinematicSections(settings?: StoryNodeCinematicSettings): PromptSection[] {
  const sections: PromptSection[] = [];
  if (!settings) return sections;

  // Shot framing and angle
  const shotParts: string[] = [];
  if (settings.shotFraming) shotParts.push(`${settings.shotFraming} shot`);
  if (settings.shotAngle) shotParts.push(settings.shotAngle);
  if (settings.cameraType) shotParts.push(`shot on ${settings.cameraType}`);
  if (settings.lens) shotParts.push(`${settings.lens} lens`);
  if (settings.focusDepth) shotParts.push(`${settings.focusDepth} depth of field`);

  if (shotParts.length > 0) {
    sections.push({
      id: generateSectionId(),
      sourceType: "CINEMATIC_SHOT",
      sourceLabel: "Camera Settings",
      text: shotParts.join(", "),
      color: SOURCE_STYLES.CINEMATIC_SHOT.color,
      icon: SOURCE_STYLES.CINEMATIC_SHOT.icon,
      editable: true,
      editPath: "cinematicSettings.shotFraming",
      priority: 50,
      isEmpty: false,
    });
  }

  // Lighting
  const lightParts: string[] = [];
  if (settings.lightingType) lightParts.push(settings.lightingType);
  if (settings.lightingDirection) lightParts.push(`${settings.lightingDirection} lighting`);
  if (settings.lightingQuality) lightParts.push(`${settings.lightingQuality} light`);

  if (lightParts.length > 0) {
    sections.push({
      id: generateSectionId(),
      sourceType: "CINEMATIC_LIGHTING",
      sourceLabel: "Lighting",
      text: lightParts.join(", "),
      color: SOURCE_STYLES.CINEMATIC_LIGHTING.color,
      icon: SOURCE_STYLES.CINEMATIC_LIGHTING.icon,
      editable: true,
      editPath: "cinematicSettings.lightingType",
      priority: 45,
      isEmpty: false,
    });
  }

  // Time of day
  if (settings.timeOfDay) {
    sections.push({
      id: generateSectionId(),
      sourceType: "CINEMATIC_TIME",
      sourceLabel: "Time of Day",
      text: settings.timeOfDay,
      color: SOURCE_STYLES.CINEMATIC_TIME.color,
      icon: SOURCE_STYLES.CINEMATIC_TIME.icon,
      editable: true,
      editPath: "cinematicSettings.timeOfDay",
      priority: 40,
      isEmpty: false,
    });
  }

  // Atmosphere and weather
  const atmoParts: string[] = [];
  if (settings.atmosphere) atmoParts.push(`${settings.atmosphere} atmosphere`);
  if (settings.weather) atmoParts.push(`${settings.weather} weather`);

  if (atmoParts.length > 0) {
    sections.push({
      id: generateSectionId(),
      sourceType: "CINEMATIC_ATMOSPHERE",
      sourceLabel: "Atmosphere",
      text: atmoParts.join(", "),
      color: SOURCE_STYLES.CINEMATIC_ATMOSPHERE.color,
      icon: SOURCE_STYLES.CINEMATIC_ATMOSPHERE.icon,
      editable: true,
      editPath: "cinematicSettings.atmosphere",
      priority: 35,
      isEmpty: false,
    });
  }

  // Visual style
  const styleParts: string[] = [];
  if (settings.colorPalette) styleParts.push(`${settings.colorPalette} color palette`);
  if (settings.visualStyle) styleParts.push(`${settings.visualStyle} style`);
  if (settings.filmGrain) styleParts.push(settings.filmGrain);
  if (settings.imperfection) styleParts.push(settings.imperfection);

  if (styleParts.length > 0) {
    sections.push({
      id: generateSectionId(),
      sourceType: "CINEMATIC_STYLE",
      sourceLabel: "Visual Style",
      text: styleParts.join(", "),
      color: SOURCE_STYLES.CINEMATIC_STYLE.color,
      icon: SOURCE_STYLES.CINEMATIC_STYLE.icon,
      editable: true,
      editPath: "cinematicSettings.visualStyle",
      priority: 30,
      isEmpty: false,
    });
  }

  return sections;
}

// =====================================================
// BUILD LOCATION SECTION
// =====================================================
function buildLocationSection(locationIds: string[], entities: Entity[]): PromptSection | null {
  const locations = entities.filter(e => e.type === "LOCATION" && locationIds.includes(e._id));
  if (locations.length === 0) return null;

  const locationTexts = locations.map(loc => {
    const parts: string[] = [loc.name];
    if (loc.summary) parts.push(loc.summary);
    return parts.join(", ");
  });

  return {
    id: generateSectionId(),
    sourceType: "LOCATION",
    sourceLabel: "Location",
    text: locationTexts.join("; "),
    color: SOURCE_STYLES.LOCATION.color,
    icon: SOURCE_STYLES.LOCATION.icon,
    editable: false,
    priority: 90,
    isEmpty: false,
  };
}

// =====================================================
// BUILD LIBRARY PROMPT SECTIONS
// =====================================================
function buildLibraryPromptSections(libraryPrompts: PromptLibraryItem[]): PromptSection[] {
  return libraryPrompts.map(prompt => ({
    id: generateSectionId(),
    sourceType: "PROMPT_LIBRARY",
    sourceLabel: `Library: ${prompt.name}`,
    text: prompt.promptText,
    color: SOURCE_STYLES.PROMPT_LIBRARY.color,
    icon: SOURCE_STYLES.PROMPT_LIBRARY.icon,
    editable: false,
    priority: 25,
    isEmpty: false,
  }));
}

// =====================================================
// MAIN BUILDER: Build Highlighted Prompt for a Scene
// =====================================================
export function buildHighlightedPrompt(
  node: StoryNode,
  entities: Entity[],
  libraryPrompts: PromptLibraryItem[] = [],
): HighlightedPrompt {
  const sections: PromptSection[] = [];
  const warnings: string[] = [];

  // 1. Scene Direction
  const sceneDirection = buildSceneDirectionSection(node.screenplay);
  if (sceneDirection) {
    sections.push(sceneDirection);
  } else {
    warnings.push("Scene direction is empty");
  }

  // 2. Location
  if (node.locations && node.locations.length > 0) {
    const locationSection = buildLocationSection(node.locations, entities);
    if (locationSection) {
      sections.push(locationSection);
    }
  }

  // 3. Characters
  if (node.screenplay?.characterInstances) {
    const activeCharacters = node.screenplay.characterInstances
      .filter(inst => inst.includeInPrompt && inst.position !== "OFF_SCREEN")
      .sort((a, b) => (b.promptPriority || 1) - (a.promptPriority || 1));

    if (activeCharacters.length === 0 && node.screenplay.characterInstances.length > 0) {
      warnings.push("All characters are excluded from prompt or off-screen");
    }

    activeCharacters.forEach(instance => {
      const entity = entities.find(e => e._id === instance.entityId);
      const charSections = buildCharacterSections(instance, entity);
      sections.push(...charSections);

      // Check for missing data
      if (!instance.currentOutfitDescription && !instance.baseAppearance) {
        warnings.push(`${instance.name} has no outfit or appearance description`);
      }
      if (!instance.expression) {
        warnings.push(`${instance.name} has no expression set`);
      }
    });
  } else {
    warnings.push("No characters in scene");
  }

  // 4. Cinematic Settings
  const cinematicSections = buildCinematicSections(node.cinematicSettings);
  sections.push(...cinematicSections);

  if (!node.cinematicSettings?.shotFraming) {
    warnings.push("No camera/shot framing specified");
  }
  if (!node.cinematicSettings?.lightingType) {
    warnings.push("No lighting type specified");
  }

  // 5. Library Prompts
  const librarySections = buildLibraryPromptSections(libraryPrompts);
  sections.push(...librarySections);

  // 6. Atmosphere notes from screenplay
  if (node.screenplay?.atmosphereNotes) {
    sections.push({
      id: generateSectionId(),
      sourceType: "CINEMATIC_ATMOSPHERE",
      sourceLabel: "Atmosphere Notes",
      text: node.screenplay.atmosphereNotes,
      color: SOURCE_STYLES.CINEMATIC_ATMOSPHERE.color,
      icon: "sparkles",
      editable: true,
      editPath: "screenplay.atmosphereNotes",
      priority: 20,
      isEmpty: false,
    });
  }

  // 7. Tension/Pacing hints
  if (node.screenplay?.tension) {
    const tensionMap: Record<string, string> = {
      LOW: "calm, peaceful atmosphere",
      BUILDING: "building tension, anticipation",
      HIGH: "high tension, intense moment",
      CLIMAX: "climactic moment, peak drama",
      RELEASE: "tension release, catharsis",
    };
    if (tensionMap[node.screenplay.tension]) {
      sections.push({
        id: generateSectionId(),
        sourceType: "DRAMATIC_CONFLICT",
        sourceLabel: "Tension Level",
        text: tensionMap[node.screenplay.tension],
        color: SOURCE_STYLES.DRAMATIC_CONFLICT.color,
        icon: "warning",
        editable: true,
        editPath: "screenplay.tension",
        priority: 15,
        isEmpty: false,
      });
    }
  }

  // Sort by priority and build full prompt
  sections.sort((a, b) => b.priority - a.priority);
  const fullPrompt = sections.map(s => s.text).filter(Boolean).join(". ");

  // Build negative prompt (could be expanded with library negative prompts)
  const negativePrompts = libraryPrompts
    .filter(p => p.negativePrompt)
    .map(p => p.negativePrompt!)
    .join(", ");

  return {
    sections,
    fullPrompt: fullPrompt ? `${fullPrompt}.` : "",
    negativePrompt: negativePrompts,
    missingDataWarnings: warnings,
    characterCount: fullPrompt.length,
    wordCount: fullPrompt.split(/\s+/).filter(Boolean).length,
  };
}

// =====================================================
// HELPER: Get empty sections for a scene (what's missing)
// =====================================================
export function getMissingSections(node: StoryNode): PromptSection[] {
  const missing: PromptSection[] = [];

  if (!node.screenplay?.sceneDirection) {
    missing.push({
      id: generateSectionId(),
      sourceType: "SCENE_DIRECTION",
      sourceLabel: "Scene Direction",
      text: "Add scene direction...",
      color: "bg-red-50 text-red-500 border-red-300 border-dashed",
      icon: "film",
      editable: true,
      editPath: "screenplay.sceneDirection",
      priority: 100,
      isEmpty: true,
    });
  }

  if (!node.screenplay?.characterInstances?.length) {
    missing.push({
      id: generateSectionId(),
      sourceType: "CHARACTER_BASE",
      sourceLabel: "Characters",
      text: "Add characters to this scene...",
      color: "bg-red-50 text-red-500 border-red-300 border-dashed",
      icon: "users",
      editable: true,
      editPath: "screenplay.characterInstances",
      priority: 80,
      isEmpty: true,
    });
  }

  if (!node.cinematicSettings?.shotFraming) {
    missing.push({
      id: generateSectionId(),
      sourceType: "CINEMATIC_SHOT",
      sourceLabel: "Camera Settings",
      text: "Set camera/shot framing...",
      color: "bg-red-50 text-red-500 border-red-300 border-dashed",
      icon: "camera",
      editable: true,
      editPath: "cinematicSettings.shotFraming",
      priority: 50,
      isEmpty: true,
    });
  }

  return missing;
}

// =====================================================
// EXPORT: Source styles for UI components
// =====================================================
export { SOURCE_STYLES };
