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

export async function PUT(
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
      "editor"
    );
    if (accessError) return accessError;

    const { tags } = await request.json();
    if (!Array.isArray(tags) || tags.length > 20 || tags.some((t: unknown) => typeof t !== "string" || t.length > 50)) {
      return NextResponse.json(
        { error: "Tags must be an array of up to 20 strings (max 50 chars each)" },
        { status: 400 }
      );
    }

    const docs = await getDocumentsCollection();
    await docs.updateOne(
      { _id: new ObjectId(id) },
      { $set: { tags, updatedAt: new Date() } }
    );

    await logActivity(new ObjectId(id), new ObjectId(session.user.id), "edited", { action: "tags_updated" });

    return NextResponse.json({ tags });
  } catch (err) {
    console.error("[PUT /api/documents/:id/tags]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
