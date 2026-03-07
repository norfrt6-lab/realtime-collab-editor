"use client";

import { useState, useRef, useEffect, useCallback } from "react";

interface MentionUser {
  id: string;
  name: string;
  email: string;
}

interface CommentMentionInputProps {
  value: string;
  onChange: (value: string) => void;
  onSubmit: (mentionedUserIds: string[]) => void;
  documentId: string;
  placeholder?: string;
  className?: string;
  autoFocus?: boolean;
}

export function CommentMentionInput({
  value,
  onChange,
  onSubmit,
  documentId,
  placeholder,
  className,
  autoFocus,
}: CommentMentionInputProps) {
  const [showDropdown, setShowDropdown] = useState(false);
  const [query, setQuery] = useState("");
  const [users, setUsers] = useState<MentionUser[]>([]);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [mentionedIds, setMentionedIds] = useState<string[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const fetchUsers = useCallback(async (q: string) => {
    try {
      const res = await fetch(`/api/documents/${documentId}/collaborators`);
      if (!res.ok) return;
      const data: MentionUser[] = await res.json();
      setUsers(
        q
          ? data.filter((u) => u.name.toLowerCase().includes(q.toLowerCase()))
          : data
      );
    } catch {
      // ignore
    }
  }, [documentId]);

  useEffect(() => {
    if (showDropdown) {
      fetchUsers(query);
      setSelectedIndex(0);
    }
  }, [showDropdown, query, fetchUsers]);

  function handleChange(e: React.ChangeEvent<HTMLInputElement>) {
    const newValue = e.target.value;
    onChange(newValue);

    const cursorPos = e.target.selectionStart || 0;
    const textBeforeCursor = newValue.slice(0, cursorPos);
    const atMatch = textBeforeCursor.match(/@(\w*)$/);

    if (atMatch) {
      setQuery(atMatch[1]);
      setShowDropdown(true);
    } else {
      setShowDropdown(false);
    }
  }

  function handleSelect(user: MentionUser) {
    const cursorPos = inputRef.current?.selectionStart || 0;
    const textBeforeCursor = value.slice(0, cursorPos);
    const atIndex = textBeforeCursor.lastIndexOf("@");

    if (atIndex !== -1) {
      const before = value.slice(0, atIndex);
      const after = value.slice(cursorPos);
      const newValue = `${before}@${user.name} ${after}`;
      onChange(newValue);
      setMentionedIds((prev) =>
        prev.includes(user.id) ? prev : [...prev, user.id]
      );
    }

    setShowDropdown(false);
  }

  function handleKeyDown(e: React.KeyboardEvent<HTMLInputElement>) {
    if (showDropdown && users.length > 0) {
      if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev >= users.length - 1 ? 0 : prev + 1
        );
        return;
      }
      if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) =>
          prev <= 0 ? users.length - 1 : prev - 1
        );
        return;
      }
      if (e.key === "Enter") {
        e.preventDefault();
        handleSelect(users[selectedIndex]);
        return;
      }
      if (e.key === "Escape") {
        setShowDropdown(false);
        return;
      }
    }

    if (e.key === "Enter" && !showDropdown) {
      onSubmit(mentionedIds);
      setMentionedIds([]);
    }
  }

  return (
    <div className="relative flex-1">
      <input
        ref={inputRef}
        value={value}
        onChange={handleChange}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className={className}
        autoFocus={autoFocus}
      />

      {showDropdown && users.length > 0 && (
        <div
          ref={dropdownRef}
          className="absolute bottom-full left-0 mb-1 w-56 bg-[var(--popover)] border border-[var(--border)] rounded-xl shadow-[var(--shadow-lg)] overflow-hidden z-50"
        >
          {users.map((user, index) => (
            <button
              key={user.id}
              onClick={() => handleSelect(user)}
              className={`w-full flex items-center gap-2 px-3 py-2 text-sm transition-colors ${
                index === selectedIndex
                  ? "bg-[var(--accent)] text-[var(--primary)]"
                  : "hover:bg-[var(--muted)]"
              }`}
            >
              <div className="w-5 h-5 rounded-full bg-[var(--primary)] flex items-center justify-center text-[10px] text-white font-medium shrink-0">
                {user.name.charAt(0).toUpperCase()}
              </div>
              <div className="text-left min-w-0">
                <div className="font-medium truncate text-xs">{user.name}</div>
                <div className="text-[10px] text-[var(--muted-foreground)] truncate">{user.email}</div>
              </div>
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
