"use client";

import { useEffect, useState } from "react";
import { Sun, Moon, Monitor } from "lucide-react";

type Theme = "system" | "light" | "dark";

const iconMap: Record<Theme, React.ReactNode> = {
  system: <Monitor size={16} />,
  light: <Sun size={16} />,
  dark: <Moon size={16} />,
};

const labelMap: Record<Theme, string> = {
  system: "System theme",
  light: "Light theme",
  dark: "Dark theme",
};

const cycle: Theme[] = ["system", "light", "dark"];

export function ThemeToggle() {
  const [theme, setTheme] = useState<Theme>("system");
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
    const stored = localStorage.getItem("theme") as Theme | null;
    if (stored && cycle.includes(stored)) {
      setTheme(stored);
    }
  }, []);

  useEffect(() => {
    if (!mounted) return;
    const root = document.documentElement;

    if (theme === "dark") {
      root.classList.add("dark");
      root.classList.remove("light");
    } else if (theme === "light") {
      root.classList.add("light");
      root.classList.remove("dark");
    } else {
      root.classList.remove("light", "dark");
    }

    localStorage.setItem("theme", theme);
  }, [theme, mounted]);

  const toggle = () => {
    const idx = cycle.indexOf(theme);
    setTheme(cycle[(idx + 1) % cycle.length]);
  };

  if (!mounted) {
    return <div className="w-8 h-8" />;
  }

  return (
    <button
      onClick={toggle}
      title={labelMap[theme]}
      className="relative p-2 rounded-full hover:bg-[var(--muted)] transition-all duration-200 text-[var(--muted-foreground)] hover:text-[var(--foreground)]"
    >
      <span className="block transition-transform duration-300" style={{ transform: `rotate(${cycle.indexOf(theme) * 120}deg)` }}>
        {iconMap[theme]}
      </span>
    </button>
  );
}
