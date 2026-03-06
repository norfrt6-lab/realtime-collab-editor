"use client";

import {
  forwardRef,
  useEffect,
  useImperativeHandle,
  useState,
} from "react";

interface MentionItem {
  id: string;
  name: string;
  email: string;
}

interface MentionListProps {
  items: MentionItem[];
  command: (item: { id: string; label: string }) => void;
}

export interface MentionListRef {
  onKeyDown: (props: { event: KeyboardEvent }) => boolean;
}

export const MentionList = forwardRef<MentionListRef, MentionListProps>(
  ({ items, command }, ref) => {
    const [selectedIndex, setSelectedIndex] = useState(0);

    useEffect(() => {
      setSelectedIndex(0);
    }, [items]);

    useImperativeHandle(ref, () => ({
      onKeyDown: ({ event }) => {
        if (event.key === "ArrowUp") {
          setSelectedIndex((prev) =>
            prev <= 0 ? items.length - 1 : prev - 1
          );
          return true;
        }

        if (event.key === "ArrowDown") {
          setSelectedIndex((prev) =>
            prev >= items.length - 1 ? 0 : prev + 1
          );
          return true;
        }

        if (event.key === "Enter") {
          const item = items[selectedIndex];
          if (item) {
            command({ id: item.id, label: item.name });
          }
          return true;
        }

        return false;
      },
    }));

    if (items.length === 0) {
      return (
        <div className="bg-[var(--popover)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-lg)] p-3 text-sm text-[var(--muted-foreground)]">
          No users found
        </div>
      );
    }

    return (
      <div className="bg-[var(--popover)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-lg)] overflow-hidden min-w-[200px]">
        {items.map((item, index) => (
          <button
            key={item.id}
            onClick={() => command({ id: item.id, label: item.name })}
            className={`w-full flex items-center gap-2.5 px-3 py-2 text-sm transition-colors ${
              index === selectedIndex
                ? "bg-[var(--accent)] text-[var(--primary)]"
                : "hover:bg-[var(--muted)]"
            }`}
          >
            <div className="w-6 h-6 rounded-full bg-[var(--primary)] flex items-center justify-center text-[10px] text-white font-medium shrink-0">
              {item.name.charAt(0).toUpperCase()}
            </div>
            <div className="text-left min-w-0">
              <div className="font-medium truncate">{item.name}</div>
              <div className="text-xs text-[var(--muted-foreground)] truncate">
                {item.email}
              </div>
            </div>
          </button>
        ))}
      </div>
    );
  }
);

MentionList.displayName = "MentionList";
