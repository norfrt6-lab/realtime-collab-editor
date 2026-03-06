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

const mockFind = jest.fn();
const mockInsertOne = jest.fn();
const mockFindOne = jest.fn();
const mockUpdateOne = jest.fn();

const mockCountDocuments = jest.fn();

const mockDocsCollection = {
  find: mockFind,
  insertOne: mockInsertOne,
  findOne: mockFindOne,
  updateOne: mockUpdateOne,
  countDocuments: mockCountDocuments,
};

jest.mock("@/lib/db/collections", () => ({
  getDocumentsCollection: jest.fn(() => Promise.resolve(mockDocsCollection)),
  getUsersCollection: jest.fn(() => Promise.resolve(mockDocsCollection)),
}));

jest.mock("@/lib/db/activity", () => ({
  logActivity: jest.fn(),
  createNotification: jest.fn(),
}));

import { getServerSession } from "next-auth";
import { ObjectId } from "mongodb";

const mockGetServerSession = getServerSession as jest.MockedFunction<typeof getServerSession>;

const mockUserId = new ObjectId("aabbccddeeff001122334455");
const mockDocId = new ObjectId("112233445566778899aabbcc");

const mockDoc = {
  _id: mockDocId,
  title: "Test Document",
  ownerId: mockUserId,
  collaborators: [],
  tags: ["test"],
  starredBy: [],
  isPublic: false,
  isDeleted: false,
  createdAt: new Date("2024-01-01"),
  updatedAt: new Date("2024-01-02"),
  folder: null,
};

describe("GET /api/documents", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockCountDocuments.mockResolvedValue(1);
    mockFind.mockReturnValue({
      sort: jest.fn().mockReturnValue({
        project: jest.fn().mockReturnValue({
          skip: jest.fn().mockReturnValue({
            limit: jest.fn().mockReturnValue({
              toArray: jest.fn().mockResolvedValue([mockDoc]),
            }),
          }),
        }),
      }),
    });
  });

  it("returns 401 when not authenticated", async () => {
    mockGetServerSession.mockResolvedValueOnce(null);

    const { GET } = await import("@/app/api/documents/route");
    const request = new Request("https://example.com/api/documents");
    const response = await GET(request);

    expect(response.status).toBe(401);
    const data = await response.json();
    expect(data.error).toBe("Unauthorized");
  });

  it("returns documents when authenticated", async () => {
    mockGetServerSession.mockResolvedValueOnce({
      user: { id: mockUserId.toString(), name: "Test", email: "test@test.com" },
      expires: "",
    });

    const { GET } = await import("@/app/api/documents/route");
    const request = new Request("https://example.com/api/documents");
    const response = await GET(request);

    expect(response.status).toBe(200);
    const data = await response.json();
    expect(data.documents).toBeDefined();
    expect(Array.isArray(data.documents)).toBe(true);
    expect(data.documents[0].title).toBe("Test Document");
    expect(data.total).toBe(1);
    expect(data.hasMore).toBe(false);
  });
});

describe("POST /api/documents", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    mockInsertOne.mockResolvedValue({
      insertedId: new ObjectId(),
    });
  });

  it("returns 401 when not authenticated", async () => {
    mockGetServerSession.mockResolvedValueOnce(null);

    const { POST } = await import("@/app/api/documents/route");
    const request = new Request("https://example.com/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Doc" }),
    });
    const response = await POST(request);

    expect(response.status).toBe(401);
  });

  it("creates a document when authenticated", async () => {
    mockGetServerSession.mockResolvedValueOnce({
      user: { id: mockUserId.toString(), name: "Test", email: "test@test.com" },
      expires: "",
    });

    const { POST } = await import("@/app/api/documents/route");
    const request = new Request("https://example.com/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ title: "New Doc" }),
    });
    const response = await POST(request);

    expect(response.status).toBe(201);
    const data = await response.json();
    expect(data.id).toBeDefined();
  });

  it("uses default title when not provided", async () => {
    mockGetServerSession.mockResolvedValueOnce({
      user: { id: mockUserId.toString(), name: "Test", email: "test@test.com" },
      expires: "",
    });

    const { POST } = await import("@/app/api/documents/route");
    const request = new Request("https://example.com/api/documents", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({}),
    });
    await POST(request);

    expect(mockInsertOne).toHaveBeenCalledWith(
      expect.objectContaining({ title: "Untitled Document" })
    );
  });
});

describe("DELETE /api/documents/:id", () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it("returns 400 for invalid document ID", async () => {
    mockGetServerSession.mockResolvedValueOnce({
      user: { id: mockUserId.toString(), name: "Test", email: "test@test.com" },
      expires: "",
    });

    const mod = await import("@/app/api/documents/[id]/route");
    const request = new Request("https://example.com/api/documents/invalid-id", {
      method: "DELETE",
    });
    const response = await mod.DELETE(request, {
      params: Promise.resolve({ id: "invalid-id" }),
    });

    expect(response.status).toBe(400);
  });

  it("returns 404 when document not found", async () => {
    mockGetServerSession.mockResolvedValueOnce({
      user: { id: mockUserId.toString(), name: "Test", email: "test@test.com" },
      expires: "",
    });
    mockFindOne.mockResolvedValueOnce(null);

    const mod = await import("@/app/api/documents/[id]/route");
    const request = new Request(
      `https://example.com/api/documents/${mockDocId}`,
      { method: "DELETE" }
    );
    const response = await mod.DELETE(request, {
      params: Promise.resolve({ id: mockDocId.toString() }),
    });

    expect(response.status).toBe(404);
  });

  it("returns 403 when not the owner", async () => {
    const otherUserId = new ObjectId("ffeeddccbbaa998877665544");
    mockGetServerSession.mockResolvedValueOnce({
      user: { id: otherUserId.toString(), name: "Other", email: "other@test.com" },
      expires: "",
    });
    mockFindOne.mockResolvedValueOnce(mockDoc);

    const mod = await import("@/app/api/documents/[id]/route");
    const request = new Request(
      `https://example.com/api/documents/${mockDocId}`,
      { method: "DELETE" }
    );
    const response = await mod.DELETE(request, {
      params: Promise.resolve({ id: mockDocId.toString() }),
    });

    expect(response.status).toBe(403);
  });
});
