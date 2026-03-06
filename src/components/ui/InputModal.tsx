"use client";

import { useEffect, useRef, useState } from "react";

interface InputModalProps {
  title: string;
  placeholder?: string;
  defaultValue?: string;
  confirmLabel?: string;
  onConfirm: (value: string) => void;
  onCancel: () => void;
}

export function InputModal({
  title,
  placeholder,
  defaultValue = "",
  confirmLabel = "Confirm",
  onConfirm,
  onCancel,
}: InputModalProps) {
  const [value, setValue] = useState(defaultValue);
  const inputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    inputRef.current?.focus();
  }, []);

  // Close on Escape key
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") onCancel();
    };
    document.addEventListener("keydown", handleKeyDown);
    return () => document.removeEventListener("keydown", handleKeyDown);
  }, [onCancel]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (value.trim()) onConfirm(value.trim());
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm animate-overlay"
      role="dialog"
      aria-modal="true"
      aria-labelledby="input-modal-title"
      onClick={(e) => e.target === e.currentTarget && onCancel()}
    >
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-[var(--card)] rounded-2xl shadow-[var(--shadow-xl)] overflow-hidden animate-scale-in"
      >
        <div className="h-1 bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)]" />
        <div className="p-6 space-y-4">
          <h3 id="input-modal-title" className="text-lg font-semibold text-[var(--foreground)]">{title}</h3>
          <input
            ref={inputRef}
            type="text"
            value={value}
            onChange={(e) => setValue(e.target.value)}
            placeholder={placeholder}
            aria-label={placeholder || title}
            className="w-full px-4 py-2.5 bg-[var(--surface-2)] border border-[var(--border)] rounded-xl text-[var(--foreground)] placeholder:text-[var(--muted-foreground)] focus:outline-none focus:ring-2 focus:ring-[var(--ring)]/50 focus:border-[var(--ring)] transition-shadow"
          />
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onCancel}
              className="px-4 py-2 text-sm font-medium rounded-xl border border-[var(--border)] text-[var(--foreground)] hover:bg-[var(--muted)] transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={!value.trim()}
              className="px-4 py-2 text-sm font-medium rounded-xl text-white bg-gradient-to-r from-[var(--gradient-start)] to-[var(--gradient-end)] hover:opacity-90 disabled:opacity-50 transition-opacity shadow-[var(--shadow-sm)]"
            >
              {confirmLabel}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}
