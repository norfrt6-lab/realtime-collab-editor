"use client";

import { useEffect, useState } from "react";
import type { Editor } from "@tiptap/react";
import { getWordCount } from "@/lib/export";

interface WordCountProps {
  editor: Editor | null;
}

export function WordCount({ editor }: WordCountProps) {
  const [stats, setStats] = useState({ words: 0, characters: 0, readingTime: "1 min read" });

  useEffect(() => {
    if (!editor) return;

    const update = () => setStats(getWordCount(editor));
    update();

    editor.on("update", update);
    return () => {
      editor.off("update", update);
    };
  }, [editor]);

  return (
    <div className="flex items-center gap-2 text-[10px] text-[var(--muted-foreground)] bg-[var(--surface-2)] rounded-full px-3 py-1">
      <span>{stats.words} words</span>
      <span className="opacity-30">·</span>
      <span>{stats.characters} chars</span>
      <span className="opacity-30">·</span>
      <span>{stats.readingTime}</span>
    </div>
  );
}
