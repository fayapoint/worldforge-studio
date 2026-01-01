import { getDb } from "./db";
import {
  colEntities,
  colProjects,
  colPromptPacks,
  colStoryEdges,
  colStoryNodes,
  colTenants,
  colUsers,
} from "./collections";

let ensured = false;

export async function ensureIndexes() {
  if (ensured) return;

  const db = await getDb();

  await colTenants(db).createIndex({ name: 1 }, { unique: true });
  await colUsers(db).createIndex({ tenantId: 1, email: 1 }, { unique: true });

  await colProjects(db).createIndex({ tenantId: 1, title: 1 });

  await colEntities(db).createIndex({ tenantId: 1, projectId: 1, type: 1, name: 1 });
  await colEntities(db).createIndex({
    name: "text",
    summary: "text",
    tags: "text",
    "character.fullName": "text",
    "character.aliases": "text",
    "character.role": "text",
  });

  await colStoryNodes(db).createIndex({ tenantId: 1, projectId: 1, "time.order": 1 });
  await colStoryNodes(db).createIndex({ title: "text", synopsis: "text", "hooks.hook": "text" });

  await colStoryEdges(db).createIndex({ tenantId: 1, projectId: 1, fromNodeId: 1 });
  await colStoryEdges(db).createIndex({ tenantId: 1, projectId: 1, toNodeId: 1 });

  await colPromptPacks(db).createIndex({ tenantId: 1, projectId: 1, nodeId: 1, createdAt: -1 });

  ensured = true;
}
