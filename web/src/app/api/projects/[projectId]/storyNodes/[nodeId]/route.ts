import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { ensureIndexes } from "@/lib/ensureIndexes";
import { ApiError, jsonError, jsonOk } from "@/lib/http";
import { requireAuth } from "@/lib/requestAuth";
import { requirePermission } from "@/lib/rbac";
import { colStoryNodes } from "@/lib/collections";
import { serializeStoryNode } from "@/lib/serializers";
import { storyNodePatchSchema } from "@/lib/schemas";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ projectId: string; nodeId: string }> },
) {
  try {
    await ensureIndexes();
    const auth = await requireAuth(req);
    requirePermission(auth.roles, "story:read");

    const { projectId, nodeId } = await ctx.params;

    const db = await getDb();
    const doc = await colStoryNodes(db).findOne({
      _id: new ObjectId(nodeId),
      tenantId: new ObjectId(auth.tenantId),
      projectId: new ObjectId(projectId),
    });

    if (!doc) throw new ApiError("NOT_FOUND", 404, "Story node not found");

    return jsonOk({ node: serializeStoryNode(doc) });
  } catch (err: unknown) {
    return jsonError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ projectId: string; nodeId: string }> },
) {
  try {
    await ensureIndexes();
    const auth = await requireAuth(req);
    requirePermission(auth.roles, "story:write");

    const { projectId, nodeId } = await ctx.params;
    const patch = storyNodePatchSchema.parse(await req.json());

    const db = await getDb();
    const now = new Date();

    const update: Record<string, unknown> = { ...patch };
    update["audit.updatedBy"] = new ObjectId(auth.userId);
    update["audit.updatedAt"] = now;

    const res = await colStoryNodes(db).findOneAndUpdate(
      {
        _id: new ObjectId(nodeId),
        tenantId: new ObjectId(auth.tenantId),
        projectId: new ObjectId(projectId),
      },
      { $set: update },
      { returnDocument: "after" },
    );

    if (!res) throw new ApiError("NOT_FOUND", 404, "Story node not found");

    return jsonOk({ node: serializeStoryNode(res) });
  } catch (err: unknown) {
    return jsonError(err);
  }
}
