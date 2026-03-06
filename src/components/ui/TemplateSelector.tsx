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

export function TemplateSelector({ onSelect, onClose }: TemplateSelectorProps) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50">
      <div className="bg-[var(--background)] rounded-xl shadow-xl w-full max-w-lg mx-4">
        <div className="flex items-center justify-between px-6 py-4 border-b border-[var(--border)]">
          <h2 className="text-lg font-semibold">Choose a Template</h2>
          <button
            onClick={onClose}
            className="p-1 rounded hover:bg-[var(--muted)]"
          >
            <X size={20} />
          </button>
        </div>

        <div className="p-4 grid grid-cols-2 gap-3">
          {TEMPLATES.map((template) => {
            const Icon = ICON_MAP[template.icon] || FileText;
            return (
              <button
                key={template.id}
                onClick={() => onSelect(template)}
                className="flex items-start gap-3 p-4 border border-[var(--border)] rounded-lg hover:border-[var(--primary)] hover:bg-[var(--accent)] transition-all text-left"
              >
                <div className="w-10 h-10 rounded-lg bg-[var(--muted)] flex items-center justify-center shrink-0">
                  <Icon size={20} className="text-[var(--primary)]" />
                </div>
                <div>
                  <p className="font-medium text-sm">{template.name}</p>
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
