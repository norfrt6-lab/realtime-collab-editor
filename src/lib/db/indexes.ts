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
  await db.collection("documents").createIndex({ title: "text" }); // Full-text search
  await db.collection("documents").createIndex({ tags: 1 });
  await db.collection("documents").createIndex({ folder: 1 });
  await db.collection("documents").createIndex({ starredBy: 1 });

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

  // Activity
  await db
    .collection("activity")
    .createIndex({ documentId: 1, createdAt: -1 });

  // Notifications
  await db
    .collection("notifications")
    .createIndex({ userId: 1, createdAt: -1 });
  await db
    .collection("notifications")
    .createIndex({ userId: 1, read: 1 });

  // Audit log
  await db
    .collection("audit_log")
    .createIndex({ createdAt: -1 });
  await db
    .collection("audit_log")
    .createIndex({ userId: 1, createdAt: -1 });
  await db
    .collection("audit_log")
    .createIndex({ resource: 1, resourceId: 1 });
}
