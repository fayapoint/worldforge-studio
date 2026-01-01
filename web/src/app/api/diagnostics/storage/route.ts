import { NextRequest } from "next/server";
import { ObjectId } from "mongodb";
import { getDb } from "@/lib/db";
import { ensureIndexes } from "@/lib/ensureIndexes";
import { jsonError, jsonOk } from "@/lib/http";
import { requireAuth } from "@/lib/requestAuth";
import { colEntities, colProjects, colStoryEdges, colStoryNodes } from "@/lib/collections";
import { getEnv } from "@/lib/env";

function isCloudinaryUrl(u: unknown): boolean {
  return typeof u === "string" && /res\.cloudinary\.com\//i.test(u);
}

async function safeCount<T>(col: any, filter: Record<string, unknown>): Promise<number> {
  if (typeof col.countDocuments === "function") {
    return await col.countDocuments(filter);
  }
  const items = await col.find(filter).limit(5000).toArray();
  return items.length;
}

export async function GET(req: NextRequest) {
  try {
    await ensureIndexes();

    const isDev = process.env.NODE_ENV !== "production";
    let tenantId: string | null = null;

    if (!isDev) {
      const auth = await requireAuth(req);
      tenantId = auth.tenantId;
    } else {
      try {
        const auth = await requireAuth(req);
        tenantId = auth.tenantId;
      } catch {
        tenantId = null;
      }
    }

    const db = await getDb();
    const driver = typeof (db as any).listCollections === "function" ? "mongo" : "in_memory";

    const { mongodbDb, cloudinaryUrl } = getEnv();

    const idFilter: Record<string, unknown> = {};
    if (tenantId) idFilter.tenantId = new ObjectId(tenantId);

    const projects = await colProjects(db)
      .find(idFilter)
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    const projectSummaries = [] as {
      projectId: string;
      title: string;
      entities: number;
      storyNodes: number;
      storyEdges: number;
      entitiesWithMedia: number;
      cloudinaryOnly: number;
      missingPublicId: number;
    }[];

    for (const p of projects as any[]) {
      const projectId = String(p._id);
      const tenantObj = tenantId ? new ObjectId(tenantId) : p.tenantId;

      const baseFilter = {
        tenantId: tenantObj,
        projectId: p._id,
      };

      const entitiesCount = await safeCount(colEntities(db), baseFilter);
      const storyNodesCount = await safeCount(colStoryNodes(db), baseFilter);
      const storyEdgesCount = await safeCount(colStoryEdges(db), baseFilter);

      const entsWithMedia = await colEntities(db)
        .find(
          {
            ...baseFilter,
            $or: [
              { "media.thumbnailUrl": { $exists: true, $ne: null } },
              { "media.faceUrl": { $exists: true, $ne: null } },
              { "media.poseUrls.0": { $exists: true } },
              { "media.referenceUrls.0": { $exists: true } },
            ],
          },
        )
        .limit(200)
        .toArray();

      let cloudinaryOnly = 0;
      let missingPublicId = 0;

      for (const e of entsWithMedia as any[]) {
        const m = e.media ?? {};
        const pairs: Array<{ url?: unknown; pid?: unknown }> = [];
        if (m.thumbnailUrl) pairs.push({ url: m.thumbnailUrl, pid: m.thumbnailPublicId });
        if (m.faceUrl) pairs.push({ url: m.faceUrl, pid: m.facePublicId });
        if (Array.isArray(m.poseUrls)) {
          for (let i = 0; i < m.poseUrls.length; i++) pairs.push({ url: m.poseUrls[i], pid: m.posePublicIds?.[i] });
        }
        if (Array.isArray(m.referenceUrls)) {
          for (let i = 0; i < m.referenceUrls.length; i++) pairs.push({ url: m.referenceUrls[i], pid: m.referencePublicIds?.[i] });
        }

        const allCloud = pairs.every((x) => isCloudinaryUrl(x.url));
        const miss = pairs.some((x) => !x.pid);
        if (allCloud) cloudinaryOnly++;
        if (miss) missingPublicId++;
      }

      projectSummaries.push({
        projectId,
        title: String(p.title ?? ""),
        entities: entitiesCount,
        storyNodes: storyNodesCount,
        storyEdges: storyEdgesCount,
        entitiesWithMedia: entsWithMedia.length,
        cloudinaryOnly,
        missingPublicId,
      });
    }

    return jsonOk({
      ok: true,
      driver,
      mongodbDb,
      tenantScoped: Boolean(tenantId),
      projectCount: projectSummaries.length,
      cloudinaryConfigured: Boolean(cloudinaryUrl),
      projects: projectSummaries,
    });
  } catch (err: unknown) {
    return jsonError(err);
  }
}
