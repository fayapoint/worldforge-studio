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
  prompt: string;
  negativePrompt?: string;
  cinematicSettings: StoryNodeCinematicSettings;
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
