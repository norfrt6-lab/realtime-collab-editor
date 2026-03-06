"use client";

import { useEffect, useState } from "react";
import type { HocuspocusProvider } from "@hocuspocus/provider";

interface TypingIndicatorProps {
  provider: HocuspocusProvider;
  currentUserName: string;
}

interface AwarenessState {
  user?: { name: string; color: string };
  isTyping?: boolean;
}

export function TypingIndicator({
  provider,
  currentUserName,
}: TypingIndicatorProps) {
  const [typingUsers, setTypingUsers] = useState<string[]>([]);

  useEffect(() => {
    function updateTyping() {
      const states = provider.awareness?.getStates();
      if (!states) return;

      const typing: string[] = [];
      states.forEach((state: AwarenessState) => {
        if (
          state.user &&
          state.isTyping &&
          state.user.name !== currentUserName
        ) {
          typing.push(state.user.name);
        }
      });

      setTypingUsers(typing);
    }

    provider.awareness?.on("change", updateTyping);
    return () => {
      provider.awareness?.off("change", updateTyping);
    };
  }, [provider, currentUserName]);

  if (typingUsers.length === 0) return null;

  const text =
    typingUsers.length === 1
      ? `${typingUsers[0]} is typing...`
      : typingUsers.length === 2
      ? `${typingUsers[0]} and ${typingUsers[1]} are typing...`
      : `${typingUsers[0]} and ${typingUsers.length - 1} others are typing...`;

  return (
    <div className="text-xs text-[var(--muted-foreground)] px-4 py-1 animate-pulse">
      {text}
    </div>
  );
}
