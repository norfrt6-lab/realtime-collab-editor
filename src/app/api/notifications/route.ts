import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/auth";
import { getNotificationsCollection } from "@/lib/db/activity";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const userId = new ObjectId(session.user.id);
  const col = await getNotificationsCollection();

  const notifications = await col
    .find({ userId })
    .sort({ createdAt: -1 })
    .limit(50)
    .toArray();

  const result = notifications.map((n) => ({
    id: n._id.toString(),
    type: n.type,
    message: n.message,
    documentId: n.documentId?.toString(),
    fromUserName: n.fromUserName,
    read: n.read,
    createdAt: n.createdAt.toISOString(),
  }));

  return NextResponse.json(result);
}

export async function PATCH(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { notificationId, markAllRead } = await request.json();
  const userId = new ObjectId(session.user.id);
  const col = await getNotificationsCollection();

  if (markAllRead) {
    await col.updateMany({ userId, read: false }, { $set: { read: true } });
  } else if (notificationId) {
    await col.updateOne(
      { _id: new ObjectId(notificationId), userId },
      { $set: { read: true } }
    );
  }

  return NextResponse.json({ success: true });
}
