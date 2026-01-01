import type { ObjectId } from "mongodb";
import type {
  Entity,
  Project,
  PromptPack,
  StoryEdge,
  StoryNode,
  Tenant,
  User,
} from "./models";
import type {
  EntityDoc,
  ProjectDoc,
  PromptPackDoc,
  StoryEdgeDoc,
  StoryNodeDoc,
  TenantDoc,
  UserDoc,
} from "./collections";
import { asIdString } from "./ids";

function oid(id: ObjectId): string {
  return asIdString(id);
}

export function serializeTenant(doc: TenantDoc): Tenant {
  return {
    _id: oid(doc._id),
    name: doc.name,
    plan: doc.plan,
    createdAt: doc.createdAt,
  };
}

export function serializeUser(doc: UserDoc): User {
  return {
    _id: oid(doc._id),
    tenantId: oid(doc.tenantId),
    email: doc.email,
    passwordHash: doc.passwordHash,
    roles: doc.roles,
    createdAt: doc.createdAt,
  };
}

export function serializeProject(doc: ProjectDoc): Project {
  return {
    _id: oid(doc._id),
    tenantId: oid(doc.tenantId),
    title: doc.title,
    logline: doc.logline,
    styleBible: doc.styleBible,
    createdAt: doc.createdAt,
  };
}

export function serializeEntity(doc: EntityDoc): Entity {
  return {
    _id: oid(doc._id),
    tenantId: oid(doc.tenantId),
    projectId: oid(doc.projectId),
    type: doc.type,
    name: doc.name,
    summary: doc.summary,
    tags: doc.tags,
    media: (doc as any).media,
    character: (doc as any).character,
    attributes: doc.attributes,
    relationships: doc.relationships,
    version: doc.version,
    audit: {
      createdBy: oid(doc.audit.createdBy),
      updatedBy: oid(doc.audit.updatedBy),
      updatedAt: doc.audit.updatedAt,
    },
  };
}

export function serializeStoryNode(doc: StoryNodeDoc): StoryNode {
  return {
    _id: oid(doc._id),
    tenantId: oid(doc.tenantId),
    projectId: oid(doc.projectId),
    nodeType: doc.nodeType,
    title: doc.title,
    synopsis: doc.synopsis,
    goals: doc.goals,
    hooks: doc.hooks,
    time: doc.time,
    participants: doc.participants,
    locations: doc.locations,
    worldStateDelta: doc.worldStateDelta,
    cinematicSettings: doc.cinematicSettings,
    versionHistory: doc.versionHistory,
    thumbnail: doc.thumbnail,
    parentNodeId: doc.parentNodeId,
    variationType: doc.variationType,
    version: doc.version,
    audit: {
      createdBy: oid(doc.audit.createdBy),
      updatedBy: oid(doc.audit.updatedBy),
      updatedAt: doc.audit.updatedAt,
    },
  };
}

export function serializeStoryEdge(doc: StoryEdgeDoc): StoryEdge {
  return {
    _id: oid(doc._id),
    tenantId: oid(doc.tenantId),
    projectId: oid(doc.projectId),
    fromNodeId: oid(doc.fromNodeId),
    toNodeId: oid(doc.toNodeId),
    edgeType: doc.edgeType,
    conditions: doc.conditions,
    notes: doc.notes,
  };
}

export function serializePromptPack(doc: PromptPackDoc): PromptPack {
  return {
    _id: oid(doc._id),
    tenantId: oid(doc.tenantId),
    projectId: oid(doc.projectId),
    nodeId: oid(doc.nodeId),
    target: doc.target,
    template: doc.template,
    shots: doc.shots,
    continuityNotes: doc.continuityNotes,
    createdAt: doc.createdAt,
    createdBy: oid(doc.createdBy),
  };
}
