"use client";

import { useEffect, useState, useCallback } from "react";
import { useSession } from "next-auth/react";
import { X, Check, Send, MessageCircle } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { CommentData } from "@/types";

interface CommentsPanelProps {
  documentId: string;
  onClose: () => void;
}

export function CommentsPanel({ documentId, onClose }: CommentsPanelProps) {
  const { data: session } = useSession();
  const [comments, setComments] = useState<CommentData[]>([]);
  const [loading, setLoading] = useState(true);
  const [newComment, setNewComment] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [replyText, setReplyText] = useState("");

  const fetchComments = useCallback(async () => {
    const res = await fetch(`/api/documents/${documentId}/comments`);
    if (res.ok) {
      setComments(await res.json());
    }
    setLoading(false);
  }, [documentId]);

  useEffect(() => {
    fetchComments();
    // Poll for new comments every 5s
    const interval = setInterval(fetchComments, 5000);
    return () => clearInterval(interval);
  }, [fetchComments]);

  async function handleAddComment() {
    if (!newComment.trim()) return;

    await fetch(`/api/documents/${documentId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        threadId: `thread-${Date.now()}`,
        content: newComment,
      }),
    });

    setNewComment("");
    fetchComments();
  }

  async function handleReply(threadId: string, parentId: string) {
    if (!replyText.trim()) return;

    await fetch(`/api/documents/${documentId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        threadId,
        content: replyText,
        parentId,
      }),
    });

    setReplyTo(null);
    setReplyText("");
    fetchComments();
  }

  async function handleResolve(commentId: string, resolved: boolean) {
    await fetch(`/api/documents/${documentId}/comments`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId, resolved }),
    });
    fetchComments();
  }

  // Group comments by thread
  const threads = comments.reduce<Record<string, CommentData[]>>(
    (acc, comment) => {
      if (!acc[comment.threadId]) {
        acc[comment.threadId] = [];
      }
      acc[comment.threadId].push(comment);
      return acc;
    },
    {}
  );

  return (
    <div className="w-80 border-l border-[var(--border)] flex flex-col bg-[var(--background)]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <h3 className="font-semibold">Comments</h3>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-[var(--muted)]"
        >
          <X size={18} />
        </button>
      </div>

      {/* Add new comment */}
      <div className="px-4 py-3 border-b border-[var(--border)]">
        <div className="flex gap-2">
          <input
            value={newComment}
            onChange={(e) => setNewComment(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && handleAddComment()}
            placeholder="Add a comment..."
            className="flex-1 px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
          />
          <button
            onClick={handleAddComment}
            disabled={!newComment.trim()}
            className="p-1.5 rounded-lg bg-[var(--primary)] text-[var(--primary-foreground)] hover:opacity-90 disabled:opacity-50"
          >
            <Send size={16} />
          </button>
        </div>
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div
                key={i}
                className="h-20 bg-[var(--muted)] rounded animate-pulse"
              />
            ))}
          </div>
        ) : Object.keys(threads).length === 0 ? (
          <div className="p-4 text-center text-sm text-[var(--muted-foreground)]">
            <MessageCircle className="mx-auto mb-2" size={32} />
            No comments yet
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {Object.entries(threads).map(([threadId, threadComments]) => {
              const root = threadComments.find((c) => !c.parentId);
              const replies = threadComments.filter((c) => c.parentId);
              if (!root) return null;

              return (
                <div
                  key={threadId}
                  className={`px-4 py-3 ${
                    root.resolved ? "opacity-60" : ""
                  }`}
                >
                  {/* Root comment */}
                  <div className="flex items-start gap-2">
                    <div
                      className="w-6 h-6 rounded-full bg-[var(--primary)] flex items-center justify-center text-xs text-white shrink-0"
                    >
                      {(root.authorName || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {root.authorName || "Unknown"}
                        </span>
                        <span className="text-xs text-[var(--muted-foreground)]">
                          {formatDistanceToNow(new Date(root.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <p className="text-sm mt-0.5">{root.content}</p>

                      <div className="flex items-center gap-2 mt-1">
                        <button
                          onClick={() =>
                            setReplyTo(
                              replyTo === root.id ? null : root.id
                            )
                          }
                          className="text-xs text-[var(--primary)] hover:underline"
                        >
                          Reply
                        </button>
                        {session?.user?.id && (
                          <button
                            onClick={() =>
                              handleResolve(root.id, !root.resolved)
                            }
                            className="text-xs text-[var(--muted-foreground)] hover:text-[var(--primary)] flex items-center gap-0.5"
                          >
                            <Check size={12} />
                            {root.resolved ? "Unresolve" : "Resolve"}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Replies */}
                  {replies.map((reply) => (
                    <div
                      key={reply.id}
                      className="flex items-start gap-2 ml-8 mt-2"
                    >
                      <div className="w-5 h-5 rounded-full bg-[var(--muted)] flex items-center justify-center text-xs shrink-0">
                        {(reply.authorName || "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">
                            {reply.authorName || "Unknown"}
                          </span>
                          <span className="text-xs text-[var(--muted-foreground)]">
                            {formatDistanceToNow(new Date(reply.createdAt), {
                              addSuffix: true,
                            })}
                          </span>
                        </div>
                        <p className="text-sm">{reply.content}</p>
                      </div>
                    </div>
                  ))}

                  {/* Reply input */}
                  {replyTo === root.id && (
                    <div className="flex gap-2 ml-8 mt-2">
                      <input
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" &&
                          handleReply(threadId, root.id)
                        }
                        placeholder="Reply..."
                        className="flex-1 px-2 py-1 text-sm border border-[var(--border)] rounded bg-[var(--background)] focus:outline-none focus:ring-1 focus:ring-[var(--primary)]"
                        autoFocus
                      />
                      <button
                        onClick={() => handleReply(threadId, root.id)}
                        disabled={!replyText.trim()}
                        className="p-1 rounded bg-[var(--primary)] text-[var(--primary-foreground)] disabled:opacity-50"
                      >
                        <Send size={14} />
                      </button>
                    </div>
                  )}
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
