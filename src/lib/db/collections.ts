import type { Collection } from "mongodb";
import type { User, Document, Version, Comment } from "@/types";
import { getDb } from "./client";

export async function getUsersCollection(): Promise<Collection<User>> {
  const db = await getDb();
  return db.collection<User>("users");
}

export async function getDocumentsCollection(): Promise<Collection<Document>> {
  const db = await getDb();
  return db.collection<Document>("documents");
}

export async function getVersionsCollection(): Promise<Collection<Version>> {
  const db = await getDb();
  return db.collection<Version>("versions");
}

export async function getCommentsCollection(): Promise<Collection<Comment>> {
  const db = await getDb();
  return db.collection<Comment>("comments");
}
