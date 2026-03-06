import type { ObjectId } from "mongodb";

export interface User {
  _id: ObjectId;
  email: string;
  name: string;
  passwordHash: string;
  avatar?: string;
  createdAt: Date;
}

export interface Collaborator {
  userId: ObjectId;
  role: "editor" | "viewer";
  addedAt: Date;
}

export interface Document {
  _id: ObjectId;
  title: string;
  ownerId: ObjectId;
  collaborators: Collaborator[];
  ydocState?: Buffer;
  createdAt: Date;
  updatedAt: Date;
  isPublic: boolean;
  isDeleted: boolean;
}

export interface Version {
  _id: ObjectId;
  documentId: ObjectId;
  snapshot: Buffer;
  createdBy: ObjectId;
  createdAt: Date;
  label?: string;
}

export interface Comment {
  _id: ObjectId;
  documentId: ObjectId;
  threadId: string;
  content: string;
  authorId: ObjectId;
  parentId: ObjectId | null;
  resolved: boolean;
  createdAt: Date;
}

// Client-side serialized types (ObjectId → string, Buffer → excluded)
export interface DocumentMeta {
  id: string;
  title: string;
  ownerId: string;
  collaborators: {
    userId: string;
    role: "editor" | "viewer";
    addedAt: string;
  }[];
  createdAt: string;
  updatedAt: string;
  isPublic: boolean;
}

export interface VersionMeta {
  id: string;
  documentId: string;
  createdBy: string;
  createdAt: string;
  label?: string;
}

export interface CommentData {
  id: string;
  documentId: string;
  threadId: string;
  content: string;
  authorId: string;
  authorName?: string;
  authorAvatar?: string;
  parentId: string | null;
  resolved: boolean;
  createdAt: string;
}

export interface PresenceUser {
  name: string;
  color: string;
  avatar?: string;
}
