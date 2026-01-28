"use client";

import * as React from "react";
import * as PopoverPrimitive from "@radix-ui/react-popover";
import { cn } from "@/lib/utils";

export function AnchoredPopover({
  open,
  onOpenChange,
  anchorEl,
  children,
  className,
}: {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  anchorEl: HTMLElement | null;
  children: React.ReactNode;
  className?: string;
}) {
  const [anchorRect, setAnchorRect] = React.useState<DOMRect | null>(null);

  // -------------------------
  // Update rect whenever open / anchor changes (scroll or resize)
  // -------------------------
  React.useEffect(() => {
    if (!open || !anchorEl) return;

    const update = () => setAnchorRect(anchorEl.getBoundingClientRect());
    update();

    window.addEventListener("scroll", update, true);
    window.addEventListener("resize", update);

    return () => {
      window.removeEventListener("scroll", update, true);
      window.removeEventListener("resize", update);
    };
  }, [open, anchorEl]);

  return (
    <PopoverPrimitive.Root open={open} onOpenChange={onOpenChange}>
      {/* Anchor element at the clicked word's viewport position */}
      {anchorRect && (
        <PopoverPrimitive.Anchor asChild>
          <span
            aria-hidden
            style={{
              position: "fixed",
              left: anchorRect.left,
              top: anchorRect.top,
              width: anchorRect.width,
              height: anchorRect.height,
              pointerEvents: "none",
            }}
          />
        </PopoverPrimitive.Anchor>
      )}

      <PopoverPrimitive.Portal>
        <PopoverPrimitive.Content
          side="bottom"
          align="start"
          sideOffset={10}
          className={cn(
            "z-50 w-[380px] rounded-xl border bg-background shadow-md overflow-hidden",
            "outline-none focus:outline-none focus-visible:outline-none",
            className
          )}
        >
          {children}
          <PopoverPrimitive.Arrow className="fill-border" />
        </PopoverPrimitive.Content>
      </PopoverPrimitive.Portal>
    </PopoverPrimitive.Root>
  );
}
