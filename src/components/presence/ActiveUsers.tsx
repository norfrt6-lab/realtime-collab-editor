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
    <div className="flex items-center gap-1">
      {users.slice(0, 5).map((user, i) => (
        <div
          key={i}
          className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium text-white border-2 border-[var(--background)]"
          style={{ backgroundColor: user.color }}
          title={user.name}
        >
          {user.name.charAt(0).toUpperCase()}
        </div>
      ))}
      {users.length > 5 && (
        <div className="w-7 h-7 rounded-full bg-[var(--muted)] flex items-center justify-center text-xs font-medium border-2 border-[var(--background)]">
          +{users.length - 5}
        </div>
      )}
    </div>
  );
}
