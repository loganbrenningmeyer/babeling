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
      className="
        inline-flex rounded-full p-0.5
        transition-transform duration-200
      "
    >
      <span
          className={cn(
          `
            relative inline-flex h-9 w-9 items-center overflow-hidden rounded-full
            border border-transparent px-1
            transition-colors duration-300 ease-out
            sm:h-10 sm:w-[4rem] sm:px-2
          `,
          isDark
            ? "bg-zinc-800"
            : "bg-zinc-200"
        )}
      >
        <span
          className={cn(
            `
              absolute left-0.75 top-1/2 inline-flex h-7 w-7 items-center justify-center
              rounded-full shadow-sm
              transition-all duration-300 ease-out
              -translate-y-1/2
              sm:h-8 sm:w-8
            `,
            isDark
              ? "translate-x-0 bg-blue-800/60 text-slate-400/70 sm:translate-x-[1.5rem]"
              : "translate-x-0 bg-amber-400/60 text-amber-950"
          )}
        >
          <Sun
            className={cn(
              "absolute size-4 transition-all duration-300 ease-out",
              isDark
                ? "rotate-90 scale-0 opacity-0"
                : "rotate-0 scale-100 opacity-100"
            )}
          />
          <Moon
            className={cn(
              "absolute size-4 transition-all duration-300 ease-out",
              isDark
                ? "rotate-0 scale-100 opacity-100"
                : "-rotate-90 scale-0 opacity-0"
            )}
          />
        </span>
      </span>
    </button>
  );
}
