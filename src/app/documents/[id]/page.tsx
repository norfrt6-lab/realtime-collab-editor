"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import { ArrowLeft, Share2, History, MessageSquare } from "lucide-react";
import type { HocuspocusProvider } from "@hocuspocus/provider";
import type * as Y from "yjs";

import { CollabEditor } from "@/components/editor/CollabEditor";
import { ActiveUsers } from "@/components/presence/ActiveUsers";
import { VersionHistoryPanel } from "@/components/version-history/VersionHistoryPanel";
import { CommentsPanel } from "@/components/comments/CommentsPanel";
import { ShareDialog } from "@/components/ui/ShareDialog";
import {
  createCollaborationProvider,
  getUserColor,
} from "@/lib/collaboration/provider";
import type { DocumentMeta } from "@/types";

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const { data: session } = useSession();
  const documentId = params.id as string;

  const [doc, setDoc] = useState<DocumentMeta | null>(null);
  const [title, setTitle] = useState("");
  const [loading, setLoading] = useState(true);
  const [showVersions, setShowVersions] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [showShare, setShowShare] = useState(false);

  const providerRef = useRef<HocuspocusProvider | null>(null);
  const ydocRef = useRef<Y.Doc | null>(null);

  // Fetch document metadata
  const fetchDoc = useCallback(async () => {
    const res = await fetch(`/api/documents/${documentId}`);
    if (!res.ok) {
      router.push("/");
      return;
    }
    const data = await res.json();
    setDoc(data);
    setTitle(data.title);
    setLoading(false);
  }, [documentId, router]);

  useEffect(() => {
    fetchDoc();
  }, [fetchDoc]);

  // Initialize collaboration provider
  useEffect(() => {
    if (!session?.user?.id || !doc) return;

    const user = {
      name: session.user.name || "Anonymous",
      color: getUserColor(session.user.id),
      avatar: session.user.image,
    };

    const { ydoc, provider } = createCollaborationProvider(
      documentId,
      session.user.id,
      user
    );

    ydocRef.current = ydoc;
    providerRef.current = provider;

    return () => {
      provider.destroy();
      ydoc.destroy();
    };
  }, [documentId, session?.user, doc]);

  // Save title on blur
  async function handleTitleBlur() {
    if (title !== doc?.title) {
      await fetch(`/api/documents/${documentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title }),
      });
    }
  }

  if (loading || !session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-pulse text-[var(--muted-foreground)]">
          Loading editor...
        </div>
      </div>
    );
  }

  const userInfo = {
    name: session.user.name || "Anonymous",
    color: getUserColor(session.user.id),
  };

  return (
    <div className="h-screen flex flex-col">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-2 border-b border-[var(--border)] shrink-0">
        <button
          onClick={() => router.push("/")}
          className="p-1.5 rounded-lg hover:bg-[var(--muted)]"
          title="Back to documents"
        >
          <ArrowLeft size={20} />
        </button>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          className="text-lg font-semibold bg-transparent border-none outline-none flex-1 min-w-0"
          placeholder="Untitled Document"
        />

        <div className="flex items-center gap-2">
          {providerRef.current && (
            <ActiveUsers
              provider={providerRef.current}
              currentUser={userInfo}
            />
          )}

          <button
            onClick={() => setShowComments((v) => !v)}
            className={`p-1.5 rounded-lg hover:bg-[var(--muted)] ${
              showComments ? "bg-[var(--accent)] text-[var(--primary)]" : ""
            }`}
            title="Comments"
          >
            <MessageSquare size={20} />
          </button>

          <button
            onClick={() => setShowVersions((v) => !v)}
            className={`p-1.5 rounded-lg hover:bg-[var(--muted)] ${
              showVersions ? "bg-[var(--accent)] text-[var(--primary)]" : ""
            }`}
            title="Version History"
          >
            <History size={20} />
          </button>

          <button
            onClick={() => setShowShare(true)}
            className="p-1.5 rounded-lg hover:bg-[var(--muted)]"
            title="Share"
          >
            <Share2 size={20} />
          </button>
        </div>
      </header>

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Editor */}
        <div className="flex-1 flex flex-col min-w-0">
          {providerRef.current && ydocRef.current ? (
            <CollabEditor
              ydoc={ydocRef.current}
              provider={providerRef.current}
              user={userInfo}
            />
          ) : (
            <div className="flex items-center justify-center flex-1">
              <div className="animate-pulse text-[var(--muted-foreground)]">
                Connecting...
              </div>
            </div>
          )}
        </div>

        {/* Side panels */}
        {showVersions && (
          <VersionHistoryPanel
            documentId={documentId}
            onClose={() => setShowVersions(false)}
          />
        )}

        {showComments && (
          <CommentsPanel
            documentId={documentId}
            onClose={() => setShowComments(false)}
          />
        )}
      </div>

      {/* Share dialog */}
      {showShare && doc && (
        <ShareDialog
          document={doc}
          onClose={() => setShowShare(false)}
          onUpdate={fetchDoc}
        />
      )}
    </div>
  );
}
