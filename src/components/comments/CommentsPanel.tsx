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
    const interval = setInterval(fetchComments, 5000);
    return () => clearInterval(interval);
  }, [fetchComments]);

  async function handleAddComment() {
    if (!newComment.trim()) return;

    const res = await fetch(`/api/documents/${documentId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        threadId: `thread-${crypto.randomUUID()}`,
        content: newComment,
      }),
    });

    if (res.ok) {
      setNewComment("");
      fetchComments();
    }
  }

  async function handleReply(threadId: string, parentId: string) {
    if (!replyText.trim()) return;

    const res = await fetch(`/api/documents/${documentId}/comments`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        threadId,
        content: replyText,
        parentId,
      }),
    });

    if (res.ok) {
      setReplyTo(null);
      setReplyText("");
      fetchComments();
    }
  }

  async function handleResolve(commentId: string, resolved: boolean) {
    const res = await fetch(`/api/documents/${documentId}/comments`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ commentId, resolved }),
    });
    if (res.ok) {
      fetchComments();
    }
  }

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
    <div className="w-80 border-l border-[var(--border)] flex flex-col bg-[var(--card)] shadow-[-4px_0_15px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <h3 className="font-semibold">Comments</h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-[var(--muted)] transition-colors"
        >
          <X size={16} />
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
            className="flex-1 px-3 py-2 text-sm border border-[var(--border)] rounded-xl bg-[var(--surface-2)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/50 focus:border-[var(--ring)] transition-shadow"
          />
          <button
            onClick={handleAddComment}
            disabled={!newComment.trim()}
            className="p-2 rounded-xl bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] text-white hover:opacity-90 disabled:opacity-50 transition-opacity shadow-[var(--shadow-xs)]"
          >
            <Send size={14} />
          </button>
        </div>
      </div>

      {/* Comments list */}
      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(3)].map((_, i) => (
              <div key={i} className="h-20 rounded-lg shimmer-loading" />
            ))}
          </div>
        ) : Object.keys(threads).length === 0 ? (
          <div className="p-8 text-center">
            <div className="w-12 h-12 mx-auto mb-3 rounded-xl bg-[var(--muted)] flex items-center justify-center">
              <MessageCircle className="text-[var(--muted-foreground)]" size={24} />
            </div>
            <p className="text-sm text-[var(--muted-foreground)]">No comments yet</p>
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
                  className={`px-4 py-3 transition-opacity ${
                    root.resolved ? "opacity-50" : ""
                  }`}
                >
                  <div className="flex items-start gap-2.5">
                    <div
                      className="w-7 h-7 rounded-full bg-[var(--primary)] flex items-center justify-center text-xs text-white font-medium shrink-0 shadow-[var(--shadow-xs)]"
                    >
                      {(root.authorName || "?").charAt(0).toUpperCase()}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-2">
                        <span className="text-sm font-medium truncate">
                          {root.authorName || "Unknown"}
                        </span>
                        <span className="text-[10px] text-[var(--muted-foreground)]">
                          {formatDistanceToNow(new Date(root.createdAt), {
                            addSuffix: true,
                          })}
                        </span>
                      </div>
                      <p className="text-sm mt-0.5 text-[var(--foreground)]">{root.content}</p>

                      <div className="flex items-center gap-3 mt-1.5">
                        <button
                          onClick={() =>
                            setReplyTo(replyTo === root.id ? null : root.id)
                          }
                          className="text-xs text-[var(--primary)] hover:underline font-medium"
                        >
                          Reply
                        </button>
                        {session?.user?.id && (
                          <button
                            onClick={() =>
                              handleResolve(root.id, !root.resolved)
                            }
                            className="text-xs text-[var(--muted-foreground)] hover:text-[var(--primary)] flex items-center gap-0.5 transition-colors"
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
                      className="flex items-start gap-2 ml-9 mt-2.5"
                    >
                      <div className="w-5 h-5 rounded-full bg-[var(--secondary)] flex items-center justify-center text-[10px] font-medium shrink-0">
                        {(reply.authorName || "?").charAt(0).toUpperCase()}
                      </div>
                      <div>
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-medium">
                            {reply.authorName || "Unknown"}
                          </span>
                          <span className="text-[10px] text-[var(--muted-foreground)]">
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
                    <div className="flex gap-2 ml-9 mt-2.5">
                      <input
                        value={replyText}
                        onChange={(e) => setReplyText(e.target.value)}
                        onKeyDown={(e) =>
                          e.key === "Enter" &&
                          handleReply(threadId, root.id)
                        }
                        placeholder="Reply..."
                        className="flex-1 px-2.5 py-1.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--surface-2)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]/50"
                        autoFocus
                      />
                      <button
                        onClick={() => handleReply(threadId, root.id)}
                        disabled={!replyText.trim()}
                        className="p-1.5 rounded-lg bg-[var(--primary)] text-white disabled:opacity-50"
                      >
                        <Send size={12} />
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
