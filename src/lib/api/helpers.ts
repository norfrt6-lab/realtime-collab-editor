import { NextResponse } from "next/server";
import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";
import { authOptions } from "@/lib/auth";
import { getDocumentsCollection } from "@/lib/db/collections";
import { rateLimit, rateLimitHeaders } from "@/lib/rate-limit";

/**
 * Get the authenticated session or return a 401 response.
 */
export async function requireAuth() {
  const session = await getServerSession(authOptions);
  if (!session?.user?.id) {
    return { session: null, error: NextResponse.json({ error: "Unauthorized" }, { status: 401 }) };
  }
  return { session, error: null };
}

/**
 * Validate that an ID string is a valid MongoDB ObjectId.
 */
export function validateObjectId(id: string) {
  if (!ObjectId.isValid(id)) {
    return NextResponse.json({ error: "Invalid ID format" }, { status: 400 });
  }
  return null;
}

/**
 * Check that the current user has access to a document.
 * Returns the document if access is granted, or a 403/404 response.
 *
 * @param documentId - The document ObjectId string
 * @param userId - The authenticated user ObjectId string
 * @param requireRole - "owner" requires ownership; "editor" requires owner or editor role; "viewer" requires any access
 */
export async function requireDocumentAccess(
  documentId: string,
  userId: string,
  requireRole: "owner" | "editor" | "viewer" = "viewer"
) {
  const docs = await getDocumentsCollection();
  const doc = await docs.findOne({
    _id: new ObjectId(documentId),
    isDeleted: { $ne: true },
  });

  if (!doc) {
    return { doc: null, error: NextResponse.json({ error: "Document not found" }, { status: 404 }) };
  }

  const userOid = new ObjectId(userId);
  const isOwner = doc.ownerId.equals(userOid);
  const collaborator = doc.collaborators?.find((c) => c.userId.equals(userOid));
  const isEditor = collaborator?.role === "editor";
  const isViewer = collaborator?.role === "viewer";

  if (requireRole === "owner" && !isOwner) {
    return { doc: null, error: NextResponse.json({ error: "Forbidden: owner access required" }, { status: 403 }) };
  }

  if (requireRole === "editor" && !isOwner && !isEditor) {
    return { doc: null, error: NextResponse.json({ error: "Forbidden: editor access required" }, { status: 403 }) };
  }

  if (requireRole === "viewer" && !isOwner && !isEditor && !isViewer && !doc.isPublic) {
    return { doc: null, error: NextResponse.json({ error: "Forbidden" }, { status: 403 }) };
  }

  return { doc, error: null };
}

/**
 * Apply rate limiting based on an identifier (e.g., IP or user ID).
 * Returns a 429 response if the limit is exceeded, or null if allowed.
 */
export function applyRateLimit(identifier: string) {
  const { allowed, resetAt } = rateLimit(identifier);
  if (!allowed) {
    return NextResponse.json(
      { error: "Too many requests. Please try again later." },
      { status: 429, headers: rateLimitHeaders(resetAt) }
    );
  }
  return null;
}

/**
 * Extract a client identifier for rate limiting from a request.
 */
export function getRateLimitKey(request: Request, userId?: string): string {
  if (userId) return `user:${userId}`;
  const forwarded = request.headers.get("x-forwarded-for");
  const ip = forwarded?.split(",")[0]?.trim() || "unknown";
  return `ip:${ip}`;
}
