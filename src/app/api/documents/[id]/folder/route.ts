import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/auth";
import { getDocumentsCollection } from "@/lib/db/collections";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const { folder } = await request.json();

  const docs = await getDocumentsCollection();
  await docs.updateOne(
    { _id: new ObjectId(id) },
    { $set: { folder: folder || null, updatedAt: new Date() } }
  );

  return NextResponse.json({ folder });
}
