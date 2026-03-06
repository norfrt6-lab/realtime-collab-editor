import { NextResponse } from "next/server";
import { getAuditLogCollection } from "@/lib/db/activity";
import { requireAuth, applyRateLimit, getRateLimitKey } from "@/lib/api/helpers";

export async function GET(request: Request) {
  try {
    const { session, error: authError } = await requireAuth();
    if (authError) return authError;

    const rateLimited = applyRateLimit(getRateLimitKey(request, session.user.id));
    if (rateLimited) return rateLimited;

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
  } catch (err) {
    console.error("[GET /api/audit]", err);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
