import type { WithId, ObjectId } from "mongodb";
import { asIdString } from "./ids";

export function idStr(id: ObjectId | string): string {
  return asIdString(id);
}

export function normalizeDoc<T extends Record<string, unknown>>(doc: WithId<T>) {
  const anyDoc = doc as unknown as { _id: ObjectId } & Record<string, unknown>;
  return { ...anyDoc, _id: asIdString(anyDoc._id) } as unknown as Omit<T, "_id"> & {
    _id: string;
  };
}
