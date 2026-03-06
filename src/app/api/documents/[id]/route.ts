import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/auth";
import { getDocumentsCollection } from "@/lib/db/collections";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid document ID" }, { status: 400 });
  }

  const docs = await getDocumentsCollection();
  const doc = await docs.findOne(
    { _id: new ObjectId(id), isDeleted: { $ne: true } },
    { projection: { ydocState: 0 } }
  );

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  const userId = new ObjectId(session.user.id);
  const isOwner = doc.ownerId.equals(userId);
  const isCollaborator = doc.collaborators.some((c) => c.userId.equals(userId));
  if (!isOwner && !isCollaborator && !doc.isPublic) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  return NextResponse.json({
    id: doc._id.toString(),
    title: doc.title,
    ownerId: doc.ownerId.toString(),
    collaborators: doc.collaborators.map((c) => ({
      userId: c.userId.toString(),
      role: c.role,
      addedAt: c.addedAt.toISOString(),
    })),
    createdAt: doc.createdAt.toISOString(),
    updatedAt: doc.updatedAt.toISOString(),
    isPublic: doc.isPublic,
  });
}

export async function PATCH(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid document ID" }, { status: 400 });
  }

  const body = await request.json();
  const docs = await getDocumentsCollection();

  const doc = await docs.findOne({ _id: new ObjectId(id) });
  if (!doc || doc.isDeleted) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (!doc.ownerId.equals(new ObjectId(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  const update: Record<string, unknown> = { updatedAt: new Date() };
  if (body.title !== undefined) update.title = body.title;
  if (body.isPublic !== undefined) update.isPublic = body.isPublic;

  await docs.updateOne({ _id: new ObjectId(id) }, { $set: update });

  return NextResponse.json({ success: true });
}

export async function DELETE(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;

  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid document ID" }, { status: 400 });
  }

  const docs = await getDocumentsCollection();
  const doc = await docs.findOne({ _id: new ObjectId(id) });

  if (!doc) {
    return NextResponse.json({ error: "Document not found" }, { status: 404 });
  }

  if (!doc.ownerId.equals(new ObjectId(session.user.id))) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  await docs.updateOne(
    { _id: new ObjectId(id) },
    { $set: { isDeleted: true, updatedAt: new Date() } }
  );

  return NextResponse.json({ success: true });
}
