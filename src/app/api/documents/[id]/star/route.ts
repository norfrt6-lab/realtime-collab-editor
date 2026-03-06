import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/auth";
import { getDocumentsCollection } from "@/lib/db/collections";

export async function POST(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const userId = new ObjectId(session.user.id);
  const docs = await getDocumentsCollection();

  await docs.updateOne(
    { _id: new ObjectId(id) },
    { $addToSet: { starredBy: userId } }
  );

  return NextResponse.json({ starred: true });
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
  const userId = new ObjectId(session.user.id);
  const docs = await getDocumentsCollection();

  await docs.updateOne(
    { _id: new ObjectId(id) },
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    { $pull: { starredBy: userId } as any }
  );

  return NextResponse.json({ starred: false });
}
