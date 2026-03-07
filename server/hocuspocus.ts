import { Server } from "@hocuspocus/server";
import { Database } from "@hocuspocus/extension-database";
import { Redis } from "@hocuspocus/extension-redis";
import { MongoClient, ObjectId } from "mongodb";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/collab-editor";
const REDIS_URL = process.env.REDIS_URL;
const PORT = parseInt(process.env.HOCUSPOCUS_PORT || "1234", 10);

let mongoClient: MongoClient;

async function getMongoDb() {
  if (!mongoClient) {
    mongoClient = new MongoClient(MONGODB_URI);
    await mongoClient.connect();
  }
  return mongoClient.db();
}

const server = Server.configure({
  port: PORT,

  extensions: [
    new Database({
      async fetch({ documentName }) {
        const db = await getMongoDb();
        const doc = await db
          .collection("documents")
          .findOne({ _id: new ObjectId(documentName) });

        if (doc?.ydocState) {
          return Buffer.isBuffer(doc.ydocState)
            ? new Uint8Array(doc.ydocState)
            : new Uint8Array(doc.ydocState.buffer);
        }

        return null;
      },

      async store({ documentName, state }) {
        const db = await getMongoDb();
        await db.collection("documents").updateOne(
          { _id: new ObjectId(documentName) },
          {
            $set: {
              ydocState: Buffer.from(state),
              updatedAt: new Date(),
            },
          }
        );
      },
    }),

    ...(REDIS_URL
      ? [
          new Redis({
            host: new URL(REDIS_URL).hostname,
            port: parseInt(new URL(REDIS_URL).port || "6379", 10),
          }),
        ]
      : []),
  ],

  async onAuthenticate({ token, documentName }) {
    console.log(`[hocuspocus] Auth attempt: token=${token}, doc=${documentName}`);
    try {
      if (!token) {
        throw new Error("Authentication required");
      }

      // Validate token is a valid ObjectId (user ID)
      if (!ObjectId.isValid(token)) {
        throw new Error("Invalid authentication token");
      }

      const db = await getMongoDb();

      // Verify the user exists
      const user = await db
        .collection("users")
        .findOne({ _id: new ObjectId(token) }, { projection: { name: 1 } });

      if (!user) {
        throw new Error("User not found");
      }

      // Verify the document exists and user has access
      const doc = await db
        .collection("documents")
        .findOne(
          { _id: new ObjectId(documentName), isDeleted: { $ne: true } },
          { projection: { ownerId: 1, collaborators: 1, isPublic: 1 } }
        );

      if (!doc) {
        throw new Error("Document not found");
      }

      const userId = new ObjectId(token);
      const isOwner = doc.ownerId.equals(userId);
      const isCollaborator = (doc.collaborators || []).some(
        (c: { userId: ObjectId }) => c.userId.equals(userId)
      );

      if (!isOwner && !isCollaborator && !doc.isPublic) {
        throw new Error("Access denied");
      }

      console.log(`[hocuspocus] Auth success: user=${user.name}`);
      return {
        user: { id: token, name: user.name },
      };
    } catch (err) {
      console.error(`[hocuspocus] Auth failed:`, err);
      throw err;
    }
  },

  async onConnect({ documentName }) {
    console.log(`[hocuspocus] Client connected to ${documentName}`);
  },

  async onDisconnect({ documentName }) {
    console.log(`[hocuspocus] Client disconnected from ${documentName}`);
  },
});

server.listen().then(() => {
  console.log(`[hocuspocus] WebSocket server running on port ${PORT}`);
});

// Graceful shutdown
process.on("SIGINT", async () => {
  await server.destroy();
  if (mongoClient) await mongoClient.close();
  process.exit(0);
});

process.on("SIGTERM", async () => {
  await server.destroy();
  if (mongoClient) await mongoClient.close();
  process.exit(0);
});
