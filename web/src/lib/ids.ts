import { ObjectId } from "mongodb";

export function toObjectId(id: string): ObjectId {
  if (!ObjectId.isValid(id)) {
    throw new Error("Invalid ObjectId");
  }
  return new ObjectId(id);
}

export function asIdString(id: ObjectId | string): string {
  return typeof id === "string" ? id : id.toHexString();
}
