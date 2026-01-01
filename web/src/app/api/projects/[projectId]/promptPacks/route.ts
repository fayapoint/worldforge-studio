import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { ensureIndexes } from "@/lib/ensureIndexes";
import { ApiError, jsonError, jsonOk } from "@/lib/http";
import { requireAuth } from "@/lib/requestAuth";
import { requirePermission } from "@/lib/rbac";
import { colProjects, colPromptPacks } from "@/lib/collections";
import { serializePromptPack } from "@/lib/serializers";

export async function GET(req: NextRequest, ctx: { params: Promise<{ projectId: string }> }) {
  try {
    await ensureIndexes();
    const auth = await requireAuth(req);
    requirePermission(auth.roles, "export:read");

    const { projectId } = await ctx.params;
    const url = new URL(req.url);
    const nodeId = url.searchParams.get("nodeId");

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
    if (nodeId) filter.nodeId = new ObjectId(nodeId);

    const items = await colPromptPacks(db).find(filter).sort({ createdAt: -1 }).limit(50).toArray();

    return jsonOk({ items: items.map(serializePromptPack) });
  } catch (err: unknown) {
    return jsonError(err);
  }
}
