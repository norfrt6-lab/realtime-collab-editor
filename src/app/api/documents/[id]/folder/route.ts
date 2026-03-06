import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDocumentsCollection } from "@/lib/db/collections";
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

    const { folder } = await request.json();

    if (folder && (typeof folder !== "string" || folder.length > 100)) {
      return NextResponse.json(
        { error: "Folder name must be under 100 characters" },
        { status: 400 }
      );
    }

    const docs = await getDocumentsCollection();

    await docs.updateOne(
      { _id: new ObjectId(id) },
      { $set: { folder: folder || null, updatedAt: new Date() } }
    );

    return NextResponse.json({ folder });
  } catch (err) {
    console.error("[PUT /api/documents/:id/folder]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
