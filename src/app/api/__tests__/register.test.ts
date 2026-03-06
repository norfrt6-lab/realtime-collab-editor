/**
 * @jest-environment node
 */

// Mock mongodb before anything else
jest.mock("mongodb", () => {
  class MockObjectId {
    id: string;
    constructor(id?: string) {
      this.id = id || Math.random().toString(16).slice(2, 26).padEnd(24, "0");
    }
    toString() { return this.id; }
    equals(other: MockObjectId) { return this.id === other.toString(); }
    static isValid(id: string) {
      return typeof id === "string" && /^[0-9a-fA-F]{24}$/.test(id);
    }
  }
  return { ObjectId: MockObjectId };
});

jest.mock("next/server", () => {
  class MockNextResponse {
    _body: unknown;
    status: number;
    constructor(body: unknown, status: number) {
      this._body = body;
      this.status = status;
    }
    async json() { return this._body; }
    static json(body: unknown, init?: { status?: number; headers?: Record<string, string> }) {
      return new MockNextResponse(body, init?.status || 200);
    }
  }
  return { NextResponse: MockNextResponse };
});

// Mock next-auth (imported transitively via helpers.ts)
jest.mock("next-auth", () => ({
  getServerSession: jest.fn(),
}));

jest.mock("@/lib/auth", () => ({
  authOptions: {},
}));

jest.mock("@/lib/rate-limit", () => ({
  rateLimit: () => ({ allowed: true, remaining: 99, resetAt: Date.now() + 60000 }),
  rateLimitHeaders: () => ({}),
}));

const mockFindOne = jest.fn();
const mockInsertOne = jest.fn();

jest.mock("@/lib/db/collections", () => ({
  getUsersCollection: jest.fn(() =>
    Promise.resolve({
      findOne: mockFindOne,
      insertOne: mockInsertOne,
    })
  ),
}));

jest.mock("bcryptjs", () => ({
  hash: jest.fn().mockResolvedValue("hashed-password"),
}));

import { ObjectId } from "mongodb";

describe("POST /api/auth/register", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 when fields are missing", async () => {
    const { POST } = await import("@/app/api/auth/register/route");
    const request = new Request("https://example.com/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@test.com" }),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("required");
  });

  it("returns 400 for invalid email", async () => {
    const { POST } = await import("@/app/api/auth/register/route");
    const request = new Request("https://example.com/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "notanemail", name: "Test", password: "123456" }),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("email");
  });

  it("returns 400 for short password", async () => {
    const { POST } = await import("@/app/api/auth/register/route");
    const request = new Request("https://example.com/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@test.com", name: "Test", password: "123" }),
    });
    const response = await POST(request);

    expect(response.status).toBe(400);
    const data = await response.json();
    expect(data.error).toContain("6 characters");
  });

  it("returns 409 when email already exists", async () => {
    mockFindOne.mockResolvedValueOnce({ _id: new ObjectId(), email: "test@test.com" });

    const { POST } = await import("@/app/api/auth/register/route");
    const request = new Request("https://example.com/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "test@test.com", name: "Test", password: "123456" }),
    });
    const response = await POST(request);

    expect(response.status).toBe(409);
    const data = await response.json();
    expect(data.error).toContain("already registered");
  });

  it("creates user successfully with 201", async () => {
    mockFindOne.mockResolvedValueOnce(null);
    const insertedId = new ObjectId();
    mockInsertOne.mockResolvedValueOnce({ insertedId });

    const { POST } = await import("@/app/api/auth/register/route");
    const request = new Request("https://example.com/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "new@test.com", name: "New User", password: "secure123" }),
    });
    const response = await POST(request);

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.id).toBe(insertedId.toString());
    expect(data.email).toBe("new@test.com");
  });

  it("normalizes email to lowercase", async () => {
    mockFindOne.mockResolvedValueOnce(null);
    mockInsertOne.mockResolvedValueOnce({ insertedId: new ObjectId() });

    const { POST } = await import("@/app/api/auth/register/route");
    const request = new Request("https://example.com/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: "Test@Example.COM", name: "Test", password: "123456" }),
    });
    const response = await POST(request);

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.email).toBe("test@example.com");
  });
});
