export type Role = "ADMIN" | "WRITER" | "EDITOR";

export type EntityType =
  | "CHARACTER"
  | "LOCATION"
  | "FACTION"
  | "ITEM"
  | "RULE"
  | "LORE";

export type NodeType = "BEAT" | "SCENE" | "CHAPTER";

export type EdgeType = "LINEAR" | "BRANCH" | "CHOICE" | "FLASHBACK" | "TIMEJUMP";

export type VersionStatus = "DRAFT" | "PUBLISHED";

export type VersionInfo = {
  status: VersionStatus;
  number: number;
};

export type AuditInfo = {
  createdBy: string;
  updatedBy: string;
  updatedAt: Date;
};

export type Tenant = {
  _id: string;
  name: string;
  plan: string;
  createdAt: Date;
};

export type User = {
  _id: string;
  tenantId: string;
  email: string;
  passwordHash: string;
  roles: Role[];
  createdAt: Date;
};

export type Project = {
  _id: string;
  tenantId: string;
  title: string;
  logline: string;
  styleBible?: Record<string, unknown>;
  createdAt: Date;
};

export type EntityRelationship = {
  toEntityId: string;
  relType: string;
  note?: string;
};

export type EntityMedia = {
  thumbnailUrl?: string;
  thumbnailPublicId?: string;
  faceUrl?: string;
  facePublicId?: string;
  poseUrls?: string[];
  posePublicIds?: string[];
  referenceUrls?: string[];
  referencePublicIds?: string[];
};

export type CharacterDetails = {
  fullName?: string;
  aliases?: string[];
  pronouns?: string;
  age?: string;
  role?: string;
  occupation?: string;
  archetype?: string;
  personality?: string;
  appearance?: string;
  backstory?: string;
  motivation?: string;
  skills?: string[];
  weaknesses?: string[];
  voiceNotes?: string;
};

export type Entity = {
  _id: string;
  tenantId: string;
  projectId: string;
  type: EntityType;
  name: string;
  summary: string;
  tags?: string[];
  media?: EntityMedia;
  character?: CharacterDetails;
  attributes: Record<string, unknown>;
  relationships: EntityRelationship[];
  version: VersionInfo;
  audit: AuditInfo;
};

export type StoryParticipantRole = "PROTAGONIST" | "ANTAGONIST" | "SUPPORT";

export type StoryParticipant = {
  entityId: string;
  role: StoryParticipantRole;
};

export type WorldStateDeltaOp = "SET" | "INC" | "DEC" | "ADD" | "REMOVE";

export type WorldStateDelta = {
  key: string;
  op: WorldStateDeltaOp;
  value?: unknown;
};

export type StoryNodeCinematicSettings = {
  shotAngle?: string;
  shotFraming?: string;
  focusDepth?: string;
  lightingType?: string;
  lightingDirection?: string;
  lightingQuality?: string;
  cameraType?: string;
  lens?: string;
  filmGrain?: string;
  colorPalette?: string;
  timeOfDay?: string;
  weather?: string;
  locationType?: string;
  visualStyle?: string;
  subjectExpression?: string;
  subjectPose?: string;
  atmosphere?: string;
  imperfection?: string;
};

// =====================================================
// SCENE VERSION SYSTEM - For tracking prompt/image versions
// =====================================================

export type SceneFrameImage = {
  url: string;
  publicId?: string;
  uploadedAt: Date;
  width?: number;
  height?: number;
};

export type SceneVersion = {
  versionNumber: number;
  title?: string;
  synopsis?: string;
  goals?: { dramaticGoal?: string; conflict?: string; turn?: string };
  hooks?: { hook?: string; foreshadow?: string[]; payoffTargets?: string[] };
  prompt: string;
  negativePrompt?: string;
  cinematicSettings: StoryNodeCinematicSettings;
  thumbnail?: SceneFrameImage;
  firstFrame?: SceneFrameImage;
  lastFrame?: SceneFrameImage;
  createdAt: Date;
  notes?: string;
  isActive: boolean;
};

export type SceneVersionHistory = {
  versions: SceneVersion[];
  activeVersionNumber: number;
};

export type StoryNode = {
  _id: string;
  tenantId: string;
  projectId: string;
  nodeType: NodeType;
  title: string;
  synopsis: string;
  goals: { dramaticGoal: string; conflict: string; turn: string };
  hooks: { hook: string; foreshadow: string[]; payoffTargets: string[] };
  time: { inWorldDate?: string; order: number };
  participants: StoryParticipant[];
  locations: string[];
  worldStateDelta: WorldStateDelta[];
  cinematicSettings?: StoryNodeCinematicSettings;
  versionHistory?: SceneVersionHistory;
  thumbnail?: SceneFrameImage; // Main thumbnail for scene visualization in graph
  parentNodeId?: string; // For duplicated/continuation nodes
  variationType?: 'DUPLICATE' | 'CONTINUATION' | 'CLOSE_SHOT' | 'WIDE_SHOT';
  screenplay?: SceneScreenplay; // Screenplay data with character instances
  version: VersionInfo;
  audit: AuditInfo;
};

export type StoryEdge = {
  _id: string;
  tenantId: string;
  projectId: string;
  fromNodeId: string;
  toNodeId: string;
  edgeType: EdgeType;
  conditions: string[];
  notes: string;
};

export type PromptPackShot = {
  shotId: string;
  variant: "A" | "B";
  prompt: string;
  negative: string;
  refs: string[];
};

export type PromptPack = {
  _id: string;
  tenantId: string;
  projectId: string;
  nodeId: string;
  target: "HIGGSFIELD";
  template: "CINEMATIC_V1";
  shots: PromptPackShot[];
  continuityNotes: string[];
  createdAt: Date;
  createdBy: string;
};

export type ContinuityIssueSeverity = "INFO" | "WARN" | "ERROR";

export type ContinuityIssue = {
  severity: ContinuityIssueSeverity;
  code: string;
  message: string;
  nodeId: string;
  entityIds?: string[];
  suggestion?: string;
};

// =====================================================
// EXPORTED PROMPTS - For Gallery & Story
// =====================================================

export type ExportedPromptType = "IMAGE" | "VIDEO";

export type CinematicSettings = {
  shotAngle?: string;
  shotFraming?: string;
  focusDepth?: string;
  lightingType?: string;
  lightingDirection?: string;
  lightingQuality?: string;
  cameraType?: string;
  lens?: string;
  filmGrain?: string;
  colorPalette?: string;
  timeOfDay?: string;
  weather?: string;
  locationType?: string;
  visualStyle?: string;
  subjectExpression?: string;
  subjectPose?: string;
  atmosphere?: string;
  imperfection?: string;
};

export type VideoMotionSettings = {
  motionType: "PAN" | "ZOOM" | "DOLLY" | "TRACKING" | "STATIC" | "CRANE" | "HANDHELD" | "ORBIT";
  motionDirection?: "LEFT" | "RIGHT" | "UP" | "DOWN" | "IN" | "OUT" | "CLOCKWISE" | "COUNTERCLOCKWISE";
  motionSpeed: "SLOW" | "MEDIUM" | "FAST";
  motionIntensity: "SUBTLE" | "MODERATE" | "DRAMATIC";
  transitionType?: "CUT" | "DISSOLVE" | "FADE" | "WIPE" | "MATCH_CUT";
  startFrame?: CinematicSettings;
  endFrame?: CinematicSettings;
};

export type CharacterInScene = {
  entityId: string;
  name: string;
  appearance?: string;
  expression?: string;
  pose?: string;
  position?: "FOREGROUND" | "MIDGROUND" | "BACKGROUND" | "LEFT" | "CENTER" | "RIGHT";
  action?: string;
};

// =====================================================
// SCREENPLAY SYSTEM - Scene Character Instances
// Instances are copies of characters with scene-specific state
// Never modifies the original Entity in the database
// =====================================================

export type DialogLine = {
  id: string;
  text: string;
  emotion?: string;
  direction?: string; // Stage direction for delivery
  voiceTone?: string;
};

export type WardrobeItemType = "TOP" | "BOTTOM" | "DRESS" | "OUTERWEAR" | "FOOTWEAR" | "ACCESSORY" | "HEADWEAR" | "FULL_OUTFIT" | "JEWELRY" | "BAG" | "EYEWEAR" | "GLOVES" | "BELT" | "SCARF" | "UNIFORM" | "COSTUME";

export type WardrobeItemCondition = "PRISTINE" | "WORN" | "DAMAGED" | "DIRTY" | "WET" | "BLOODIED" | "TORN" | "FADED";

export type WardrobeItemRarity = "COMMON" | "UNCOMMON" | "RARE" | "UNIQUE" | "LEGENDARY";

export type WardrobeItem = {
  type: WardrobeItemType;
  description: string;
  color?: string;
  style?: string;
  condition?: WardrobeItemCondition;
};

// =====================================================
// COMMUNITY WARDROBE SYSTEM - Global clothing database
// =====================================================

export type CommunityWardrobeItem = {
  _id: string;
  
  // Basic info
  name: string;
  type: WardrobeItemType;
  description: string;
  promptText: string; // The actual text to insert into prompts
  negativePrompt?: string; // What to avoid when using this item
  
  // Visual attributes
  color?: string;
  colors?: string[]; // Multiple colors for patterns
  pattern?: string; // e.g., "striped", "plaid", "floral"
  material?: string; // e.g., "leather", "cotton", "silk"
  style?: string; // e.g., "casual", "formal", "vintage"
  era?: string; // e.g., "1920s", "modern", "futuristic"
  
  // Categorization
  tags: string[];
  category?: string; // e.g., "workwear", "evening", "athletic"
  gender?: "MALE" | "FEMALE" | "UNISEX";
  ageGroup?: "CHILD" | "TEEN" | "ADULT" | "ELDERLY" | "ANY";
  
  // Rarity and restrictions
  rarity: WardrobeItemRarity;
  isPublic: boolean; // Available to all users
  restrictedToCharacters?: string[]; // Character entity IDs that can use this
  restrictedToConditions?: string[]; // e.g., "formal_event", "combat", "underwater"
  
  // Character association (optional)
  characterEntityId?: string; // If this is a character's signature item
  characterName?: string; // For display purposes
  
  // Media
  imageUrl?: string;
  imagePublicId?: string;
  thumbnailUrl?: string;
  referenceImages?: string[];
  
  // AI-generated data (always stored)
  aiGeneratedDescription?: string;
  aiRecognizedDetails?: Record<string, unknown>;
  aiSuggestedPrompt?: string;
  aiLastAnalyzed?: Date;
  
  // Usage tracking
  usageCount: number;
  lastUsedAt?: Date;
  favoriteCount: number;
  
  // Metadata
  createdAt: Date;
  createdBy: string;
  updatedAt: Date;
  updatedBy: string;
  
  // Version history
  previousVersions?: {
    promptText: string;
    updatedAt: Date;
    updatedBy: string;
    reason?: string;
  }[];
};

export type CharacterWardrobe = {
  _id: string;
  entityId: string; // Character entity ID
  characterName: string;
  
  // Default outfit
  defaultOutfitDescription?: string;
  defaultOutfitItems: string[]; // CommunityWardrobeItem IDs
  
  // Outfit collections for different situations
  outfitCollections: {
    name: string; // e.g., "Work", "Casual", "Formal", "Combat"
    description?: string;
    itemIds: string[];
    condition?: string; // When to use this outfit
  }[];
  
  // Favorite items
  favoriteItemIds: string[];
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
};

export type WardrobeSearchFilters = {
  type?: WardrobeItemType;
  category?: string;
  tags?: string[];
  gender?: "MALE" | "FEMALE" | "UNISEX";
  rarity?: WardrobeItemRarity;
  characterEntityId?: string;
  searchText?: string;
  isPublic?: boolean;
};

export type CharacterStateChange = {
  field: string;
  previousValue?: string;
  newValue: string;
  reason?: string;
};

export type SceneCharacterInstance = {
  id: string; // Unique instance ID
  entityId: string; // Reference to original character Entity
  sceneNodeId: string; // Which scene this instance belongs to
  
  // Character base info (copied from Entity for quick access)
  name: string;
  thumbnailUrl?: string;
  baseAppearance?: string;
  
  // Scene-specific state (INSTANCED - doesn't affect original)
  wardrobe: WardrobeItem[];
  currentOutfitDescription?: string;
  
  // Physical state in scene
  position: "FOREGROUND" | "MIDGROUND" | "BACKGROUND" | "LEFT" | "CENTER" | "RIGHT" | "OFF_SCREEN";
  facing?: "CAMERA" | "AWAY" | "LEFT" | "RIGHT" | "UP" | "DOWN";
  pose?: string;
  expression?: string;
  bodyLanguage?: string;
  
  // Actions
  currentAction?: string;
  actionIntensity?: "SUBTLE" | "MODERATE" | "DRAMATIC";
  props?: string[]; // Items character is holding/using
  
  // Dialog
  dialogLines: DialogLine[];
  isSpeaking?: boolean;
  speakingOrder?: number;
  
  // Emotional/Mental state
  emotionalState?: string;
  internalThought?: string;
  motivation?: string;
  
  // Continuity tracking
  stateChanges: CharacterStateChange[];
  previousSceneInstanceId?: string; // Link to previous scene's instance
  continuityNotes?: string;
  
  // Visual prompt contribution
  visualPromptOverride?: string; // Manual override for visual description
  includeInPrompt: boolean;
  promptPriority: number; // Higher = more prominent in prompt
  
  // Metadata
  createdAt: Date;
  updatedAt: Date;
};

export type SceneScreenplay = {
  sceneNodeId: string;
  characterInstances: SceneCharacterInstance[];
  sceneDirection?: string; // Overall stage direction
  openingAction?: string;
  closingAction?: string;
  atmosphereNotes?: string;
  pacing?: "SLOW" | "MEDIUM" | "FAST" | "FRENETIC";
  tension?: "LOW" | "BUILDING" | "HIGH" | "CLIMAX" | "RELEASE";
  
  // Dialog order
  dialogSequence: string[]; // Array of instance IDs in speaking order
  
  // Continuity
  previousSceneId?: string;
  nextSceneId?: string;
  continuityChecklist?: string[];
  
  // Generated prompts from screenplay
  generatedCharacterPrompt?: string;
  generatedActionPrompt?: string;
  generatedDialogSummary?: string;
};

export type LocationInScene = {
  entityId: string;
  name: string;
  description?: string;
  timeOfDay?: string;
  weather?: string;
  atmosphere?: string;
};

export type ExportedPrompt = {
  _id: string;
  tenantId: string;
  projectId: string;
  nodeId: string;
  type: ExportedPromptType;
  title: string;
  
  // Scene context
  sceneDescription: string;
  dramaticContext: {
    goal?: string;
    conflict?: string;
    turn?: string;
    mood?: string;
  };
  
  // Characters & Locations
  characters: CharacterInScene[];
  locations: LocationInScene[];
  
  // Cinematic settings
  cinematicSettings: CinematicSettings;
  
  // Video-specific (only for VIDEO type)
  videoSettings?: VideoMotionSettings;
  
  // Final generated prompts
  finalPrompt: string;
  negativePrompt?: string;
  
  // Continuity tracking
  continuityTags: string[];
  previousPromptId?: string;
  nextPromptId?: string;
  timelineOrder: number;
  
  // Metadata
  createdAt: Date;
  createdBy: string;
  usedInGallery: boolean;
  usedInStory: boolean;
  thumbnailUrl?: string;
};
