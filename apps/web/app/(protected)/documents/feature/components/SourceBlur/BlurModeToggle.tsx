import { useLayoutEffect, useRef, useState } from "react";
import { ToggleGroup, ToggleGroupItem } from "@/components/ui/toggle-group";
import { useMessages } from "@/app/hooks/useMessages";

export type BlurMode = "word" | "sentence" | "paragraph";

type Indicator = { left: number; width: number; ready: boolean };

export function BlurModeToggle({
  value,
  onChange,
}: {
  value: BlurMode;
  onChange: (v: BlurMode) => void;
}) {
  const m = useMessages();
  const msgs = m.reader.blurModeToggle;

  const trackRef = useRef<HTMLDivElement | null>(null);
  const [indicator, setIndicator] = useState<Indicator>({
    left: 0,
    width: 0,
    ready: false,
  });

  {/* -------------------------
  * Set sliding pill left / width based on selection
  * ------------------------- */}
  useLayoutEffect(() => {
    const root = trackRef.current;
    if (!root) return;

    const active = root.querySelector<HTMLElement>(`[data-blur-mode="${value}"]`);
    if (!active) return;

    const rootRect = root.getBoundingClientRect();
    const activeRect = active.getBoundingClientRect();

    setIndicator({
      left: activeRect.left - rootRect.left,
      width: activeRect.width,
      ready: true,
    });
  }, [value, msgs.word, msgs.sentence, msgs.paragraph]);

  return (
    <div className="rounded-lg bg-muted p-1 shadow-sm">
      <div ref={trackRef} className="relative inline-flex items-center">
        {/* -------------------------
        * Sliding Active Pill
        * ------------------------- */}
        <div
          aria-hidden
          className={[
            "pointer-events-none absolute inset-y-0 rounded-md bg-background shadow",
            "transition-[transform,width] duration-200 ease-out",
            indicator.ready ? "opacity-100" : "opacity-0",
          ].join(" ")}
          style={{
            width: indicator.width,
            transform: `translateX(${indicator.left}px)`,
          }}
        />

        <ToggleGroup
          type="single"
          value={value}
          spacing={1}
          onValueChange={(v) => {
            if (!v) return;
            onChange(v as BlurMode);
          }}
          className="
            relative z-10 inline-flex w-auto 
            bg-transparent p-0 shadow-none
        ">
          <SegItem value="word">{msgs.word}</SegItem>
          <SegItem value="sentence">{msgs.sentence}</SegItem>
          <SegItem value="paragraph">{msgs.paragraph}</SegItem>
        </ToggleGroup>
      </div>
    </div>
  );
}

{/* -------------------------
* Blur-mode Toggle Button
* ------------------------- */}
function SegItem({
  value,
  children,
}: {
  value: BlurMode;
  children: React.ReactNode;
}) {
  return (
    <ToggleGroupItem
      value={value}
      data-blur-mode={value}
      className="
        relative h-7 px-3 text-xs font-medium rounded-md
        inline-flex items-center justify-center
        text-muted-foreground hover:text-foreground
        bg-transparent shadow-none
        data-[state=on]:bg-transparent
        data-[state=on]:shadow-none
        data-[state=on]:text-foreground
      "
    >
      {children}
    </ToggleGroupItem>
  );
}
