"use client";

import React, {
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

type ThemePref = "system" | "light" | "dark";

type UserPrefsState = {
  uiLang: string;
  srcLang: string | null;
  tgtLang: string | null;
  theme: ThemePref;

  setUiLang: (next: string) => void;
  setSrcLang: (next: string | null) => void;
  setTgtLang: (next: string | null) => void;
  setTheme: (next: ThemePref) => void;

  loading: boolean;
};

const UserPrefsContext = createContext<UserPrefsState | null>(null);

export function UserPreferencesProvider({
  initialTheme = "system",
  children,
}: {
  initialTheme?: ThemePref;
  children: React.ReactNode;
}) {
  const [uiLang, setUiLangState] = useState("en");
  const [srcLang, setSrcLangState] = useState<string | null>(null);
  const [tgtLang, setTgtLangState] = useState<string | null>(null);
  const [theme, setThemeState] = useState<ThemePref>(initialTheme);
  const [loading, setLoading] = useState(true);

  // -------------------------
  // PATCH helper (fire-and-forget)
  // -------------------------
  type UserPrefsPatch = Partial<{
    preferred_ui_lang: string;
    preferred_src_lang: string | null;
    preferred_tgt_lang: string | null;
    theme: ThemePref;
  }>;

  const patchPrefs = (partial: UserPrefsPatch) => {
    void fetch("/api/user_preferences", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(partial),
    });
  };

  // -------------------------
  // Initial fetch from DB
  // -------------------------
  useEffect(() => {
    // Prevent state updates after unmounting component
    let cancelled = false;

    // -------------------------
    // Fetch user preferences from database
    // -------------------------
    (async () => {
      try {
        const res = await fetch("/api/user_preferences", { cache: "no-store" });
        if (!res.ok) throw new Error("Error fetching user preferences");
        const data = await res.json();

        if (cancelled) return;

        // -------------------------
        // Update states
        // -------------------------
        // Non-nullable in DB (server defaults ensure these exist)
        setUiLangState(data.preferred_ui_lang);
        setThemeState(data.theme);
        // Nullable in DB
        setSrcLangState(data.preferred_src_lang ?? null);
        setTgtLangState(data.preferred_tgt_lang ?? null);
      } catch {
        // keep defaults
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // -------------------------
  // Set <html lang={uiLang}> for screen reader accessibility
  // -- e.g., using browser speech engine, accent rules, etc.
  // -------------------------
  useEffect(() => {
    document.documentElement.lang = uiLang;
  }, [uiLang]);

  // -------------------------
  // Set light / dark theme
  // -------------------------
  useEffect(() => {
    const root = document.documentElement;
    const media = window.matchMedia("(prefers-color-scheme: dark)");

    const applyTheme = () => {
      const isDark =
        theme === "system" ? media.matches : theme === "dark";

      root.classList.toggle("dark", isDark);
    };

    applyTheme();

    if (theme !== "system") {
      return;
    }

    media.addEventListener("change", applyTheme);

    return () => {
      media.removeEventListener("change", applyTheme);
    };
  }, [theme]);

  // -------------------------
  // Preference setters
  // -- Optimistic: Updates UI render immediately, then patches backend
  // -------------------------
  const setUiLang = (next: string) => {
    // Update UI lang render immediately
    setUiLangState(next);
    patchPrefs({ preferred_ui_lang: next });
  };

  const setSrcLang = (next: string | null) => {
    // Update src lang in browser immediately
    setSrcLangState(next);
    patchPrefs({ preferred_src_lang: next });
  };

  const setTgtLang = (next: string | null) => {
    // Update tgt lang in browser immediately
    setTgtLangState(next);
    patchPrefs({ preferred_tgt_lang: next });
  };

  const setTheme = (next: ThemePref) => {
    setThemeState(next);
    patchPrefs({ theme: next });
  };

  const value = {
    uiLang,
    srcLang,
    tgtLang,
    theme,
    setUiLang,
    setSrcLang,
    setTgtLang,
    setTheme,
    loading,
  };

  return (
    <UserPrefsContext.Provider value={value}>
      {children}
    </UserPrefsContext.Provider>
  );
}

export function useUserPreferences() {
  const ctx = useContext(UserPrefsContext);
  if (!ctx)
    throw new Error(
      "useUserPreferences must be used within UserPreferencesProvider"
    );
  return ctx;
}
