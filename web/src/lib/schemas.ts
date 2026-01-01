import { z } from "zod";

export const roleSchema = z.enum(["ADMIN", "WRITER", "EDITOR"]);

export const entityTypeSchema = z.enum([
  "CHARACTER",
  "LOCATION",
  "FACTION",
  "ITEM",
  "RULE",
  "LORE",
]);

export const nodeTypeSchema = z.enum(["BEAT", "SCENE", "CHAPTER"]);

export const edgeTypeSchema = z.enum([
  "LINEAR",
  "BRANCH",
  "CHOICE",
  "FLASHBACK",
  "TIMEJUMP",
]);

export const versionSchema = z.object({
  status: z.enum(["DRAFT", "PUBLISHED"]),
  number: z.number().int().min(1),
});

export const auditSchema = z.object({
  createdBy: z.string().min(1),
  updatedBy: z.string().min(1),
  updatedAt: z.coerce.date(),
});

export const entityRelationshipSchema = z.object({
  toEntityId: z.string().min(1),
  relType: z.string().min(1),
  note: z.string().optional(),
});

export const entityMediaSchema = z.object({
  thumbnailUrl: z.string().optional(),
  thumbnailPublicId: z.string().optional(),
  faceUrl: z.string().optional(),
  facePublicId: z.string().optional(),
  poseUrls: z.array(z.string()).optional(),
  posePublicIds: z.array(z.string()).optional(),
  referenceUrls: z.array(z.string()).optional(),
  referencePublicIds: z.array(z.string()).optional(),
});

export const characterDetailsSchema = z.object({
  fullName: z.string().optional(),
  aliases: z.array(z.string()).optional(),
  pronouns: z.string().optional(),
  age: z.string().optional(),
  role: z.string().optional(),
  occupation: z.string().optional(),
  archetype: z.string().optional(),
  personality: z.string().optional(),
  appearance: z.string().optional(),
  backstory: z.string().optional(),
  motivation: z.string().optional(),
  skills: z.array(z.string()).optional(),
  weaknesses: z.array(z.string()).optional(),
  voiceNotes: z.string().optional(),
});

export const entityInputSchema = z.object({
  type: entityTypeSchema,
  name: z.string().min(1),
  summary: z.string().default(""),
  tags: z.array(z.string()).optional(),
  media: entityMediaSchema.optional(),
  character: characterDetailsSchema.optional(),
  attributes: z.record(z.string(), z.unknown()).default({}),
  relationships: z.array(entityRelationshipSchema).default([]),
});

export const entityPatchSchema = entityInputSchema.partial();

export const storyParticipantSchema = z.object({
  entityId: z.string().min(1),
  role: z.enum(["PROTAGONIST", "ANTAGONIST", "SUPPORT"]),
});

export const worldStateDeltaSchema = z.object({
  key: z.string().min(1),
  op: z.enum(["SET", "INC", "DEC", "ADD", "REMOVE"]),
  value: z.unknown().optional(),
});

export const sceneFrameImageSchema = z.object({
  url: z.string(),
  uploadedAt: z.coerce.date().optional(),
  width: z.number().optional(),
  height: z.number().optional(),
});

export const sceneVersionSchema = z.object({
  versionNumber: z.number().int().min(1),
  prompt: z.string(),
  negativePrompt: z.string().optional(),
  cinematicSettings: z.record(z.string(), z.unknown()).optional(),
  firstFrame: sceneFrameImageSchema.optional(),
  lastFrame: sceneFrameImageSchema.optional(),
  createdAt: z.coerce.date(),
  notes: z.string().optional(),
  isActive: z.boolean(),
});

export const sceneVersionHistorySchema = z.object({
  versions: z.array(sceneVersionSchema),
  activeVersionNumber: z.number().int().min(0),
});

export const storyNodeInputSchema = z.object({
  nodeType: nodeTypeSchema,
  title: z.string().min(1),
  synopsis: z.string().default(""),
  goals: z
    .object({
      dramaticGoal: z.string().default(""),
      conflict: z.string().default(""),
      turn: z.string().default(""),
    })
    .default({ dramaticGoal: "", conflict: "", turn: "" }),
  hooks: z
    .object({
      hook: z.string().default(""),
      foreshadow: z.array(z.string()).default([]),
      payoffTargets: z.array(z.string()).default([]),
    })
    .default({ hook: "", foreshadow: [], payoffTargets: [] }),
  time: z
    .object({
      inWorldDate: z.string().optional(),
      order: z.number().int().min(0),
    })
    .default({ order: 0 }),
  participants: z.array(storyParticipantSchema).default([]),
  locations: z.array(z.string()).default([]),
  worldStateDelta: z.array(worldStateDeltaSchema).default([]),
  cinematicSettings: z.record(z.string(), z.unknown()).optional(),
  versionHistory: sceneVersionHistorySchema.optional(),
  thumbnail: sceneFrameImageSchema.optional(),
  parentNodeId: z.string().optional(),
  variationType: z.enum(['DUPLICATE', 'CONTINUATION', 'CLOSE_SHOT', 'WIDE_SHOT']).optional(),
});

export const storyNodePatchSchema = storyNodeInputSchema.partial();

export const storyEdgeInputSchema = z.object({
  fromNodeId: z.string().min(1),
  toNodeId: z.string().min(1),
  edgeType: edgeTypeSchema,
  conditions: z.array(z.string()).default([]),
  notes: z.string().default(""),
});

export const storyEdgePatchSchema = storyEdgeInputSchema.partial();

export const registerSchema = z.object({
  tenantName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(6),
});

export const loginSchema = z.object({
  tenantName: z.string().min(1),
  email: z.string().email(),
  password: z.string().min(1),
});

export const projectCreateSchema = z.object({
  title: z.string().min(1),
  logline: z.string().default(""),
  styleBible: z.record(z.string(), z.unknown()).optional(),
});

export const promptComposeSchema = z.object({
  nodeId: z.string().min(1),
  template: z.literal("CINEMATIC_V1"),
});

export const continuityCheckSchema = z.object({
  nodeId: z.string().min(1),
});

export const publishSchema = z.object({
  objectType: z.enum(["ENTITY", "STORY_NODE"]),
  objectId: z.string().min(1),
  projectId: z.string().min(1),
});
