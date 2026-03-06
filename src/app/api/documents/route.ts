import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/auth";
import { getDocumentsCollection } from "@/lib/db/collections";
import { logActivity } from "@/lib/db/activity";
import type { DocumentMeta } from "@/types";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = new ObjectId(session.user.id);
  const docs = await getDocumentsCollection();

  const documents = await docs
    .find({
      isDeleted: { $ne: true },
      $or: [
        { ownerId: userId },
        { "collaborators.userId": userId },
        { isPublic: true },
      ],
    })
    .sort({ updatedAt: -1 })
    .project({ ydocState: 0 })
    .toArray();

  const result: DocumentMeta[] = documents.map((doc) => ({
    id: doc._id.toString(),
    title: doc.title,
    ownerId: doc.ownerId.toString(),
    collaborators: (doc.collaborators || []).map((c: any) => ({
      userId: c.userId.toString(),
      role: c.role,
      addedAt: c.addedAt.toISOString(),
    })),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    isPublic: doc.isPublic,
    folder: doc.folder,
    tags: doc.tags || [],
    isStarred: (doc.starredBy || []).some((id: ObjectId) => id.equals(userId)),
  }));

  return NextResponse.json(result);
}

export async function POST(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { title, templateId } = await request.json();
  const docs = await getDocumentsCollection();
  const userId = new ObjectId(session.user.id);

  const now = new Date();
  const result = await docs.insertOne({
    title: title || "Untitled Document",
    ownerId: userId,
    collaborators: [],
    tags: [],
    starredBy: [],
    lastAccessedBy: [{ userId, at: now }],
    templateId: templateId || undefined,
    createdAt: now,
    updatedAt: now,
    isPublic: false,
    isDeleted: false,
  } as any);

  // Log activity
  await logActivity(result.insertedId, userId, "created");

  return NextResponse.json(
    { id: result.insertedId.toString() },
    { status: 201 }
  );
}
