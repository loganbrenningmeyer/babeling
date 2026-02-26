import React from "react";

import { ToggleGroupItem } from "@/components/ui/toggle-group";


export function FilterItem({
  value,
  count,
  children,
}: {
  value: string;
  count: number;
  children: React.ReactNode;
}) {
  return (
    <ToggleGroupItem
      value={value}
      className="
        rounded-full px-4
        text-sm font-medium
        border
        data-[state=on]:bg-blue-300/10
        data-[state=on]:text-blue-600
        data-[state=on]:border-blue-600
        data-[state=off]:bg-muted
        data-[state=off]:text-foreground/70
        data-[state=off]:border-border
        transition-colors
      "
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