/**
 * @jest-environment node
 */

// Mock all dependencies that helpers.ts imports
jest.mock("next/server", () => ({
  NextResponse: {
    json: (body: unknown, init?: { status?: number; headers?: Record<string, string> }) => ({
      status: init?.status || 200,
      json: () => Promise.resolve(body),
      headers: init?.headers || {},
    }),
  },
}));

jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/auth", () => ({
  authOptions: {},
}));

jest.mock("mongodb", () => {
  class MockObjectId {
    id: string;
    constructor(id?: string) {
      this.id = id || "507f1f77bcf86cd799439011";
    }
    toString() { return this.id; }
    equals(other: MockObjectId) { return this.id === other.id; }
    static isValid(id: string) {
      return typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
    }
  }
  return { ObjectId: MockObjectId };
});

jest.mock("@/lib/db/collections", () => ({
  getDocumentsCollection: jest.fn(),
}));

jest.mock("@/lib/rate-limit", () => ({
  rateLimit: jest.fn(),
  rateLimitHeaders: () => ({ "Retry-After": "60" }),
}));

import { rateLimit } from "@/lib/rate-limit";
const mockRateLimit = rateLimit as jest.MockedFunction<typeof rateLimit>;

describe("validateObjectId", () => {
  it("returns null for valid ObjectId strings", async () => {
    const { validateObjectId } = await import("../helpers");
    expect(validateObjectId("507f1f77bcf86cd799439011")).toBeNull();
  });

  it("returns error response for invalid ObjectId strings", async () => {
    const { validateObjectId } = await import("../helpers");
    const response = validateObjectId("invalid-id");
    expect(response).not.toBeNull();
    expect(response!.status).toBe(400);
  });

  it("returns error for empty string", async () => {
    const { validateObjectId } = await import("../helpers");
    const response = validateObjectId("");
    expect(response).not.toBeNull();
    expect(response!.status).toBe(400);
  });
});

describe("applyRateLimit", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns null when requests are allowed", async () => {
    mockRateLimit.mockReturnValue({ allowed: true, remaining: 99, resetAt: Date.now() + 60000 });
    const { applyRateLimit } = await import("../helpers");
    const result = applyRateLimit("test-user");
    expect(result).toBeNull();
  });

  it("returns 429 response when rate limited", async () => {
    mockRateLimit.mockReturnValue({ allowed: false, remaining: 0, resetAt: Date.now() + 60000 });
    const { applyRateLimit } = await import("../helpers");
    const result = applyRateLimit("test-user");
    expect(result).not.toBeNull();
    expect(result!.status).toBe(429);
  });
});

describe("getRateLimitKey", () => {
  it("returns user-prefixed key when userId is provided", async () => {
    const { getRateLimitKey } = await import("../helpers");
    const request = new Request("https://example.com/api/test");
    const key = getRateLimitKey(request, "user123");
    expect(key).toBe("user:user123");
  });

  it("returns ip-prefixed key from x-forwarded-for header", async () => {
    const { getRateLimitKey } = await import("../helpers");
    const request = new Request("https://example.com/api/test", {
      headers: { "x-forwarded-for": "192.168.1.1, 10.0.0.1" },
    });
    const key = getRateLimitKey(request);
    expect(key).toBe("ip:192.168.1.1");
  });

  it("returns ip:unknown when no user and no forwarded header", async () => {
    const { getRateLimitKey } = await import("../helpers");
    const request = new Request("https://example.com/api/test");
    const key = getRateLimitKey(request);
    expect(key).toBe("ip:unknown");
  });
});
