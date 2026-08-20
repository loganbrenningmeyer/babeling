"use client";

import { useEffect, useState } from "react";
import { Moon, Sun } from "lucide-react";

import { useUserPreferences } from "@/components/UserPreferencesProvider";
import { cn } from "@/lib/utils";

export function ThemeToggle() {
  const { theme, setTheme } = useUserPreferences();
  const [systemPrefersDark, setSystemPrefersDark] = useState(false);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const syncTheme = () => {
      setSystemPrefersDark(media.matches);
    };

    syncTheme();
    media.addEventListener("change", syncTheme);

    return () => {
      media.removeEventListener("change", syncTheme);
    };
  }, []);

  const isDark = theme === "system" ? systemPrefersDark : theme === "dark";
  const nextTheme = isDark ? "light" : "dark";
  const nextLabel = isDark ? "light" : "dark";

  return (
    <button
      type="button"
      onClick={() => setTheme(nextTheme)}
      aria-label={`Switch to ${nextLabel} mode`}
      aria-pressed={isDark}
      title={`Switch to ${nextLabel} mode`}
      className={cn(
        `
          relative inline-flex size-9 shrink-0 items-center justify-center
          rounded-md border border-input bg-transparent shadow-xs
          outline-none transition-colors
          hover:bg-accent
          focus-visible:border-ring focus-visible:ring-[3px] focus-visible:ring-ring/50
          dark:bg-input/30 dark:hover:bg-input/50
        `,
        isDark ? "text-slate-300" : "text-amber-500"
      )}
    >
      <Sun
        className={cn(
          "absolute size-4 transition-all duration-300 ease-out",
          isDark ? "rotate-90 scale-0 opacity-0" : "rotate-0 scale-100 opacity-100"
        )}
      />
      <Moon
        className={cn(
          "absolute size-4 transition-all duration-300 ease-out",
          isDark ? "rotate-0 scale-100 opacity-100" : "-rotate-90 scale-0 opacity-0"
        )}
      />
    </button>
  );
}
