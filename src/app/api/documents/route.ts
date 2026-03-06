import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDocumentsCollection } from "@/lib/db/collections";
import { logActivity } from "@/lib/db/activity";
import { requireAuth, applyRateLimit, getRateLimitKey } from "@/lib/api/helpers";
import type { DocumentMeta } from "@/types";

export async function GET(request: Request) {
  try {
    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

    const rateLimited = applyRateLimit(getRateLimitKey(request, session.user.id));
    if (rateLimited) return rateLimited;

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
      collaborators: (doc.collaborators || []).map(
        (c: { userId: ObjectId; role: string; addedAt: Date }) => ({
          userId: c.userId.toString(),
          role: c.role,
          addedAt: c.addedAt.toISOString(),
        })
      ),
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
      isPublic: doc.isPublic,
      folder: doc.folder,
      tags: doc.tags || [],
      isStarred: (doc.starredBy || []).some((id: ObjectId) =>
        id.equals(userId)
      ),
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /api/documents]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function POST(request: Request) {
  try {
    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

    const rateLimited = applyRateLimit(getRateLimitKey(request, session.user.id));
    if (rateLimited) return rateLimited;

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
    });

    await logActivity(result.insertedId, userId, "created");

    return NextResponse.json(
      { id: result.insertedId.toString() },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/documents]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
