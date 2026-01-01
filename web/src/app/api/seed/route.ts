import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { jsonOk, jsonError } from "@/lib/http";
import { colProjects } from "@/lib/collections";
import { seedTchProject } from "@/lib/seedData";

export async function POST(req: NextRequest) {
  try {
    const db = await getDb();

    // Check if already seeded
    const existingProject = await colProjects(db).findOne({ title: "They Can Hear — Project 01" });
    if (existingProject) {
      return jsonOk({ 
        message: "Already seeded", 
        projectId: existingProject._id.toHexString(),
        tenantId: existingProject.tenantId.toHexString()
      });
    }

    const result = await seedTchProject(db);
    
    return jsonOk({ 
      message: "Seed complete", 
      projectId: result.projectId,
      tenantId: result.tenantId,
      counts: result.counts
    });
  } catch (err: unknown) {
    return jsonError(err);
  }
}

export async function GET(req: NextRequest) {
  try {
    const db = await getDb();
    const existingProject = await colProjects(db).findOne({ title: "They Can Hear — Project 01" });
    
    if (existingProject) {
      return jsonOk({ 
        seeded: true, 
        projectId: existingProject._id.toHexString(),
        tenantId: existingProject.tenantId.toHexString()
      });
    }
    
    return jsonOk({ seeded: false });
  } catch (err: unknown) {
    return jsonError(err);
  }
}
