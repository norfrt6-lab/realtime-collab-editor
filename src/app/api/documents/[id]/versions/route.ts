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
import type { VersionMeta } from "@/types";

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

    const versions = await getVersionsCollection();
    const list = await versions
      .find({ documentId: new ObjectId(id) })
      .sort({ createdAt: -1 })
      .project({ snapshot: 0 })
      .toArray();

    const result: VersionMeta[] = list.map((v) => ({
      id: v._id.toString(),
      documentId: v.documentId.toString(),
      createdBy: v.createdBy.toString(),
      createdAt: v.createdAt.toISOString(),
      label: v.label,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /api/documents/:id/versions]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

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
      "editor"
    );
    if (accessError) return accessError;

    const { label } = await request.json();

    const docs = await getDocumentsCollection();
    const doc = await docs.findOne({ _id: new ObjectId(id) });

    if (!doc?.ydocState) {
      return NextResponse.json(
        { error: "Document has no content to save" },
        { status: 400 }
      );
    }

    const versions = await getVersionsCollection();
    const result = await versions.insertOne({
      documentId: new ObjectId(id),
      snapshot: doc.ydocState,
      createdBy: new ObjectId(session.user.id),
      createdAt: new Date(),
      label: label || undefined,
    });

    return NextResponse.json(
      { id: result.insertedId.toString() },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/documents/:id/versions]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
