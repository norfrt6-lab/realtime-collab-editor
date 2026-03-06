import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/auth";
import { getAuditLogCollection } from "@/lib/db/activity";

export async function GET(request: Request) {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const resource = searchParams.get("resource");
  const resourceId = searchParams.get("resourceId");
  const limit = parseInt(searchParams.get("limit") || "100", 10);

  const col = await getAuditLogCollection();

  const filter: Record<string, unknown> = {};
  if (resource) filter.resource = resource;
  if (resourceId) filter.resourceId = resourceId;

  const entries = await col
    .find(filter)
    .sort({ createdAt: -1 })
    .limit(Math.min(limit, 500))
    .toArray();

  const result = entries.map((e) => ({
    id: e._id.toString(),
    userId: e.userId.toString(),
    action: e.action,
    resource: e.resource,
    resourceId: e.resourceId,
    metadata: e.metadata,
    createdAt: e.createdAt.toISOString(),
  }));

  return NextResponse.json(result);
}
