"use client";

import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";

import { useUserPreferences } from "@/components/UserPreferencesProvider";
import { UI_LANGS_MAP } from "@/app/i18n/messages";


export function UiLanguageSelect() {
  const { uiLang, setUiLang } = useUserPreferences();
  const selectedLang = UI_LANGS_MAP.find((l) => l.code === uiLang);

  return (
    <Select
      value={uiLang}
      onValueChange={(v) => setUiLang(v)}
    >
      <SelectTrigger className="h-9 w-[4.75rem] px-2 sm:w-[7.25rem] sm:px-3">
        <span className="font-ui text-sm font-medium uppercase sm:hidden">
          {uiLang}
        </span>
        <span className="hidden min-w-0 truncate font-ui text-sm sm:inline">
          {selectedLang?.label ?? uiLang}
        </span>
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
