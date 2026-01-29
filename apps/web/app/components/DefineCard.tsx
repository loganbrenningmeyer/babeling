import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { PronounceButton } from "./PronounceButton";

export type DefineEntry = {
  lemma: string;
  pos: string;
  ipa: string;
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
  return (
    <div className={cn("space-y-3", className)}>
      {/* Headword */}
      <div className="gap-2 inline-flex">
        <div className="text-lg font-bold">{data.lemma}</div>
        <PronounceButton text={data.lemma} tgtLang={tgtLang} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* IPA Pronunciation / Audio */}
        {data.ipa && (
          <Badge variant="outline" className="h-6 inline-flex text-sm font-mono text-muted-foreground">
            /{data.ipa}/
          </Badge>
        )}

        {/* Part of Speech */}
        {data.pos && (
          <Badge variant="secondary" className="h-6 inline-flex text-sm">{data.pos}</Badge>
        )}
      </div>
      
      {/* Definition body */}
      <p className="text-base leading-6">
        {data.gloss ? data.gloss : "Definition unavailable."}
      </p>

    </div>
  );
}
