"use client";

import { useEffect } from "react";
import { X } from "lucide-react";

interface MobileMenuProps {
  children: React.ReactNode;
  onClose: () => void;
}

export function MobileMenu({ children, onClose }: MobileMenuProps) {
  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onClose();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onClose]);

  return (
    <div className="fixed inset-0 z-50 md:hidden" role="dialog" aria-modal="true" aria-label="Navigation menu">
      <div
        className="absolute inset-0 bg-black/50 backdrop-blur-sm animate-overlay"
        onClick={onClose}
        aria-hidden="true"
      />
      <aside className="absolute top-0 left-0 bottom-0 w-72 bg-[var(--card)] shadow-[var(--shadow-xl)] animate-slide-in-left overflow-y-auto">
        <div className="flex items-center justify-between p-4 border-b border-[var(--border)]">
          <span className="font-bold text-lg bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] bg-clip-text text-transparent">
            CollabEdit
          </span>
          <button
            onClick={onClose}
            className="p-1.5 rounded-full hover:bg-[var(--muted)] transition-colors"
            aria-label="Close menu"
          >
            <X size={18} />
          </button>
        </div>
        <nav className="p-2" aria-label="Sidebar navigation">{children}</nav>
      </aside>
    </div>
  );
}
