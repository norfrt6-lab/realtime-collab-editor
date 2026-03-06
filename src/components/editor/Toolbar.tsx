"use client";

import type { Editor } from "@tiptap/react";
import {
  Bold,
  Italic,
  Underline,
  Strikethrough,
  Code,
  Heading1,
  Heading2,
  Heading3,
  List,
  ListOrdered,
  ListChecks,
  Quote,
  Minus,
  Link,
  Image,
  Undo,
  Redo,
  Table,
  Highlighter,
} from "lucide-react";

interface ToolbarProps {
  editor: Editor | null;
}

interface ToolbarButton {
  icon: React.ReactNode;
  title: string;
  action: () => void;
  isActive?: boolean;
}

export function Toolbar({ editor }: ToolbarProps) {
  if (!editor) return null;

  const groups: ToolbarButton[][] = [
    [
      {
        icon: <Undo size={18} />,
        title: "Undo",
        action: () => editor.chain().focus().undo().run(),
      },
      {
        icon: <Redo size={18} />,
        title: "Redo",
        action: () => editor.chain().focus().redo().run(),
      },
    ],
    [
      {
        icon: <Bold size={18} />,
        title: "Bold (Ctrl+B)",
        action: () => editor.chain().focus().toggleBold().run(),
        isActive: editor.isActive("bold"),
      },
      {
        icon: <Italic size={18} />,
        title: "Italic (Ctrl+I)",
        action: () => editor.chain().focus().toggleItalic().run(),
        isActive: editor.isActive("italic"),
      },
      {
        icon: <Underline size={18} />,
        title: "Underline (Ctrl+U)",
        action: () => editor.chain().focus().toggleUnderline().run(),
        isActive: editor.isActive("underline"),
      },
      {
        icon: <Strikethrough size={18} />,
        title: "Strikethrough",
        action: () => editor.chain().focus().toggleStrike().run(),
        isActive: editor.isActive("strike"),
      },
      {
        icon: <Highlighter size={18} />,
        title: "Highlight",
        action: () => editor.chain().focus().toggleHighlight().run(),
        isActive: editor.isActive("highlight"),
      },
      {
        icon: <Code size={18} />,
        title: "Inline Code",
        action: () => editor.chain().focus().toggleCode().run(),
        isActive: editor.isActive("code"),
      },
    ],
    [
      {
        icon: <Heading1 size={18} />,
        title: "Heading 1",
        action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
        isActive: editor.isActive("heading", { level: 1 }),
      },
      {
        icon: <Heading2 size={18} />,
        title: "Heading 2",
        action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        isActive: editor.isActive("heading", { level: 2 }),
      },
      {
        icon: <Heading3 size={18} />,
        title: "Heading 3",
        action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        isActive: editor.isActive("heading", { level: 3 }),
      },
    ],
    [
      {
        icon: <List size={18} />,
        title: "Bullet List",
        action: () => editor.chain().focus().toggleBulletList().run(),
        isActive: editor.isActive("bulletList"),
      },
      {
        icon: <ListOrdered size={18} />,
        title: "Ordered List",
        action: () => editor.chain().focus().toggleOrderedList().run(),
        isActive: editor.isActive("orderedList"),
      },
      {
        icon: <ListChecks size={18} />,
        title: "Task List",
        action: () => editor.chain().focus().toggleTaskList().run(),
        isActive: editor.isActive("taskList"),
      },
    ],
    [
      {
        icon: <Quote size={18} />,
        title: "Blockquote",
        action: () => editor.chain().focus().toggleBlockquote().run(),
        isActive: editor.isActive("blockquote"),
      },
      {
        icon: <Minus size={18} />,
        title: "Horizontal Rule",
        action: () => editor.chain().focus().setHorizontalRule().run(),
      },
      {
        icon: <Link size={18} />,
        title: "Link",
        action: () => {
          const url = window.prompt("URL:");
          if (url) {
            editor.chain().focus().setLink({ href: url }).run();
          }
        },
        isActive: editor.isActive("link"),
      },
      {
        icon: <Image size={18} />,
        title: "Image",
        action: () => {
          const url = window.prompt("Image URL:");
          if (url) {
            editor.chain().focus().setImage({ src: url }).run();
          }
        },
      },
      {
        icon: <Table size={18} />,
        title: "Insert Table",
        action: () =>
          editor
            .chain()
            .focus()
            .insertTable({ rows: 3, cols: 3, withHeaderRow: true })
            .run(),
      },
    ],
  ];

  return (
    <div className="flex items-center gap-1 flex-wrap border-b border-[var(--border)] px-3 py-2 bg-[var(--background)] sticky top-0 z-10">
      {groups.map((group, gi) => (
        <div key={gi} className="flex items-center gap-0.5">
          {gi > 0 && (
            <div className="w-px h-6 bg-[var(--border)] mx-1" />
          )}
          {group.map((btn, bi) => (
            <button
              key={bi}
              onClick={btn.action}
              title={btn.title}
              className={`p-1.5 rounded hover:bg-[var(--muted)] transition-colors ${
                btn.isActive
                  ? "bg-[var(--accent)] text-[var(--primary)]"
                  : "text-[var(--foreground)]"
              }`}
            >
              {btn.icon}
            </button>
          ))}
        </div>
      ))}
    </div>
  );
}
