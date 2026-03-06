"use client";

import { useState } from "react";
import { X, Copy, Check, Globe, Lock } from "lucide-react";
import type { DocumentMeta } from "@/types";

interface ShareDialogProps {
  document: DocumentMeta;
  onClose: () => void;
  onUpdate: () => void;
}

export function ShareDialog({ document, onClose, onUpdate }: ShareDialogProps) {
  const [email, setEmail] = useState("");
  const [role, setRole] = useState<"editor" | "viewer">("editor");
  const [copied, setCopied] = useState(false);
  const [adding, setAdding] = useState(false);
  const [error, setError] = useState("");

  const shareUrl =
    typeof window !== "undefined"
      ? `${window.location.origin}/documents/${document.id}`
      : "";

  async function handleTogglePublic() {
    await fetch(`/api/documents/${document.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ isPublic: !document.isPublic }),
    });
    onUpdate();
  }

  async function handleAddCollaborator() {
    if (!email.trim()) return;
    setError("");
    setAdding(true);

    const res = await fetch(`/api/documents/${document.id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        addCollaborator: { email, role },
      }),
    });

    setAdding(false);

    if (!res.ok) {
      const data = await res.json();
      setError(data.error || "Failed to add collaborator");
      return;
    }

    setEmail("");
    onUpdate();
  }

  function handleCopyLink() {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[var(--background)] rounded-xl shadow-xl w-full max-w-md mx-4">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold">Share Document</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--muted)]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-4 space-y-4">
          {/* Add collaborator */}
          <div>
            <label className="block text-sm font-medium mb-1">
              Invite by email
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="flex-1 px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)] focus:outline-none focus:ring-2 focus:ring-[var(--primary)]"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "editor" | "viewer")}
                className="px-2 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--background)]"
              >
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
              <button
                onClick={handleAddCollaborator}
                disabled={adding || !email.trim()}
                className="px-4 py-2 text-sm bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 disabled:opacity-50"
              >
                {adding ? "..." : "Add"}
              </button>
            </div>
            {error && (
              <p className="text-xs text-red-500 mt-1">{error}</p>
            )}
          </div>

          {/* Collaborators list */}
          {document.collaborators.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-1">
                Collaborators
              </label>
              <div className="space-y-2">
                {document.collaborators.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-2 bg-[var(--muted)] rounded-lg text-sm"
                  >
                    <span>{c.userId}</span>
                    <span className="text-[var(--muted-foreground)] capitalize">
                      {c.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Public toggle */}
          <div className="flex items-center justify-between py-3 border-t border-[var(--border)]">
            <div className="flex items-center gap-2">
              {document.isPublic ? (
                <Globe size={18} className="text-[var(--primary)]" />
              ) : (
                <Lock size={18} className="text-[var(--muted-foreground)]" />
              )}
              <div>
                <p className="text-sm font-medium">
                  {document.isPublic ? "Public" : "Private"}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {document.isPublic
                    ? "Anyone with the link can view"
                    : "Only invited collaborators can access"}
                </p>
              </div>
            </div>
            <button
              onClick={handleTogglePublic}
              className="px-3 py-1 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]"
            >
              {document.isPublic ? "Make Private" : "Make Public"}
            </button>
          </div>

          {/* Copy link */}
          <div className="flex gap-2">
            <input
              readOnly
              value={shareUrl}
              className="flex-1 px-3 py-2 text-sm border border-[var(--border)] rounded-lg bg-[var(--muted)] truncate"
            />
            <button
              onClick={handleCopyLink}
              className="flex items-center gap-1 px-3 py-2 text-sm border border-[var(--border)] rounded-lg hover:bg-[var(--muted)]"
            >
              {copied ? <Check size={16} /> : <Copy size={16} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
