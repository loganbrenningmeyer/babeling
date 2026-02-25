/**************************
 * `truncate()`
 * -- Truncates sample text up to maxChars at the last space
 **************************/
export function truncate(text: string, maxChars: number) {
  if (text.length <= maxChars) return text;

  const trimmed = text.slice(0, maxChars);
  const lastSpace = trimmed.lastIndexOf(" ");

  return trimmed.slice(0, lastSpace > 0 ? lastSpace : maxChars);
}

/**************************
 * `capitalizeWords()`
 * -- Capitalizes words in a string
 **************************/
export function capitalizeWords(str: string) {
  return str.replace(/\b\w/g, (char) => char.toUpperCase());
}

/**************************
 * `formatRelativeTime()`
 * -- Takes iso time string and returns a human-readable relative time (e.g., "2 days ago")
 **************************/
export function formatRelativeTime(iso: string | null): string {
  if (!iso) return "Never opened";

  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return "Unknown";

  const diffMs = date.getTime() - Date.now(); // negative = past
  const absMs = Math.abs(diffMs);

  const rtf = new Intl.RelativeTimeFormat(undefined, { numeric: "auto" });

  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;
  const week = 7 * day;
  const month = 30 * day;
  const year = 365 * day;

  if (absMs < minute) return rtf.format(Math.round(diffMs / 1000), "second");
  if (absMs < hour) return rtf.format(Math.round(diffMs / minute), "minute");
  if (absMs < day) return rtf.format(Math.round(diffMs / hour), "hour");
  if (absMs < week) return rtf.format(Math.round(diffMs / day), "day");
  if (absMs < month) return rtf.format(Math.round(diffMs / week), "week");
  if (absMs < year) return rtf.format(Math.round(diffMs / month), "month");
  return rtf.format(Math.round(diffMs / year), "year");
}
