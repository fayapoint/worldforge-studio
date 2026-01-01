import type { Entity, EntityRelationship, EntityMedia, CharacterDetails } from "./models";

export type CanonicalEntity = {
  _id: string;
  type: "CHARACTER" | "LOCATION" | "FACTION" | "ITEM" | "RULE" | "LORE";
  name: string;
  canonicalVersion: number;
  locked: true;
  
  summary: string;
  character?: CharacterDetails;
  media?: EntityMedia;
  attributes: Record<string, unknown>;
  relationships: EntityRelationship[];
  
  firstAppearsInChapter?: string;
  keyMoments: {
    chapterId: string;
    description: string;
    stateChange?: Record<string, unknown>;
  }[];
  
  createdAt: Date;
  updatedAt: Date;
};

export type EntityModification = {
  field: string;
  canonicalValue: any;
  userValue: any;
  reason?: string;
};

export type UserEntityFork = {
  _id: string;
  userId: string;
  canonicalEntityId: string;
  
  modifications: EntityModification[];
  mergedData: Entity;
  
  forkedAt: Date;
  lastSyncedCanonicalVersion: number;
  divergenceScore: number;
  
  usedInChapters: string[];
};

export type Scene = {
  sceneId: string;
  title: string;
  synopsis: string;
  participants: string[];
  location: string;
  keyEvents: string[];
};

export type DramaticBeat = {
  beat: string;
  description: string;
};

export type EntityState = {
  entityId: string;
  stateBefore: Record<string, unknown>;
  stateAfter: Record<string, unknown>;
};

export type CanonicalChapter = {
  _id: string;
  chapterNumber: number;
  title: string;
  
  bookNumber?: number;
  partNumber?: number;
  
  timelineOrder: number;
  inWorldDate?: string;
  duration?: string;
  
  synopsis: string;
  fullText?: string;
  scenes: Scene[];
  
  dramaticBeats: DramaticBeat[];
  cliffhanger?: string;
  foreshadowing: string[];
  payoffs: string[];
  
  worldStateBefore: Record<string, unknown>;
  worldStateAfter: Record<string, unknown>;
  entityStates: EntityState[];
  
  locked: true;
  canonicalVersion: number;
  createdAt: Date;
};

export type ToneModifiers = {
  darkness: number;
  humor: number;
  tension: number;
  romance: number;
};

export type ComplianceIssue = {
  severity: "ERROR" | "WARNING" | "INFO";
  category: "CONTINUITY" | "CHARACTER" | "TIMELINE" | "TONE" | "QUALITY";
  message: string;
  suggestion?: string;
};

export type ChapterReview = {
  userId: string;
  rating: number;
  comment: string;
  createdAt: Date;
};

export type UserChapterContribution = {
  _id: string;
  userId: string;
  
  insertAfterChapter: string | null;
  insertBeforeChapter: string | null;
  timelinePosition: number;
  
  title: string;
  synopsis: string;
  fullText: string;
  
  toneModifiers: ToneModifiers;
  arcDirection: string;
  
  canonicalEntities: string[];
  userModifiedEntities: string[];
  newEntities: string[];
  
  scenes: Scene[];
  dramaticBeats: DramaticBeat[];
  
  complianceStatus: "PENDING" | "REVIEWING" | "APPROVED" | "REJECTED" | "NEEDS_REVISION";
  complianceScore: number;
  complianceIssues: ComplianceIssue[];
  
  communityStatus: "PRIVATE" | "SHARED" | "CANONICAL_CANDIDATE";
  upvotes: number;
  downvotes: number;
  reviews: ChapterReview[];
  
  version: number;
  createdAt: Date;
  updatedAt: Date;
  submittedAt?: Date;
  approvedAt?: Date;
};

export type BranchChapter = {
  chapterId: string;
  type: "CANONICAL" | "USER_CONTRIBUTION" | "COMMUNITY";
  order: number;
  customizations?: {
    toneAdjustments?: ToneModifiers;
    entityOverrides?: string[];
  };
};

export type UserStoryBranch = {
  _id: string;
  userId: string;
  branchName: string;
  
  chapters: BranchChapter[];
  
  divergenceFromCanonical: number;
  totalChapters: number;
  userChapters: number;
  
  defaultTone: ToneModifiers;
  preferredGenres: string[];
  contentRatings: string[];
  
  isPublic: boolean;
  followers: string[];
  
  createdAt: Date;
  updatedAt: Date;
};

export type ComplianceRuleType = 
  | "CHARACTER_CONSISTENCY"
  | "TIMELINE_LOGIC"
  | "WORLD_RULES"
  | "TONE_MATCH"
  | "QUALITY_THRESHOLD";

export type ComplianceRule = {
  _id: string;
  ruleType: ComplianceRuleType;
  
  name: string;
  description: string;
  severity: "ERROR" | "WARNING" | "INFO";
  
  validationFunction: string;
  parameters: Record<string, unknown>;
  
  weight: number;
  
  active: boolean;
  createdAt: Date;
};

export type ChapterInsertionPoint = {
  afterChapter: CanonicalChapter | null;
  beforeChapter: CanonicalChapter | null;
  timelinePosition: number;
  worldState: Record<string, unknown>;
  availableEntities: CanonicalEntity[];
  storyContext: {
    recentEvents: string[];
    activeConflicts: string[];
    momentum: string;
    emotionalTone: string;
  };
};

export type ChapterGenerationRequest = {
  insertionPoint: ChapterInsertionPoint;
  userPreferences: {
    toneModifiers: ToneModifiers;
    arcDirection: string;
    focusCharacters?: string[];
    desiredLength?: "SHORT" | "MEDIUM" | "LONG";
  };
  entityModifications: UserEntityFork[];
  newEntities: Entity[];
};

export type ComplianceCheckResult = {
  overallScore: number;
  passed: boolean;
  issues: ComplianceIssue[];
  recommendations: string[];
  autoFixSuggestions?: {
    issue: ComplianceIssue;
    proposedFix: string;
  }[];
};
