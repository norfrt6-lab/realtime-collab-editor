import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import {
  getDocumentsCollection,
  getVersionsCollection,
} from "@/lib/db/collections";
import {
  requireAuth,
  validateObjectId,
  requireDocumentAccess,
  applyRateLimit,
  getRateLimitKey,
} from "@/lib/api/helpers";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  try {
    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

    const rateLimited = applyRateLimit(getRateLimitKey(request, session.user.id));
    if (rateLimited) return rateLimited;

    const { id, versionId } = await params;
    const idError = validateObjectId(id);
    if (idError) return idError;
    const versionIdError = validateObjectId(versionId);
    if (versionIdError) return versionIdError;

    const { error: accessError } = await requireDocumentAccess(
      id,
      session.user.id,
      "editor"
    );
    if (accessError) return accessError;

    const versions = await getVersionsCollection();
    const version = await versions.findOne({
      _id: new ObjectId(versionId),
    });

    if (!version || version.documentId.toString() !== id) {
      return NextResponse.json(
        { error: "Version not found" },
        { status: 404 }
      );
    }

    const docs = await getDocumentsCollection();
    await docs.updateOne(
      { _id: new ObjectId(id) },
      {
        $set: {
          ydocState: version.snapshot,
          updatedAt: new Date(),
        },
      }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[POST /api/documents/:id/versions/:versionId/restore]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
