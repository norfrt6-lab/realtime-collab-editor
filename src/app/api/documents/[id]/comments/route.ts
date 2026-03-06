import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import {
  getCommentsCollection,
  getUsersCollection,
} from "@/lib/db/collections";
import {
  requireAuth,
  validateObjectId,
  requireDocumentAccess,
  applyRateLimit,
  getRateLimitKey,
} from "@/lib/api/helpers";
import type { CommentData } from "@/types";

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

    const comments = await getCommentsCollection();
    const users = await getUsersCollection();

    const list = await comments
      .find({ documentId: new ObjectId(id) })
      .sort({ createdAt: 1 })
      .toArray();

    const authorIds = [...new Set(list.map((c) => c.authorId.toString()))];
    const authors = await users
      .find({ _id: { $in: authorIds.map((aid) => new ObjectId(aid)) } })
      .project({ name: 1, avatar: 1 })
      .toArray();

    const authorMap = new Map(
      authors.map((a) => [
        a._id.toString(),
        { name: a.name, avatar: a.avatar },
      ])
    );

    const result: CommentData[] = list.map((c) => {
      const author = authorMap.get(c.authorId.toString());
      return {
        id: c._id.toString(),
        documentId: c.documentId.toString(),
        threadId: c.threadId,
        content: c.content,
        authorId: c.authorId.toString(),
        authorName: author?.name,
        authorAvatar: author?.avatar,
        parentId: c.parentId?.toString() || null,
        resolved: c.resolved,
        createdAt: c.createdAt.toISOString(),
      };
    });

    return NextResponse.json(result);
  } catch (err) {
    console.error("[GET /api/documents/:id/comments]", err);
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
      "viewer"
    );
    if (accessError) return accessError;

    const { threadId, content, parentId } = await request.json();

    if (!threadId || !content) {
      return NextResponse.json(
        { error: "threadId and content are required" },
        { status: 400 }
      );
    }

    const comments = await getCommentsCollection();
    const result = await comments.insertOne({
      documentId: new ObjectId(id),
      threadId,
      content,
      authorId: new ObjectId(session.user.id),
      parentId: parentId ? new ObjectId(parentId) : null,
      resolved: false,
      createdAt: new Date(),
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
    } as any);

    return NextResponse.json(
      { id: result.insertedId.toString() },
      { status: 201 }
    );
  } catch (err) {
    console.error("[POST /api/documents/:id/comments]", err);
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

    const { error: accessError } = await requireDocumentAccess(
      id,
      session.user.id,
      "viewer"
    );
    if (accessError) return accessError;

    const { commentId, resolved } = await request.json();

    if (!commentId || typeof resolved !== "boolean") {
      return NextResponse.json(
        { error: "commentId and resolved (boolean) are required" },
        { status: 400 }
      );
    }

    const commentIdError = validateObjectId(commentId);
    if (commentIdError) return commentIdError;

    const comments = await getCommentsCollection();
    const result = await comments.updateOne(
      { _id: new ObjectId(commentId), documentId: new ObjectId(id) },
      { $set: { resolved } }
    );

    if (result.matchedCount === 0) {
      return NextResponse.json(
        { error: "Comment not found" },
        { status: 404 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PATCH /api/documents/:id/comments]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
