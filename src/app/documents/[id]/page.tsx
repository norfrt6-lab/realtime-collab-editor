"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useParams, useRouter, useSearchParams } from "next/navigation";
import { useSession } from "next-auth/react";
import {
  ArrowLeft,
  Share2,
  History,
  MessageSquare,
  Activity,
  Tag,
  Folder,
  X,
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
import { ThemeToggle } from "@/components/ui/ThemeToggle";
import { useToast } from "@/components/ui/Toast";
import {
  createCollaborationProvider,
  getUserColor,
} from "@/lib/collaboration/provider";
import { TEMPLATES } from "@/lib/templates";
import type { DocumentMeta } from "@/types";

function getTagColor(tag: string) {
  let hash = 0;
  for (let i = 0; i < tag.length; i++) hash = tag.charCodeAt(i) + ((hash << 5) - hash);
  const hue = Math.abs(hash % 360);
  return `hsl(${hue}, 65%, 50%)`;
}

export default function EditorPage() {
  const params = useParams();
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session } = useSession();
  const { toast } = useToast();
  const documentId = params.id as string;
  const templateAppliedRef = useRef(false);

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

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if ((e.ctrlKey || e.metaKey) && e.key === "s") {
        e.preventDefault();
        fetch(`/api/documents/${documentId}/versions`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ label: "Quick save" }),
        }).then(() => toast("success", "Version saved"));
      }
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [documentId, toast]);

  if (loading || !session?.user) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[var(--surface-1)]">
        <div className="flex flex-col items-center gap-3 animate-fade-in">
          <div className="w-10 h-10 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
          <span className="text-sm text-[var(--muted-foreground)]">Loading editor...</span>
        </div>
      </div>
    );
  }

  const userInfo = {
    name: session.user.name || "Anonymous",
    color: getUserColor(session.user.id),
  };

  const activePanel = showVersions ? "versions" : showComments ? "comments" : showActivity ? "activity" : null;

  function togglePanel(panel: "versions" | "comments" | "activity") {
    setShowVersions(panel === "versions" ? !showVersions : false);
    setShowComments(panel === "comments" ? !showComments : false);
    setShowActivity(panel === "activity" ? !showActivity : false);
  }

  return (
    <div className="h-screen flex flex-col bg-[var(--surface-1)]">
      {/* Header */}
      <header className="flex items-center gap-3 px-4 py-2.5 border-b border-[var(--border)] bg-[var(--glass-bg)] backdrop-blur-md shrink-0 z-20">
        <button
          onClick={() => router.push("/")}
          className="p-2 rounded-full hover:bg-[var(--muted)] transition-colors"
          title="Back to documents"
        >
          <ArrowLeft size={18} />
        </button>

        <input
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          onBlur={handleTitleBlur}
          className="text-lg font-semibold bg-transparent border-none outline-none flex-1 min-w-0 border-b-2 border-transparent focus:border-[var(--primary)] transition-colors"
          placeholder="Untitled Document"
        />

        <div className="flex items-center gap-1.5">
          {providerRef.current && (
            <ActiveUsers
              provider={providerRef.current}
              currentUser={userInfo}
            />
          )}

          <div className="w-px h-5 bg-[var(--border)] mx-1 hidden sm:block" />

          <ExportMenu editor={editorRef.current} documentTitle={title} />

          {([
            { panel: "comments" as const, icon: <MessageSquare size={18} />, label: "Comments" },
            { panel: "versions" as const, icon: <History size={18} />, label: "Version History" },
            { panel: "activity" as const, icon: <Activity size={18} />, label: "Activity" },
          ]).map(({ panel, icon, label }) => (
            <button
              key={panel}
              onClick={() => togglePanel(panel)}
              className={`p-2 rounded-full transition-all duration-150 ${
                activePanel === panel
                  ? "bg-[var(--accent)] text-[var(--primary)] shadow-[var(--shadow-xs)]"
                  : "hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
              }`}
              title={label}
            >
              {icon}
            </button>
          ))}

          <button
            onClick={() => setShowShare(true)}
            className="p-2 rounded-full hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            title="Share"
          >
            <Share2 size={18} />
          </button>

          <ThemeToggle />
        </div>
      </header>

      {/* Metadata bar */}
      <div className="flex items-center gap-3 px-4 py-2 border-b border-[var(--border)] bg-[var(--card)] text-xs">
        <div className="flex items-center gap-1.5">
          <Folder size={12} className="text-[var(--muted-foreground)]" />
          {showFolderInput ? (
            <input
              value={folderInput}
              onChange={(e) => setFolderInput(e.target.value)}
              onBlur={handleSetFolder}
              onKeyDown={(e) => e.key === "Enter" && handleSetFolder()}
              placeholder="Folder name..."
              className="px-2 py-0.5 text-xs border border-[var(--border)] rounded-lg bg-[var(--surface-2)] w-28 focus:outline-none focus:ring-1 focus:ring-[var(--ring)]/50"
              autoFocus
            />
          ) : (
            <button
              onClick={() => {
                setFolderInput(doc?.folder || "");
                setShowFolderInput(true);
              }}
              className="text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
            >
              {doc?.folder || "Set folder"}
            </button>
          )}
        </div>

        <div className="w-px h-3 bg-[var(--border)]" />

        <div className="flex items-center gap-1.5 flex-wrap">
          <Tag size={12} className="text-[var(--muted-foreground)]" />
          {(doc?.tags || []).map((tag) => (
            <span
              key={tag}
              className="px-2 py-0.5 rounded-full flex items-center gap-1 group text-[10px] font-medium"
              style={{
                backgroundColor: `${getTagColor(tag)}15`,
                color: getTagColor(tag),
              }}
            >
              {tag}
              <button
                onClick={() => handleRemoveTag(tag)}
                className="opacity-0 group-hover:opacity-100 hover:text-[var(--destructive)] transition-opacity"
              >
                <X size={10} />
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
              className="px-2 py-0.5 text-xs border border-[var(--border)] rounded-lg bg-[var(--surface-2)] w-20 focus:outline-none focus:ring-1 focus:ring-[var(--ring)]/50"
              autoFocus
            />
          ) : (
            <button
              onClick={() => setShowTagInput(true)}
              className="text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-colors"
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
        <div className="flex-1 flex flex-col min-w-0">
          {providerRef.current && ydocRef.current ? (
            <CollabEditor
              ydoc={ydocRef.current}
              provider={providerRef.current}
              user={userInfo}
              documentId={documentId}
              onEditorReady={(editor) => {
                editorRef.current = editor;
                const templateId = searchParams.get("template");
                if (templateId && !templateAppliedRef.current) {
                  templateAppliedRef.current = true;
                  const template = TEMPLATES.find((t) => t.id === templateId);
                  if (template && editor.isEmpty) {
                    editor.commands.setContent(JSON.parse(JSON.stringify(template.content)));
                  }
                }
              }}
            />
          ) : (
            <div className="flex items-center justify-center flex-1">
              <div className="flex flex-col items-center gap-3">
                <div className="w-8 h-8 border-2 border-[var(--primary)] border-t-transparent rounded-full animate-spin" />
                <span className="text-sm text-[var(--muted-foreground)]">Connecting...</span>
              </div>
            </div>
          )}
        </div>

        {/* Side panels with slide animation */}
        {showVersions && (
          <div className="animate-slide-in-right">
            <VersionHistoryPanel
              documentId={documentId}
              onClose={() => setShowVersions(false)}
            />
          </div>
        )}

        {showComments && (
          <div className="animate-slide-in-right">
            <CommentsPanel
              documentId={documentId}
              onClose={() => setShowComments(false)}
            />
          </div>
        )}

        {showActivity && (
          <div className="animate-slide-in-right">
            <ActivityPanel
              documentId={documentId}
              onClose={() => setShowActivity(false)}
            />
          </div>
        )}
      </div>

      {showShare && doc && (
        <ShareDialog
          document={doc}
          isOwner={doc.ownerId === session.user.id}
          onClose={() => setShowShare(false)}
          onUpdate={fetchDoc}
        />
      )}
    </div>
  );
}
