import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { ensureIndexes } from "@/lib/ensureIndexes";
import { ApiError, jsonError, jsonOk } from "@/lib/http";
import { requireAuth } from "@/lib/requestAuth";
import { requirePermission } from "@/lib/rbac";
import { colProjects, colStoryNodes } from "@/lib/collections";
import { continuityCheckSchema } from "@/lib/schemas";
import {
  computePreAndPostStateForNode,
  continuityCheckForNode,
  type WorldState,
} from "@/lib/worldState";
import { serializeStoryNode } from "@/lib/serializers";

export async function POST(req: NextRequest, ctx: { params: Promise<{ projectId: string }> }) {
  try {
    await ensureIndexes();
    const auth = await requireAuth(req);
    requirePermission(auth.roles, "continuity:check");

    const { projectId } = await ctx.params;
    const body = continuityCheckSchema.parse(await req.json());

    const db = await getDb();

    const project = await colProjects(db).findOne({
      _id: new ObjectId(projectId),
      tenantId: new ObjectId(auth.tenantId),
    });
    if (!project) throw new ApiError("NOT_FOUND", 404, "Project not found");

    const nodeDocs = await colStoryNodes(db)
      .find({ tenantId: new ObjectId(auth.tenantId), projectId: new ObjectId(projectId) })
      .sort({ "time.order": 1 })
      .toArray();

    const nodes = nodeDocs.map(serializeStoryNode);

    let pre: WorldState;
    let post: WorldState;
    let node;

    try {
      ({ pre, post, node } = computePreAndPostStateForNode(nodes, body.nodeId));
    } catch {
      throw new ApiError("NOT_FOUND", 404, "Story node not found");
    }

    const issues = continuityCheckForNode(node, pre, post);

    return jsonOk({ issues, preState: pre, postState: post });
  } catch (err: unknown) {
    return jsonError(err);
  }
}
