import { getDb } from "./client";

export async function ensureIndexes(): Promise<void> {
  const db = await getDb();

  // Users
  await db.collection("users").createIndex({ email: 1 }, { unique: true });

  // Documents
  await db
    .collection("documents")
    .createIndex({ ownerId: 1, isDeleted: 1 });
  await db
    .collection("documents")
    .createIndex({ "collaborators.userId": 1 });
  await db.collection("documents").createIndex({ updatedAt: -1 });

  // Versions
  await db
    .collection("versions")
    .createIndex({ documentId: 1, createdAt: -1 });

  // Comments
  await db
    .collection("comments")
    .createIndex({ documentId: 1, threadId: 1 });
  await db
    .collection("comments")
    .createIndex({ documentId: 1, createdAt: 1 });
}
