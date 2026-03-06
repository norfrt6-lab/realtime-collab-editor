"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  Share2,
  History,
  MessageSquare,
  Activity,
  Tag,
  Folder,
} from "lucide-react";
import type { HocuspocusProvider } from "@hocuspocus/provider";
import type * as Y from "yjs";

import { CollabEditor } from "@/components/editor/CollabEditor";
import { ExportMenu } from "@/components/editor/ExportMenu";
import { WordCount } from "@/components/editor/WordCount";
import { ActiveUsers } from "@/components/presence/ActiveUsers";
import { TypingIndicator } from "@/components/presence/TypingIndicator";
import { VersionHistoryPanel } from "@/components/version-history/VersionHistoryPanel";
import { CommentsPanel } from "@/components/comments/CommentsPanel";
import { ActivityPanel } from "@/components/editor/ActivityPanel";
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
  const [showActivity, setShowActivity] = useState(false);
  const [showShare, setShowShare] = useState(false);
  const [tagInput, setTagInput] = useState("");
  const [showTagInput, setShowTagInput] = useState(false);
  const [folderInput, setFolderInput] = useState("");
  const [showFolderInput, setShowFolderInput] = useState(false);

  const providerRef = useRef<HocuspocusProvider | null>(null);
  const ydocRef = useRef<Y.Doc | null>(null);
  const editorRef = useRef<import("@tiptap/react").Editor | null>(null);

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

  async function handleAddTag() {
    if (!tagInput.trim() || !doc) return;
    const newTags = [...(doc.tags || []), tagInput.trim()];
    await fetch(`/api/documents/${documentId}/tags`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags: newTags }),
    });
    setDoc({ ...doc, tags: newTags });
    setTagInput("");
    setShowTagInput(false);
  }

  async function handleRemoveTag(tag: string) {
    if (!doc) return;
    const newTags = (doc.tags || []).filter((t) => t !== tag);
    await fetch(`/api/documents/${documentId}/tags`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ tags: newTags }),
    });
    setDoc({ ...doc, tags: newTags });
  }

  async function handleSetFolder() {
    if (!doc) return;
    await fetch(`/api/documents/${documentId}/folder`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ folder: folderInput.trim() || null }),
    });
    setDoc({ ...doc, folder: folderInput.trim() || undefined });
    setShowFolderInput(false);
  }

  // Keyboard shortcut: Ctrl+S for manual version save
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        fetch(`/api/documents/${documentId}/versions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label: "Quick save" }),
        });
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [documentId]);

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

          <ExportMenu editor={editorRef.current} documentTitle={title} />

          <button
            onClick={() => {
              setShowComments((v) => !v);
              setShowVersions(false);
              setShowActivity(false);
            }}
            className={`p-1.5 rounded-lg hover:bg-[var(--muted)] ${
              showComments ? "bg-[var(--accent)] text-[var(--primary)]" : ""
            }`}
            title="Comments"
          >
            <MessageSquare size={20} />
          </button>

          <button
            onClick={() => {
              setShowVersions((v) => !v);
              setShowComments(false);
              setShowActivity(false);
            }}
            className={`p-1.5 rounded-lg hover:bg-[var(--muted)] ${
              showVersions ? "bg-[var(--accent)] text-[var(--primary)]" : ""
            }`}
            title="Version History (Ctrl+S to save)"
          >
            <History size={20} />
          </button>

          <button
            onClick={() => {
              setShowActivity((v) => !v);
              setShowComments(false);
              setShowVersions(false);
            }}
            className={`p-1.5 rounded-lg hover:bg-[var(--muted)] ${
              showActivity ? "bg-[var(--accent)] text-[var(--primary)]" : ""
            }`}
            title="Activity Feed"
          >
            <Activity size={20} />
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

      {/* Document metadata bar */}
      <div className="flex items-center gap-3 px-4 py-1.5 border-b border-[var(--border)] text-xs">
        {/* Folder */}
        <div className="flex items-center gap-1">
          <Folder size={12} className="text-[var(--muted-foreground)]" />
          {showFolderInput ? (
            <input
              value={folderInput}
              onChange={(e) => setFolderInput(e.target.value)}
              onBlur={handleSetFolder}
              onKeyDown={(e) => e.key === "Enter" && handleSetFolder()}
              placeholder="Folder name..."
              className="px-1 py-0.5 text-xs border border-[var(--border)] rounded bg-[var(--background)] w-24"
              autoFocus
            />
          ) : (
            <button
              onClick={() => {
                setFolderInput(doc?.folder || "");
                setShowFolderInput(true);
              }}
              className="text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
            >
              {doc?.folder || "Set folder"}
            </button>
          )}
        </div>

        <div className="w-px h-3 bg-[var(--border)]" />

        {/* Tags */}
        <div className="flex items-center gap-1 flex-wrap">
          <Tag size={12} className="text-[var(--muted-foreground)]" />
          {(doc?.tags || []).map((tag) => (
            <span
              key={tag}
              className="px-1.5 py-0.5 bg-[var(--muted)] rounded-full flex items-center gap-0.5 group"
            >
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="text-[var(--muted-foreground)] hover:text-red-500 hidden group-hover:inline"
              >
                x
              </button>
            </span>
          ))}
          {showTagInput ? (
            <input
              value={tagInput}
              onChange={(e) => setTagInput(e.target.value)}
              onBlur={handleAddTag}
              onKeyDown={(e) => e.key === "Enter" && handleAddTag()}
              placeholder="Tag..."
              className="px-1 py-0.5 text-xs border border-[var(--border)] rounded bg-[var(--background)] w-16"
              autoFocus
            />
          ) : (
            <button
              onClick={() => setShowTagInput(true)}
              className="text-[var(--muted-foreground)] hover:text-[var(--primary)]"
            >
              + Add tag
            </button>
          )}
        </div>

        <div className="ml-auto">
          <WordCount editor={editorRef.current} />
        </div>
      </div>

      {/* Typing indicator */}
      {providerRef.current && (
        <TypingIndicator
          provider={providerRef.current}
          currentUserName={userInfo.name}
        />
      )}

      {/* Main content */}
      <div className="flex flex-1 min-h-0">
        {/* Editor */}
        <div className="flex-1 flex flex-col min-w-0">
          {providerRef.current && ydocRef.current ? (
            <CollabEditor
              ydoc={ydocRef.current}
              provider={providerRef.current}
              user={userInfo}
              onEditorReady={(editor) => {
                editorRef.current = editor;
              }}
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

        {showActivity && (
          <ActivityPanel
            documentId={documentId}
            onClose={() => setShowActivity(false)}
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
