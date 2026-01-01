import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { ensureIndexes } from "@/lib/ensureIndexes";
import { ApiError, jsonCreated, jsonError } from "@/lib/http";
import { requireAuth } from "@/lib/requestAuth";
import { requirePermission } from "@/lib/rbac";
import { colEntities, colProjects, colPromptPacks, colStoryNodes } from "@/lib/collections";
import { promptComposeSchema } from "@/lib/schemas";
import { serializeEntity, serializeProject, serializePromptPack, serializeStoryNode } from "@/lib/serializers";
import { computePreAndPostStateForNode } from "@/lib/worldState";
import { composePromptPack } from "@/lib/promptComposer";

export async function POST(req: NextRequest, ctx: { params: Promise<{ projectId: string }> }) {
  try {
    await ensureIndexes();
    const auth = await requireAuth(req);
    requirePermission(auth.roles, "prompt:compose");

    const { projectId } = await ctx.params;
    const body = promptComposeSchema.parse(await req.json());

    const db = await getDb();

    const projectDoc = await colProjects(db).findOne({
      _id: new ObjectId(projectId),
      tenantId: new ObjectId(auth.tenantId),
    });
    if (!projectDoc) throw new ApiError("NOT_FOUND", 404, "Project not found");

    const nodeDocs = await colStoryNodes(db)
      .find({ tenantId: new ObjectId(auth.tenantId), projectId: new ObjectId(projectId) })
      .sort({ "time.order": 1 })
      .toArray();

    const nodes = nodeDocs.map(serializeStoryNode);
    const { pre, node } = computePreAndPostStateForNode(nodes, body.nodeId);

    const project = serializeProject(projectDoc);

    const participantIds = (node.participants ?? []).map((p) => p.entityId);
    const locationIds = node.locations ?? [];

    const entityDocs = await colEntities(db)
      .find({
        tenantId: new ObjectId(auth.tenantId),
        projectId: new ObjectId(projectId),
        _id: { $in: [...participantIds, ...locationIds].map((id) => new ObjectId(id)) },
      })
      .toArray();

    const entities = entityDocs.map(serializeEntity);

    const characters = entities.filter((e) => participantIds.includes(e._id));
    const locations = entities.filter((e) => locationIds.includes(e._id));

    const pack = composePromptPack({
      tenantId: auth.tenantId,
      project,
      node,
      characters,
      locations,
      worldState: pre,
      createdBy: auth.userId,
    });

    const packId = new ObjectId();

    await colPromptPacks(db).insertOne({
      _id: packId,
      tenantId: new ObjectId(auth.tenantId),
      projectId: new ObjectId(projectId),
      nodeId: new ObjectId(node._id),
      target: pack.target,
      template: pack.template,
      shots: pack.shots,
      continuityNotes: pack.continuityNotes,
      createdAt: pack.createdAt,
      createdBy: new ObjectId(auth.userId),
    });

    const saved = await colPromptPacks(db).findOne({
      _id: packId,
      tenantId: new ObjectId(auth.tenantId),
      projectId: new ObjectId(projectId),
    });

    if (!saved) throw new ApiError("INTERNAL_ERROR", 500, "Failed to save prompt pack");

    return jsonCreated({ promptPack: serializePromptPack(saved) });
  } catch (err: unknown) {
    return jsonError(err);
  }
}
