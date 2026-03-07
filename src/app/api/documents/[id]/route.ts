import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getDocumentsCollection, getUsersCollection, getCommentsCollection } from "@/lib/db/collections";
import { createNotification, logActivity } from "@/lib/db/activity";
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

    // Resolve collaborator names/emails
    const collabs = doc.collaborators || [];
    let collaboratorsData = collabs.map((c) => ({
      userId: c.userId.toString(),
      role: c.role,
      addedAt: c.addedAt.toISOString(),
      email: "",
      name: "",
    }));

    if (collabs.length > 0) {
      const users = await getUsersCollection();
      const collabUsers = await users
        .find({ _id: { $in: collabs.map((c) => c.userId) } })
        .project({ email: 1, name: 1 })
        .toArray();
      const userMap = new Map(
        collabUsers.map((u) => [u._id!.toString(), { email: u.email, name: u.name }])
      );
      collaboratorsData = collaboratorsData.map((c) => ({
        ...c,
        email: userMap.get(c.userId)?.email || "",
        name: userMap.get(c.userId)?.name || "",
      }));
    }

    return NextResponse.json({
      id: doc._id.toString(),
      title: doc.title,
      ownerId: doc.ownerId.toString(),
      collaborators: collaboratorsData,
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

    const update: Record<string, unknown> = {};
    const setFields: Record<string, unknown> = { updatedAt: new Date() };

    if (body.title !== undefined) {
      if (typeof body.title !== "string" || body.title.length > 200) {
        return NextResponse.json(
          { error: "Title must be a string under 200 characters" },
          { status: 400 }
        );
      }
      setFields.title = body.title;
    }
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
      const targetUser = await users.findOne({ email: email.toLowerCase() });
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
    } else if (body.removeCollaborator) {
      const { userId: removeUserId } = body.removeCollaborator;
      if (!removeUserId || !ObjectId.isValid(removeUserId)) {
        return NextResponse.json(
          { error: "Valid userId is required" },
          { status: 400 }
        );
      }

      // Prevent removing the owner
      if (doc.ownerId.equals(new ObjectId(removeUserId))) {
        return NextResponse.json(
          { error: "Cannot remove the document owner" },
          { status: 400 }
        );
      }

      update.$pull = {
        collaborators: { userId: new ObjectId(removeUserId) },
      };
    }

    update.$set = setFields;
    await docs.updateOne({ _id: new ObjectId(id) }, update);

    const userId = new ObjectId(session.user.id);
    if (body.addCollaborator) {
      await logActivity(new ObjectId(id), userId, "shared", { email: body.addCollaborator.email, role: body.addCollaborator.role });
    } else if (body.removeCollaborator) {
      await logActivity(new ObjectId(id), userId, "shared", { action: "collaborator_removed", removedUserId: body.removeCollaborator.userId });
    } else if (body.title !== undefined || body.isPublic !== undefined) {
      await logActivity(new ObjectId(id), userId, "edited");
    }

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

    const userId = new ObjectId(session.user.id);
    const docId = new ObjectId(id);

    // Try standard access check first (for non-deleted docs)
    const { error: accessError } = await requireDocumentAccess(
      id,
      session.user.id,
      "owner"
    );

    if (accessError) {
      // If 404, check if it's a soft-deleted doc owned by the user (permanent delete from trash)
      const data = await accessError.json();
      if (data.error === "Document not found") {
        const docs = await getDocumentsCollection();
        const deletedDoc = await docs.findOne({ _id: docId, isDeleted: true, ownerId: userId });
        if (deletedDoc) {
          const comments = await getCommentsCollection();
          await Promise.all([
            docs.deleteOne({ _id: docId }),
            comments.deleteMany({ documentId: docId }),
          ]);
          return NextResponse.json({ success: true });
        }
      }
      // Re-create the error response since we consumed it
      return NextResponse.json({ error: data.error }, { status: accessError.status });
    }

    // Soft delete
    const docs = await getDocumentsCollection();
    await docs.updateOne(
      { _id: docId },
      { $set: { isDeleted: true, updatedAt: new Date() } }
    );
    await logActivity(docId, userId, "deleted");

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[DELETE /api/documents/:id]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
