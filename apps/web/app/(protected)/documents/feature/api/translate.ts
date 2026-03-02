import type { TranslateResponse, TranslateResponseDTO } from "../types/translate";

/**************************
 * `translate()`
 * -- 
 **************************/
export async function translate(args: {
  sourceText: string;
  srcLang: string;
  tgtLang: string;
}): Promise<TranslateResponse> {
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source_text: args.sourceText,
      src_lang: args.srcLang,
      tgt_lang: args.tgtLang,
    }),
  });

  if (!res.ok) {
    throw new Error("Translate failed");
  }

  const data = (await res.json()) as TranslateResponseDTO;

  return {
    sourceText: data.source_text,
    targetText: data.target_text,
    paragraphs: data.paragraphs.map((p) => ({
      parId: p.par_id,
      sentences: p.sentences.map((s) => ({
        sentId: s.sent_id,
        source: s.source,
        target: s.target,
      })),
    })),
  };
}