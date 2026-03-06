"use client";

import { useState } from "react";
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
  ImageIcon,
  Undo,
  Redo,
  Table,
  Highlighter,
} from "lucide-react";
import { InputModal } from "@/components/ui/InputModal";

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
  const [linkModal, setLinkModal] = useState(false);
  const [imageModal, setImageModal] = useState(false);

  if (!editor) return null;

  const groups: ToolbarButton[][] = [
    [
      {
        icon: <Undo size={16} />,
        title: "Undo",
        action: () => editor.chain().focus().undo().run(),
      },
      {
        icon: <Redo size={16} />,
        title: "Redo",
        action: () => editor.chain().focus().redo().run(),
      },
    ],
    [
      {
        icon: <Bold size={16} />,
        title: "Bold (Ctrl+B)",
        action: () => editor.chain().focus().toggleBold().run(),
        isActive: editor.isActive("bold"),
      },
      {
        icon: <Italic size={16} />,
        title: "Italic (Ctrl+I)",
        action: () => editor.chain().focus().toggleItalic().run(),
        isActive: editor.isActive("italic"),
      },
      {
        icon: <Underline size={16} />,
        title: "Underline (Ctrl+U)",
        action: () => editor.chain().focus().toggleUnderline().run(),
        isActive: editor.isActive("underline"),
      },
      {
        icon: <Strikethrough size={16} />,
        title: "Strikethrough",
        action: () => editor.chain().focus().toggleStrike().run(),
        isActive: editor.isActive("strike"),
      },
      {
        icon: <Highlighter size={16} />,
        title: "Highlight",
        action: () => editor.chain().focus().toggleHighlight().run(),
        isActive: editor.isActive("highlight"),
      },
      {
        icon: <Code size={16} />,
        title: "Inline Code",
        action: () => editor.chain().focus().toggleCode().run(),
        isActive: editor.isActive("code"),
      },
    ],
    [
      {
        icon: <Heading1 size={16} />,
        title: "Heading 1",
        action: () => editor.chain().focus().toggleHeading({ level: 1 }).run(),
        isActive: editor.isActive("heading", { level: 1 }),
      },
      {
        icon: <Heading2 size={16} />,
        title: "Heading 2",
        action: () => editor.chain().focus().toggleHeading({ level: 2 }).run(),
        isActive: editor.isActive("heading", { level: 2 }),
      },
      {
        icon: <Heading3 size={16} />,
        title: "Heading 3",
        action: () => editor.chain().focus().toggleHeading({ level: 3 }).run(),
        isActive: editor.isActive("heading", { level: 3 }),
      },
    ],
    [
      {
        icon: <List size={16} />,
        title: "Bullet List",
        action: () => editor.chain().focus().toggleBulletList().run(),
        isActive: editor.isActive("bulletList"),
      },
      {
        icon: <ListOrdered size={16} />,
        title: "Ordered List",
        action: () => editor.chain().focus().toggleOrderedList().run(),
        isActive: editor.isActive("orderedList"),
      },
      {
        icon: <ListChecks size={16} />,
        title: "Task List",
        action: () => editor.chain().focus().toggleTaskList().run(),
        isActive: editor.isActive("taskList"),
      },
    ],
    [
      {
        icon: <Quote size={16} />,
        title: "Blockquote",
        action: () => editor.chain().focus().toggleBlockquote().run(),
        isActive: editor.isActive("blockquote"),
      },
      {
        icon: <Minus size={16} />,
        title: "Horizontal Rule",
        action: () => editor.chain().focus().setHorizontalRule().run(),
      },
      {
        icon: <Link size={16} />,
        title: "Link",
        action: () => setLinkModal(true),
        isActive: editor.isActive("link"),
      },
      {
        icon: <ImageIcon size={16} />,
        title: "Image",
        action: () => setImageModal(true),
      },
      {
        icon: <Table size={16} />,
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
    <>
      <div className="flex items-center gap-0.5 flex-wrap border-b border-[var(--border)] px-3 py-1.5 bg-[var(--glass-bg)] backdrop-blur-sm sticky top-0 z-10 shadow-[var(--shadow-xs)]">
        {groups.map((group, gi) => (
          <div key={gi} className="flex items-center gap-0.5">
            {gi > 0 && (
              <div className="w-px h-5 bg-[var(--border)] opacity-50 mx-1 rounded-full" />
            )}
            {group.map((btn, bi) => (
              <button
                key={bi}
                onClick={btn.action}
                title={btn.title}
                className={`p-2 rounded-lg transition-all duration-150 hover:scale-105 ${
                  btn.isActive
                    ? "bg-gradient-to-r from-[var(--gradient-start)]/10 to-[var(--gradient-end)]/10 text-[var(--primary)] shadow-[var(--shadow-xs)]"
                    : "text-[var(--foreground)] hover:bg-[var(--muted)]"
                }`}
              >
                {btn.icon}
              </button>
            ))}
          </div>
        ))}
      </div>

      {linkModal && (
        <InputModal
          title="Insert Link"
          placeholder="https://example.com"
          confirmLabel="Add Link"
          onConfirm={(url) => {
            editor.chain().focus().setLink({ href: url }).run();
            setLinkModal(false);
          }}
          onCancel={() => setLinkModal(false)}
        />
      )}

      {imageModal && (
        <InputModal
          title="Insert Image"
          placeholder="https://example.com/image.jpg"
          confirmLabel="Add Image"
          onConfirm={(url) => {
            editor.chain().focus().setImage({ src: url }).run();
            setImageModal(false);
          }}
          onCancel={() => setImageModal(false)}
        />
      )}
    </>
  );
}
