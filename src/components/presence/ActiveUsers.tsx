"use client";

import { useEffect, useState } from "react";
import type { HocuspocusProvider } from "@hocuspocus/provider";
import type { PresenceUser } from "@/types";

interface ActiveUsersProps {
  provider: HocuspocusProvider;
  currentUser: PresenceUser;
}

interface AwarenessState {
  user?: PresenceUser;
}

export function ActiveUsers({ provider, currentUser }: ActiveUsersProps) {
  const [users, setUsers] = useState<PresenceUser[]>([]);

  useEffect(() => {
    function updateUsers() {
      const states = provider.awareness?.getStates();
      if (!states) return;

      const activeUsers: PresenceUser[] = [];
      states.forEach((state: AwarenessState) => {
        if (state.user && state.user.name !== currentUser.name) {
          activeUsers.push(state.user);
        }
      });

      setUsers(activeUsers);
    }

    provider.awareness?.on("change", updateUsers);
    updateUsers();

    return () => {
      provider.awareness?.off("change", updateUsers);
    };
  }, [provider, currentUser.name]);

  if (users.length === 0) return null;

  return (
    <div className="flex items-center gap-0.5">
      {users.slice(0, 5).map((user, i) => (
        <div
          key={i}
          className="relative w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium text-white border-2 border-[var(--card)] shadow-[var(--shadow-xs)] animate-scale-in group cursor-default"
          style={{ backgroundColor: user.color }}
          title={user.name}
        >
          {user.name.charAt(0).toUpperCase()}
          {/* Online indicator */}
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-[var(--success)] border-2 border-[var(--card)] rounded-full" />
          {/* Tooltip */}
          <span className="absolute -bottom-7 left-1/2 -translate-x-1/2 px-2 py-0.5 text-[10px] bg-[var(--foreground)] text-[var(--background)] rounded whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none">
            {user.name}
          </span>
        </div>
      ))}
      {users.length > 5 && (
        <div className="w-7 h-7 rounded-full bg-[var(--muted)] flex items-center justify-center text-xs font-medium border-2 border-[var(--card)] shadow-[var(--shadow-xs)]">
          +{users.length - 5}
        </div>
      )}
    </div>
  );
}
