"use client";

import {
  FileText,
  Users,
  Briefcase,
  Code,
  Calendar,
  X,
} from "lucide-react";
import { TEMPLATES, type DocumentTemplate } from "@/lib/templates";

interface TemplateSelectorProps {
  onSelect: (template: DocumentTemplate) => void;
  onClose: () => void;
}

const ICON_MAP: Record<string, typeof FileText> = {
  FileText,
  Users,
  Briefcase,
  Code,
  Calendar,
};

const COLORS: string[] = [
  "from-blue-500 to-blue-600",
  "from-green-500 to-green-600",
  "from-purple-500 to-purple-600",
  "from-orange-500 to-orange-600",
  "from-pink-500 to-pink-600",
];

export function TemplateSelector({ onSelect, onClose }: TemplateSelectorProps) {
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="template-selector-title"
      onClick={(e) => e.target === e.currentTarget && onClose()}
    >
      <div className="bg-[var(--card)] rounded-2xl shadow-[var(--shadow-xl)] w-full max-w-lg overflow-hidden animate-scale-in">
        <div className="h-1 bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)]" />
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 id="template-selector-title" className="text-lg font-semibold">Choose a Template</h2>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[var(--muted)] transition-colors"
            aria-label="Close template selector"
          >
            <X size={18} />
          </button>
        </div>

        <div className="p-4 grid grid-cols-2 gap-3">
          {TEMPLATES.map((template, i) => {
            const Icon = ICON_MAP[template.icon] || FileText;
            return (
              <button
                key={template.id}
                onClick={() => onSelect(template)}
                className="flex items-start gap-3 p-4 border border-[var(--border)] rounded-xl hover:border-[var(--primary)]/40 hover:shadow-[var(--shadow-md)] hover:-translate-y-0.5 transition-all duration-200 text-left group bg-[var(--card)]"
              >
                <div className={`w-10 h-10 rounded-xl bg-gradient-to-br ${COLORS[i % COLORS.length]} flex items-center justify-center shrink-0 shadow-[var(--shadow-sm)]`}>
                  <Icon size={20} className="text-white" />
                </div>
                <div>
                  <p className="font-medium text-sm group-hover:text-[var(--primary)] transition-colors">{template.name}</p>
                  <p className="text-xs text-[var(--muted-foreground)] mt-0.5">
                    {template.description}
                  </p>
                </div>
              </button>
            );
          })}
        </div>
      </div>
    </div>
  );
}
