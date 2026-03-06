"use client";

import { useState, useRef, useEffect } from "react";
import type { Editor } from "@tiptap/react";
import { Download, FileText, Code, FileType } from "lucide-react";
import { exportToMarkdown, exportToHtml, downloadFile } from "@/lib/export";

interface ExportMenuProps {
  editor: Editor | null;
  documentTitle: string;
}

export function ExportMenu({ editor, documentTitle }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    function handleClickOutside(e: MouseEvent) {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  if (!editor) return null;

  const filename = documentTitle.replace(/[^a-zA-Z0-9-_ ]/g, "").trim() || "document";

  function handleExportMarkdown() {
    const md = exportToMarkdown(editor!);
    downloadFile(md, `${filename}.md`, "text/markdown");
    setOpen(false);
  }

  function handleExportHtml() {
    const html = exportToHtml(editor!);
    const full = `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${documentTitle}</title>
  <style>
    body { font-family: system-ui, sans-serif; max-width: 800px; margin: 2rem auto; padding: 0 1rem; line-height: 1.6; }
    code { background: #f4f4f5; padding: 0.2em 0.4em; border-radius: 0.25rem; }
    pre { background: #f4f4f5; padding: 1rem; border-radius: 0.5rem; overflow-x: auto; }
    blockquote { border-left: 3px solid #e5e5e5; padding-left: 1rem; color: #666; }
    table { border-collapse: collapse; width: 100%; }
    td, th { border: 1px solid #e5e5e5; padding: 0.5rem; }
    th { background: #f4f4f5; font-weight: 600; }
    img { max-width: 100%; }
  </style>
</head>
<body>
  ${html}
</body>
</html>`;
    downloadFile(full, `${filename}.html`, "text/html");
    setOpen(false);
  }

  function handleExportText() {
    const text = editor!.state.doc.textContent;
    downloadFile(text, `${filename}.txt`, "text/plain");
    setOpen(false);
  }

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-1.5 rounded-lg hover:bg-[var(--muted)]"
        title="Export document"
      >
        <Download size={20} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1 w-48 bg-[var(--background)] border border-[var(--border)] rounded-lg shadow-lg z-50">
          <button
            onClick={handleExportMarkdown}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--muted)] rounded-t-lg"
          >
            <FileText size={16} />
            Markdown (.md)
          </button>
          <button
            onClick={handleExportHtml}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--muted)]"
          >
            <Code size={16} />
            HTML (.html)
          </button>
          <button
            onClick={handleExportText}
            className="w-full flex items-center gap-2 px-3 py-2 text-sm hover:bg-[var(--muted)] rounded-b-lg"
          >
            <FileType size={16} />
            Plain Text (.txt)
          </button>
        </div>
      )}
    </div>
  );
}
