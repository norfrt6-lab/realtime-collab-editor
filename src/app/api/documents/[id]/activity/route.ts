import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getActivityCollection } from "@/lib/db/activity";
import { getUsersCollection } from "@/lib/db/collections";
import {
  requireAuth,
  validateObjectId,
  requireDocumentAccess,
  applyRateLimit,
  getRateLimitKey,
} from "@/lib/api/helpers";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

    const rateLimited = applyRateLimit(getRateLimitKey(request, session.user.id));
    if (rateLimited) return rateLimited;

    const { id } = await params;
    const idError = validateObjectId(id);
    if (idError) return idError;

    const { error: accessError } = await requireDocumentAccess(
      id,
      session.user.id,
      "viewer"
    );
    if (accessError) return accessError;

    const activity = await getActivityCollection();
    const users = await getUsersCollection();

    const events = await activity
      .find({ documentId: new ObjectId(id) })
      .sort({ createdAt: -1 })
      .limit(50)
      .toArray();

    const userIds = [...new Set(events.map((e) => e.userId.toString()))];
    const userDocs = await users
      .find({ _id: { $in: userIds.map((uid) => new ObjectId(uid)) } })
      .project({ name: 1 })
      .toArray();

    const userMap = new Map(
      userDocs.map((u) => [u._id.toString(), u.name])
    );

    const result = events.map((e) => ({
      id: e._id.toString(),
      documentId: e.documentId.toString(),
      userId: e.userId.toString(),
      userName: userMap.get(e.userId.toString()) || "Unknown",
      action: e.action,
      metadata: e.metadata,
      createdAt: e.createdAt.toISOString(),
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /api/documents/:id/activity]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
