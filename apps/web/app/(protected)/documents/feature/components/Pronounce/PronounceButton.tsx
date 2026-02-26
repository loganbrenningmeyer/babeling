"use client";

import { cn } from "@/lib/utils";
import { Volume, Volume1, Volume2 } from "lucide-react";

import { usePronunciation } from "@/app/hooks/usePronunciation";


type PronounceProps = {
  text: string;
  label: string;
  tgtLang: string;
  className?: string;
  iconClassName?: string;
}


function DotsIcon({ className }: { className?: string }) {
  return (
    <span 
      className={cn(
        "inline-flex items-end gap-[2px]",
        className
      )}
      aria-hidden="true"
    >
      <span className="dot h-1 w-[3px] rounded-full" />
      <span className="dot h-1 w-[3px] rounded-full" />
      <span className="dot h-1 w-[3px] rounded-full" />
    </span>
  );
}


function EqualizerIcon({ className }: { className?: string }) {
  return (
    <span
      className={cn(
        "inline-flex items-end gap-[2px]",
        className
      )}
      aria-hidden="true"
    >
      <span className="eq-bar h-1 w-[3px] rounded-full" />
      <span className="eq-bar h-3 w-[3px] rounded-full" />
      <span className="eq-bar h-2 w-[3px] rounded-full" />
    </span>
  );
}


function HoverVolumeCycle({ className }: { className?: string }) {
  return (
    <span className={cn("relative inline-block", className)} aria-hidden="true">
      <Volume  className={cn("vol-cycle vol-cycle-0 absolute inset-0", className)} />
      <Volume1 className={cn("vol-cycle vol-cycle-1 absolute inset-0", className)} />
      <Volume2 className={cn("vol-cycle vol-cycle-2 absolute inset-0", className)} />
    </span>
  );
}


export function PronounceButton({ 
  text,
  label,
  tgtLang,
  className,
  iconClassName,
}: PronounceProps) {
  const { play, stop, loading, playing } = usePronunciation();

  return (
    <div
      role="button"
      onClick={(e) => {
        e.stopPropagation();
        playing || loading ? stop() : play(text, tgtLang);
      }}
      className={cn(`
        group
        inline-flex items-center gap-2 w-fit
        rounded-2xl border border-border
        px-3 py-2
        transition-colors
        hover:bg-muted/40
        cursor-pointer
      `, className)}
    >
      <span
        className="
          text-muted-foreground
          underline underline-offset-3
          decoration-dotted decoration-1 decoration-muted-foreground
          transition-colors
          group-hover:text-foreground
        "
      >
        {label}
      </span>

      {/* Play / Loading / Playing Icons */}
      <span
        className="
          inline-flex items-center justify-center
          text-muted-foreground
          transition-colors
          group-hover:text-foreground
        "
      >
        {playing ? (
          <HoverVolumeCycle className={iconClassName}/>
        ) : (
          <Volume2 className={iconClassName}/>
        )}
      </span>
    </div>
  );
}
