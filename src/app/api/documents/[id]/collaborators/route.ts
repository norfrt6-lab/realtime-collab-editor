import { NextResponse } from "next/server";
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

    const { doc, error: accessError } = await requireDocumentAccess(
      id,
      session.user.id,
      "viewer"
    );
    if (accessError) return accessError;

    // Collect owner + all collaborator userIds
    const userIds = [doc.ownerId, ...(doc.collaborators || []).map((c) => c.userId)];
    const uniqueIds = [...new Map(userIds.map((id) => [id.toString(), id])).values()];

    const users = await getUsersCollection();
    const collabUsers = await users
      .find({ _id: { $in: uniqueIds } })
      .project({ name: 1, email: 1 })
      .toArray();

    const result = collabUsers.map((u) => ({
      id: u._id!.toString(),
      name: u.name || u.email,
      email: u.email,
    }));

    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /api/documents/:id/collaborators]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
