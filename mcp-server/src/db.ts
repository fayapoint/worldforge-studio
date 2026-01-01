import { MongoClient } from "mongodb";

export type Env = {
  mongodbUri: string;
  mongodbDb: string;
};

export function getEnv(): Env {
  return {
    mongodbUri: process.env.MONGODB_URI ?? "mongodb://127.0.0.1:27017/worldforge",
    mongodbDb: process.env.MONGODB_DB ?? "worldforge",
  };
}

let clientPromise: Promise<MongoClient> | null = null;

export async function getMongoClient(): Promise<MongoClient> {
  if (!clientPromise) {
    const { mongodbUri } = getEnv();
    const client = new MongoClient(mongodbUri, { maxPoolSize: 10 });
    clientPromise = client.connect();
  }
  return clientPromise;
}

export async function getDb() {
  const { mongodbDb } = getEnv();
  const client = await getMongoClient();
  return client.db(mongodbDb);
}
