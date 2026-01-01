import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { ensureIndexes } from "@/lib/ensureIndexes";
import { ApiError, jsonCreated, jsonError, jsonOk } from "@/lib/http";
import { requireAuth } from "@/lib/requestAuth";
import { requirePermission } from "@/lib/rbac";
import { colProjects, colStoryNodes } from "@/lib/collections";
import { serializeStoryNode } from "@/lib/serializers";
import { storyNodeInputSchema } from "@/lib/schemas";

export async function GET(req: NextRequest, ctx: { params: Promise<{ projectId: string }> }) {
  try {
    await ensureIndexes();
    const auth = await requireAuth(req);
    requirePermission(auth.roles, "story:read");

    const { projectId } = await ctx.params;

    const db = await getDb();
    const project = await colProjects(db).findOne({
      _id: new ObjectId(projectId),
      tenantId: new ObjectId(auth.tenantId),
    });
    if (!project) throw new ApiError("NOT_FOUND", 404, "Project not found");

    const items = await colStoryNodes(db)
      .find({ tenantId: new ObjectId(auth.tenantId), projectId: new ObjectId(projectId) })
      .sort({ "time.order": 1 })
      .toArray();

    return jsonOk({ items: items.map(serializeStoryNode) });
  } catch (err: unknown) {
    return jsonError(err);
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ projectId: string }> }) {
  try {
    await ensureIndexes();
    const auth = await requireAuth(req);
    requirePermission(auth.roles, "story:write");

    const { projectId } = await ctx.params;
    const body = storyNodeInputSchema.parse(await req.json());

    const db = await getDb();
    const project = await colProjects(db).findOne({
      _id: new ObjectId(projectId),
      tenantId: new ObjectId(auth.tenantId),
    });
    if (!project) throw new ApiError("NOT_FOUND", 404, "Project not found");

    const now = new Date();
    const nodeId = new ObjectId();

    await colStoryNodes(db).insertOne({
      _id: nodeId,
      tenantId: new ObjectId(auth.tenantId),
      projectId: new ObjectId(projectId),
      nodeType: body.nodeType,
      title: body.title,
      synopsis: body.synopsis,
      goals: body.goals,
      hooks: body.hooks,
      time: body.time,
      participants: body.participants,
      locations: body.locations,
      worldStateDelta: body.worldStateDelta,
      version: { status: "DRAFT", number: 1 },
      audit: {
        createdBy: new ObjectId(auth.userId),
        updatedBy: new ObjectId(auth.userId),
        updatedAt: now,
      },
    });

    const doc = await colStoryNodes(db).findOne({
      _id: nodeId,
      tenantId: new ObjectId(auth.tenantId),
      projectId: new ObjectId(projectId),
    });

    if (!doc) throw new ApiError("INTERNAL_ERROR", 500, "Failed to create story node");

    return jsonCreated({ node: serializeStoryNode(doc) });
  } catch (err: unknown) {
    return jsonError(err);
  }
}
