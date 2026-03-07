"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface KeyboardShortcutsPanelProps {
  onClose: () => void;
}

interface ShortcutGroup {
  title: string;
  shortcuts: { keys: string; description: string }[];
}

const isMac = typeof navigator !== "undefined" && /Mac/.test(navigator.userAgent);
const mod = isMac ? "\u2318" : "Ctrl";

const groups: ShortcutGroup[] = [
  {
    title: "General",
    shortcuts: [
      { keys: `${mod}+S`, description: "Save version" },
      { keys: `${mod}+Z`, description: "Undo" },
      { keys: `${mod}+Y`, description: "Redo" },
      { keys: `${mod}+Shift+Z`, description: "Redo" },
      { keys: `${mod}+F`, description: "Find" },
      { keys: `${mod}+H`, description: "Find & Replace" },
      { keys: `${mod}+/`, description: "Keyboard shortcuts" },
    ],
  },
  {
    title: "Formatting",
    shortcuts: [
      { keys: `${mod}+B`, description: "Bold" },
      { keys: `${mod}+I`, description: "Italic" },
      { keys: `${mod}+U`, description: "Underline" },
      { keys: `${mod}+E`, description: "Inline code" },
      { keys: `${mod}+Shift+H`, description: "Highlight" },
      { keys: `${mod}+Shift+X`, description: "Strikethrough" },
    ],
  },
  {
    title: "Blocks",
    shortcuts: [
      { keys: `${mod}+Shift+7`, description: "Ordered list" },
      { keys: `${mod}+Shift+8`, description: "Bullet list" },
      { keys: `${mod}+Shift+9`, description: "Task list" },
      { keys: `${mod}+Shift+B`, description: "Blockquote" },
      { keys: "---", description: "Horizontal rule" },
    ],
  },
  {
    title: "Headings",
    shortcuts: [
      { keys: `${mod}+Alt+1`, description: "Heading 1" },
      { keys: `${mod}+Alt+2`, description: "Heading 2" },
      { keys: `${mod}+Alt+3`, description: "Heading 3" },
    ],
  },
  {
    title: "Collaboration",
    shortcuts: [
      { keys: "@", description: "Mention a collaborator" },
    ],
  },
];

export function KeyboardShortcutsPanel({ onClose }: KeyboardShortcutsPanelProps) {
  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "Escape") onClose();
    }
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="w-80 border-l border-[var(--border)] flex flex-col bg-[var(--card)] shadow-[-4px_0_15px_rgba(0,0,0,0.03)]">
      <div className="flex items-center justify-between px-4 py-3 border-b border-[var(--border)]">
        <h3 className="font-semibold">Keyboard Shortcuts</h3>
        <button
          onClick={onClose}
          className="p-1.5 rounded-full hover:bg-[var(--muted)] transition-colors"
        >
          <X size={16} />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto">
        {groups.map((group) => (
          <div key={group.title} className="px-4 py-3 border-b border-[var(--border)]">
            <h4 className="text-[10px] font-semibold text-[var(--muted-foreground)] uppercase tracking-wider mb-2">
              {group.title}
            </h4>
            <div className="space-y-1.5">
              {group.shortcuts.map((shortcut) => (
                <div
                  key={shortcut.keys}
                  className="flex items-center justify-between text-sm"
                >
                  <span className="text-[var(--foreground)]">{shortcut.description}</span>
                  <kbd className="px-1.5 py-0.5 text-xs font-mono bg-[var(--muted)] border border-[var(--border)] rounded text-[var(--muted-foreground)]">
                    {shortcut.keys}
                  </kbd>
                </div>
              ))}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
