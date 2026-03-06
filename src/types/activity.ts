import type { ObjectId } from "mongodb";

export interface ActivityEvent {
  _id: ObjectId;
  documentId: ObjectId;
  userId: ObjectId;
  action:
    | "created"
    | "edited"
    | "commented"
    | "shared"
    | "version_saved"
    | "version_restored"
    | "deleted";
  metadata?: Record<string, unknown>;
  createdAt: Date;
}

export interface ActivityEventData {
  id: string;
  documentId: string;
  userId: string;
  userName?: string;
  action: string;
  metadata?: Record<string, unknown>;
  createdAt: string;
}

export interface Notification {
  _id: ObjectId;
  userId: ObjectId;
  type: "mention" | "comment" | "share" | "version_restored";
  message: string;
  documentId?: ObjectId;
  fromUserId?: ObjectId;
  fromUserName?: string;
  read: boolean;
  createdAt: Date;
}

export interface NotificationData {
  id: string;
  type: string;
  message: string;
  documentId?: string;
  fromUserName?: string;
  read: boolean;
  createdAt: string;
}

export interface AuditLogEntry {
  _id: ObjectId;
  userId: ObjectId;
  action: string;
  resource: string;
  resourceId?: string;
  ip?: string;
  userAgent?: string;
  metadata?: Record<string, unknown>;
  createdAt: Date;
}
