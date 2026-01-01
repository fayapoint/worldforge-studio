import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { ensureIndexes } from "@/lib/ensureIndexes";
import { ApiError, jsonError, jsonOk } from "@/lib/http";
import { requireAuth } from "@/lib/requestAuth";
import { requirePermission } from "@/lib/rbac";
import { colStoryEdges } from "@/lib/collections";
import { serializeStoryEdge } from "@/lib/serializers";
import { storyEdgePatchSchema } from "@/lib/schemas";

export async function GET(req: NextRequest, ctx: { params: Promise<{ projectId: string; edgeId: string }> }) {
  try {
    await ensureIndexes();
    const auth = await requireAuth(req);
    requirePermission(auth.roles, "story:read");

    const { projectId, edgeId } = await ctx.params;

    const db = await getDb();
    const doc = await colStoryEdges(db).findOne({
      _id: new ObjectId(edgeId),
      tenantId: new ObjectId(auth.tenantId),
      projectId: new ObjectId(projectId),
    });

    if (!doc) throw new ApiError("NOT_FOUND", 404, "Story edge not found");

    return jsonOk({ edge: serializeStoryEdge(doc) });
  } catch (err: unknown) {
    return jsonError(err);
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ projectId: string; edgeId: string }> }) {
  try {
    await ensureIndexes();
    const auth = await requireAuth(req);
    requirePermission(auth.roles, "story:write");

    const { projectId, edgeId } = await ctx.params;
    const patch = storyEdgePatchSchema.parse(await req.json());

    const db = await getDb();

    const update: Record<string, unknown> = {};

    if (patch.fromNodeId !== undefined) update.fromNodeId = new ObjectId(patch.fromNodeId);
    if (patch.toNodeId !== undefined) update.toNodeId = new ObjectId(patch.toNodeId);
    if (patch.edgeType !== undefined) update.edgeType = patch.edgeType;
    if (patch.conditions !== undefined) update.conditions = patch.conditions;
    if (patch.notes !== undefined) update.notes = patch.notes;

    const res = await colStoryEdges(db).findOneAndUpdate(
      {
        _id: new ObjectId(edgeId),
        tenantId: new ObjectId(auth.tenantId),
        projectId: new ObjectId(projectId),
      },
      { $set: update },
      { returnDocument: "after" },
    );

    if (!res) throw new ApiError("NOT_FOUND", 404, "Story edge not found");

    return jsonOk({ edge: serializeStoryEdge(res) });
  } catch (err: unknown) {
    return jsonError(err);
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ projectId: string; edgeId: string }> }) {
  try {
    await ensureIndexes();
    const auth = await requireAuth(req);
    requirePermission(auth.roles, "story:write");

    const { projectId, edgeId } = await ctx.params;

    const db = await getDb();
    const col = colStoryEdges(db);

    const del = await col.deleteOne?.({
      _id: new ObjectId(edgeId),
      tenantId: new ObjectId(auth.tenantId),
      projectId: new ObjectId(projectId),
    });

    if (!del) throw new ApiError("INTERNAL_ERROR", 500, "Delete not supported by DB driver");
    if (del.deletedCount === 0) throw new ApiError("NOT_FOUND", 404, "Story edge not found");

    return jsonOk({ ok: true });
  } catch (err: unknown) {
    return jsonError(err);
  }
}
