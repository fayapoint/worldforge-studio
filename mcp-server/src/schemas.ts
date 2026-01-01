import { z } from "zod";

export const objectIdSchema = z.string().min(1);

export const ctxSchema = z.object({
  tenantId: z.string().min(1),
  userId: z.string().min(1),
});

export const projectCtxSchema = ctxSchema.extend({ projectId: z.string().min(1) });

export const projectCreateSchema = ctxSchema.extend({
  title: z.string().min(1),
  logline: z.string().default(""),
  styleBible: z.record(z.string(), z.unknown()).optional(),
});

export const projectGetSchema = ctxSchema.extend({ projectId: z.string().min(1) });

export const entityTypeSchema = z.enum([
  "CHARACTER",
  "LOCATION",
  "FACTION",
  "ITEM",
  "RULE",
  "LORE",
]);

export const entityInputSchema = z.object({
  entityId: z.string().optional(),
  type: entityTypeSchema,
  name: z.string().min(1),
  summary: z.string().default(""),
  tags: z.array(z.string()).optional(),
  attributes: z.record(z.string(), z.unknown()).default({}),
  relationships: z
    .array(
      z.object({
        toEntityId: z.string().min(1),
        relType: z.string().min(1),
        note: z.string().optional(),
      }),
    )
    .default([]),
});

export const entityUpsertSchema = projectCtxSchema.extend({ entity: entityInputSchema });
export const entityGetSchema = projectCtxSchema.extend({ entityId: z.string().min(1) });
export const entitySearchSchema = projectCtxSchema.extend({
  query: z.string().default(""),
  type: entityTypeSchema.optional(),
  limit: z.number().int().min(1).max(200).default(50),
  offset: z.number().int().min(0).default(0),
});
export const entityLinkSchema = projectCtxSchema.extend({
  fromEntityId: z.string().min(1),
  toEntityId: z.string().min(1),
  relType: z.string().min(1),
  note: z.string().optional(),
});

export const nodeTypeSchema = z.enum(["BEAT", "SCENE", "CHAPTER"]);
export const edgeTypeSchema = z.enum(["LINEAR", "BRANCH", "CHOICE", "FLASHBACK", "TIMEJUMP"]);

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
  participants: z
    .array(
      z.object({
        entityId: z.string().min(1),
        role: z.enum(["PROTAGONIST", "ANTAGONIST", "SUPPORT"]),
      }),
    )
    .default([]),
  locations: z.array(z.string()).default([]),
  worldStateDelta: z
    .array(
      z.object({
        key: z.string().min(1),
        op: z.enum(["SET", "INC", "DEC", "ADD", "REMOVE"]),
        value: z.unknown().optional(),
      }),
    )
    .default([]),
});

export const storyNodeCreateSchema = projectCtxSchema.extend({ node: storyNodeInputSchema });
export const storyNodeGetSchema = projectCtxSchema.extend({ nodeId: z.string().min(1) });
export const storyNodeUpdateSchema = projectCtxSchema.extend({
  nodeId: z.string().min(1),
  patch: storyNodeInputSchema.partial(),
});

export const storyEdgeCreateSchema = projectCtxSchema.extend({
  edge: z.object({
    fromNodeId: z.string().min(1),
    toNodeId: z.string().min(1),
    edgeType: edgeTypeSchema,
    conditions: z.array(z.string()).default([]),
    notes: z.string().default(""),
  }),
});

export const storyGraphGetSchema = projectCtxSchema;

export const continuityCheckSchema = projectCtxSchema.extend({ nodeId: z.string().min(1) });

export const promptComposeSchema = projectCtxSchema.extend({
  nodeId: z.string().min(1),
  template: z.literal("CINEMATIC_V1"),
});

export const exportStoryBibleSchema = projectCtxSchema;

export const exportShotPromptPackSchema = projectCtxSchema.extend({
  chapterNodeId: z.string().optional(),
});

export const publishSchema = projectCtxSchema.extend({
  objectType: z.enum(["ENTITY", "STORY_NODE"]),
  objectId: z.string().min(1),
});
