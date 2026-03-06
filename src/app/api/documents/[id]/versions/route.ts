import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/auth";
import {
  getDocumentsCollection,
  getVersionsCollection,
} from "@/lib/db/collections";
import type { VersionMeta } from "@/types";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
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
  const { label } = await request.json();

  const docs = await getDocumentsCollection();
  const doc = await docs.findOne({ _id: new ObjectId(id) });

  if (!doc || !doc.ydocState) {
    return NextResponse.json(
      { error: "Document not found or has no content" },
      { status: 404 }
    );
  }

  const versions = await getVersionsCollection();
  const result = await versions.insertOne({
    documentId: new ObjectId(id),
    snapshot: doc.ydocState,
    createdBy: new ObjectId(session.user.id),
    createdAt: new Date(),
    label: label || undefined,
  } as any);

  return NextResponse.json(
    { id: result.insertedId.toString() },
    { status: 201 }
  );
}
