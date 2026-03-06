import { MongoClient, Db } from "mongodb";
import { ensureIndexes } from "./indexes";

const MONGODB_URI = process.env.MONGODB_URI || "mongodb://localhost:27017/collab-editor";

let client: MongoClient | null = null;
let db: Db | null = null;
let indexesEnsured = false;

export async function getDb(): Promise<Db> {
  if (db) return db;

  client = new MongoClient(MONGODB_URI);
  await client.connect();
  db = client.db();

  // Ensure indexes on first connection (non-blocking for subsequent calls)
  if (!indexesEnsured) {
    indexesEnsured = true;
    ensureIndexes().catch((err) =>
      console.error("[db] Failed to ensure indexes:", err)
    );
  }

  return db;
}

export async function closeDb(): Promise<void> {
  if (client) {
    await client.close();
    client = null;
    db = null;
  }
}
