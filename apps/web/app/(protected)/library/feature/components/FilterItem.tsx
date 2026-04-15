import React from "react";

import { ToggleGroupItem } from "@/components/ui/toggle-group";


export type LibraryFilterKey = "all" | "texts" | "glossary";

const LibraryFilterColors: Record<LibraryFilterKey, string> = {
  all: `
    data-[state=on]:bg-emerald-300/10
    data-[state=on]:text-emerald-600
    data-[state=on]:border-emerald-600
  `,
  texts: `
    data-[state=on]:bg-blue-300/10
    data-[state=on]:text-blue-600
    data-[state=on]:border-blue-600
  `,
  glossary: `
    data-[state=on]:bg-orange-300/10
    data-[state=on]:text-orange-600
    data-[state=on]:border-orange-600
  `
}


export function FilterItem({
  value,
  count,
  children,
}: {
  value: LibraryFilterKey;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <ToggleGroupItem
      value={value}
      className={`
        w-full justify-center rounded-full px-2
        text-xs font-medium sm:w-auto sm:px-4 sm:text-sm
        border
        ${LibraryFilterColors[value]}
        data-[state=off]:bg-muted/20
        data-[state=off]:text-muted-foreground/60
        data-[state=off]:border-border/60
        data-[state=off]:hover:text-muted-foreground
        data-[state=off]:hover:border-border
        transition-colors
        cursor-pointer
      `}
    >
      <span className="flex min-w-0 items-center gap-1.5 sm:gap-2">
        {children}
        <span
          className="
            rounded-full px-1.5 sm:px-2
            font-ui text-[11px] font-bold sm:text-xs
            bg-muted/40
          "
        >
          {count}
        </span>
      </span>
    </ToggleGroupItem>
  )
}
