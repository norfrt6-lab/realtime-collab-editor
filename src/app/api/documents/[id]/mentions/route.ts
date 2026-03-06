import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { createNotification } from "@/lib/db/activity";
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

    const { doc, error: accessError } = await requireDocumentAccess(
      id,
      session.user.id,
      "editor"
    );
    if (accessError) return accessError;

    const { mentionedUserId } = await request.json();

    if (!mentionedUserId || !ObjectId.isValid(mentionedUserId)) {
      return NextResponse.json(
        { error: "Valid mentionedUserId is required" },
        { status: 400 }
      );
    }

    // Don't notify yourself
    if (mentionedUserId === session.user.id) {
      return NextResponse.json({ sent: false });
    }

    // Verify the mentioned user is a collaborator or owner
    const mentionedOid = new ObjectId(mentionedUserId);
    const isOwner = doc.ownerId.equals(mentionedOid);
    const isCollab = (doc.collaborators || []).some((c) => c.userId.equals(mentionedOid));

    if (!isOwner && !isCollab) {
      return NextResponse.json(
        { error: "User is not a collaborator on this document" },
        { status: 400 }
      );
    }

    await createNotification(
      mentionedOid,
      "mention",
      `${session.user.name || "Someone"} mentioned you in "${doc.title}"`,
      doc._id,
      new ObjectId(session.user.id),
      session.user.name
    );

    return NextResponse.json({ sent: true });
  } catch (err) {
    console.error("[POST /api/documents/:id/mentions]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
