"use client";

import { useEffect, useRef } from "react";
import { AlertTriangle } from "lucide-react";

interface ConfirmModalProps {
  title: string;
  description: string;
  confirmLabel?: string;
  variant?: "destructive" | "primary";
  onConfirm: () => void;
  onCancel: () => void;
}

export function ConfirmModal({
  title,
  description,
  confirmLabel = "Confirm",
  variant = "primary",
  onConfirm,
  onCancel,
}: ConfirmModalProps) {
  const cancelRef = useRef<HTMLButtonElement>(null);

  // Focus the cancel button on mount (safer default for destructive actions)
  useEffect(() => {
    cancelRef.current?.focus();
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-overlay"
      role="alertdialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      aria-describedby="confirm-modal-desc"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <div className="w-full max-w-sm bg-[var(--card)] rounded-2xl shadow-[var(--shadow-xl)] overflow-hidden animate-scale-in">
        <div
          className={`h-1 ${
            variant === "destructive"
              ? "bg-[var(--destructive)]"
              : "bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)]"
          }`}
        />
        <div className="p-6 space-y-4">
          <div className="flex items-start gap-3">
            {variant === "destructive" && (
              <div className="shrink-0 w-10 h-10 rounded-full bg-[var(--destructive)]/10 flex items-center justify-center text-[var(--destructive)]" aria-hidden="true">
                <AlertTriangle size={20} />
              </div>
            )}
            <div>
              <h3 id="confirm-modal-title" className="text-lg font-semibold text-[var(--foreground)]">{title}</h3>
              <p id="confirm-modal-desc" className="text-sm text-[var(--muted-foreground)] mt-1">{description}</p>
            </div>
          </div>
          <div className="flex justify-end gap-2">
            <button
              ref={cancelRef}
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium rounded-xl border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="button"
              onClick={onConfirm}
              className={`px-4 py-2 text-sm font-medium rounded-xl text-white transition-opacity hover:opacity-90 shadow-[var(--shadow-sm)] ${
                variant === "destructive"
                  ? "bg-[var(--destructive)]"
                  : "bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)]"
              }`}
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
