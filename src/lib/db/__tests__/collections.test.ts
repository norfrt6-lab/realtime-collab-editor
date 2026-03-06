import { getDb } from "../client";

// Mock MongoDB
jest.mock("../client", () => ({
  getDb: jest.fn(),
}));

const mockCollection = jest.fn();
const mockDb = { collection: mockCollection };

(getDb as jest.Mock).mockResolvedValue(mockDb);

describe("DB collections", () => {
  beforeEach(() => {
    jest.clearAllMocks();
    (getDb as jest.Mock).mockResolvedValue(mockDb);
  });

  it("getUsersCollection returns users collection", async () => {
    const { getUsersCollection } = await import("../collections");
    mockCollection.mockReturnValue("users-collection");
    const result = await getUsersCollection();
    expect(mockCollection).toHaveBeenCalledWith("users");
    expect(result).toBe("users-collection");
  });

  it("getDocumentsCollection returns documents collection", async () => {
    const { getDocumentsCollection } = await import("../collections");
    mockCollection.mockReturnValue("documents-collection");
    const result = await getDocumentsCollection();
    expect(mockCollection).toHaveBeenCalledWith("documents");
    expect(result).toBe("documents-collection");
  });

  it("getVersionsCollection returns versions collection", async () => {
    const { getVersionsCollection } = await import("../collections");
    mockCollection.mockReturnValue("versions-collection");
    const result = await getVersionsCollection();
    expect(mockCollection).toHaveBeenCalledWith("versions");
    expect(result).toBe("versions-collection");
  });

  it("getCommentsCollection returns comments collection", async () => {
    const { getCommentsCollection } = await import("../collections");
    mockCollection.mockReturnValue("comments-collection");
    const result = await getCommentsCollection();
    expect(mockCollection).toHaveBeenCalledWith("comments");
    expect(result).toBe("comments-collection");
  });
});
