"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

import { useUserPreferences } from "@/components/UserPreferencesProvider";
import { UI_LANGS_MAP } from "@/app/i18n/messages";


export function UiLanguageSelect() {
  const { uiLang, setUiLang, loading } = useUserPreferences();

  return (
    <Select
      value={uiLang}
      onValueChange={(v) => setUiLang(v)}
    >
      <SelectTrigger>
        <SelectValue />
      </SelectTrigger>
      <SelectContent position="popper" align="start">
        {UI_LANGS_MAP.map((l) => (
          <SelectItem
            key={l.code}
            value={l.code}
          >
            {l.label}
          </SelectItem>
        ))}
      </SelectContent>
    </Select>
  );
}