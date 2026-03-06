import { HocuspocusProvider } from "@hocuspocus/provider";
import * as Y from "yjs";
import { IndexeddbPersistence } from "y-indexeddb";

const WS_URL = process.env.NEXT_PUBLIC_WS_URL || "ws://localhost:1234";

export function createCollaborationProvider(
  documentId: string,
  token: string,
  user: { name: string; color: string; avatar?: string }
) {
  const ydoc = new Y.Doc();

  // Offline persistence via IndexedDB
  const indexeddbProvider = new IndexeddbPersistence(documentId, ydoc);

  const provider = new HocuspocusProvider({
    url: WS_URL,
    name: documentId,
    token,
    document: ydoc,
    onSynced() {
      console.log("[collab] Synced with server");
    },
    onDisconnect() {
      console.log("[collab] Disconnected — offline mode active");
    },
  });

  // Set user awareness
  provider.setAwarenessField("user", user);

  return { ydoc, provider, indexeddbProvider };
}

// Deterministic color from string hash
export function getUserColor(userId: string): string {
  const colors = [
    "#f44336", "#e91e63", "#9c27b0", "#673ab7", "#3f51b5",
    "#2196f3", "#03a9f4", "#00bcd4", "#009688", "#4caf50",
    "#8bc34a", "#ff9800", "#ff5722", "#795548", "#607d8b",
  ];
  let hash = 0;
  for (let i = 0; i < userId.length; i++) {
    hash = userId.charCodeAt(i) + ((hash << 5) - hash);
  }
  return colors[Math.abs(hash) % colors.length];
}
