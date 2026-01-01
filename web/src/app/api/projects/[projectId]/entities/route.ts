import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { ensureIndexes } from "@/lib/ensureIndexes";
import { ApiError, jsonCreated, jsonError, jsonOk } from "@/lib/http";
import { requireAuth } from "@/lib/requestAuth";
import { requirePermission } from "@/lib/rbac";
import { colEntities, colProjects } from "@/lib/collections";
import { serializeEntity } from "@/lib/serializers";
import { entityInputSchema, entityTypeSchema } from "@/lib/schemas";

export async function GET(req: NextRequest, ctx: { params: Promise<{ projectId: string }> }) {
  try {
    await ensureIndexes();
    const auth = await requireAuth(req);
    requirePermission(auth.roles, "entity:read");

    const { projectId } = await ctx.params;

    const url = new URL(req.url);
    const query = url.searchParams.get("query") ?? "";
    const typeParam = url.searchParams.get("type");
    const limit = Math.min(Number(url.searchParams.get("limit") ?? "50"), 200);
    const offset = Math.max(Number(url.searchParams.get("offset") ?? "0"), 0);

    const db = await getDb();
    const project = await colProjects(db).findOne({
      _id: new ObjectId(projectId),
      tenantId: new ObjectId(auth.tenantId),
    });
    if (!project) throw new ApiError("NOT_FOUND", 404, "Project not found");

    const filter: Record<string, unknown> = {
      tenantId: new ObjectId(auth.tenantId),
      projectId: new ObjectId(projectId),
    };

    if (typeParam) {
      const type = entityTypeSchema.parse(typeParam);
      filter.type = type;
    }

    if (query.trim()) {
      filter.$text = { $search: query.trim() };
    }

    const items = await colEntities(db)
      .find(filter)
      .sort(query.trim() ? { score: { $meta: "textScore" } } : { "audit.updatedAt": -1 })
      .skip(offset)
      .limit(limit)
      .toArray();

    return jsonOk({ items: items.map(serializeEntity) });
  } catch (err: unknown) {
    return jsonError(err);
  }
}

export async function POST(req: NextRequest, ctx: { params: Promise<{ projectId: string }> }) {
  try {
    await ensureIndexes();
    const auth = await requireAuth(req);
    requirePermission(auth.roles, "entity:write");

    const { projectId } = await ctx.params;
    const body = entityInputSchema.parse(await req.json());

    const db = await getDb();
    const project = await colProjects(db).findOne({
      _id: new ObjectId(projectId),
      tenantId: new ObjectId(auth.tenantId),
    });
    if (!project) throw new ApiError("NOT_FOUND", 404, "Project not found");

    const now = new Date();
    const entityId = new ObjectId();

    await colEntities(db).insertOne({
      _id: entityId,
      tenantId: new ObjectId(auth.tenantId),
      projectId: new ObjectId(projectId),
      type: body.type,
      name: body.name,
      summary: body.summary,
      tags: body.tags,
      media: body.media,
      character: body.character,
      attributes: body.attributes,
      relationships: body.relationships,
      version: { status: "DRAFT", number: 1 },
      audit: {
        createdBy: new ObjectId(auth.userId),
        updatedBy: new ObjectId(auth.userId),
        updatedAt: now,
      },
    });

    const doc = await colEntities(db).findOne({
      _id: entityId,
      tenantId: new ObjectId(auth.tenantId),
      projectId: new ObjectId(projectId),
    });

    if (!doc) throw new ApiError("INTERNAL_ERROR", 500, "Failed to create entity");

    return jsonCreated({ entity: serializeEntity(doc) });
  } catch (err: unknown) {
    return jsonError(err);
  }
}
