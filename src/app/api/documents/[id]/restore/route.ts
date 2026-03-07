import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDocumentsCollection } from "@/lib/db/collections";
import { logActivity } from "@/lib/db/activity";
import {
  requireAuth,
  validateObjectId,
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

    const userId = new ObjectId(session.user.id);
    const docs = await getDocumentsCollection();

    const result = await docs.updateOne(
      { _id: new ObjectId(id), isDeleted: true, ownerId: userId },
      { $set: { isDeleted: false, updatedAt: new Date() } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Document not found in trash" },
        { status: 404 }
      );
    }

    await logActivity(new ObjectId(id), userId, "edited", { action: "restored" });

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/documents/:id/restore]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
