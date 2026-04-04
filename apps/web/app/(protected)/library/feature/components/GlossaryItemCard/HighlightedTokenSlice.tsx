import type { ReactNode } from "react";
import { cn } from "@/lib/utils";
import { buildClusters } from "@/lib/textClusters";

import type { GlossaryContextTokenSlice } from "@/app/(protected)/documents/feature/types/glossaryItem";


export function HighlightedTokenSlice({
  slice,
  className,
  highlightClassName = "bg-yellow-200/70",
}: {
  slice: GlossaryContextTokenSlice;
  className?: string;
  highlightClassName?: string;
}) {
  const highlighted = new Set(slice.highlightedLocalWordIds);
  const clusters = buildClusters(slice.words, slice.spaces);

  function renderSpace(space: string) {
    if (!space) return null;

    const parts = space.split("\n");
    if (parts.length === 1) return parts[0];

    const out: ReactNode[] = [];
    for (let k = 0; k < parts.length; k += 1) {
      if (k > 0) out.push(<br key={`br-${k}`} />);
      if (parts[k].length > 0) out.push(parts[k]);
    }
    return out;
  }

  return (
    <p className={cn("whitespace-pre-wrap leading-6", className)}>
      {clusters.map((cluster, i) => {
        const isHighlighted = Array.from(
          { length: cluster.end - cluster.start + 1 },
          (_, j) => cluster.start + j
        ).some((idx) => highlighted.has(idx));
        const space =
          i === clusters.length - 1
            ? cluster.afterSpace.replace(/\s+$/, "")
            : cluster.afterSpace;

        return (
          <span
            key={`${
              slice.globalWordIds[cluster.anchorLocalIndex] ?? cluster.anchorLocalIndex
            }-${cluster.start}`}
          >
            <span
              className={cn(
                isHighlighted &&
                  `${highlightClassName} rounded px-0.5 text-foreground font-semibold`
              )}
            >
              {cluster.text}
            </span>
            {renderSpace(space)}
          </span>
        );
      })}
    </p>
  );
}
