import React from "react";

import { ToggleGroupItem } from "@/components/ui/toggle-group";


export type LibraryFilterKey = "all" | "texts" | "glossary";

/* -------------------------
//* Per-filter accent
//* -- Each filter borrows a semantic accent family from the theme, so the
//*    selected pill is a real tinted surface (`*-subtle`) with text that
//*    clears AA on it (`*-subtle-foreground`) in *both* light and dark.
//* -- `hover` is spelled out for both states: the base `toggleVariants`
//*    ship a bare `hover:bg-muted hover:text-muted-foreground` that would
//*    otherwise wash the selected pill back to neutral on hover.
//* ------------------------- */
const LibraryFilterColors: Record<LibraryFilterKey, string> = {
  all: `
    data-[state=on]:bg-success-subtle
    data-[state=on]:text-success-subtle-foreground
    data-[state=on]:border-success-border
    data-[state=on]:hover:bg-success-subtle
    data-[state=on]:hover:text-success-subtle-foreground
  `,
  texts: `
    data-[state=on]:bg-info-subtle
    data-[state=on]:text-info-subtle-foreground
    data-[state=on]:border-info-border
    data-[state=on]:hover:bg-info-subtle
    data-[state=on]:hover:text-info-subtle-foreground
  `,
  glossary: `
    data-[state=on]:bg-warning-subtle
    data-[state=on]:text-warning-subtle-foreground
    data-[state=on]:border-warning-border
    data-[state=on]:hover:bg-warning-subtle
    data-[state=on]:hover:text-warning-subtle-foreground
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
        text-xs sm:w-auto sm:px-4 sm:text-sm
        border
        ${LibraryFilterColors[value]}
        data-[state=on]:font-semibold
        data-[state=on]:shadow-sm
        data-[state=off]:bg-card
        data-[state=off]:font-medium
        data-[state=off]:text-muted-foreground
        data-[state=off]:border-border
        data-[state=off]:hover:bg-accent
        data-[state=off]:hover:text-foreground
        data-[state=off]:hover:border-border-strong
        transition-colors
        cursor-pointer
      `}
    >
      <span className="flex min-w-0 items-center gap-1.5 sm:gap-2">
        {children}
        {/* Neutral ink/paper plate rather than a fixed fill: the count text
            inherits the pill's accent (or muted off-state) via `currentColor`,
            and the plate just darkens/lightens whatever is behind it.
            NB: `bg-current/15` is not an option — Tailwind drops the alpha
            modifier on `currentColor` and emits an opaque fill. */}
        <span
          className="
            rounded-full px-1.5 sm:px-2
            font-ui text-[11px] font-bold sm:text-xs
            bg-black/[0.07] dark:bg-white/10
          "
        >
          {count}
        </span>
      </span>
    </ToggleGroupItem>
  )
}
