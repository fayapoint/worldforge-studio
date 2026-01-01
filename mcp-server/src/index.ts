import * as z from "zod/v4";
import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { StdioServerTransport } from "@modelcontextprotocol/sdk/server/stdio.js";
import type { CallToolResult } from "@modelcontextprotocol/sdk/types.js";
import { ObjectId } from "mongodb";

import { ensureIndexes } from "./ensureIndexes.js";
import { getDb } from "./db.js";
import {
  colEntities,
  colProjects,
  colPromptPacks,
  colStoryEdges,
  colStoryNodes,
  colUsers,
  type EntityDoc,
  type ProjectDoc,
  type PromptPackDoc,
  type StoryEdgeDoc,
  type StoryNodeDoc,
} from "./mongoModels.js";
import { requirePermission, ForbiddenError } from "./rbac.js";
import {
  continuityCheckForNode,
  computePreAndPostStateForNode,
  type WorldState,
} from "./worldState.js";
import { composePromptPack } from "./promptComposer.js";
import {
  continuityCheckSchema,
  entityGetSchema,
  entityLinkSchema,
  entitySearchSchema,
  entityUpsertSchema,
  exportShotPromptPackSchema,
  exportStoryBibleSchema,
  projectCreateSchema,
  projectGetSchema,
  promptComposeSchema,
  publishSchema,
  storyEdgeCreateSchema,
  storyGraphGetSchema,
  storyNodeCreateSchema,
  storyNodeGetSchema,
  storyNodeUpdateSchema,
} from "./schemas.js";
import { idStr, toObjectId, toolError, toolOk } from "./utils.js";

function serializeProject(doc: ProjectDoc) {
  return {
    _id: idStr(doc._id),
    tenantId: idStr(doc.tenantId),
    title: doc.title,
    logline: doc.logline,
    styleBible: doc.styleBible ?? {},
    createdAt: doc.createdAt,
  };
}

function serializeEntity(doc: EntityDoc) {
  return {
    _id: idStr(doc._id),
    tenantId: idStr(doc.tenantId),
    projectId: idStr(doc.projectId),
    type: doc.type,
    name: doc.name,
    summary: doc.summary,
    tags: doc.tags,
    attributes: doc.attributes,
    relationships: doc.relationships,
    version: doc.version,
    audit: {
      createdBy: idStr(doc.audit.createdBy),
      updatedBy: idStr(doc.audit.updatedBy),
      updatedAt: doc.audit.updatedAt,
    },
  };
}

function serializeStoryNode(doc: StoryNodeDoc) {
  return {
    _id: idStr(doc._id),
    tenantId: idStr(doc.tenantId),
    projectId: idStr(doc.projectId),
    nodeType: doc.nodeType,
    title: doc.title,
    synopsis: doc.synopsis,
    goals: doc.goals,
    hooks: doc.hooks,
    time: doc.time,
    participants: doc.participants,
    locations: doc.locations,
    worldStateDelta: doc.worldStateDelta,
    version: doc.version,
    audit: {
      createdBy: idStr(doc.audit.createdBy),
      updatedBy: idStr(doc.audit.updatedBy),
      updatedAt: doc.audit.updatedAt,
    },
  };
}

function serializeStoryEdge(doc: StoryEdgeDoc) {
  return {
    _id: idStr(doc._id),
    tenantId: idStr(doc.tenantId),
    projectId: idStr(doc.projectId),
    fromNodeId: idStr(doc.fromNodeId),
    toNodeId: idStr(doc.toNodeId),
    edgeType: doc.edgeType,
    conditions: doc.conditions,
    notes: doc.notes,
  };
}

function serializePromptPack(doc: PromptPackDoc) {
  return {
    _id: idStr(doc._id),
    tenantId: idStr(doc.tenantId),
    projectId: idStr(doc.projectId),
    nodeId: idStr(doc.nodeId),
    target: doc.target,
    template: doc.template,
    shots: doc.shots,
    continuityNotes: doc.continuityNotes,
    createdAt: doc.createdAt,
    createdBy: idStr(doc.createdBy),
  };
}

async function getUserRoles(params: { tenantId: string; userId: string }) {
  const db = await getDb();
  const user = await colUsers(db).findOne({
    _id: toObjectId(params.userId),
    tenantId: toObjectId(params.tenantId),
  });
  if (!user) {
    throw new Error("UNAUTHORIZED");
  }
  return user.roles;
}

async function ensureProjectAccessible(params: { tenantId: string; projectId: string }) {
  const db = await getDb();
  const project = await colProjects(db).findOne({
    _id: toObjectId(params.projectId),
    tenantId: toObjectId(params.tenantId),
  });
  if (!project) {
    throw new Error("NOT_FOUND_PROJECT");
  }
  return project;
}

function toolResult(result: ReturnType<typeof toolOk> | ReturnType<typeof toolError>): CallToolResult {
  return result as unknown as CallToolResult;
}

function mapErrorToTool(err: unknown): CallToolResult {
  if (err instanceof z.ZodError) {
    return toolResult(toolError("VALIDATION_ERROR", "Invalid input", err.flatten()));
  }

  if (err instanceof ForbiddenError) {
    return toolResult(toolError("FORBIDDEN", "Forbidden"));
  }

  const message = err instanceof Error ? err.message : String(err);

  if (message === "UNAUTHORIZED") {
    return toolResult(toolError("UNAUTHORIZED", "Unauthorized"));
  }

  if (message === "NOT_FOUND_PROJECT") {
    return toolResult(toolError("NOT_FOUND", "Project not found"));
  }

  if (message === "Invalid ObjectId") {
    return toolResult(toolError("VALIDATION_ERROR", "Invalid id"));
  }

  return toolResult(toolError("INTERNAL_ERROR", message));
}

const server = new McpServer(
  {
    name: "worldforge-mcp",
    version: "0.1.0",
  },
  {
    capabilities: {
      tools: {},
    },
  },
);

server.registerTool(
  "project.create",
  {
    title: "Create Project",
    description: "Create a new project",
    inputSchema: { tenantId: z.string(), userId: z.string(), title: z.string(), logline: z.string().optional(), styleBible: z.record(z.string(), z.unknown()).optional() },
  },
  async (raw): Promise<CallToolResult> => {
    try {
      await ensureIndexes();
      const input = projectCreateSchema.parse(raw);

      const roles = await getUserRoles(input);
      requirePermission(roles, "project:write");

      const db = await getDb();
      const now = new Date();
      const projectId = new ObjectId();

      await colProjects(db).insertOne({
        _id: projectId,
        tenantId: toObjectId(input.tenantId),
        title: input.title,
        logline: input.logline,
        styleBible: input.styleBible ?? {},
        createdAt: now,
      });

      const doc = await colProjects(db).findOne({ _id: projectId, tenantId: toObjectId(input.tenantId) });
      if (!doc) throw new Error("INTERNAL_ERROR");

      return toolResult(toolOk({ project: serializeProject(doc) }));
    } catch (err: unknown) {
      return mapErrorToTool(err);
    }
  },
);

server.registerTool(
  "project.get",
  {
    title: "Get Project",
    description: "Fetch a project by id",
    inputSchema: { tenantId: z.string(), userId: z.string(), projectId: z.string() },
  },
  async (raw): Promise<CallToolResult> => {
    try {
      await ensureIndexes();
      const input = projectGetSchema.parse(raw);

      const roles = await getUserRoles(input);
      requirePermission(roles, "project:read");

      const db = await getDb();
      const project = await colProjects(db).findOne({
        _id: toObjectId(input.projectId),
        tenantId: toObjectId(input.tenantId),
      });
      if (!project) throw new Error("NOT_FOUND_PROJECT");

      return toolResult(toolOk({ project: serializeProject(project) }));
    } catch (err: unknown) {
      return mapErrorToTool(err);
    }
  },
);

server.registerTool(
  "entity.upsert",
  {
    title: "Upsert Entity",
    description: "Create or update an entity",
    inputSchema: {
      tenantId: z.string(),
      userId: z.string(),
      projectId: z.string(),
      entity: z.any(),
    },
  },
  async (raw): Promise<CallToolResult> => {
    try {
      await ensureIndexes();
      const input = entityUpsertSchema.parse(raw);

      const roles = await getUserRoles(input);
      requirePermission(roles, "entity:write");

      await ensureProjectAccessible(input);

      const db = await getDb();
      const now = new Date();

      const entityId = input.entity.entityId ? toObjectId(input.entity.entityId) : new ObjectId();

      const existing = await colEntities(db).findOne({
        _id: entityId,
        tenantId: toObjectId(input.tenantId),
        projectId: toObjectId(input.projectId),
      });

      if (!existing) {
        await colEntities(db).insertOne({
          _id: entityId,
          tenantId: toObjectId(input.tenantId),
          projectId: toObjectId(input.projectId),
          type: input.entity.type,
          name: input.entity.name,
          summary: input.entity.summary,
          tags: input.entity.tags,
          attributes: input.entity.attributes,
          relationships: input.entity.relationships,
          version: { status: "DRAFT", number: 1 },
          audit: {
            createdBy: toObjectId(input.userId),
            updatedBy: toObjectId(input.userId),
            updatedAt: now,
          },
        });
      } else {
        await colEntities(db).updateOne(
          {
            _id: entityId,
            tenantId: toObjectId(input.tenantId),
            projectId: toObjectId(input.projectId),
          },
          {
            $set: {
              type: input.entity.type,
              name: input.entity.name,
              summary: input.entity.summary,
              tags: input.entity.tags,
              attributes: input.entity.attributes,
              relationships: input.entity.relationships,
              "audit.updatedBy": toObjectId(input.userId),
              "audit.updatedAt": now,
            },
          },
        );
      }

      const doc = await colEntities(db).findOne({
        _id: entityId,
        tenantId: toObjectId(input.tenantId),
        projectId: toObjectId(input.projectId),
      });
      if (!doc) throw new Error("NOT_FOUND");

      return toolResult(toolOk({ entity: serializeEntity(doc) }));
    } catch (err: unknown) {
      return mapErrorToTool(err);
    }
  },
);

server.registerTool(
  "entity.get",
  {
    title: "Get Entity",
    description: "Fetch an entity by id",
    inputSchema: { tenantId: z.string(), userId: z.string(), projectId: z.string(), entityId: z.string() },
  },
  async (raw): Promise<CallToolResult> => {
    try {
      await ensureIndexes();
      const input = entityGetSchema.parse(raw);

      const roles = await getUserRoles(input);
      requirePermission(roles, "entity:read");

      await ensureProjectAccessible(input);

      const db = await getDb();
      const doc = await colEntities(db).findOne({
        _id: toObjectId(input.entityId),
        tenantId: toObjectId(input.tenantId),
        projectId: toObjectId(input.projectId),
      });

      if (!doc) {
        return toolResult(toolError("NOT_FOUND", "Entity not found"));
      }

      return toolResult(toolOk({ entity: serializeEntity(doc) }));
    } catch (err: unknown) {
      return mapErrorToTool(err);
    }
  },
);

server.registerTool(
  "entity.search",
  {
    title: "Search Entities",
    description: "Search entities by text and optional type",
    inputSchema: {
      tenantId: z.string(),
      userId: z.string(),
      projectId: z.string(),
      query: z.string().optional(),
      type: z.string().optional(),
      limit: z.number().optional(),
      offset: z.number().optional(),
    },
  },
  async (raw): Promise<CallToolResult> => {
    try {
      await ensureIndexes();
      const input = entitySearchSchema.parse(raw);

      const roles = await getUserRoles(input);
      requirePermission(roles, "entity:read");

      await ensureProjectAccessible(input);

      const db = await getDb();

      const filter: Record<string, unknown> = {
        tenantId: toObjectId(input.tenantId),
        projectId: toObjectId(input.projectId),
      };

      if (input.type) {
        filter.type = input.type;
      }

      if (input.query.trim()) {
        filter.$text = { $search: input.query.trim() };
      }

      const [items, total] = await Promise.all([
        colEntities(db)
          .find(filter)
          .sort(input.query.trim() ? { score: { $meta: "textScore" } } : { "audit.updatedAt": -1 })
          .skip(input.offset)
          .limit(input.limit)
          .toArray(),
        colEntities(db).countDocuments(filter),
      ]);

      return toolResult(toolOk({ items: items.map(serializeEntity), total }));
    } catch (err: unknown) {
      return mapErrorToTool(err);
    }
  },
);

server.registerTool(
  "entity.link",
  {
    title: "Link Entities",
    description: "Create a relationship link from one entity to another",
    inputSchema: {
      tenantId: z.string(),
      userId: z.string(),
      projectId: z.string(),
      fromEntityId: z.string(),
      toEntityId: z.string(),
      relType: z.string(),
      note: z.string().optional(),
    },
  },
  async (raw): Promise<CallToolResult> => {
    try {
      await ensureIndexes();
      const input = entityLinkSchema.parse(raw);

      const roles = await getUserRoles(input);
      requirePermission(roles, "entity:write");

      await ensureProjectAccessible(input);

      const db = await getDb();
      const now = new Date();

      const updated = await colEntities(db).findOneAndUpdate(
        {
          _id: toObjectId(input.fromEntityId),
          tenantId: toObjectId(input.tenantId),
          projectId: toObjectId(input.projectId),
        },
        {
          $push: {
            relationships: {
              toEntityId: input.toEntityId,
              relType: input.relType,
              note: input.note,
            },
          },
          $set: {
            "audit.updatedBy": toObjectId(input.userId),
            "audit.updatedAt": now,
          },
        },
        { returnDocument: "after" },
      );

      if (!updated) {
        return toolResult(toolError("NOT_FOUND", "Entity not found"));
      }

      return toolResult(toolOk({ entity: serializeEntity(updated) }));
    } catch (err: unknown) {
      return mapErrorToTool(err);
    }
  },
);

server.registerTool(
  "storyNode.create",
  {
    title: "Create Story Node",
    description: "Create a beat/scene/chapter node",
    inputSchema: {
      tenantId: z.string(),
      userId: z.string(),
      projectId: z.string(),
      node: z.any(),
    },
  },
  async (raw): Promise<CallToolResult> => {
    try {
      await ensureIndexes();
      const input = storyNodeCreateSchema.parse(raw);

      const roles = await getUserRoles(input);
      requirePermission(roles, "story:write");

      await ensureProjectAccessible(input);

      const db = await getDb();
      const now = new Date();
      const nodeId = new ObjectId();

      await colStoryNodes(db).insertOne({
        _id: nodeId,
        tenantId: toObjectId(input.tenantId),
        projectId: toObjectId(input.projectId),
        nodeType: input.node.nodeType,
        title: input.node.title,
        synopsis: input.node.synopsis,
        goals: input.node.goals,
        hooks: input.node.hooks,
        time: input.node.time,
        participants: input.node.participants,
        locations: input.node.locations,
        worldStateDelta: input.node.worldStateDelta,
        version: { status: "DRAFT", number: 1 },
        audit: {
          createdBy: toObjectId(input.userId),
          updatedBy: toObjectId(input.userId),
          updatedAt: now,
        },
      });

      const doc = await colStoryNodes(db).findOne({
        _id: nodeId,
        tenantId: toObjectId(input.tenantId),
        projectId: toObjectId(input.projectId),
      });
      if (!doc) return toolResult(toolError("INTERNAL_ERROR", "Failed to create node"));

      return toolResult(toolOk({ node: serializeStoryNode(doc) }));
    } catch (err: unknown) {
      return mapErrorToTool(err);
    }
  },
);

server.registerTool(
  "storyNode.update",
  {
    title: "Update Story Node",
    description: "Patch a story node",
    inputSchema: {
      tenantId: z.string(),
      userId: z.string(),
      projectId: z.string(),
      nodeId: z.string(),
      patch: z.any(),
    },
  },
  async (raw): Promise<CallToolResult> => {
    try {
      await ensureIndexes();
      const input = storyNodeUpdateSchema.parse(raw);

      const roles = await getUserRoles(input);
      requirePermission(roles, "story:write");

      await ensureProjectAccessible(input);

      const db = await getDb();
      const now = new Date();

      const update: Record<string, unknown> = { ...input.patch };
      update["audit.updatedBy"] = toObjectId(input.userId);
      update["audit.updatedAt"] = now;

      const updated = await colStoryNodes(db).findOneAndUpdate(
        {
          _id: toObjectId(input.nodeId),
          tenantId: toObjectId(input.tenantId),
          projectId: toObjectId(input.projectId),
        },
        { $set: update },
        { returnDocument: "after" },
      );

      if (!updated) return toolResult(toolError("NOT_FOUND", "Story node not found"));

      return toolResult(toolOk({ node: serializeStoryNode(updated) }));
    } catch (err: unknown) {
      return mapErrorToTool(err);
    }
  },
);

server.registerTool(
  "storyNode.get",
  {
    title: "Get Story Node",
    description: "Fetch a story node",
    inputSchema: {
      tenantId: z.string(),
      userId: z.string(),
      projectId: z.string(),
      nodeId: z.string(),
    },
  },
  async (raw): Promise<CallToolResult> => {
    try {
      await ensureIndexes();
      const input = storyNodeGetSchema.parse(raw);

      const roles = await getUserRoles(input);
      requirePermission(roles, "story:read");

      await ensureProjectAccessible(input);

      const db = await getDb();
      const doc = await colStoryNodes(db).findOne({
        _id: toObjectId(input.nodeId),
        tenantId: toObjectId(input.tenantId),
        projectId: toObjectId(input.projectId),
      });

      if (!doc) return toolResult(toolError("NOT_FOUND", "Story node not found"));

      return toolResult(toolOk({ node: serializeStoryNode(doc) }));
    } catch (err: unknown) {
      return mapErrorToTool(err);
    }
  },
);

server.registerTool(
  "storyEdge.create",
  {
    title: "Create Story Edge",
    description: "Create an edge between story nodes",
    inputSchema: {
      tenantId: z.string(),
      userId: z.string(),
      projectId: z.string(),
      edge: z.any(),
    },
  },
  async (raw): Promise<CallToolResult> => {
    try {
      await ensureIndexes();
      const input = storyEdgeCreateSchema.parse(raw);

      const roles = await getUserRoles(input);
      requirePermission(roles, "story:write");

      await ensureProjectAccessible(input);

      const db = await getDb();
      const edgeId = new ObjectId();

      await colStoryEdges(db).insertOne({
        _id: edgeId,
        tenantId: toObjectId(input.tenantId),
        projectId: toObjectId(input.projectId),
        fromNodeId: toObjectId(input.edge.fromNodeId),
        toNodeId: toObjectId(input.edge.toNodeId),
        edgeType: input.edge.edgeType,
        conditions: input.edge.conditions,
        notes: input.edge.notes,
      });

      const doc = await colStoryEdges(db).findOne({
        _id: edgeId,
        tenantId: toObjectId(input.tenantId),
        projectId: toObjectId(input.projectId),
      });

      if (!doc) return toolResult(toolError("INTERNAL_ERROR", "Failed to create edge"));

      return toolResult(toolOk({ edge: serializeStoryEdge(doc) }));
    } catch (err: unknown) {
      return mapErrorToTool(err);
    }
  },
);

server.registerTool(
  "storyGraph.get",
  {
    title: "Get Story Graph",
    description: "Fetch all story nodes and edges",
    inputSchema: { tenantId: z.string(), userId: z.string(), projectId: z.string() },
  },
  async (raw): Promise<CallToolResult> => {
    try {
      await ensureIndexes();
      const input = storyGraphGetSchema.parse(raw);

      const roles = await getUserRoles(input);
      requirePermission(roles, "story:read");

      await ensureProjectAccessible(input);

      const db = await getDb();
      const [nodes, edges] = await Promise.all([
        colStoryNodes(db)
          .find({ tenantId: toObjectId(input.tenantId), projectId: toObjectId(input.projectId) })
          .sort({ "time.order": 1 })
          .toArray(),
        colStoryEdges(db)
          .find({ tenantId: toObjectId(input.tenantId), projectId: toObjectId(input.projectId) })
          .toArray(),
      ]);

      return toolResult(toolOk({ nodes: nodes.map(serializeStoryNode), edges: edges.map(serializeStoryEdge) }));
    } catch (err: unknown) {
      return mapErrorToTool(err);
    }
  },
);

server.registerTool(
  "continuity.check",
  {
    title: "Continuity Check",
    description: "Detect continuity issues for a node",
    inputSchema: { tenantId: z.string(), userId: z.string(), projectId: z.string(), nodeId: z.string() },
  },
  async (raw): Promise<CallToolResult> => {
    try {
      await ensureIndexes();
      const input = continuityCheckSchema.parse(raw);

      const roles = await getUserRoles(input);
      requirePermission(roles, "continuity:check");

      await ensureProjectAccessible(input);

      const db = await getDb();
      const nodeDocs = await colStoryNodes(db)
        .find({ tenantId: toObjectId(input.tenantId), projectId: toObjectId(input.projectId) })
        .sort({ "time.order": 1 })
        .toArray();

      const nodes = nodeDocs.map(serializeStoryNode);

      let pre: WorldState;
      let post: WorldState;
      const node = nodes.find((n) => n._id === input.nodeId);
      if (!node) return toolResult(toolError("NOT_FOUND", "Story node not found"));

      ({ pre, post } = computePreAndPostStateForNode(nodes, input.nodeId));

      const result = continuityCheckForNode({ node, pre, post });

      return toolResult(toolOk({ ...result, preState: pre, postState: post }));
    } catch (err: unknown) {
      return mapErrorToTool(err);
    }
  },
);

server.registerTool(
  "prompt.compose",
  {
    title: "Compose Prompt Pack",
    description: "Generate and persist a Higgsfield prompt pack for a node",
    inputSchema: { tenantId: z.string(), userId: z.string(), projectId: z.string(), nodeId: z.string(), template: z.literal("CINEMATIC_V1") },
  },
  async (raw): Promise<CallToolResult> => {
    try {
      await ensureIndexes();
      const input = promptComposeSchema.parse(raw);

      const roles = await getUserRoles(input);
      requirePermission(roles, "prompt:compose");

      const projectDoc = await ensureProjectAccessible(input);

      const db = await getDb();

      const nodeDocs = await colStoryNodes(db)
        .find({ tenantId: toObjectId(input.tenantId), projectId: toObjectId(input.projectId) })
        .sort({ "time.order": 1 })
        .toArray();

      const nodes = nodeDocs.map(serializeStoryNode);
      const node = nodes.find((n) => n._id === input.nodeId);
      if (!node) return toolResult(toolError("NOT_FOUND", "Story node not found"));

      const { pre } = computePreAndPostStateForNode(nodes, input.nodeId);

      const participantIds = (node.participants ?? []).map((p) => p.entityId);
      const locationIds = node.locations ?? [];

      const entityDocs = await colEntities(db)
        .find({
          tenantId: toObjectId(input.tenantId),
          projectId: toObjectId(input.projectId),
          _id: { $in: [...participantIds, ...locationIds].map((id) => toObjectId(id)) },
        })
        .toArray();

      const entities = entityDocs.map(serializeEntity);
      const characters = entities.filter((e) => participantIds.includes(e._id));
      const locations = entities.filter((e) => locationIds.includes(e._id));

      const project = serializeProject(projectDoc);

      const pack = composePromptPack({
        tenantId: input.tenantId,
        projectId: input.projectId,
        nodeId: node._id,
        project,
        node,
        characters,
        locations,
        worldState: pre,
        createdBy: input.userId,
      });

      const packId = new ObjectId();
      await colPromptPacks(db).insertOne({
        _id: packId,
        tenantId: toObjectId(input.tenantId),
        projectId: toObjectId(input.projectId),
        nodeId: toObjectId(node._id),
        target: pack.target,
        template: pack.template,
        shots: pack.shots,
        continuityNotes: pack.continuityNotes,
        createdAt: pack.createdAt,
        createdBy: toObjectId(input.userId),
      });

      const saved = await colPromptPacks(db).findOne({
        _id: packId,
        tenantId: toObjectId(input.tenantId),
        projectId: toObjectId(input.projectId),
      });
      if (!saved) return toolResult(toolError("INTERNAL_ERROR", "Failed to save prompt pack"));

      return toolResult(toolOk({ promptPack: serializePromptPack(saved) }));
    } catch (err: unknown) {
      return mapErrorToTool(err);
    }
  },
);

server.registerTool(
  "version.publish",
  {
    title: "Publish",
    description: "Publish an entity or story node (canon lock)",
    inputSchema: { tenantId: z.string(), userId: z.string(), projectId: z.string(), objectType: z.enum(["ENTITY", "STORY_NODE"]), objectId: z.string() },
  },
  async (raw): Promise<CallToolResult> => {
    try {
      await ensureIndexes();
      const input = publishSchema.parse(raw);

      const roles = await getUserRoles(input);
      requirePermission(roles, "version:publish");

      await ensureProjectAccessible(input);

      const db = await getDb();
      const now = new Date();

      if (input.objectType === "ENTITY") {
        const updated = await colEntities(db).findOneAndUpdate(
          {
            _id: toObjectId(input.objectId),
            tenantId: toObjectId(input.tenantId),
            projectId: toObjectId(input.projectId),
          },
          {
            $set: {
              "version.status": "PUBLISHED",
              "audit.updatedBy": toObjectId(input.userId),
              "audit.updatedAt": now,
            },
            $inc: { "version.number": 1 },
          },
          { returnDocument: "after" },
        );

        if (!updated) return toolResult(toolError("NOT_FOUND", "Entity not found"));
        return toolResult(toolOk({ object: serializeEntity(updated) }));
      }

      const updated = await colStoryNodes(db).findOneAndUpdate(
        {
          _id: toObjectId(input.objectId),
          tenantId: toObjectId(input.tenantId),
          projectId: toObjectId(input.projectId),
        },
        {
          $set: {
            "version.status": "PUBLISHED",
            "audit.updatedBy": toObjectId(input.userId),
            "audit.updatedAt": now,
          },
          $inc: { "version.number": 1 },
        },
        { returnDocument: "after" },
      );

      if (!updated) return toolResult(toolError("NOT_FOUND", "Story node not found"));
      return toolResult(toolOk({ object: serializeStoryNode(updated) }));
    } catch (err: unknown) {
      return mapErrorToTool(err);
    }
  },
);

server.registerTool(
  "export.storyBible",
  {
    title: "Export Story Bible",
    description: "Export project + entities + story graph as JSON",
    inputSchema: { tenantId: z.string(), userId: z.string(), projectId: z.string() },
  },
  async (raw): Promise<CallToolResult> => {
    try {
      await ensureIndexes();
      const input = exportStoryBibleSchema.parse(raw);

      const roles = await getUserRoles(input);
      requirePermission(roles, "export:read");

      const projectDoc = await ensureProjectAccessible(input);

      const db = await getDb();
      const [entities, nodes, edges] = await Promise.all([
        colEntities(db)
          .find({ tenantId: toObjectId(input.tenantId), projectId: toObjectId(input.projectId) })
          .toArray(),
        colStoryNodes(db)
          .find({ tenantId: toObjectId(input.tenantId), projectId: toObjectId(input.projectId) })
          .sort({ "time.order": 1 })
          .toArray(),
        colStoryEdges(db)
          .find({ tenantId: toObjectId(input.tenantId), projectId: toObjectId(input.projectId) })
          .toArray(),
      ]);

      return toolResult(
        toolOk({
          project: serializeProject(projectDoc),
          entities: entities.map(serializeEntity),
          storyNodes: nodes.map(serializeStoryNode),
          storyEdges: edges.map(serializeStoryEdge),
        }),
      );
    } catch (err: unknown) {
      return mapErrorToTool(err);
    }
  },
);

server.registerTool(
  "export.shotPromptPack",
  {
    title: "Export Shot Prompt Packs",
    description: "Export prompt packs as JSON",
    inputSchema: { tenantId: z.string(), userId: z.string(), projectId: z.string(), chapterNodeId: z.string().optional() },
  },
  async (raw): Promise<CallToolResult> => {
    try {
      await ensureIndexes();
      const input = exportShotPromptPackSchema.parse(raw);

      const roles = await getUserRoles(input);
      requirePermission(roles, "export:read");

      await ensureProjectAccessible(input);

      const db = await getDb();
      const filter: Record<string, unknown> = {
        tenantId: toObjectId(input.tenantId),
        projectId: toObjectId(input.projectId),
      };

      if (input.chapterNodeId) {
        filter.nodeId = toObjectId(input.chapterNodeId);
      }

      const packs = await colPromptPacks(db).find(filter).sort({ createdAt: -1 }).toArray();

      return toolResult(toolOk({ promptPacks: packs.map(serializePromptPack) }));
    } catch (err: unknown) {
      return mapErrorToTool(err);
    }
  },
);

async function main() {
  if (process.argv.includes("--selftest")) {
    process.stderr.write("worldforge-mcp: selftest ok\n");
    return;
  }

  const transport = new StdioServerTransport();
  await server.connect(transport);
  process.stderr.write("worldforge-mcp: ready\n");
}

main().catch((err) => {
  const msg = err instanceof Error ? err.message : String(err);
  process.stderr.write(`MCP server failed to start: ${msg}\n`);
  process.exit(1);
});
