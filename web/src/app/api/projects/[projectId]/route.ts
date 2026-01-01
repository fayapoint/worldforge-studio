import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { ensureIndexes } from "@/lib/ensureIndexes";
import { ApiError, jsonError, jsonOk } from "@/lib/http";
import { requireAuth } from "@/lib/requestAuth";
import { requirePermission } from "@/lib/rbac";
import { colProjects, colEntities, colStoryNodes, colStoryEdges } from "@/lib/collections";
import { serializeProject } from "@/lib/serializers";
import { z } from "zod";

const projectUpdateSchema = z.object({
  title: z.string().min(1).max(200).optional(),
  logline: z.string().max(2000).optional(),
  styleBible: z.record(z.string(), z.unknown()).optional(),
});

export async function GET(req: NextRequest, ctx: { params: Promise<{ projectId: string }> }) {
  try {
    await ensureIndexes();
    const auth = await requireAuth(req);
    requirePermission(auth.roles, "project:read");

    const { projectId } = await ctx.params;

    const db = await getDb();
    const doc = await colProjects(db).findOne({
      _id: new ObjectId(projectId),
      tenantId: new ObjectId(auth.tenantId),
    });

    if (!doc) throw new ApiError("NOT_FOUND", 404, "Project not found");

    return jsonOk({ project: serializeProject(doc) });
  } catch (err: unknown) {
    return jsonError(err);
  }
}

export async function PATCH(req: NextRequest, ctx: { params: Promise<{ projectId: string }> }) {
  try {
    await ensureIndexes();
    const auth = await requireAuth(req);
    requirePermission(auth.roles, "project:write");

    const { projectId } = await ctx.params;
    const body = projectUpdateSchema.parse(await req.json());

    const db = await getDb();
    const oid = new ObjectId(projectId);
    const tenantOid = new ObjectId(auth.tenantId);

    const existing = await colProjects(db).findOne({ _id: oid, tenantId: tenantOid });
    if (!existing) throw new ApiError("NOT_FOUND", 404, "Project not found");

    const updates: Record<string, unknown> = {};
    if (body.title !== undefined) updates.title = body.title;
    if (body.logline !== undefined) updates.logline = body.logline;
    if (body.styleBible !== undefined) updates.styleBible = body.styleBible;

    if (Object.keys(updates).length > 0) {
      await colProjects(db).updateOne({ _id: oid, tenantId: tenantOid }, { $set: updates });
    }

    const doc = await colProjects(db).findOne({ _id: oid, tenantId: tenantOid });
    if (!doc) throw new ApiError("NOT_FOUND", 404, "Project not found");

    return jsonOk({ project: serializeProject(doc) });
  } catch (err: unknown) {
    return jsonError(err);
  }
}

export async function DELETE(req: NextRequest, ctx: { params: Promise<{ projectId: string }> }) {
  try {
    await ensureIndexes();
    const auth = await requireAuth(req);
    requirePermission(auth.roles, "project:write");

    const { projectId } = await ctx.params;
    const db = await getDb();
    const oid = new ObjectId(projectId);
    const tenantOid = new ObjectId(auth.tenantId);

    const existing = await colProjects(db).findOne({ _id: oid, tenantId: tenantOid });
    if (!existing) throw new ApiError("NOT_FOUND", 404, "Project not found");

    // Delete all related data using any-cast for optional methods
    const entitiesCol = colEntities(db) as any;
    const nodesCol = colStoryNodes(db) as any;
    const edgesCol = colStoryEdges(db) as any;
    const projectsCol = colProjects(db) as any;
    
    if (typeof entitiesCol.deleteMany === "function") {
      await entitiesCol.deleteMany({ projectId: oid, tenantId: tenantOid });
    }
    if (typeof nodesCol.deleteMany === "function") {
      await nodesCol.deleteMany({ projectId: oid, tenantId: tenantOid });
    }
    if (typeof edgesCol.deleteMany === "function") {
      await edgesCol.deleteMany({ projectId: oid, tenantId: tenantOid });
    }
    if (typeof projectsCol.deleteOne === "function") {
      await projectsCol.deleteOne({ _id: oid, tenantId: tenantOid });
    }

    return jsonOk({ deleted: true });
  } catch (err: unknown) {
    return jsonError(err);
  }
}
