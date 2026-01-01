import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { ensureIndexes } from "@/lib/ensureIndexes";
import { ApiError, jsonError, jsonOk } from "@/lib/http";
import { requireAuth } from "@/lib/requestAuth";
import { requirePermission } from "@/lib/rbac";
import { colEntities, colProjects, colStoryNodes } from "@/lib/collections";
import { publishSchema } from "@/lib/schemas";
import { serializeEntity, serializeStoryNode } from "@/lib/serializers";

export async function POST(req: NextRequest, ctx: { params: Promise<{ projectId: string }> }) {
  try {
    await ensureIndexes();
    const auth = await requireAuth(req);
    requirePermission(auth.roles, "version:publish");

    const { projectId } = await ctx.params;
    const body = publishSchema.parse({ ...(await req.json()), projectId });

    const db = await getDb();

    const project = await colProjects(db).findOne({
      _id: new ObjectId(projectId),
      tenantId: new ObjectId(auth.tenantId),
    });
    if (!project) throw new ApiError("NOT_FOUND", 404, "Project not found");

    const now = new Date();

    if (body.objectType === "ENTITY") {
      const updated = await colEntities(db).findOneAndUpdate(
        {
          _id: new ObjectId(body.objectId),
          tenantId: new ObjectId(auth.tenantId),
          projectId: new ObjectId(projectId),
        },
        {
          $set: {
            "version.status": "PUBLISHED",
            "audit.updatedBy": new ObjectId(auth.userId),
            "audit.updatedAt": now,
          },
          $inc: { "version.number": 1 },
        },
        { returnDocument: "after" },
      );

      if (!updated) throw new ApiError("NOT_FOUND", 404, "Entity not found");

      return jsonOk({ object: serializeEntity(updated) });
    }

    const updated = await colStoryNodes(db).findOneAndUpdate(
      {
        _id: new ObjectId(body.objectId),
        tenantId: new ObjectId(auth.tenantId),
        projectId: new ObjectId(projectId),
      },
      {
        $set: {
          "version.status": "PUBLISHED",
          "audit.updatedBy": new ObjectId(auth.userId),
          "audit.updatedAt": now,
        },
        $inc: { "version.number": 1 },
      },
      { returnDocument: "after" },
    );

    if (!updated) throw new ApiError("NOT_FOUND", 404, "Story node not found");

    return jsonOk({ object: serializeStoryNode(updated) });
  } catch (err: unknown) {
    return jsonError(err);
  }
}
