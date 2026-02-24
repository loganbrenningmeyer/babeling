import type {
  SaveReadProgressRequest,
  SaveReadProgressResponseDTO,
} from "../types/readProgress";

/**************************
 * `saveReadProgress()`
 * -- POST: /api/read_progress
 *    Saves current reader page progress for a document/tgtLang
 **************************/
export async function saveReadProgress(
  args: SaveReadProgressRequest
): Promise<SaveReadProgressResponseDTO> {
  const res = await fetch("/api/read_progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      document_id: args.documentId,
      tgt_lang: args.tgtLang,
      current_page_number: args.currentPageNumber, // 1-indexed
    }),
    cache: "no-store",
  });

  if (!res.ok) {
    const msg = await res.text().catch(() => "");
    throw new Error(msg || "Failed to save read progress");
  }

  return (await res.json()) as SaveReadProgressResponseDTO;
}
