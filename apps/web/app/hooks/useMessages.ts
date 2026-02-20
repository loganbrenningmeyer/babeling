import { messages, type UiLang } from "../i18n/messages";
import { useUserPreferences } from "@/components/UserPreferencesProvider";

const DEFAULT_LANG: UiLang = "en";


/**************************
 * `useMessages()`
 * -- Hook to use preferred UI language in UI
 * -- Usage:
 *      const m = useMessages();
 *      <Button>{m.nav.translate}</Button>
 **************************/
export function useMessages() {
  const { uiLang } = useUserPreferences();

  const lang = (uiLang in messages ? (uiLang as UiLang) : DEFAULT_LANG);
  return messages[lang];
}