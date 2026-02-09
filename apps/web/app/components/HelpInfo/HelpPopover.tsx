"use client";

import * as React from "react";
import {
  Popover,
  PopoverTrigger,
  PopoverContent,
} from "@/components/ui/popover";
import { HelpCircle } from "lucide-react";

import { SourceNavInfo } from "./SourceNavInfo";
import { SourceClickInfo } from "./SourceClickInfo";
import { TargetClickInfo } from "./TargetClickInfo";
import { PageNavInfo } from "./PageNavInfo";
import { IPAClickInfo } from "./IPAClickInfo";

export function HelpPopover() {
  const [open, setOpen] = React.useState(false);
  const closeTimeout = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const openPopover = () => {
    if (closeTimeout.current) {
      clearTimeout(closeTimeout.current);
      closeTimeout.current = null;
    }
    setOpen(true);
  };

  const closePopoverWithDelay = () => {
    closeTimeout.current = setTimeout(() => {
      setOpen(false);
    }, 150);
  };

  return (
    <Popover open={open} onOpenChange={setOpen}>
      <PopoverTrigger asChild>
        <span
          onMouseEnter={openPopover}
          onMouseLeave={closePopoverWithDelay}
          className="inline-flex items-center text-muted-foreground hover:text-blue-600 cursor-default"
          aria-label="Help"
        >
          <HelpCircle className="h-4 w-4" />
        </span>
      </PopoverTrigger>

      <PopoverContent
        side="top"
        align="start"
        sideOffset={8}
        alignOffset={12}
        onMouseEnter={openPopover}
        onMouseLeave={closePopoverWithDelay}
        className="w-auto p-0 border shadow-lg"
      >
        <div className="border-b px-4 py-3 text-center">
          <div className="text-sm font-semibold">Navigation & interactions</div>
        </div>

        <div className="flex flex-col gap-3 p-3">
          <PageNavInfo className="w-full" />
          <SourceNavInfo className="w-full" />
          <SourceClickInfo className="w-full" />
          <TargetClickInfo className="w-full" />
          <IPAClickInfo className="w-full"/>
        </div>
      </PopoverContent>
    </Popover>
  );
}
