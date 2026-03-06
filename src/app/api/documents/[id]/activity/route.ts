import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/auth";
import { getActivityCollection } from "@/lib/db/activity";
import { getUsersCollection } from "@/lib/db/collections";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { id } = await params;
  const activity = await getActivityCollection();
  const users = await getUsersCollection();

  const events = await activity
    .find({ documentId: new ObjectId(id) })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();

  const userIds = [...new Set(events.map((e) => e.userId.toString()))];
  const userDocs = await users
    .find({ _id: { $in: userIds.map((uid) => new ObjectId(uid)) } })
    .project({ name: 1 })
    .toArray();

  const userMap = new Map(
    userDocs.map((u) => [u._id.toString(), u.name])
  );

  const result = events.map((e) => ({
    id: e._id.toString(),
    documentId: e.documentId.toString(),
    userId: e.userId.toString(),
    userName: userMap.get(e.userId.toString()) || "Unknown",
    action: e.action,
    metadata: e.metadata,
    createdAt: e.createdAt.toISOString(),
  }));

  return NextResponse.json(result);
}
