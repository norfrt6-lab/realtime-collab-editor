import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/auth";
import {
  getDocumentsCollection,
  getVersionsCollection,
} from "@/lib/db/collections";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string; versionId: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id, versionId } = await params;

  const versions = await getVersionsCollection();
  const version = await versions.findOne({ _id: new ObjectId(versionId) });

  if (!version || version.documentId.toString() !== id) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
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
}
