import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { z } from "zod";
import { getDb } from "@/lib/db";
import { ensureIndexes } from "@/lib/ensureIndexes";
import { ApiError, jsonError, jsonOk } from "@/lib/http";
import { requireAuth } from "@/lib/requestAuth";
import { requirePermission } from "@/lib/rbac";
import { colEntities } from "@/lib/collections";
import { serializeEntity } from "@/lib/serializers";

const linkSchema = z.object({
  toEntityId: z.string().min(1),
  relType: z.string().min(1),
  note: z.string().optional(),
});

export async function POST(
  req: NextRequest,
  ctx: { params: Promise<{ projectId: string; entityId: string }> },
) {
  try {
    await ensureIndexes();
    const auth = await requireAuth(req);
    requirePermission(auth.roles, "entity:write");

    const { projectId, entityId } = await ctx.params;
    const body = linkSchema.parse(await req.json());

    const db = await getDb();
    const now = new Date();

    const updateRes = await colEntities(db).findOneAndUpdate(
      {
        _id: new ObjectId(entityId),
        tenantId: new ObjectId(auth.tenantId),
        projectId: new ObjectId(projectId),
      },
      {
        $push: {
          relationships: {
            toEntityId: body.toEntityId,
            relType: body.relType,
            note: body.note,
          },
        },
        $set: {
          "audit.updatedBy": new ObjectId(auth.userId),
          "audit.updatedAt": now,
        },
      },
      { returnDocument: "after" },
    );

    if (!updateRes) throw new ApiError("NOT_FOUND", 404, "Entity not found");

    return jsonOk({ entity: serializeEntity(updateRes) });
  } catch (err: unknown) {
    return jsonError(err);
  }
}
