"use client";

import { useState, useEffect, useRef } from "react";
import type { Editor } from "@tiptap/react";
import {
  X,
  ChevronUp,
  ChevronDown,
  CaseSensitive,
  Replace,
  ReplaceAll,
} from "lucide-react";

interface FindReplaceBarProps {
  editor: Editor;
  showReplace: boolean;
  onClose: () => void;
}

export function FindReplaceBar({ editor, showReplace: initialShowReplace, onClose }: FindReplaceBarProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [replaceTerm, setReplaceTerm] = useState("");
  const [showReplace, setShowReplace] = useState(initialShowReplace);
  const [caseSensitive, setCaseSensitive] = useState(false);
  const searchInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    searchInputRef.current?.focus();
  }, []);

  useEffect(() => {
    editor.commands.setSearchTerm(searchTerm);
  }, [searchTerm, editor]);

  useEffect(() => {
    editor.commands.setReplaceTerm(replaceTerm);
  }, [replaceTerm, editor]);

  useEffect(() => {
    editor.commands.setCaseSensitive(caseSensitive);
  }, [caseSensitive, editor]);

  function handleClose() {
    editor.commands.clearSearch();
    onClose();
  }

  function handleKeyDown(e: React.KeyboardEvent) {
    if (e.key === "Escape") {
      handleClose();
    } else if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      editor.commands.goToNextResult();
    } else if (e.key === "Enter" && e.shiftKey) {
      e.preventDefault();
      editor.commands.goToPrevResult();
    }
  }

  const storage = editor.storage.searchReplace;
  const resultCount = storage?.results?.length || 0;
  const currentIndex = storage?.currentIndex ?? -1;

  return (
    <div className="flex flex-col gap-2 px-3 py-2 border-b border-[var(--border)] bg-[var(--card)] shadow-[var(--shadow-xs)]">
      <div className="flex items-center gap-2">
        <div className="relative flex-1">
          <input
            ref={searchInputRef}
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Find..."
            className="w-full px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--surface-2)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]/50 pr-16"
          />
          <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs text-[var(--muted-foreground)]">
            {resultCount > 0 ? `${currentIndex + 1}/${resultCount}` : searchTerm ? "0/0" : ""}
          </span>
        </div>

        <button
          onClick={() => setCaseSensitive(!caseSensitive)}
          className={`p-1.5 rounded-lg transition-colors ${
            caseSensitive
              ? "bg-[var(--accent)] text-[var(--primary)]"
              : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
          }`}
          title="Case sensitive"
        >
          <CaseSensitive size={16} />
        </button>

        <button
          onClick={() => editor.commands.goToPrevResult()}
          disabled={resultCount === 0}
          className="p-1.5 rounded-lg hover:bg-[var(--muted)] text-[var(--muted-foreground)] disabled:opacity-30 transition-colors"
          title="Previous (Shift+Enter)"
        >
          <ChevronUp size={16} />
        </button>

        <button
          onClick={() => editor.commands.goToNextResult()}
          disabled={resultCount === 0}
          className="p-1.5 rounded-lg hover:bg-[var(--muted)] text-[var(--muted-foreground)] disabled:opacity-30 transition-colors"
          title="Next (Enter)"
        >
          <ChevronDown size={16} />
        </button>

        <button
          onClick={() => setShowReplace(!showReplace)}
          className={`p-1.5 rounded-lg transition-colors ${
            showReplace
              ? "bg-[var(--accent)] text-[var(--primary)]"
              : "text-[var(--muted-foreground)] hover:bg-[var(--muted)]"
          }`}
          title="Toggle replace"
        >
          <Replace size={16} />
        </button>

        <button
          onClick={handleClose}
          className="p-1.5 rounded-lg hover:bg-[var(--muted)] text-[var(--muted-foreground)] transition-colors"
          title="Close (Escape)"
        >
          <X size={16} />
        </button>
      </div>

      {showReplace && (
        <div className="flex items-center gap-2">
          <input
            value={replaceTerm}
            onChange={(e) => setReplaceTerm(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Replace..."
            className="flex-1 px-3 py-1.5 text-sm border border-[var(--border)] rounded-lg bg-[var(--surface-2)] focus:outline-none focus:ring-1 focus:ring-[var(--ring)]/50"
          />
          <button
            onClick={() => editor.commands.replaceCurrent()}
            disabled={resultCount === 0}
            className="p-1.5 rounded-lg hover:bg-[var(--muted)] text-[var(--muted-foreground)] disabled:opacity-30 transition-colors"
            title="Replace"
          >
            <Replace size={16} />
          </button>
          <button
            onClick={() => editor.commands.replaceAll()}
            disabled={resultCount === 0}
            className="p-1.5 rounded-lg hover:bg-[var(--muted)] text-[var(--muted-foreground)] disabled:opacity-30 transition-colors"
            title="Replace all"
          >
            <ReplaceAll size={16} />
          </button>
        </div>
      )}
    </div>
  );
}
