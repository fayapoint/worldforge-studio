import type { ObjectId } from "mongodb";
import type { Entity, Project, PromptPack, StoryEdge, StoryNode, Tenant, User, CommunityWardrobeItem, CharacterWardrobe } from "./models";
import type { PromptLibraryItem, PromptPreset, PromptCollection } from "./promptLibrary";

export type CursorLike<T> = {
  sort(spec: Record<string, unknown>): CursorLike<T>;
  skip(n: number): CursorLike<T>;
  limit(n: number): CursorLike<T>;
  toArray(): Promise<T[]>;
};

export type CollectionLike<T> = {
  createIndex(keys: Record<string, unknown>, opts?: { unique?: boolean }): Promise<unknown>;
  findOne(filter: Record<string, unknown>): Promise<T | null>;
  insertOne(doc: T): Promise<unknown>;
  updateOne(filter: Record<string, unknown>, update: Record<string, unknown>): Promise<unknown>;
  deleteOne(filter: Record<string, unknown>): Promise<{ deletedCount: number }>;
  findOneAndUpdate(
    filter: Record<string, unknown>,
    update: Record<string, unknown>,
    opts?: { returnDocument?: "after" | "before" },
  ): Promise<T | null>;
  find(filter: Record<string, unknown>): CursorLike<T>;
  countDocuments?(filter: Record<string, unknown>): Promise<number>;
};

export type DbLike = {
  collection<T>(name: string): CollectionLike<T>;
};

export type TenantDoc = Omit<Tenant, "_id"> & { _id: ObjectId };
export type UserDoc = Omit<User, "_id" | "tenantId"> & { _id: ObjectId; tenantId: ObjectId };
export type ProjectDoc = Omit<Project, "_id" | "tenantId"> & { _id: ObjectId; tenantId: ObjectId };
export type EntityDoc =
  Omit<Entity, "_id" | "tenantId" | "projectId" | "audit"> & {
    _id: ObjectId;
    tenantId: ObjectId;
    projectId: ObjectId;
    audit: { createdBy: ObjectId; updatedBy: ObjectId; updatedAt: Date };
  };
export type StoryNodeDoc =
  Omit<StoryNode, "_id" | "tenantId" | "projectId" | "audit"> & {
    _id: ObjectId;
    tenantId: ObjectId;
    projectId: ObjectId;
    audit: { createdBy: ObjectId; updatedBy: ObjectId; updatedAt: Date };
  };
export type StoryEdgeDoc =
  Omit<StoryEdge, "_id" | "tenantId" | "projectId" | "fromNodeId" | "toNodeId"> & {
    _id: ObjectId;
    tenantId: ObjectId;
    projectId: ObjectId;
    fromNodeId: ObjectId;
    toNodeId: ObjectId;
  };
export type PromptPackDoc =
  Omit<PromptPack, "_id" | "tenantId" | "projectId" | "nodeId" | "createdBy"> & {
    _id: ObjectId;
    tenantId: ObjectId;
    projectId: ObjectId;
    nodeId: ObjectId;
    createdBy: ObjectId;
  };

export type CommunityWardrobeItemDoc =
  Omit<CommunityWardrobeItem, "_id" | "createdBy" | "updatedBy" | "characterEntityId" | "restrictedToCharacters"> & {
    _id: ObjectId;
    createdBy: ObjectId;
    updatedBy: ObjectId;
    characterEntityId?: ObjectId;
    restrictedToCharacters?: ObjectId[];
  };

export type CharacterWardrobeDoc =
  Omit<CharacterWardrobe, "_id" | "entityId"> & {
    _id: ObjectId;
    entityId: ObjectId;
  };

export function colTenants(db: DbLike): CollectionLike<TenantDoc> {
  return db.collection<TenantDoc>("tenants");
}

export function colUsers(db: DbLike): CollectionLike<UserDoc> {
  return db.collection<UserDoc>("users");
}

export function colProjects(db: DbLike): CollectionLike<ProjectDoc> {
  return db.collection<ProjectDoc>("projects");
}

export function colEntities(db: DbLike): CollectionLike<EntityDoc> {
  return db.collection<EntityDoc>("entities");
}

export function colStoryNodes(db: DbLike): CollectionLike<StoryNodeDoc> {
  return db.collection<StoryNodeDoc>("storyNodes");
}

export function colStoryEdges(db: DbLike): CollectionLike<StoryEdgeDoc> {
  return db.collection<StoryEdgeDoc>("storyEdges");
}

export function colPromptPacks(db: DbLike): CollectionLike<PromptPackDoc> {
  return db.collection<PromptPackDoc>("promptPacks");
}

export function colCommunityWardrobe(db: DbLike): CollectionLike<CommunityWardrobeItemDoc> {
  return db.collection<CommunityWardrobeItemDoc>("communityWardrobe");
}

export function colCharacterWardrobes(db: DbLike): CollectionLike<CharacterWardrobeDoc> {
  return db.collection<CharacterWardrobeDoc>("characterWardrobes");
}

// =====================================================
// PROMPT LIBRARY COLLECTIONS
// =====================================================

export type PromptLibraryItemDoc =
  Omit<PromptLibraryItem, "_id" | "tenantId" | "projectId" | "createdBy"> & {
    _id: ObjectId;
    tenantId?: ObjectId;
    projectId?: ObjectId;
    createdBy: ObjectId;
  };

export type PromptPresetDoc =
  Omit<PromptPreset, "_id" | "tenantId" | "projectId" | "createdBy"> & {
    _id: ObjectId;
    tenantId?: ObjectId;
    projectId?: ObjectId;
    createdBy: ObjectId;
  };

export type PromptCollectionDoc =
  Omit<PromptCollection, "_id" | "tenantId" | "projectId" | "createdBy"> & {
    _id: ObjectId;
    tenantId?: ObjectId;
    projectId?: ObjectId;
    createdBy: ObjectId;
  };

export function colPromptLibrary(db: DbLike): CollectionLike<PromptLibraryItemDoc> {
  return db.collection<PromptLibraryItemDoc>("promptLibrary");
}

export function colPromptPresets(db: DbLike): CollectionLike<PromptPresetDoc> {
  return db.collection<PromptPresetDoc>("promptPresets");
}

export function colPromptCollections(db: DbLike): CollectionLike<PromptCollectionDoc> {
  return db.collection<PromptCollectionDoc>("promptCollections");
}
