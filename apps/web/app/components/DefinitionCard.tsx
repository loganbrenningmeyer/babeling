import { Badge } from "@/components/ui/badge";

export type DefinitionEntry = {
    word: string;
    pos: string;
    definition: string;
    pronunciation: string | null;
    infinitive: string | null;
}

export function DefinitionCard({
    definition
}: {
    definition: DefinitionEntry | null;
}) {
    if (!definition) {
        return (
            <div className="min-h-[20vh] text-sm text-muted-foreground">
                Click a French word to get a definition...
            </div>
        )
    }
    return (
        <div className="min-h-[20vh] space-y-3">
            {/* Headword */}
            <div className="text-lg font-semibold">
                {definition.word}
            </div>
            
            {/* Top line: POS + pronunciation */}
            <div className="flex flex-wrap items-center gap-2">
                <Badge variant="secondary">{definition.pos}</Badge>

                {definition.pronunciation && (
                <span className="text-sm text-muted-foreground">
                    /{definition.pronunciation}/
                </span>
                )}

                {definition.infinitive && (
                <span className="text-sm text-muted-foreground">
                    infinitive:{" "}
                    <span className="font-medium text-foreground">
                    {definition.infinitive}
                    </span>
                </span>
                )}
            </div>

            {/* Definition body */}
            <p className="text-sm leading-6">{definition.definition}</p>
        </div>
    );
}