"use client";

import { useEffect, useState, useCallback } from "react";
import { X, RotateCcw, Save } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { VersionMeta } from "@/types";

interface VersionHistoryPanelProps {
  documentId: string;
  onClose: () => void;
}

export function VersionHistoryPanel({
  documentId,
  onClose,
}: VersionHistoryPanelProps) {
  const [versions, setVersions] = useState<VersionMeta[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const fetchVersions = useCallback(async () => {
    const res = await fetch(`/api/documents/${documentId}/versions`);
    if (res.ok) {
      setVersions(await res.json());
    }
    setLoading(false);
  }, [documentId]);

  useEffect(() => {
    fetchVersions();
  }, [fetchVersions]);

  async function handleSaveVersion() {
    const label = window.prompt("Version label (optional):");
    setSaving(true);

    await fetch(`/api/documents/${documentId}/versions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: label || undefined }),
    });

    setSaving(false);
    fetchVersions();
  }

  async function handleRestore(versionId: string) {
    if (!confirm("Restore this version? Current changes will be replaced.")) {
      return;
    }

    await fetch(
      `/api/documents/${documentId}/versions/${versionId}/restore`,
      { method: "POST" }
    );

    // Reload the page to pick up the restored state
    window.location.reload();
  }

  return (
    <div className="w-80 border-l border-[var(--border)] flex flex-col bg-[var(--background)]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <h3 className="font-semibold">Version History</h3>
        <button
          onClick={onClose}
          className="p-1 rounded hover:bg-[var(--muted)]"
        >
          <X size={18} />
        </button>
      </div>

      <div className="px-4 py-3 border-b border-[var(--border)]">
        <button
          onClick={handleSaveVersion}
          disabled={saving}
          className="flex items-center gap-2 w-full px-3 py-2 text-sm bg-[var(--primary)] text-[var(--primary-foreground)] rounded-lg hover:opacity-90 disabled:opacity-50"
        >
          <Save size={16} />
          {saving ? "Saving..." : "Save Version"}
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div
                key={i}
                className="h-16 bg-[var(--muted)] rounded animate-pulse"
              />
            ))}
          </div>
        ) : versions.length === 0 ? (
          <div className="p-4 text-sm text-[var(--muted-foreground)] text-center">
            No versions saved yet
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {versions.map((version) => (
              <div key={version.id} className="px-4 py-3 hover:bg-[var(--muted)]">
                <div className="flex items-start justify-between">
                  <div>
                    <p className="text-sm font-medium">
                      {version.label || "Auto-save"}
                    </p>
                    <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                      {formatDistanceToNow(new Date(version.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                  <button
                    onClick={() => handleRestore(version.id)}
                    className="p-1 rounded hover:bg-[var(--accent)] text-[var(--muted-foreground)] hover:text-[var(--primary)]"
                    title="Restore this version"
                  >
                    <RotateCcw size={16} />
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
