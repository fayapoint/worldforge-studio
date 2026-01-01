import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { ensureIndexes } from "@/lib/ensureIndexes";
import { ApiError, jsonCreated, jsonError, jsonOk } from "@/lib/http";
import { requireAuth } from "@/lib/requestAuth";
import { requirePermission } from "@/lib/rbac";
import { colProjects, colStoryEdges } from "@/lib/collections";
import { serializeStoryEdge } from "@/lib/serializers";
import { storyEdgeInputSchema } from "@/lib/schemas";

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

    const items = await colStoryEdges(db)
      .find({ tenantId: new ObjectId(auth.tenantId), projectId: new ObjectId(projectId) })
      .toArray();

    return jsonOk({ items: items.map(serializeStoryEdge) });
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
    const body = storyEdgeInputSchema.parse(await req.json());

    const db = await getDb();
    const project = await colProjects(db).findOne({
      _id: new ObjectId(projectId),
      tenantId: new ObjectId(auth.tenantId),
    });
    if (!project) throw new ApiError("NOT_FOUND", 404, "Project not found");

    const edgeId = new ObjectId();

    await colStoryEdges(db).insertOne({
      _id: edgeId,
      tenantId: new ObjectId(auth.tenantId),
      projectId: new ObjectId(projectId),
      fromNodeId: new ObjectId(body.fromNodeId),
      toNodeId: new ObjectId(body.toNodeId),
      edgeType: body.edgeType,
      conditions: body.conditions,
      notes: body.notes,
    });

    const doc = await colStoryEdges(db).findOne({
      _id: edgeId,
      tenantId: new ObjectId(auth.tenantId),
      projectId: new ObjectId(projectId),
    });

    if (!doc) throw new ApiError("INTERNAL_ERROR", 500, "Failed to create story edge");

    return jsonCreated({ edge: serializeStoryEdge(doc) });
  } catch (err: unknown) {
    return jsonError(err);
  }
}
