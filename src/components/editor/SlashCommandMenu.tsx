"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import type { Editor, Range } from "@tiptap/react";
import {
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Code,
  Minus,
  Table,
  ImageIcon,
  type LucideIcon,
} from "lucide-react";
import { InputModal } from "@/components/ui/InputModal";

interface SlashCommandItem {
  title: string;
  description: string;
  icon: LucideIcon;
  iconColor: string;
  command: (editor: Editor, range: Range) => void;
}

const COMMANDS: SlashCommandItem[] = [
  {
    title: "Heading 1",
    description: "Large section heading",
    icon: Heading1,
    iconColor: "text-blue-500",
    command: (editor, range) =>
      editor.chain().focus().deleteRange(range).setHeading({ level: 1 }).run(),
  },
  {
    title: "Heading 2",
    description: "Medium section heading",
    icon: Heading2,
    iconColor: "text-blue-400",
    command: (editor, range) =>
      editor.chain().focus().deleteRange(range).setHeading({ level: 2 }).run(),
  },
  {
    title: "Heading 3",
    description: "Small section heading",
    icon: Heading3,
    iconColor: "text-blue-300",
    command: (editor, range) =>
      editor.chain().focus().deleteRange(range).setHeading({ level: 3 }).run(),
  },
  {
    title: "Bullet List",
    description: "Create an unordered list",
    icon: List,
    iconColor: "text-green-500",
    command: (editor, range) =>
      editor.chain().focus().deleteRange(range).toggleBulletList().run(),
  },
  {
    title: "Numbered List",
    description: "Create an ordered list",
    icon: ListOrdered,
    iconColor: "text-green-400",
    command: (editor, range) =>
      editor.chain().focus().deleteRange(range).toggleOrderedList().run(),
  },
  {
    title: "Task List",
    description: "Create a checklist",
    icon: ListChecks,
    iconColor: "text-green-600",
    command: (editor, range) =>
      editor.chain().focus().deleteRange(range).toggleTaskList().run(),
  },
  {
    title: "Blockquote",
    description: "Add a quote block",
    icon: Quote,
    iconColor: "text-purple-500",
    command: (editor, range) =>
      editor.chain().focus().deleteRange(range).toggleBlockquote().run(),
  },
  {
    title: "Code Block",
    description: "Add a code snippet",
    icon: Code,
    iconColor: "text-orange-500",
    command: (editor, range) =>
      editor.chain().focus().deleteRange(range).toggleCodeBlock().run(),
  },
  {
    title: "Divider",
    description: "Insert a horizontal rule",
    icon: Minus,
    iconColor: "text-gray-500",
    command: (editor, range) =>
      editor.chain().focus().deleteRange(range).setHorizontalRule().run(),
  },
  {
    title: "Table",
    description: "Insert a 3x3 table",
    icon: Table,
    iconColor: "text-cyan-500",
    command: (editor, range) =>
      editor
        .chain()
        .focus()
        .deleteRange(range)
        .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
        .run(),
  },
  {
    title: "Image",
    description: "Insert an image from URL",
    icon: ImageIcon,
    iconColor: "text-pink-500",
    command: () => {
      // handled via modal in the component
    },
  },
];

interface SlashCommandMenuProps {
  editor: Editor;
  range: Range;
  onClose: () => void;
}

export function SlashCommandMenu({
  editor,
  range,
  onClose,
}: SlashCommandMenuProps) {
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [showImageModal, setShowImageModal] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  const filtered = COMMANDS.filter(
    (cmd) =>
      cmd.title.toLowerCase().includes(query.toLowerCase()) ||
      cmd.description.toLowerCase().includes(query.toLowerCase())
  );

  const selectItem = useCallback(
    (index: number) => {
      const item = filtered[index];
      if (item) {
        if (item.title === "Image") {
          setShowImageModal(true);
        } else {
          item.command(editor, range);
          onClose();
        }
      }
    },
    [filtered, editor, range, onClose]
  );

  useEffect(() => {
    function handleKeyDown(e: KeyboardEvent) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev + 1) % filtered.length);
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev === 0 ? filtered.length - 1 : prev - 1
        );
      } else if (e.key === "Enter") {
        e.preventDefault();
        selectItem(selectedIndex);
      } else if (e.key === "Escape") {
        onClose();
      }
    }

    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [filtered.length, selectedIndex, selectItem, onClose]);

  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  return (
    <>
      <div
        ref={menuRef}
        className="absolute z-50 w-72 bg-[var(--popover)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-lg)] overflow-hidden animate-slide-in-up"
      >
        <div className="px-3 py-2.5 border-b border-[var(--border)]">
          <input
            type="text"
            placeholder="Filter commands..."
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            className="w-full text-sm bg-transparent outline-none placeholder:text-[var(--muted-foreground)]"
            autoFocus
          />
        </div>
        <div className="max-h-64 overflow-y-auto py-1">
          {filtered.length === 0 ? (
            <div className="px-3 py-4 text-sm text-[var(--muted-foreground)] text-center">
              No matching commands
            </div>
          ) : (
            filtered.map((item, index) => (
              <button
                key={item.title}
                onClick={() => selectItem(index)}
                className={`w-full flex items-center gap-3 px-3 py-2 text-left transition-colors duration-100 ${
                  index === selectedIndex
                    ? "bg-[var(--accent)] border-l-2 border-[var(--primary)]"
                    : "hover:bg-[var(--muted)] border-l-2 border-transparent"
                }`}
              >
                <div className={`w-8 h-8 rounded-lg bg-[var(--surface-2)] flex items-center justify-center shrink-0 ${item.iconColor}`}>
                  <item.icon size={16} />
                </div>
                <div>
                  <p className="text-sm font-medium">{item.title}</p>
                  <p className="text-xs text-[var(--muted-foreground)]">
                    {item.description}
                  </p>
                </div>
              </button>
            ))
          )}
        </div>
      </div>

      {showImageModal && (
        <InputModal
          title="Insert Image"
          placeholder="https://example.com/image.jpg"
          confirmLabel="Insert"
          onConfirm={(url) => {
            editor.chain().focus().deleteRange(range).setImage({ src: url }).run();
            setShowImageModal(false);
            onClose();
          }}
          onCancel={() => {
            setShowImageModal(false);
            onClose();
          }}
        />
      )}
    </>
  );
}
