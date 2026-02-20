"use client";

import { useUserPreferences } from "@/components/UserPreferencesProvider";
import { UI_LANGS_MAP } from "@/app/i18n/messages";


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
      {UI_LANGS_MAP.map((l) => (
        <option key={l.code} value={l.code}>{l.label}</option>
      ))}
    </select>
  );
}