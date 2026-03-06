import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDocumentsCollection } from "@/lib/db/collections";
import { logActivity } from "@/lib/db/activity";
import {
  requireAuth,
  validateObjectId,
  requireDocumentAccess,
  applyRateLimit,
  getRateLimitKey,
} from "@/lib/api/helpers";

export async function POST(
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

    const userId = new ObjectId(session.user.id);
    const docs = await getDocumentsCollection();

    await docs.updateOne(
      { _id: new ObjectId(id) },
      { $addToSet: { starredBy: userId } }
    );

    await logActivity(new ObjectId(id), userId, "edited", { action: "starred" });

    return NextResponse.json({ starred: true });
  } catch (err) {
    console.error("[POST /api/documents/:id/star]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function DELETE(
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

    const userId = new ObjectId(session.user.id);
    const docs = await getDocumentsCollection();

    await docs.updateOne(
      { _id: new ObjectId(id) },
      { $pull: { starredBy: userId } }
    );

    await logActivity(new ObjectId(id), userId, "edited", { action: "unstarred" });

    return NextResponse.json({ starred: false });
  } catch (err) {
    console.error("[DELETE /api/documents/:id/star]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
