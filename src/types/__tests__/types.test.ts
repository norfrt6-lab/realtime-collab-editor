import type {
  DocumentMeta,
  VersionMeta,
  CommentData,
  PresenceUser,
} from "../index";

describe("Type definitions", () => {
  it("DocumentMeta has correct shape", () => {
    const doc: DocumentMeta = {
      id: "123",
      title: "Test Doc",
      ownerId: "user-1",
      collaborators: [
        { userId: "user-2", role: "editor", addedAt: "2024-01-01T00:00:00Z" },
      ],
      createdAt: "2024-01-01T00:00:00Z",
      updatedAt: "2024-01-01T00:00:00Z",
      isPublic: false,
      tags: ["project", "draft"],
      isStarred: true,
    };

    expect(doc.id).toBe("123");
    expect(doc.collaborators).toHaveLength(1);
    expect(doc.collaborators[0].role).toBe("editor");
  });

  it("VersionMeta has correct shape", () => {
    const version: VersionMeta = {
      id: "v-1",
      documentId: "doc-1",
      createdBy: "user-1",
      createdAt: "2024-01-01T00:00:00Z",
      label: "Initial version",
    };

    expect(version.label).toBe("Initial version");
  });

  it("CommentData has correct shape", () => {
    const comment: CommentData = {
      id: "c-1",
      documentId: "doc-1",
      threadId: "thread-1",
      content: "This is a comment",
      authorId: "user-1",
      authorName: "Test User",
      parentId: null,
      resolved: false,
      createdAt: "2024-01-01T00:00:00Z",
    };

    expect(comment.resolved).toBe(false);
    expect(comment.parentId).toBeNull();
  });

  it("PresenceUser has correct shape", () => {
    const user: PresenceUser = {
      name: "Test User",
      color: "#ff0000",
      avatar: "https://example.com/avatar.png",
    };

    expect(user.name).toBe("Test User");
  });
});
