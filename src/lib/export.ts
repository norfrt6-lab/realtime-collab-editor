import type { Editor } from "@tiptap/react";

export function exportToMarkdown(editor: Editor): string {
  const json = editor.getJSON();
  return jsonToMarkdown(json);
}

function jsonToMarkdown(node: Record<string, unknown>): string {
  if (!node) return "";

  const type = node.type as string;
  const content = node.content as Record<string, unknown>[] | undefined;
  const attrs = node.attrs as Record<string, unknown> | undefined;
  const text = node.text as string | undefined;
  const marks = node.marks as Array<{ type: string; attrs?: Record<string, unknown> }> | undefined;

  if (type === "text") {
    let result = text || "";
    if (marks) {
      for (const mark of marks) {
        switch (mark.type) {
          case "bold":
            result = `**${result}**`;
            break;
          case "italic":
            result = `*${result}*`;
            break;
          case "code":
            result = `\`${result}\``;
            break;
          case "strike":
            result = `~~${result}~~`;
            break;
          case "link":
            result = `[${result}](${mark.attrs?.href || ""})`;
            break;
          case "underline":
            result = `<u>${result}</u>`;
            break;
        }
      }
    }
    return result;
  }

  const childContent = content
    ? content.map((child) => jsonToMarkdown(child)).join("")
    : "";

  switch (type) {
    case "doc":
      return childContent;
    case "paragraph":
      return `${childContent}\n\n`;
    case "heading": {
      const level = (attrs?.level as number) || 1;
      return `${"#".repeat(level)} ${childContent}\n\n`;
    }
    case "bulletList":
      return childContent;
    case "orderedList":
      return childContent;
    case "listItem":
      return `- ${childContent.trim()}\n`;
    case "taskList":
      return childContent;
    case "taskItem": {
      const checked = attrs?.checked ? "x" : " ";
      return `- [${checked}] ${childContent.trim()}\n`;
    }
    case "blockquote":
      return childContent
        .split("\n")
        .map((line: string) => (line ? `> ${line}` : ">"))
        .join("\n") + "\n\n";
    case "codeBlock":
      return `\`\`\`${(attrs?.language as string) || ""}\n${childContent}\`\`\`\n\n`;
    case "horizontalRule":
      return "---\n\n";
    case "image":
      return `![${(attrs?.alt as string) || ""}](${attrs?.src || ""})\n\n`;
    case "table":
      return childContent + "\n";
    case "tableRow": {
      const cells = content || [];
      const row = cells.map((cell) => jsonToMarkdown(cell).trim()).join(" | ");
      return `| ${row} |\n`;
    }
    case "tableHeader":
      return childContent;
    case "tableCell":
      return childContent;
    case "hardBreak":
      return "  \n";
    default:
      return childContent;
  }
}

export function exportToHtml(editor: Editor): string {
  return editor.getHTML();
}

export function downloadFile(content: string, filename: string, type: string) {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function getWordCount(editor: Editor): {
  words: number;
  characters: number;
  readingTime: string;
} {
  const text = editor.state.doc.textContent;
  const words = text
    .split(/\s+/)
    .filter((w) => w.length > 0).length;
  const characters = text.length;
  const minutes = Math.max(1, Math.ceil(words / 200));
  const readingTime = `${minutes} min read`;

  return { words, characters, readingTime };
}
