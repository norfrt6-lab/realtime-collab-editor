import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDocumentsCollection, getUsersCollection } from "@/lib/db/collections";
import { createNotification } from "@/lib/db/activity";
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

    const { doc, error: accessError } = await requireDocumentAccess(
      id,
      session.user.id,
      "viewer"
    );
    if (accessError) return accessError;

    return NextResponse.json({
      id: doc._id.toString(),
      title: doc.title,
      ownerId: doc.ownerId.toString(),
      collaborators: (doc.collaborators || []).map((c) => ({
        userId: c.userId.toString(),
        role: c.role,
        addedAt: c.addedAt.toISOString(),
      })),
      createdAt: doc.createdAt.toISOString(),
      updatedAt: doc.updatedAt.toISOString(),
      isPublic: doc.isPublic,
    });
  } catch (err) {
    console.error("[GET /api/documents/:id]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(
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
      "owner"
    );
    if (accessError) return accessError;

    const body = await request.json();
    const docs = await getDocumentsCollection();

    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const update: Record<string, any> = {};
    const setFields: Record<string, unknown> = { updatedAt: new Date() };

    if (body.title !== undefined) setFields.title = body.title;
    if (body.isPublic !== undefined) setFields.isPublic = body.isPublic;

    // Handle adding a collaborator
    if (body.addCollaborator) {
      const { email, role } = body.addCollaborator;
      if (!email || !role || !["editor", "viewer"].includes(role)) {
        return NextResponse.json(
          { error: "Valid email and role (editor/viewer) are required" },
          { status: 400 }
        );
      }

      const users = await getUsersCollection();
      const targetUser = await users.findOne({ email });
      if (!targetUser) {
        return NextResponse.json(
          { error: "User not found with that email" },
          { status: 404 }
        );
      }

      // Check if already a collaborator
      const alreadyCollab = doc.collaborators?.some((c) =>
        c.userId.equals(targetUser._id)
      );
      if (alreadyCollab) {
        return NextResponse.json(
          { error: "User is already a collaborator" },
          { status: 409 }
        );
      }

      // Check not adding self
      if (targetUser._id.equals(new ObjectId(session.user.id))) {
        return NextResponse.json(
          { error: "Cannot add yourself as a collaborator" },
          { status: 400 }
        );
      }

      update.$push = {
        collaborators: {
          userId: targetUser._id,
          role,
          addedAt: new Date(),
        },
      };

      // Send notification to the invited user
      await createNotification(
        targetUser._id,
        "share",
        `${session.user.name || "Someone"} shared "${doc.title}" with you as ${role}`,
        doc._id,
        new ObjectId(session.user.id),
        session.user.name
      );
    }

    update.$set = setFields;
    await docs.updateOne({ _id: new ObjectId(id) }, update);

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PATCH /api/documents/:id]", err);
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
      "owner"
    );
    if (accessError) return accessError;

    const docs = await getDocumentsCollection();
    await docs.updateOne(
      { _id: new ObjectId(id) },
      { $set: { isDeleted: true, updatedAt: new Date() } }
    );

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/documents/:id]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
