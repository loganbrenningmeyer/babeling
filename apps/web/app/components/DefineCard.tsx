import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { PronounceButton } from "./Pronounce/PronounceButton";

export type DefineEntry = {
  word: string;
  sentence: string;
  paragraph: string;
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
  tgtLang: string;
  className?: string;
}) {
  const wordIsLemma = (data.word === data.lemma);

  return (
    <div className={cn("space-y-3", className)}>
      <div className={`grid ${wordIsLemma ? "grid-cols-1" : "grid-cols-2"} gap-4`}>
        {/* -------------------------
        //* Left-Column: Clicked word (form)
        //* ------------------------- */}
        <div className={`flex flex-col items-start gap-2 pr-4 ${wordIsLemma ? "" : "border-r"}`}>
          {/* Word + Part of Speech */}
          <div className="flex items-center gap-2">
            {/* Clicked word */}
            <div className="font-reading text-2xl font-bold">{data.word}</div>
            {/* Part of Speech */}
            {data.pos && (
              <Badge 
                variant="secondary" 
                className="h-6 inline-flex text-md font-reading border border-border">
                  {data.pos}
              </Badge>
            )}
          </div>

          {/* IPA Pronunciation */}
          {data.ipa_form && (
            <PronounceButton
              text={data.word}
              label={data.ipa_form}
              tgtLang={tgtLang} 
              className="h-8 text-md"
              iconClassName="h-3 w-3"
            />
          )}

          {/* Definition */}
          <p className="text-lg leading-6 font-reading pt-4">
            {data.gloss ? data.gloss : "Definition unavailable."}
          </p>
        </div>
        
        {/* -------------------------
        * Right-Column: Lemma
        * ------------------------- */}
        {!wordIsLemma && (
          <div className="flex flex-col items-start gap-2">
            <div
              className="
                h-full w-full
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
                <div className="text-md font-reading font-semibold text-muted-foreground">{data.lemma}</div>
                {/* Part of Speech */}
                {data.pos && (
                  <Badge 
                    variant="secondary" 
                    className="h-6 inline-flex text-sm font-reading border border-border">
                      {data.pos}
                  </Badge>
                )}
              </div>

              {/* IPA */}
              {data.ipa_lemma && (
                <PronounceButton
                  text={data.lemma}
                  label={data.ipa_lemma}
                  tgtLang={tgtLang} 
                  className="h-8 text-sm"
                  iconClassName="h-3 w-3"
                />
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
