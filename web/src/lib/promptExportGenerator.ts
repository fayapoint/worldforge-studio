// =====================================================
// PROMPT EXPORT GENERATOR
// Combines scene, cinematics, characters, locations into final prompts
// =====================================================

import type { 
  StoryNode, 
  Entity, 
  CinematicSettings, 
  VideoMotionSettings,
  CharacterInScene,
  LocationInScene,
  ExportedPrompt,
} from "./models";
import { buildCinematicPrompt } from "./cinematicPromptOptions";

// =====================================================
// VIDEO MOTION OPTIONS
// =====================================================
export type MotionOption = {
  value: string;
  label: string;
  icon: string;
  description: string;
  promptText: string;
};

export const MOTION_TYPE_OPTIONS: MotionOption[] = [
  { value: "STATIC", label: "Static", icon: "circle", description: "No camera movement", promptText: "static shot, locked camera, no movement" },
  { value: "PAN", label: "Pan", icon: "arrowRight", description: "Horizontal rotation", promptText: "camera panning smoothly" },
  { value: "ZOOM", label: "Zoom", icon: "zoomIn", description: "In or out", promptText: "smooth zoom" },
  { value: "DOLLY", label: "Dolly", icon: "arrowRight", description: "Forward/backward", promptText: "dolly movement, camera moving through space" },
  { value: "TRACKING", label: "Tracking", icon: "eye", description: "Follow subject", promptText: "tracking shot, following the subject" },
  { value: "CRANE", label: "Crane", icon: "chevronUp", description: "Vertical movement", promptText: "crane shot, sweeping vertical movement" },
  { value: "HANDHELD", label: "Handheld", icon: "warning", description: "Organic shake", promptText: "handheld camera, subtle organic movement" },
  { value: "ORBIT", label: "Orbit", icon: "circle", description: "Circle around", promptText: "orbiting camera, circling around subject" },
];

export const MOTION_DIRECTION_OPTIONS: MotionOption[] = [
  { value: "LEFT", label: "Left", icon: "chevronLeft", description: "Move left", promptText: "moving left" },
  { value: "RIGHT", label: "Right", icon: "chevronRight", description: "Move right", promptText: "moving right" },
  { value: "UP", label: "Up", icon: "chevronUp", description: "Move up", promptText: "moving upward" },
  { value: "DOWN", label: "Down", icon: "chevronDown", description: "Move down", promptText: "moving downward" },
  { value: "IN", label: "Push In", icon: "zoomIn", description: "Move closer", promptText: "pushing in toward subject" },
  { value: "OUT", label: "Pull Out", icon: "zoomOut", description: "Move away", promptText: "pulling out from subject" },
  { value: "CLOCKWISE", label: "Clockwise", icon: "circle", description: "Rotate CW", promptText: "rotating clockwise" },
  { value: "COUNTERCLOCKWISE", label: "Counter-CW", icon: "circle", description: "Rotate CCW", promptText: "rotating counterclockwise" },
];

export const MOTION_SPEED_OPTIONS: MotionOption[] = [
  { value: "SLOW", label: "Slow", icon: "circle", description: "Gentle, contemplative", promptText: "slow, contemplative movement" },
  { value: "MEDIUM", label: "Medium", icon: "circle", description: "Natural pace", promptText: "natural paced movement" },
  { value: "FAST", label: "Fast", icon: "flame", description: "Quick, urgent", promptText: "fast, urgent movement" },
];

export const MOTION_INTENSITY_OPTIONS: MotionOption[] = [
  { value: "SUBTLE", label: "Subtle", icon: "circle", description: "Barely noticeable", promptText: "subtle, almost imperceptible movement" },
  { value: "MODERATE", label: "Moderate", icon: "circle", description: "Visible but smooth", promptText: "moderate, smooth movement" },
  { value: "DRAMATIC", label: "Dramatic", icon: "flame", description: "Bold, cinematic", promptText: "dramatic, bold camera movement" },
];

export const TRANSITION_OPTIONS: MotionOption[] = [
  { value: "CUT", label: "Hard Cut", icon: "split", description: "Instant switch", promptText: "hard cut transition" },
  { value: "DISSOLVE", label: "Dissolve", icon: "sparkles", description: "Fade between", promptText: "dissolve transition, fading between shots" },
  { value: "FADE", label: "Fade", icon: "circle", description: "To/from black", promptText: "fade transition" },
  { value: "WIPE", label: "Wipe", icon: "arrowRight", description: "Directional wipe", promptText: "wipe transition" },
  { value: "MATCH_CUT", label: "Match Cut", icon: "layers", description: "Visual continuity", promptText: "match cut, visual continuity between shots" },
];

// =====================================================
// CHARACTER POSITION OPTIONS
// =====================================================
export const CHARACTER_POSITION_OPTIONS: MotionOption[] = [
  { value: "FOREGROUND", label: "Foreground", icon: "character", description: "Front of frame", promptText: "positioned in foreground" },
  { value: "MIDGROUND", label: "Midground", icon: "character", description: "Middle of frame", promptText: "positioned in midground" },
  { value: "BACKGROUND", label: "Background", icon: "character", description: "Back of frame", promptText: "positioned in background" },
  { value: "LEFT", label: "Left Side", icon: "chevronLeft", description: "Left of frame", promptText: "on the left side of frame" },
  { value: "CENTER", label: "Center", icon: "target", description: "Center of frame", promptText: "centered in frame" },
  { value: "RIGHT", label: "Right Side", icon: "chevronRight", description: "Right of frame", promptText: "on the right side of frame" },
];

// =====================================================
// PROMPT BUILDERS
// =====================================================

/**
 * Build character description for prompt
 */
export function buildCharacterPrompt(character: CharacterInScene): string {
  const parts: string[] = [];
  
  parts.push(character.name);
  
  if (character.appearance) {
    parts.push(character.appearance);
  }
  
  if (character.expression) {
    parts.push(`${character.expression} expression`);
  }
  
  if (character.pose) {
    parts.push(character.pose);
  }
  
  if (character.position) {
    const posOpt = CHARACTER_POSITION_OPTIONS.find(p => p.value === character.position);
    if (posOpt) parts.push(posOpt.promptText);
  }
  
  if (character.action) {
    parts.push(character.action);
  }
  
  return parts.join(", ");
}

/**
 * Build location description for prompt
 */
export function buildLocationPrompt(location: LocationInScene): string {
  const parts: string[] = [];
  
  parts.push(location.name);
  
  if (location.description) {
    parts.push(location.description);
  }
  
  if (location.timeOfDay) {
    parts.push(`${location.timeOfDay} lighting`);
  }
  
  if (location.weather) {
    parts.push(location.weather);
  }
  
  if (location.atmosphere) {
    parts.push(`${location.atmosphere} atmosphere`);
  }
  
  return parts.join(", ");
}

/**
 * Build video motion prompt
 */
export function buildVideoMotionPrompt(settings: VideoMotionSettings): string {
  const parts: string[] = [];
  
  // Motion type
  const motionOpt = MOTION_TYPE_OPTIONS.find(m => m.value === settings.motionType);
  if (motionOpt) parts.push(motionOpt.promptText);
  
  // Direction
  if (settings.motionDirection) {
    const dirOpt = MOTION_DIRECTION_OPTIONS.find(d => d.value === settings.motionDirection);
    if (dirOpt) parts.push(dirOpt.promptText);
  }
  
  // Speed
  const speedOpt = MOTION_SPEED_OPTIONS.find(s => s.value === settings.motionSpeed);
  if (speedOpt) parts.push(speedOpt.promptText);
  
  // Intensity
  const intensityOpt = MOTION_INTENSITY_OPTIONS.find(i => i.value === settings.motionIntensity);
  if (intensityOpt) parts.push(intensityOpt.promptText);
  
  // Transition
  if (settings.transitionType) {
    const transOpt = TRANSITION_OPTIONS.find(t => t.value === settings.transitionType);
    if (transOpt) parts.push(transOpt.promptText);
  }
  
  return parts.join(", ");
}

/**
 * Build complete IMAGE prompt
 */
export function buildFinalImagePrompt(data: {
  sceneDescription: string;
  dramaticContext: {
    goal?: string;
    conflict?: string;
    turn?: string;
    mood?: string;
  };
  characters: CharacterInScene[];
  locations: LocationInScene[];
  cinematicSettings: CinematicSettings;
}): string {
  const sections: string[] = [];
  
  // 1. Visual style and technical (from cinematic settings)
  const cinematicPrompt = buildCinematicPrompt(data.cinematicSettings);
  if (cinematicPrompt) {
    sections.push(cinematicPrompt);
  }
  
  // 2. Scene description
  if (data.sceneDescription) {
    sections.push(data.sceneDescription);
  }
  
  // 3. Characters
  if (data.characters.length > 0) {
    const charDescriptions = data.characters.map(c => buildCharacterPrompt(c));
    sections.push(charDescriptions.join("; "));
  }
  
  // 4. Locations
  if (data.locations.length > 0) {
    const locDescriptions = data.locations.map(l => buildLocationPrompt(l));
    sections.push(locDescriptions.join("; "));
  }
  
  // 5. Dramatic context / mood
  if (data.dramaticContext.mood) {
    sections.push(`${data.dramaticContext.mood} mood`);
  }
  
  return sections.join(", ");
}

/**
 * Build complete VIDEO prompt with motion
 */
export function buildFinalVideoPrompt(data: {
  sceneDescription: string;
  dramaticContext: {
    goal?: string;
    conflict?: string;
    turn?: string;
    mood?: string;
  };
  characters: CharacterInScene[];
  locations: LocationInScene[];
  cinematicSettings: CinematicSettings;
  videoSettings: VideoMotionSettings;
}): string {
  const sections: string[] = [];
  
  // 1. Start with video motion
  const motionPrompt = buildVideoMotionPrompt(data.videoSettings);
  if (motionPrompt) {
    sections.push(`[MOTION: ${motionPrompt}]`);
  }
  
  // 2. Visual style and technical
  const cinematicPrompt = buildCinematicPrompt(data.cinematicSettings);
  if (cinematicPrompt) {
    sections.push(cinematicPrompt);
  }
  
  // 3. Scene description
  if (data.sceneDescription) {
    sections.push(data.sceneDescription);
  }
  
  // 4. Characters with their actions
  if (data.characters.length > 0) {
    const charDescriptions = data.characters.map(c => {
      let desc = buildCharacterPrompt(c);
      return desc;
    });
    sections.push(charDescriptions.join("; "));
  }
  
  // 5. Locations
  if (data.locations.length > 0) {
    const locDescriptions = data.locations.map(l => buildLocationPrompt(l));
    sections.push(locDescriptions.join("; "));
  }
  
  // 6. Dramatic context
  if (data.dramaticContext.mood) {
    sections.push(`${data.dramaticContext.mood} mood`);
  }
  
  // 7. Start/End frame descriptions if different
  if (data.videoSettings.startFrame || data.videoSettings.endFrame) {
    if (data.videoSettings.startFrame) {
      const startPrompt = buildCinematicPrompt(data.videoSettings.startFrame);
      if (startPrompt) sections.push(`[START: ${startPrompt}]`);
    }
    if (data.videoSettings.endFrame) {
      const endPrompt = buildCinematicPrompt(data.videoSettings.endFrame);
      if (endPrompt) sections.push(`[END: ${endPrompt}]`);
    }
  }
  
  return sections.join(", ");
}

/**
 * Generate negative prompt based on settings
 */
export function buildNegativePrompt(type: "IMAGE" | "VIDEO"): string {
  const common = [
    "blurry",
    "low quality",
    "distorted",
    "disfigured",
    "bad anatomy",
    "wrong proportions",
    "watermark",
    "signature",
    "text",
    "logo",
    "cropped",
    "out of frame",
    "duplicate",
    "ugly",
    "deformed",
  ];
  
  if (type === "VIDEO") {
    common.push(
      "jittery",
      "flickering",
      "inconsistent lighting",
      "morphing",
      "frame drops",
      "stuttering"
    );
  }
  
  return common.join(", ");
}

/**
 * Extract characters from entities based on node participants
 */
export function extractCharactersFromEntities(
  node: StoryNode,
  entities: Entity[]
): CharacterInScene[] {
  const characters: CharacterInScene[] = [];
  
  for (const participant of node.participants) {
    const entity = entities.find(e => e._id === participant.entityId);
    if (entity && entity.type === "CHARACTER") {
      characters.push({
        entityId: entity._id,
        name: entity.name,
        appearance: entity.character?.appearance || entity.summary,
        expression: undefined, // To be set by user
        pose: undefined, // To be set by user
        position: undefined, // To be set by user
        action: undefined, // To be set by user
      });
    }
  }
  
  return characters;
}

/**
 * Extract locations from entities based on node locations
 */
export function extractLocationsFromEntities(
  node: StoryNode,
  entities: Entity[]
): LocationInScene[] {
  const locations: LocationInScene[] = [];
  
  for (const locationId of node.locations) {
    const entity = entities.find(e => e._id === locationId);
    if (entity && entity.type === "LOCATION") {
      locations.push({
        entityId: entity._id,
        name: entity.name,
        description: entity.summary,
        timeOfDay: undefined, // To be set by user
        weather: undefined, // To be set by user
        atmosphere: undefined, // To be set by user
      });
    }
  }
  
  return locations;
}

/**
 * Generate continuity tags for tracking
 */
export function generateContinuityTags(data: {
  characters: CharacterInScene[];
  locations: LocationInScene[];
  cinematicSettings: CinematicSettings;
}): string[] {
  const tags: string[] = [];
  
  // Character tags
  for (const char of data.characters) {
    tags.push(`char:${char.name.toLowerCase().replace(/\s+/g, '_')}`);
    if (char.appearance) {
      tags.push(`appearance:${char.entityId}`);
    }
  }
  
  // Location tags
  for (const loc of data.locations) {
    tags.push(`loc:${loc.name.toLowerCase().replace(/\s+/g, '_')}`);
  }
  
  // Cinematic style tags
  if (data.cinematicSettings.colorPalette) {
    tags.push(`color:${data.cinematicSettings.colorPalette}`);
  }
  if (data.cinematicSettings.lightingType) {
    tags.push(`lighting:${data.cinematicSettings.lightingType}`);
  }
  if (data.cinematicSettings.visualStyle) {
    tags.push(`style:${data.cinematicSettings.visualStyle}`);
  }
  
  return tags;
}

// =====================================================
// VIDEO PRESETS
// =====================================================
export type VideoPreset = {
  id: string;
  name: string;
  icon: string;
  description: string;
  settings: Partial<VideoMotionSettings>;
};

export const VIDEO_PRESETS: VideoPreset[] = [
  {
    id: "establishing",
    name: "Establishing Shot",
    icon: "world",
    description: "Slow pan to reveal location",
    settings: {
      motionType: "PAN",
      motionSpeed: "SLOW",
      motionIntensity: "SUBTLE",
    },
  },
  {
    id: "dramatic-push",
    name: "Dramatic Push",
    icon: "zoomIn",
    description: "Push in on subject for emphasis",
    settings: {
      motionType: "DOLLY",
      motionDirection: "IN",
      motionSpeed: "SLOW",
      motionIntensity: "DRAMATIC",
    },
  },
  {
    id: "action-track",
    name: "Action Tracking",
    icon: "arrowRight",
    description: "Fast tracking following action",
    settings: {
      motionType: "TRACKING",
      motionSpeed: "FAST",
      motionIntensity: "DRAMATIC",
    },
  },
  {
    id: "reveal",
    name: "Character Reveal",
    icon: "eye",
    description: "Crane up to reveal character",
    settings: {
      motionType: "CRANE",
      motionDirection: "UP",
      motionSpeed: "MEDIUM",
      motionIntensity: "MODERATE",
    },
  },
  {
    id: "tension-static",
    name: "Tension Build",
    icon: "warning",
    description: "Static shot with subtle push",
    settings: {
      motionType: "ZOOM",
      motionDirection: "IN",
      motionSpeed: "SLOW",
      motionIntensity: "SUBTLE",
    },
  },
  {
    id: "orbit-hero",
    name: "Hero Orbit",
    icon: "circle",
    description: "Orbit around character",
    settings: {
      motionType: "ORBIT",
      motionDirection: "CLOCKWISE",
      motionSpeed: "MEDIUM",
      motionIntensity: "MODERATE",
    },
  },
  {
    id: "documentary",
    name: "Documentary",
    icon: "scene",
    description: "Handheld organic movement",
    settings: {
      motionType: "HANDHELD",
      motionSpeed: "MEDIUM",
      motionIntensity: "SUBTLE",
    },
  },
  {
    id: "pull-reveal",
    name: "Pull Back Reveal",
    icon: "zoomOut",
    description: "Pull out to reveal context",
    settings: {
      motionType: "DOLLY",
      motionDirection: "OUT",
      motionSpeed: "MEDIUM",
      motionIntensity: "MODERATE",
    },
  },
];
