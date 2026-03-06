"use client";

import { useEffect, useState, useCallback } from "react";
import { X, RotateCcw, Save } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { VersionMeta } from "@/types";
import { InputModal } from "@/components/ui/InputModal";
import { ConfirmModal } from "@/components/ui/ConfirmModal";

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
  const [showLabelModal, setShowLabelModal] = useState(false);
  const [restoreTarget, setRestoreTarget] = useState<string | null>(null);

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

  async function handleSaveVersion(label?: string) {
    setSaving(true);
    await fetch(`/api/documents/${documentId}/versions`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ label: label || undefined }),
    });
    setSaving(false);
    setShowLabelModal(false);
    fetchVersions();
  }

  async function handleRestore(versionId: string) {
    const res = await fetch(
      `/api/documents/${documentId}/versions/${versionId}/restore`,
      { method: "POST" }
    );
    setRestoreTarget(null);
    if (res.ok) {
      window.location.reload();
    }
  }

  return (
    <>
      <div className="w-80 border-l border-[var(--border)] flex flex-col bg-[var(--card)] shadow-[-4px_0_15px_rgba(0,0,0,0.03)]">
        <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
          <h3 className="font-semibold">Version History</h3>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[var(--muted)] transition-colors"
          >
            <X size={16} />
          </button>
        </div>

        <div className="px-4 py-3 border-b border-[var(--border)]">
          <button
            onClick={() => setShowLabelModal(true)}
            disabled={saving}
            className="flex items-center justify-center gap-2 w-full px-3 py-2.5 text-sm font-medium text-white rounded-xl bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] hover:opacity-90 disabled:opacity-50 transition-opacity shadow-[var(--shadow-sm)]"
          >
            <Save size={16} />
            {saving ? "Saving..." : "Save Version"}
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {loading ? (
            <div className="p-4 space-y-3">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="h-16 rounded-lg shimmer-loading" />
              ))}
            </div>
          ) : versions.length === 0 ? (
            <div className="p-8 text-sm text-[var(--muted-foreground)] text-center">
              No versions saved yet
            </div>
          ) : (
            <div className="divide-y divide-[var(--border)]">
              {versions.map((version) => (
                <div key={version.id} className="px-4 py-3 hover:bg-[var(--surface-2)] transition-colors group">
                  <div className="flex items-start justify-between">
                    <div>
                      <p className="text-sm font-medium">
                        {version.label || "Auto-save"}
                      </p>
                      <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                        {formatDistanceToNow(new Date(version.createdAt), {
                          addSuffix: true,
                        })}
                      </p>
                    </div>
                    <button
                      onClick={() => setRestoreTarget(version.id)}
                      className="p-1.5 rounded-lg opacity-0 group-hover:opacity-100 hover:bg-[var(--accent)] text-[var(--muted-foreground)] hover:text-[var(--primary)] transition-all"
                      title="Restore this version"
                    >
                      <RotateCcw size={14} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {showLabelModal && (
        <InputModal
          title="Save Version"
          placeholder="Version label (optional)"
          confirmLabel="Save"
          onConfirm={(label) => handleSaveVersion(label)}
          onCancel={() => {
            handleSaveVersion();
          }}
        />
      )}

      {restoreTarget && (
        <ConfirmModal
          title="Restore Version"
          description="This will replace the current document content with this version. Your current changes will be lost."
          confirmLabel="Restore"
          variant="primary"
          onConfirm={() => handleRestore(restoreTarget)}
          onCancel={() => setRestoreTarget(null)}
        />
      )}
    </>
  );
}
