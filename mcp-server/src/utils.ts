import { ObjectId } from "mongodb";

export function toObjectId(id: string): ObjectId {
  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid ObjectId");
  }
  return new ObjectId(id);
}

export function idStr(id: ObjectId): string {
  return id.toHexString();
}

export function toolOk(output: unknown) {
  return {
    content: [{ type: "text" as const, text: JSON.stringify(output) }],
    structuredContent: output,
  };
}

export function toolError(code: string, message: string, details?: unknown) {
  const output = { error: { code, message, details } };
  return {
    content: [{ type: "text" as const, text: JSON.stringify(output) }],
    structuredContent: output,
    isError: true,
  };
}
