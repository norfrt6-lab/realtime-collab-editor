import type { Collection, ObjectId } from "mongodb";
import type { ActivityEvent, Notification, AuditLogEntry } from "@/types/activity";
import { getDb } from "./client";

export async function getActivityCollection(): Promise<Collection<ActivityEvent>> {
  const db = await getDb();
  return db.collection<ActivityEvent>("activity");
}

export async function getNotificationsCollection(): Promise<Collection<Notification>> {
  const db = await getDb();
  return db.collection<Notification>("notifications");
}

export async function getAuditLogCollection(): Promise<Collection<AuditLogEntry>> {
  const db = await getDb();
  return db.collection<AuditLogEntry>("audit_log");
}

export async function logActivity(
  documentId: ObjectId,
  userId: ObjectId,
  action: ActivityEvent["action"],
  metadata?: Record<string, unknown>
) {
  const col = await getActivityCollection();
  await col.insertOne({
    documentId,
    userId,
    action,
    metadata,
    createdAt: new Date(),
  } as ActivityEvent);
}

export async function logAudit(
  userId: ObjectId,
  action: string,
  resource: string,
  resourceId?: string,
  metadata?: Record<string, unknown>,
  ip?: string,
  userAgent?: string
) {
  const col = await getAuditLogCollection();
  await col.insertOne({
    userId,
    action,
    resource,
    resourceId,
    ip,
    userAgent,
    metadata,
    createdAt: new Date(),
  } as AuditLogEntry);
}

export async function createNotification(
  userId: ObjectId,
  type: Notification["type"],
  message: string,
  documentId?: ObjectId,
  fromUserId?: ObjectId,
  fromUserName?: string
) {
  const col = await getNotificationsCollection();
  await col.insertOne({
    userId,
    type,
    message,
    documentId,
    fromUserId,
    fromUserName,
    read: false,
    createdAt: new Date(),
  } as Notification);
}
