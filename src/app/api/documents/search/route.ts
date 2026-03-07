import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDocumentsCollection, getUsersCollection } from "@/lib/db/collections";
import { requireAuth, applyRateLimit, getRateLimitKey } from "@/lib/api/helpers";

export async function GET(request: Request) {
  try {
    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

    const rateLimited = applyRateLimit(getRateLimitKey(request, session.user.id));
    if (rateLimited) return rateLimited;

    const { searchParams } = new URL(request.url);
    const query = searchParams.get("q") || "";
    const folder = searchParams.get("folder");
    const tag = searchParams.get("tag");
    const starred = searchParams.get("starred") === "true";
    const ownerOnly = searchParams.get("owner") === "true";
    const sharedOnly = searchParams.get("shared") === "true";
    const deletedOnly = searchParams.get("deleted") === "true";
    const page = Math.max(1, parseInt(searchParams.get("page") || "1", 10));
    const limit = Math.min(50, Math.max(1, parseInt(searchParams.get("limit") || "20", 10)));

    const userId = new ObjectId(session.user.id);
    const docs = await getDocumentsCollection();

    const filter: Record<string, unknown> = {};

    if (deletedOnly) {
      filter.isDeleted = true;
      filter.ownerId = userId;
    } else {
      filter.isDeleted = { $ne: true };
      if (ownerOnly) {
        filter.ownerId = userId;
      } else if (sharedOnly) {
        filter["collaborators.userId"] = userId;
        filter.ownerId = { $ne: userId };
      } else {
        filter.$or = [
          { ownerId: userId },
          { "collaborators.userId": userId },
          { isPublic: true },
        ];
      }
    }

    if (query) {
      const escaped = query.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
      filter.title = { $regex: escaped, $options: "i" };
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

    const [documents, total] = await Promise.all([
      docs
        .find(filter)
        .sort({ updatedAt: -1 })
        .project({ ydocState: 0 })
        .skip((page - 1) * limit)
        .limit(limit)
        .toArray(),
      docs.countDocuments(filter),
    ]);

    // Batch-resolve collaborator names
    const allCollabUserIds = new Set<string>();
    for (const doc of documents) {
      for (const c of doc.collaborators || []) {
        allCollabUserIds.add(c.userId.toString());
      }
    }

    const userMap = new Map<string, { email: string; name: string }>();
    if (allCollabUserIds.size > 0) {
      const users = await getUsersCollection();
      const collabUsers = await users
        .find({ _id: { $in: [...allCollabUserIds].map((id) => new ObjectId(id)) } })
        .project({ email: 1, name: 1 })
        .toArray();
      for (const u of collabUsers) {
        userMap.set(u._id!.toString(), { email: u.email, name: u.name });
      }
    }

    const result = documents.map((doc) => ({
      id: doc._id.toString(),
      title: doc.title,
      ownerId: doc.ownerId.toString(),
      collaborators: (doc.collaborators || []).map(
        (c: { userId: ObjectId; role: string; addedAt: Date }) => ({
          userId: c.userId.toString(),
          role: c.role,
          addedAt: c.addedAt.toISOString(),
          email: userMap.get(c.userId.toString())?.email || "",
          name: userMap.get(c.userId.toString())?.name || "",
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

    return NextResponse.json({ documents: result, total, page, limit, hasMore: page * limit < total });
  } catch (err) {
    console.error("[GET /api/documents/search]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
