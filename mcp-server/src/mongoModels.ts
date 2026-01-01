import type { Db, Collection, ObjectId } from "mongodb";

export type Role = "ADMIN" | "WRITER" | "EDITOR";

export type TenantDoc = {
  _id: ObjectId;
  name: string;
  plan: string;
  createdAt: Date;
};

export type UserDoc = {
  _id: ObjectId;
  tenantId: ObjectId;
  email: string;
  passwordHash: string;
  roles: Role[];
  createdAt: Date;
};

export type ProjectDoc = {
  _id: ObjectId;
  tenantId: ObjectId;
  title: string;
  logline: string;
  styleBible?: Record<string, unknown>;
  createdAt: Date;
};

export type EntityDoc = {
  _id: ObjectId;
  tenantId: ObjectId;
  projectId: ObjectId;
  type: "CHARACTER" | "LOCATION" | "FACTION" | "ITEM" | "RULE" | "LORE";
  name: string;
  summary: string;
  tags?: string[];
  attributes: Record<string, unknown>;
  relationships: { toEntityId: string; relType: string; note?: string }[];
  version: { status: "DRAFT" | "PUBLISHED"; number: number };
  audit: { createdBy: ObjectId; updatedBy: ObjectId; updatedAt: Date };
};

export type StoryNodeDoc = {
  _id: ObjectId;
  tenantId: ObjectId;
  projectId: ObjectId;
  nodeType: "BEAT" | "SCENE" | "CHAPTER";
  title: string;
  synopsis: string;
  goals: { dramaticGoal: string; conflict: string; turn: string };
  hooks: { hook: string; foreshadow: string[]; payoffTargets: string[] };
  time: { inWorldDate?: string; order: number };
  participants: { entityId: string; role: "PROTAGONIST" | "ANTAGONIST" | "SUPPORT" }[];
  locations: string[];
  worldStateDelta: { key: string; op: "SET" | "INC" | "DEC" | "ADD" | "REMOVE"; value?: unknown }[];
  version: { status: "DRAFT" | "PUBLISHED"; number: number };
  audit: { createdBy: ObjectId; updatedBy: ObjectId; updatedAt: Date };
};

export type StoryEdgeDoc = {
  _id: ObjectId;
  tenantId: ObjectId;
  projectId: ObjectId;
  fromNodeId: ObjectId;
  toNodeId: ObjectId;
  edgeType: "LINEAR" | "BRANCH" | "CHOICE" | "FLASHBACK" | "TIMEJUMP";
  conditions: string[];
  notes: string;
};

export type PromptPackDoc = {
  _id: ObjectId;
  tenantId: ObjectId;
  projectId: ObjectId;
  nodeId: ObjectId;
  target: "HIGGSFIELD";
  template: "CINEMATIC_V1";
  shots: { shotId: string; variant: "A" | "B"; prompt: string; negative: string; refs: string[] }[];
  continuityNotes: string[];
  createdAt: Date;
  createdBy: ObjectId;
};

export function colTenants(db: Db): Collection<TenantDoc> {
  return db.collection<TenantDoc>("tenants");
}

export function colUsers(db: Db): Collection<UserDoc> {
  return db.collection<UserDoc>("users");
}

export function colProjects(db: Db): Collection<ProjectDoc> {
  return db.collection<ProjectDoc>("projects");
}

export function colEntities(db: Db): Collection<EntityDoc> {
  return db.collection<EntityDoc>("entities");
}

export function colStoryNodes(db: Db): Collection<StoryNodeDoc> {
  return db.collection<StoryNodeDoc>("storyNodes");
}

export function colStoryEdges(db: Db): Collection<StoryEdgeDoc> {
  return db.collection<StoryEdgeDoc>("storyEdges");
}

export function colPromptPacks(db: Db): Collection<PromptPackDoc> {
  return db.collection<PromptPackDoc>("promptPacks");
}
