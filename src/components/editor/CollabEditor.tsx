"use client";

import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useEditor, EditorContent, ReactRenderer, type Editor } from "@tiptap/react";
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
import Mention from "@tiptap/extension-mention";
import type { HocuspocusProvider } from "@hocuspocus/provider";
import * as Y from "yjs";
import tippy, { type Instance as TippyInstance } from "tippy.js";
import { Wifi, WifiOff, Loader } from "lucide-react";

import { Toolbar } from "./Toolbar";
import { MentionList, type MentionListRef } from "./MentionList";

interface CollabEditorProps {
  ydoc: Y.Doc;
  provider: HocuspocusProvider;
  user: { name: string; color: string };
  documentId: string;
  onEditorReady?: (editor: Editor) => void;
}

export function CollabEditor({
  ydoc,
  provider,
  user,
  documentId,
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

  const handleTyping = useCallback(() => {
    provider.setAwarenessField("isTyping", true);

    if (typingTimeoutRef.current) {
      clearTimeout(typingTimeoutRef.current);
    }

    typingTimeoutRef.current = setTimeout(() => {
      provider.setAwarenessField("isTyping", false);
    }, 2000);
  }, [provider]);

  const mentionSuggestion = useMemo(
    () => ({
      items: async ({ query }: { query: string }) => {
        try {
          const res = await fetch(`/api/documents/${documentId}/collaborators`);
          if (!res.ok) return [];
          const users = await res.json();
          return users.filter((u: { name: string }) =>
            u.name.toLowerCase().includes(query.toLowerCase())
          );
        } catch {
          return [];
        }
      },
      render: () => {
        let component: ReactRenderer<MentionListRef> | null = null;
        let popup: TippyInstance[] | null = null;

        return {
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onStart: (props: any) => {
            const originalCommand = props.command;
            const wrappedCommand = (attrs: { id: string; label: string }) => {
              originalCommand(attrs);
              fetch(`/api/documents/${documentId}/mentions`, {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ mentionedUserId: attrs.id }),
              }).catch(() => {});
            };

            component = new ReactRenderer(MentionList, {
              props: { ...props, command: wrappedCommand },
              editor: props.editor,
            });

            if (!props.clientRect) return;

            popup = tippy("body", {
              getReferenceClientRect: props.clientRect,
              appendTo: () => document.body,
              content: component.element,
              showOnCreate: true,
              interactive: true,
              trigger: "manual",
              placement: "bottom-start",
            });
          },
          // eslint-disable-next-line @typescript-eslint/no-explicit-any
          onUpdate: (props: any) => {
            component?.updateProps(props);
            if (popup?.[0] && props.clientRect) {
              popup[0].setProps({
                getReferenceClientRect: props.clientRect,
              });
            }
          },
          onKeyDown: (props: { event: KeyboardEvent }) => {
            if (props.event.key === "Escape") {
              popup?.[0]?.hide();
              return true;
            }
            return component?.ref?.onKeyDown(props) || false;
          },
          onExit: () => {
            popup?.[0]?.destroy();
            component?.destroy();
          },
        };
      },
    }),
    [documentId]
  );

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
          'Start typing... Use "/" for slash commands, "@" to mention',
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
      Mention.configure({
        HTMLAttributes: {
          class: "mention",
        },
        suggestion: mentionSuggestion,
      }),
    ],
    [ydoc, provider, user, mentionSuggestion]
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

  useEffect(() => {
    if (editor && onEditorReady) {
      onEditorReady(editor);
    }
  }, [editor, onEditorReady]);

  return (
    <div className="flex flex-col flex-1 min-h-0">
      {/* Connection status */}
      <div
        className={`flex items-center gap-2 px-4 py-1.5 text-xs border-b transition-colors duration-300 ${
          status === "disconnected"
            ? "bg-[var(--destructive)]/10 border-[var(--destructive)]/20 text-[var(--destructive)]"
            : "border-[var(--border)] text-[var(--muted-foreground)]"
        }`}
      >
        {status === "connected" ? (
          <Wifi size={12} className="text-[var(--success)]" />
        ) : status === "connecting" ? (
          <Loader size={12} className="text-[var(--warning)] animate-spin" />
        ) : (
          <WifiOff size={12} />
        )}
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

      <Toolbar editor={editor} />

      <div className="flex-1 overflow-y-auto bg-[var(--card)]">
        <div className="max-w-4xl mx-auto px-6 py-8">
          <EditorContent editor={editor} />
        </div>
      </div>
    </div>
  );
}
