import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { ensureIndexes } from "@/lib/ensureIndexes";
import { ApiError, jsonError, jsonOk } from "@/lib/http";
import { requireAuth } from "@/lib/requestAuth";
import { requirePermission } from "@/lib/rbac";
import { colProjects, colStoryEdges, colStoryNodes } from "@/lib/collections";
import { serializeStoryEdge, serializeStoryNode } from "@/lib/serializers";

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

    const [nodes, edges] = await Promise.all([
      colStoryNodes(db)
        .find({ tenantId: new ObjectId(auth.tenantId), projectId: new ObjectId(projectId) })
        .sort({ "time.order": 1 })
        .toArray(),
      colStoryEdges(db)
        .find({ tenantId: new ObjectId(auth.tenantId), projectId: new ObjectId(projectId) })
        .toArray(),
    ]);

    return jsonOk({
      nodes: nodes.map(serializeStoryNode),
      edges: edges.map(serializeStoryEdge),
    });
  } catch (err: unknown) {
    return jsonError(err);
  }
}
