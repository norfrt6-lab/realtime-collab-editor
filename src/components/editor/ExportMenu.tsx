"use client";

import { useState, useRef, useEffect } from "react";
import type { Editor } from "@tiptap/react";
import { Download, FileText, Code, FileType } from "lucide-react";
import { exportToMarkdown, exportToHtml, downloadFile } from "@/lib/export";
import { useToast } from "@/components/ui/Toast";

interface ExportMenuProps {
  editor: Editor | null;
  documentTitle: string;
}

export function ExportMenu({ editor, documentTitle }: ExportMenuProps) {
  const [open, setOpen] = useState(false);
  const menuRef = useRef<HTMLDivElement>(null);
  const { toast } = useToast();

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
    try {
      if (editor!.isEmpty) {
        toast("warning", "Document is empty");
        setOpen(false);
        return;
      }
      const md = exportToMarkdown(editor!);
      downloadFile(md, `${filename}.md`, "text/markdown");
      toast("success", "Exported as Markdown");
    } catch (err) {
      toast("error", `Export failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
    setOpen(false);
  }

  function handleExportHtml() {
    try {
      if (editor!.isEmpty) {
        toast("warning", "Document is empty");
        setOpen(false);
        return;
      }
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
      toast("success", "Exported as HTML");
    } catch (err) {
      toast("error", `Export failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
    setOpen(false);
  }

  function handleExportText() {
    try {
      if (editor!.isEmpty) {
        toast("warning", "Document is empty");
        setOpen(false);
        return;
      }
      const text = editor!.state.doc.textContent;
      downloadFile(text, `${filename}.txt`, "text/plain");
      toast("success", "Exported as Plain Text");
    } catch (err) {
      toast("error", `Export failed: ${err instanceof Error ? err.message : "Unknown error"}`);
    }
    setOpen(false);
  }

  const items = [
    { icon: <FileText size={16} className="text-green-500" />, label: "Markdown (.md)", action: handleExportMarkdown },
    { icon: <Code size={16} className="text-orange-500" />, label: "HTML (.html)", action: handleExportHtml },
    { icon: <FileType size={16} className="text-gray-500" />, label: "Plain Text (.txt)", action: handleExportText },
  ];

  return (
    <div ref={menuRef} className="relative">
      <button
        onClick={() => setOpen(!open)}
        className="p-2 rounded-full hover:bg-[var(--muted)] text-[var(--muted-foreground)] hover:text-[var(--foreground)] transition-colors"
        title="Export document"
      >
        <Download size={18} />
      </button>

      {open && (
        <div className="absolute right-0 top-full mt-1.5 w-52 bg-[var(--popover)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-lg)] z-50 animate-slide-in-down overflow-hidden">
          {items.map((item, i) => (
            <button
              key={i}
              onClick={item.action}
              className="w-full flex items-center gap-2.5 px-4 py-2.5 text-sm hover:bg-[var(--muted)] transition-colors"
            >
              {item.icon}
              {item.label}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
