import { NextRequest } from "next/server";
import { getDb } from "@/lib/db";
import { colTenants, colUsers } from "@/lib/collections";
import { ensureIndexes } from "@/lib/ensureIndexes";
import { ApiError, jsonOk, jsonError } from "@/lib/http";
import { signToken, verifyPassword } from "@/lib/auth";
import { loginSchema } from "@/lib/schemas";

export async function POST(req: NextRequest) {
  try {
    await ensureIndexes();

    const body = loginSchema.parse(await req.json());
    const db = await getDb();

    const tenant = await colTenants(db).findOne({ name: body.tenantName });
    if (!tenant) {
      throw new ApiError("UNAUTHORIZED", 401, "Invalid credentials");
    }

    const user = await colUsers(db).findOne({
      tenantId: tenant._id,
      email: body.email.toLowerCase(),
    });

    if (!user) {
      throw new ApiError("UNAUTHORIZED", 401, "Invalid credentials");
    }

    const ok = await verifyPassword(body.password, user.passwordHash);
    if (!ok) {
      throw new ApiError("UNAUTHORIZED", 401, "Invalid credentials");
    }

    const token = await signToken({
      tenantId: tenant._id.toHexString(),
      userId: user._id.toHexString(),
      email: user.email,
      roles: user.roles,
    });

    return jsonOk({ token });
  } catch (err: unknown) {
    return jsonError(err);
  }
}
