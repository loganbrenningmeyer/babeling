import { Badge } from "@/components/ui/badge";
import { cn } from "@/lib/utils";

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
  data: DefineEntry | null;
  className?: string;
}) {
  if (!data) {
    return (
      <div className={cn("text-base text-muted-foreground", className)}>
        Click a French word to get a definition...
      </div>
    );
  }

  return (
    <div className={cn("space-y-3", className)}>
      {/* Headword */}
      <div className="text-lg font-semibold">{data.word}</div>

      {/* Top line: POS + pronunciation */}
      <div className="flex flex-wrap items-center gap-2">
        <Badge variant="secondary">{data.pos}</Badge>

        {data.pronunciation && (
          <span className="text-sm text-muted-foreground">
            /{data.pronunciation}/
          </span>
        )}

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
      <p className="text-base leading-6">{data.definition}</p>
    </div>
  );
}
