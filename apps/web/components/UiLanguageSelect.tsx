"use client";

import { useUserPreferences } from "@/components/UserPreferencesProvider";

// -------------------------
// UI Languages
// -------------------------
const UI_LANGS = [
  { code: "en", label: "English" },
  { code: "es", label: "Español" },
  { code: "fr", label: "Français" },
];


export function UiLanguageSelect() {
  const { uiLang, setUiLang, loading } = useUserPreferences();

  return (
    <select
      className="h-9 rounded-md border border-zinc-300 bg-white px-2 text-sm"
      value={uiLang}
      onChange={(e) => setUiLang(e.target.value)}
      disabled={loading}
      aria-label="UI language"
    >
      {UI_LANGS.map((l) => (
        <option key={l.code} value={l.code}>{l.label}</option>
      ))}
    </select>
  );
}