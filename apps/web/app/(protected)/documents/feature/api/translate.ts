import type { TranslateResponse, TranslateResponseDTO } from "../types/translate";

/**************************
 * `translate()`
 * -- Given `source` text, `srcLang` / `tgtLang`, normalizes the source
 *    text and translates to `target` text using Gemini, returning normalized source / target
 * 
 * @param 
 * @returns 
 **************************/
export async function translate(args: {
  source: string;
  srcLang: string;
  tgtLang: string;
}): Promise<TranslateResponse> {
  const res = await fetch("/api/translate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      source: args.source,
      src_lang: args.srcLang,
      tgt_lang: args.tgtLang,
    }),
  });

  if (!res.ok) {
    throw new Error("Translate failed");
  }

  const data = (await res.json()) as TranslateResponseDTO;

  return {
    source: data.source,
    target: data.target,
  };
}