import { NextResponse } from "next/server";
import { ObjectId } from "mongodb";
import { getNotificationsCollection } from "@/lib/db/activity";
import {
  requireAuth,
  validateObjectId,
  applyRateLimit,
  getRateLimitKey,
} from "@/lib/api/helpers";

export async function GET(request: Request) {
  try {
    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

    const rateLimited = applyRateLimit(getRateLimitKey(request, session.user.id));
    if (rateLimited) return rateLimited;

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
  } catch (err) {
    console.error("[GET /api/notifications]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}

export async function PATCH(request: Request) {
  try {
    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

    const rateLimited = applyRateLimit(getRateLimitKey(request, session.user.id));
    if (rateLimited) return rateLimited;

    const { notificationId, markAllRead } = await request.json();
    const userId = new ObjectId(session.user.id);
    const col = await getNotificationsCollection();

    if (markAllRead) {
      await col.updateMany(
        { userId, read: false },
        { $set: { read: true } }
      );
    } else if (notificationId) {
      const idError = validateObjectId(notificationId);
      if (idError) return idError;

      await col.updateOne(
        { _id: new ObjectId(notificationId), userId },
        { $set: { read: true } }
      );
    } else {
      return NextResponse.json(
        { error: "notificationId or markAllRead is required" },
        { status: 400 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("[PATCH /api/notifications]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
