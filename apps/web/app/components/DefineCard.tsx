import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { PronounceButton } from "./PronounceButton";

export type DefineEntry = {
  word: string;
  sentence: string;
  lemma: string;
  pos: string;
  ipa_lemma: string;
  ipa_form: string;
  gloss: string;
};

export function DefineCard({
  data,
  tgtLang,
  className,
}: {
  data: DefineEntry;
  tgtLang?: string;
  className?: string;
}) {
  const wordIsLemma = (data.word === data.lemma);

  return (
    <div className={cn("space-y-3", className)}>
      <div className={`grid ${wordIsLemma ? "grid-cols-1" : "grid-cols-2"} gap-4`}>
        {/* -------------------------
        //* Left-Column: Clicked word (form)
        //* ------------------------- */}
        <div className={`flex flex-col gap-2 pr-4 ${wordIsLemma ? "" : "border-r"}`}>
          {/* Word + Part of Speech */}
          <div className="flex items-center gap-2">
            {/* Clicked word */}
            <div className="font-reading text-lg font-bold">{data.word}</div>
            {/* Part of Speech */}
            {data.pos && (
              <Badge 
                variant="secondary" 
                className="h-6 inline-flex text-sm font-reading border border-border">
                  {data.pos}
              </Badge>
            )}
          </div>

          {/* IPA Pronunciation */}
          {data.ipa_form && (
            <Badge 
              variant="outline" 
              className="h-6 inline-flex text-sm font-mono text-muted-foreground"
            >
                <PronounceButton
                  text={data.word}
                  label={data.ipa_form}
                  tgtLang={tgtLang} 
                />
            </Badge>
          )}
        </div>
        
        {/* -------------------------
        * Right-Column: Sentence pronunciation
        * ------------------------- */}
        <div className="flex flex-col gap-2">
          {/* -------------------------
          * Right-Column: Lemma (base form)
          * ------------------------- */}
          {!wordIsLemma && (
            <div
              className="
                h-full
                inline-flex flex-col
                rounded-lg border
                bg-muted/40
                px-3 py-2
                space-y-2
              "
            >
              {/* Header */}
              <div
                className="
                  text-xs font-medium
                  text-muted-foreground
                  pb-1
                  border-b
                "
              >
                Base form
              </div>

              {/* Lemma + Part of Speech */}
              <div className="flex items-center gap-2">
                {/* Lemma */}
                <div className="text-sm font-reading font-medium text-muted-foreground">{data.lemma}</div>
                {/* Part of Speech */}
                {data.pos && (
                  <Badge 
                    variant="secondary" 
                    className="h-6 inline-flex text-xs font-reading border border-border">
                      {data.pos}
                  </Badge>
                )}
              </div>

              {/* IPA */}
              {data.ipa_lemma && (
                <Badge
                  variant="outline"
                  className="h-6 text-xs font-mono text-muted-foreground"
                >
                  <PronounceButton
                    text={data.lemma}
                    label={data.ipa_lemma}
                    tgtLang={tgtLang} 
                  />
                </Badge>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Definition body */}
      <p className="text-base leading-6">
        {data.gloss ? data.gloss : "Definition unavailable."}
      </p>
    </div>
  );
}
