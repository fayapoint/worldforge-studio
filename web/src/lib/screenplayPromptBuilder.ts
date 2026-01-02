import type { 
  SceneScreenplay, 
  SceneCharacterInstance, 
  StoryNode,
  CinematicSettings,
} from "./models";

// =====================================================
// SCREENPLAY PROMPT BUILDER
// Generates visual prompts from screenplay data
// =====================================================

export type ScreenplayPromptOutput = {
  characterPrompt: string;
  actionPrompt: string;
  dialogSummary: string;
  fullScenePrompt: string;
  continuityNotes: string[];
};

/**
 * Build a character description for the visual prompt
 */
function buildCharacterDescription(instance: SceneCharacterInstance): string {
  const parts: string[] = [];
  
  // Name and position
  parts.push(instance.name);
  
  // Position in frame
  const positionMap: Record<string, string> = {
    FOREGROUND: "in the foreground",
    MIDGROUND: "in the midground",
    BACKGROUND: "in the background",
    LEFT: "on the left side",
    CENTER: "in the center",
    RIGHT: "on the right side",
    OFF_SCREEN: "", // Don't include off-screen characters
  };
  if (instance.position !== "OFF_SCREEN" && positionMap[instance.position]) {
    parts.push(positionMap[instance.position]);
  }
  
  // Facing direction
  if (instance.facing) {
    const facingMap: Record<string, string> = {
      CAMERA: "facing the camera",
      AWAY: "facing away",
      LEFT: "looking left",
      RIGHT: "looking right",
      UP: "looking up",
      DOWN: "looking down",
    };
    if (facingMap[instance.facing]) {
      parts.push(facingMap[instance.facing]);
    }
  }
  
  // Expression
  if (instance.expression) {
    parts.push(`${instance.expression} expression`);
  }
  
  // Pose
  if (instance.pose) {
    parts.push(instance.pose);
  }
  
  // Body language
  if (instance.bodyLanguage) {
    parts.push(`${instance.bodyLanguage} body language`);
  }
  
  // Outfit/Wardrobe
  if (instance.currentOutfitDescription) {
    parts.push(`wearing ${instance.currentOutfitDescription}`);
  } else if (instance.baseAppearance) {
    parts.push(instance.baseAppearance);
  }
  
  // Props
  if (instance.props && instance.props.length > 0) {
    parts.push(`holding ${instance.props.join(" and ")}`);
  }
  
  return parts.filter(Boolean).join(", ");
}

/**
 * Build action descriptions from character instances
 */
function buildActionPrompt(instances: SceneCharacterInstance[]): string {
  const actions = instances
    .filter(inst => inst.includeInPrompt && inst.currentAction)
    .map(inst => {
      let action = inst.currentAction || "";
      if (inst.actionIntensity) {
        const intensityMap: Record<string, string> = {
          SUBTLE: "subtly",
          MODERATE: "",
          DRAMATIC: "dramatically",
        };
        if (intensityMap[inst.actionIntensity]) {
          action = `${intensityMap[inst.actionIntensity]} ${action}`;
        }
      }
      return `${inst.name} ${action}`;
    });
  
  return actions.join(". ");
}

/**
 * Build a dialog summary for context
 */
function buildDialogSummary(instances: SceneCharacterInstance[]): string {
  const speakingCharacters = instances
    .filter(inst => inst.dialogLines.length > 0)
    .sort((a, b) => (a.speakingOrder || 0) - (b.speakingOrder || 0));
  
  if (speakingCharacters.length === 0) return "";
  
  const summaryParts = speakingCharacters.map(inst => {
    const lineCount = inst.dialogLines.length;
    const firstLine = inst.dialogLines[0];
    const emotion = firstLine?.emotion || inst.emotionalState || "";
    return `${inst.name} speaks${emotion ? ` (${emotion})` : ""}: ${lineCount} line${lineCount > 1 ? "s" : ""}`;
  });
  
  return summaryParts.join("; ");
}

/**
 * Build continuity notes from character instances
 */
function buildContinuityNotes(screenplay: SceneScreenplay): string[] {
  const notes: string[] = [];
  
  // Add checklist items
  if (screenplay.continuityChecklist) {
    notes.push(...screenplay.continuityChecklist);
  }
  
  // Add character-specific continuity
  screenplay.characterInstances.forEach(inst => {
    if (inst.continuityNotes) {
      notes.push(`${inst.name}: ${inst.continuityNotes}`);
    }
    
    // Track state changes
    if (inst.stateChanges.length > 0) {
      inst.stateChanges.forEach(change => {
        notes.push(`${inst.name} ${change.field}: ${change.previousValue || "none"} → ${change.newValue}`);
      });
    }
  });
  
  return notes;
}

/**
 * Main function to build screenplay prompt
 */
export function buildScreenplayPrompt(screenplay: SceneScreenplay | undefined): ScreenplayPromptOutput {
  if (!screenplay || screenplay.characterInstances.length === 0) {
    return {
      characterPrompt: "",
      actionPrompt: "",
      dialogSummary: "",
      fullScenePrompt: "",
      continuityNotes: [],
    };
  }
  
  // Sort characters by priority (higher priority = more prominent)
  const sortedInstances = [...screenplay.characterInstances]
    .filter(inst => inst.includeInPrompt && inst.position !== "OFF_SCREEN")
    .sort((a, b) => b.promptPriority - a.promptPriority);
  
  // Build character descriptions
  const characterDescriptions = sortedInstances.map(buildCharacterDescription);
  const characterPrompt = characterDescriptions.join(". ");
  
  // Build action prompt
  const actionPrompt = buildActionPrompt(sortedInstances);
  
  // Build dialog summary
  const dialogSummary = buildDialogSummary(screenplay.characterInstances);
  
  // Build full scene prompt
  const fullSceneParts: string[] = [];
  
  // Scene direction first
  if (screenplay.sceneDirection) {
    fullSceneParts.push(screenplay.sceneDirection);
  }
  
  // Opening action
  if (screenplay.openingAction) {
    fullSceneParts.push(screenplay.openingAction);
  }
  
  // Characters
  if (characterPrompt) {
    fullSceneParts.push(characterPrompt);
  }
  
  // Actions
  if (actionPrompt) {
    fullSceneParts.push(actionPrompt);
  }
  
  // Atmosphere
  if (screenplay.atmosphereNotes) {
    fullSceneParts.push(screenplay.atmosphereNotes);
  }
  
  // Pacing/Tension hints
  if (screenplay.tension) {
    const tensionMap: Record<string, string> = {
      LOW: "calm, peaceful atmosphere",
      BUILDING: "building tension, anticipation",
      HIGH: "high tension, intense moment",
      CLIMAX: "climactic moment, peak drama",
      RELEASE: "tension release, catharsis",
    };
    if (tensionMap[screenplay.tension]) {
      fullSceneParts.push(tensionMap[screenplay.tension]);
    }
  }
  
  // Closing action
  if (screenplay.closingAction) {
    fullSceneParts.push(screenplay.closingAction);
  }
  
  const fullScenePrompt = fullSceneParts.filter(Boolean).join(". ");
  
  // Build continuity notes
  const continuityNotes = buildContinuityNotes(screenplay);
  
  return {
    characterPrompt,
    actionPrompt,
    dialogSummary,
    fullScenePrompt,
    continuityNotes,
  };
}

/**
 * Combine screenplay prompt with cinematic settings
 */
export function buildFinalScenePrompt(
  node: StoryNode,
  cinematicSettings?: CinematicSettings,
): string {
  const parts: string[] = [];
  
  // Add synopsis as base context
  if (node.synopsis) {
    parts.push(node.synopsis);
  }
  
  // Add screenplay-generated prompt
  const screenplayOutput = buildScreenplayPrompt(node.screenplay);
  if (screenplayOutput.fullScenePrompt) {
    parts.push(screenplayOutput.fullScenePrompt);
  }
  
  // Add cinematic settings
  if (cinematicSettings) {
    const cinematicParts: string[] = [];
    
    if (cinematicSettings.shotAngle) cinematicParts.push(cinematicSettings.shotAngle);
    if (cinematicSettings.shotFraming) cinematicParts.push(`${cinematicSettings.shotFraming} shot`);
    if (cinematicSettings.cameraType) cinematicParts.push(`shot on ${cinematicSettings.cameraType}`);
    if (cinematicSettings.lens) cinematicParts.push(`${cinematicSettings.lens} lens`);
    if (cinematicSettings.focusDepth) cinematicParts.push(`${cinematicSettings.focusDepth} depth of field`);
    if (cinematicSettings.lightingType) cinematicParts.push(cinematicSettings.lightingType);
    if (cinematicSettings.lightingDirection) cinematicParts.push(`${cinematicSettings.lightingDirection} lighting`);
    if (cinematicSettings.lightingQuality) cinematicParts.push(`${cinematicSettings.lightingQuality} light`);
    if (cinematicSettings.timeOfDay) cinematicParts.push(cinematicSettings.timeOfDay);
    if (cinematicSettings.weather) cinematicParts.push(`${cinematicSettings.weather} weather`);
    if (cinematicSettings.colorPalette) cinematicParts.push(`${cinematicSettings.colorPalette} color palette`);
    if (cinematicSettings.atmosphere) cinematicParts.push(`${cinematicSettings.atmosphere} atmosphere`);
    if (cinematicSettings.filmGrain) cinematicParts.push(cinematicSettings.filmGrain);
    if (cinematicSettings.visualStyle) cinematicParts.push(`${cinematicSettings.visualStyle} style`);
    if (cinematicSettings.imperfection) cinematicParts.push(cinematicSettings.imperfection);
    
    if (cinematicParts.length > 0) {
      parts.push(cinematicParts.join(", "));
    }
  }
  
  return parts.filter(Boolean).join(". ");
}

/**
 * Create a character instance from an entity
 */
export function createCharacterInstanceFromEntity(
  entityId: string,
  name: string,
  sceneNodeId: string,
  options?: {
    thumbnailUrl?: string;
    baseAppearance?: string;
  }
): SceneCharacterInstance {
  return {
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    entityId,
    sceneNodeId,
    name,
    thumbnailUrl: options?.thumbnailUrl,
    baseAppearance: options?.baseAppearance,
    wardrobe: [],
    position: "CENTER",
    dialogLines: [],
    stateChanges: [],
    includeInPrompt: true,
    promptPriority: 1,
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}

/**
 * Copy character instance from previous scene (for continuity)
 */
export function copyCharacterInstanceFromPreviousScene(
  previousInstance: SceneCharacterInstance,
  newSceneNodeId: string,
): SceneCharacterInstance {
  return {
    ...previousInstance,
    id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
    sceneNodeId: newSceneNodeId,
    previousSceneInstanceId: previousInstance.id,
    dialogLines: [], // Clear dialog for new scene
    stateChanges: [], // Reset state changes
    createdAt: new Date(),
    updatedAt: new Date(),
  };
}
