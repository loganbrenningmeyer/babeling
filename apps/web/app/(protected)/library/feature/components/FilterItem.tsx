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
        rounded-full px-4
        text-sm font-medium
        border
        ${LibraryFilterColors[value]}
        data-[state=off]:bg-muted
        data-[state=off]:text-foreground/50
        data-[state=off]:border-border
        data-[state=off]:hover:text-foreground/70
        data-[state=off]:hover:border-foreground/40
        transition-colors
        cursor-pointer
      `}
    >
      <span className="flex items-center gap-2">
        {children}
        <span
          className="
            rounded-full px-2
            font-ui font-bold text-xs
            bg-muted-foreground/10
          "
        >
          {count}
        </span>
      </span>
    </ToggleGroupItem>
  )
}