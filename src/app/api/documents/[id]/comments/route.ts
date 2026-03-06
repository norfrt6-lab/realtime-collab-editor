import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/auth";
import {
  getCommentsCollection,
  getUsersCollection,
} from "@/lib/db/collections";
import type { CommentData } from "@/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const comments = await getCommentsCollection();
  const users = await getUsersCollection();

  const list = await comments
    .find({ documentId: new ObjectId(id) })
    .sort({ createdAt: 1 })
    .toArray();

  // Gather unique author IDs
  const authorIds = [...new Set(list.map((c) => c.authorId.toString()))];
  const authors = await users
    .find({ _id: { $in: authorIds.map((id) => new ObjectId(id)) } })
    .project({ name: 1, avatar: 1 })
    .toArray();

  const authorMap = new Map(
    authors.map((a) => [a._id.toString(), { name: a.name, avatar: a.avatar }])
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
}

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
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
  } as any);

  return NextResponse.json(
    { id: result.insertedId.toString() },
    { status: 201 }
  );
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { commentId, resolved } = await request.json();
  const comments = await getCommentsCollection();

  await comments.updateOne(
    { _id: new ObjectId(commentId) },
    { $set: { resolved } }
  );

  return NextResponse.json({ success: true });
}
