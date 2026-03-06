import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/auth";
import { getDocumentsCollection } from "@/lib/db/collections";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const query = searchParams.get("q") || "";
  const folder = searchParams.get("folder");
  const tag = searchParams.get("tag");
  const starred = searchParams.get("starred") === "true";

  const userId = new ObjectId(session.user.id);
  const docs = await getDocumentsCollection();

  const filter: Record<string, unknown> = {
    isDeleted: { $ne: true },
    $or: [
      { ownerId: userId },
      { "collaborators.userId": userId },
      { isPublic: true },
    ],
  };

  if (query) {
    filter.title = { $regex: query, $options: "i" };
  }

  if (folder) {
    filter.folder = folder;
  }

  if (tag) {
    filter.tags = tag;
  }

  if (starred) {
    filter.starredBy = userId;
  }

  const documents = await docs
    .find(filter)
    .sort({ updatedAt: -1 })
    .project({ ydocState: 0 })
    .limit(50)
    .toArray();

  const result = documents.map((doc) => ({
    id: doc._id.toString(),
    title: doc.title,
    ownerId: doc.ownerId.toString(),
    collaborators: (doc.collaborators || []).map((c: { userId: ObjectId; role: string; addedAt: Date }) => ({
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
