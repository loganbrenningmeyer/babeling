import type { AlignmentPayload } from "../types/pageTranslation";
import type { AlignResponseDTO } from "../types/align";
import type { TranslateParagraph } from "../types/translate";

import { toParagraphsDTO } from "../types/align";

/**************************
 * `align()`
 * -- 
 * 
 * @param 
 * @returns 
 **************************/
export async function align(args: {
  paragraphs: TranslateParagraph[];
  srcLang: string;
  tgtLang: string;
}): Promise<AlignmentPayload> {
  const res = await fetch("/api/align", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      paragraphs: toParagraphsDTO(args.paragraphs),
      src_lang: args.srcLang,
      tgt_lang: args.tgtLang,
    }),
  });

  if (!res.ok) {
    throw new Error("Align failed");
  }

  const data = (await res.json()) as AlignResponseDTO;

  return {
    src: data.src,
    tgt: data.tgt,
    align: data.align,
  };
}