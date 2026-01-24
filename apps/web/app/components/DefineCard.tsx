import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

import { PronounceButton } from "./PronounceButton";

export type DefineEntry = {
  word: string;
  pos: string;
  definition: string;
  pronunciation: string | null;
  infinitive: string | null;
};

export function DefineCard({
  data,
  className,
}: {
  data: DefineEntry;
  className?: string;
}) {
  return (
    <div className={cn("space-y-3", className)}>
      {/* Headword */}
      <div className="gap-2 inline-flex">
        <div className="text-lg font-semibold">{data.word}</div>
        <PronounceButton text={data.word} />
      </div>

      <div className="flex flex-wrap items-center gap-2">
        {/* IPA Pronunciation / Audio */}
        {data.pronunciation && (
          <Badge variant="outline" className="h-6 inline-flex text-sm">
            {data.pronunciation}
          </Badge>
        )}

        {/* Part of Speech */}
        {data.pos && (
          <Badge variant="secondary" className="h-6 inline-flex text-sm">{data.pos}</Badge>
        )}

        {/* Infinitive */}
        {data.infinitive && (
          <span className="text-sm text-muted-foreground">
            infinitive:{" "}
            <span className="font-medium text-foreground">
              {data.infinitive}
            </span>
          </span>
        )}
      </div>
      
      {/* Definition body */}
      <p className="text-base leading-6">
        {data.definition ? data.definition : "Definition unavailable."}
      </p>

    </div>
  );
}
