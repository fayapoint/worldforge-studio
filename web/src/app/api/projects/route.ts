import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { ensureIndexes } from "@/lib/ensureIndexes";
import { ApiError, jsonCreated, jsonError, jsonOk } from "@/lib/http";
import { requireAuth } from "@/lib/requestAuth";
import { requirePermission } from "@/lib/rbac";
import { colProjects } from "@/lib/collections";
import { serializeProject } from "@/lib/serializers";
import { projectCreateSchema } from "@/lib/schemas";

export async function GET(req: NextRequest) {
  try {
    await ensureIndexes();
    const auth = await requireAuth(req);
    requirePermission(auth.roles, "project:read");

    const db = await getDb();
    const items = await colProjects(db)
      .find({ tenantId: new ObjectId(auth.tenantId) })
      .sort({ createdAt: -1 })
      .toArray();

    return jsonOk({ items: items.map(serializeProject) });
  } catch (err: unknown) {
    return jsonError(err);
  }
}

export async function POST(req: NextRequest) {
  try {
    await ensureIndexes();
    const auth = await requireAuth(req);
    requirePermission(auth.roles, "project:write");

    const body = projectCreateSchema.parse(await req.json());

    const db = await getDb();
    const now = new Date();

    const projectId = new ObjectId();
    await colProjects(db).insertOne({
      _id: projectId,
      tenantId: new ObjectId(auth.tenantId),
      title: body.title,
      logline: body.logline,
      styleBible: body.styleBible ?? {},
      createdAt: now,
    });

    const doc = await colProjects(db).findOne({
      _id: projectId,
      tenantId: new ObjectId(auth.tenantId),
    });

    if (!doc) throw new ApiError("INTERNAL_ERROR", 500, "Failed to create project");

    return jsonCreated({ project: serializeProject(doc) });
  } catch (err: unknown) {
    return jsonError(err);
  }
}
