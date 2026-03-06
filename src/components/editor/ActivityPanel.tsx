"use client";

import { useEffect, useState, useCallback } from "react";
import { X, FileText, Edit, MessageSquare, Share2, History, Trash2 } from "lucide-react";
import { formatDistanceToNow } from "date-fns";
import type { ActivityEventData } from "@/types/activity";

interface ActivityPanelProps {
  documentId: string;
  onClose: () => void;
}

const ACTION_CONFIG: Record<string, { icon: typeof FileText; label: string; color: string }> = {
  created: { icon: FileText, label: "created this document", color: "text-[var(--success)]" },
  edited: { icon: Edit, label: "made edits", color: "text-[var(--info)]" },
  commented: { icon: MessageSquare, label: "added a comment", color: "text-purple-500" },
  shared: { icon: Share2, label: "shared this document", color: "text-orange-500" },
  version_saved: { icon: History, label: "saved a version", color: "text-cyan-500" },
  version_restored: { icon: History, label: "restored a version", color: "text-[var(--warning)]" },
  deleted: { icon: Trash2, label: "deleted this document", color: "text-[var(--destructive)]" },
};

export function ActivityPanel({ documentId, onClose }: ActivityPanelProps) {
  const [events, setEvents] = useState<ActivityEventData[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchActivity = useCallback(async () => {
    const res = await fetch(`/api/documents/${documentId}/activity`);
    if (res.ok) {
      setEvents(await res.json());
    }
    setLoading(false);
  }, [documentId]);

  useEffect(() => {
    fetchActivity();
    const interval = setInterval(fetchActivity, 10000);
    return () => clearInterval(interval);
  }, [fetchActivity]);

  return (
    <div className="w-80 border-l border-[var(--border)] flex flex-col bg-[var(--card)] shadow-[-4px_0_15px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <h3 className="font-semibold">Activity</h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-[var(--muted)] transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {loading ? (
          <div className="p-4 space-y-3">
            {[...Array(5)].map((_, i) => (
              <div key={i} className="h-12 rounded-lg shimmer-loading" />
            ))}
          </div>
        ) : events.length === 0 ? (
          <div className="p-8 text-sm text-[var(--muted-foreground)] text-center">
            No activity yet
          </div>
        ) : (
          <div className="divide-y divide-[var(--border)]">
            {events.map((event) => {
              const config = ACTION_CONFIG[event.action] || {
                icon: FileText,
                label: event.action,
                color: "text-[var(--muted-foreground)]",
              };
              const Icon = config.icon;

              return (
                <div key={event.id} className="px-4 py-3 flex items-start gap-3 hover:bg-[var(--surface-2)] transition-colors">
                  <div className={`mt-0.5 shrink-0 w-7 h-7 rounded-lg bg-[var(--surface-3)] flex items-center justify-center ${config.color}`}>
                    <Icon size={14} />
                  </div>
                  <div className="flex-1 min-w-0">
                    <p className="text-sm">
                      <span className="font-medium">{event.userName}</span>{" "}
                      <span className="text-[var(--muted-foreground)]">{config.label}</span>
                    </p>
                    <p className="text-[10px] text-[var(--muted-foreground)] mt-0.5">
                      {formatDistanceToNow(new Date(event.createdAt), {
                        addSuffix: true,
                      })}
                    </p>
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}
