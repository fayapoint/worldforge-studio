import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { colTenants, colUsers } from "@/lib/collections";
import { ensureIndexes } from "@/lib/ensureIndexes";
import { ApiError, jsonCreated, jsonError } from "@/lib/http";
import { hashPassword, signToken } from "@/lib/auth";
import { registerSchema } from "@/lib/schemas";
import { ObjectId } from "mongodb";

export async function POST(req: NextRequest) {
  try {
    await ensureIndexes();

    const body = registerSchema.parse(await req.json());
    const db = await getDb();

    const now = new Date();

    const existingTenant = await colTenants(db).findOne({ name: body.tenantName });
    const tenantId = existingTenant ? existingTenant._id : new ObjectId();

    if (!existingTenant) {
      await colTenants(db).insertOne({
        _id: tenantId,
        name: body.tenantName,
        plan: "FREE",
        createdAt: now,
      });
    }

    const passwordHash = await hashPassword(body.password);

    const userId = new ObjectId();

    await colUsers(db).insertOne({
      _id: userId,
      tenantId,
      email: body.email.toLowerCase(),
      passwordHash,
      roles: ["ADMIN"],
      createdAt: now,
    });

    const token = await signToken({
      tenantId: tenantId.toHexString(),
      userId: userId.toHexString(),
      email: body.email.toLowerCase(),
      roles: ["ADMIN"],
    });

    return jsonCreated({ token });
  } catch (err: unknown) {
    const e = err as any;
    if (e?.code === 11000) {
      return jsonError(new ApiError("CONFLICT", 409, "Tenant or user already exists"));
    }
    return jsonError(err);
  }
}
