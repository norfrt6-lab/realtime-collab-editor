import { Server } from "@hocuspocus/server";
import { Database } from "@hocuspocus/extension-database";
import { Redis } from "@hocuspocus/extension-redis";
import { MongoClient, ObjectId } from "mongodb";
import IORedis from "ioredis";

const MONGODB_URI =
  process.env.MONGODB_URI || "mongodb://localhost:27017/collab-editor";
const REDIS_URL = process.env.REDIS_URL || "redis://localhost:6379";
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

    new Redis({
      host: new URL(REDIS_URL).hostname,
      port: parseInt(new URL(REDIS_URL).port || "6379", 10),
    }),
  ],

  async onAuthenticate({ token, documentName }) {
    // Validate JWT token and check document permissions
    if (!token) {
      throw new Error("Authentication required");
    }

    // In production, decode and verify the JWT here.
    // For now, accept any non-empty token for development.
    const db = await getMongoDb();
    const doc = await db
      .collection("documents")
      .findOne({ _id: new ObjectId(documentName) });

    if (!doc) {
      throw new Error("Document not found");
    }

    return {
      user: { id: token },
    };
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
