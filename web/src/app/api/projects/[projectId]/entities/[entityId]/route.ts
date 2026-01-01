import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { ensureIndexes } from "@/lib/ensureIndexes";
import { ApiError, jsonError, jsonOk } from "@/lib/http";
import { requireAuth } from "@/lib/requestAuth";
import { requirePermission } from "@/lib/rbac";
import { colEntities } from "@/lib/collections";
import { serializeEntity } from "@/lib/serializers";
import { entityPatchSchema } from "@/lib/schemas";

export async function GET(
  req: NextRequest,
  ctx: { params: Promise<{ projectId: string; entityId: string }> },
) {
  try {
    await ensureIndexes();
    const auth = await requireAuth(req);
    requirePermission(auth.roles, "entity:read");

    const { projectId, entityId } = await ctx.params;

    const db = await getDb();
    const doc = await colEntities(db).findOne({
      _id: new ObjectId(entityId),
      tenantId: new ObjectId(auth.tenantId),
      projectId: new ObjectId(projectId),
    });

    if (!doc) throw new ApiError("NOT_FOUND", 404, "Entity not found");

    return jsonOk({ entity: serializeEntity(doc) });
  } catch (err: unknown) {
    return jsonError(err);
  }
}

export async function PATCH(
  req: NextRequest,
  ctx: { params: Promise<{ projectId: string; entityId: string }> },
) {
  try {
    await ensureIndexes();
    const auth = await requireAuth(req);
    requirePermission(auth.roles, "entity:write");

    const { projectId, entityId } = await ctx.params;
    const patch = entityPatchSchema.parse(await req.json());

    const db = await getDb();
    const now = new Date();

    const update: Record<string, unknown> = { ...patch };
    update["audit.updatedBy"] = new ObjectId(auth.userId);
    update["audit.updatedAt"] = now;

    const res = await colEntities(db).findOneAndUpdate(
      {
        _id: new ObjectId(entityId),
        tenantId: new ObjectId(auth.tenantId),
        projectId: new ObjectId(projectId),
      },
      { $set: update },
      { returnDocument: "after" },
    );

    if (!res) throw new ApiError("NOT_FOUND", 404, "Entity not found");

    return jsonOk({ entity: serializeEntity(res) });
  } catch (err: unknown) {
    return jsonError(err);
  }
}

export async function DELETE(
  req: NextRequest,
  ctx: { params: Promise<{ projectId: string; entityId: string }> },
) {
  try {
    await ensureIndexes();
    const auth = await requireAuth(req);
    requirePermission(auth.roles, "entity:write");

    const { projectId, entityId } = await ctx.params;

    const db = await getDb();
    const result = await colEntities(db).deleteOne({
      _id: new ObjectId(entityId),
      tenantId: new ObjectId(auth.tenantId),
      projectId: new ObjectId(projectId),
    });

    if (result.deletedCount === 0) {
      throw new ApiError("NOT_FOUND", 404, "Entity not found");
    }

    return jsonOk({ deleted: true });
  } catch (err: unknown) {
    return jsonError(err);
  }
}
