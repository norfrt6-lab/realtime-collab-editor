"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useEditor, EditorContent, type Editor } from "@tiptap/react";
import StarterKit from "@tiptap/starter-kit";
import Collaboration from "@tiptap/extension-collaboration";
import CollaborationCursor from "@tiptap/extension-collaboration-cursor";
import Placeholder from "@tiptap/extension-placeholder";
import CharacterCount from "@tiptap/extension-character-count";
import Highlight from "@tiptap/extension-highlight";
import Underline from "@tiptap/extension-underline";
import Link from "@tiptap/extension-link";
import Image from "@tiptap/extension-image";
import TaskList from "@tiptap/extension-task-list";
import TaskItem from "@tiptap/extension-task-item";
import Table from "@tiptap/extension-table";
import TableRow from "@tiptap/extension-table-row";
import TableCell from "@tiptap/extension-table-cell";
import TableHeader from "@tiptap/extension-table-header";
import type { HocuspocusProvider } from "@hocuspocus/provider";
import * as Y from "yjs";

import { Toolbar } from "./Toolbar";

interface CollabEditorProps {
  ydoc: Y.Doc;
  provider: HocuspocusProvider;
  user: { name: string; color: string };
  onEditorReady?: (editor: Editor) => void;
}

export function CollabEditor({
  ydoc,
  provider,
  user,
  onEditorReady,
}: CollabEditorProps) {
  const [status, setStatus] = useState<
    "connecting" | "connected" | "disconnected"
  >("connecting");
  const typingTimeoutRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const onStatus = ({ status: s }: { status: string }) => {
      setStatus(s as "connecting" | "connected" | "disconnected");
    };

    provider.on("status", onStatus);
    return () => {
      provider.off("status", onStatus);
    };
  }, [provider]);

  // Set typing awareness on editor update
  const handleTyping = useCallback(() => {
    provider.setAwarenessField("isTyping", true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      provider.setAwarenessField("isTyping", false);
    }, 2000);
  }, [provider]);

  const extensions = useMemo(
    () => [
      StarterKit.configure({
        history: false,
      }),
      Collaboration.configure({
        document: ydoc,
      }),
      CollaborationCursor.configure({
        provider,
        user,
      }),
      Placeholder.configure({
        placeholder:
          'Start typing... Use "/" for slash commands',
      }),
      CharacterCount,
      Highlight.configure({ multicolor: true }),
      Underline,
      Link.configure({
        openOnClick: false,
      }),
      Image,
      TaskList,
      TaskItem.configure({
        nested: true,
      }),
      Table.configure({
        resizable: true,
      }),
      TableRow,
      TableCell,
      TableHeader,
    ],
    [ydoc, provider, user]
  );

  const editor = useEditor({
    extensions,
    editorProps: {
      attributes: {
        class: "tiptap prose prose-sm max-w-none focus:outline-none",
      },
    },
    onUpdate: () => {
      handleTyping();
    },
  });

  // Notify parent when editor is ready
  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Connection status */}
      <div className="flex items-center gap-2 px-4 py-1 text-xs text-[var(--muted-foreground)] border-b border-[var(--border)]">
        <div
          className={`w-2 h-2 rounded-full ${
            status === "connected"
              ? "bg-green-500"
              : status === "connecting"
              ? "bg-yellow-500"
              : "bg-red-500"
          }`}
        />
        <span>
          {status === "connected"
            ? "Connected"
            : status === "connecting"
            ? "Connecting..."
            : "Offline — changes will sync when reconnected"}
        </span>
        {editor && (
          <span className="ml-auto">
            {editor.storage.characterCount.characters()} characters
          </span>
        )}
      </div>

      {/* Toolbar */}
      <Toolbar editor={editor} />

      {/* Editor */}
      <div className="flex-1 overflow-y-auto">
        <div className="max-w-4xl mx-auto px-4 py-6">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
