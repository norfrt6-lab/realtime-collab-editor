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
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Please enter a valid email address");
      return;
    }
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
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="share-dialog-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[var(--card)] rounded-2xl shadow-[var(--shadow-xl)] w-full max-w-md overflow-hidden animate-scale-in">
        <div className="h-1 bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)]" />

        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 id="share-dialog-title" className="text-lg font-semibold">Share Document</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[var(--muted)] transition-colors"
            aria-label="Close share dialog"
          >
            <X size={18} />
          </button>
        </div>

        <div className="px-6 py-5 space-y-5">
          {/* Add collaborator */}
          <div>
            <label className="block text-sm font-medium mb-2">
              Invite by email
            </label>
            <div className="flex gap-2">
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="email@example.com"
                className="flex-1 px-3 py-2 text-sm border border-[var(--border)] rounded-xl bg-[var(--surface-2)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/50 focus:border-[var(--ring)] transition-shadow"
              />
              <select
                value={role}
                onChange={(e) => setRole(e.target.value as "editor" | "viewer")}
                className="px-2 py-2 text-sm border border-[var(--border)] rounded-xl bg-[var(--surface-2)]"
              >
                <option value="editor">Editor</option>
                <option value="viewer">Viewer</option>
              </select>
              <button
                onClick={handleAddCollaborator}
                disabled={adding || !email.trim()}
                className="px-4 py-2 text-sm font-medium text-white rounded-xl bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] hover:opacity-90 disabled:opacity-50 transition-opacity"
              >
                {adding ? "..." : "Add"}
              </button>
            </div>
            {error && (
              <p className="text-xs text-[var(--destructive)] mt-1.5">{error}</p>
            )}
          </div>

          {/* Collaborators list */}
          {document.collaborators.length > 0 && (
            <div>
              <label className="block text-sm font-medium mb-2">
                Collaborators
              </label>
              <div className="space-y-1.5">
                {document.collaborators.map((c, i) => (
                  <div
                    key={i}
                    className="flex items-center justify-between px-3 py-2.5 bg-[var(--surface-2)] rounded-xl text-sm"
                  >
                    <span>{c.userId}</span>
                    <span className="text-[var(--muted-foreground)] capitalize text-xs bg-[var(--muted)] px-2 py-0.5 rounded-full">
                      {c.role}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Public toggle */}
          <div className="flex items-center justify-between py-3 border-t border-[var(--border)]">
            <div className="flex items-center gap-3">
              <div className={`w-9 h-9 rounded-xl flex items-center justify-center ${
                document.isPublic ? "bg-[var(--primary)]/10 text-[var(--primary)]" : "bg-[var(--muted)] text-[var(--muted-foreground)]"
              }`}>
                {document.isPublic ? <Globe size={18} /> : <Lock size={18} />}
              </div>
              <div>
                <p className="text-sm font-medium">
                  {document.isPublic ? "Public" : "Private"}
                </p>
                <p className="text-xs text-[var(--muted-foreground)]">
                  {document.isPublic
                    ? "Anyone with the link can view"
                    : "Only invited collaborators"}
                </p>
              </div>
            </div>
            {/* Toggle switch */}
            <button
              onClick={handleTogglePublic}
              role="switch"
              aria-checked={document.isPublic}
              aria-label={document.isPublic ? "Make document private" : "Make document public"}
              className={`relative w-11 h-6 rounded-full transition-colors duration-200 ${
                document.isPublic ? "bg-[var(--primary)]" : "bg-[var(--input)]"
              }`}
            >
              <span
                className={`absolute top-0.5 w-5 h-5 bg-white rounded-full shadow-sm transition-transform duration-200 ${
                  document.isPublic ? "translate-x-5.5" : "translate-x-0.5"
                }`}
              />
            </button>
          </div>

          {/* Copy link */}
          <div className="flex gap-2">
            <input
              readOnly
              value={shareUrl}
              aria-label="Share link"
              className="flex-1 px-3 py-2 text-sm border border-[var(--border)] rounded-xl bg-[var(--surface-2)] truncate"
            />
            <button
              onClick={handleCopyLink}
              className={`flex items-center gap-1.5 px-4 py-2 text-sm font-medium border rounded-xl transition-all ${
                copied
                  ? "border-[var(--success)] text-[var(--success)] bg-[var(--success)]/10"
                  : "border-[var(--border)] hover:bg-[var(--muted)]"
              }`}
            >
              {copied ? <Check size={14} /> : <Copy size={14} />}
              {copied ? "Copied" : "Copy"}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
