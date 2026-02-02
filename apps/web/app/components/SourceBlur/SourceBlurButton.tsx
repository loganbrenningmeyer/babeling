import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";


export function SourceBlurButton({
  value,
  onChange,
  className,
}: {
  value: boolean,
  onChange: (v: boolean) => void;
  className?: string;
}) {
  return (
    <div className={cn(className)}>
      <Button
        type="button"
        variant="secondary"
        className={`
          h-8 rounded-full px-3 gap-2
          text-[11px] font-semibold tracking-wide
          border shadow-sm transition-colors
          ${
            value
              ? "border-border/60 bg-muted/60 text-foreground/80 hover:bg-muted"
              : "border-foreground/60 bg-foreground/80 text-background hover:bg-foreground/90"
          }
        `}
        onClick={() => onChange(!value)}
        aria-pressed={value}  
      >
        {value ? (
          <Eye className="h-3.5 w-3.5" />
        ) : (
          <EyeOff className="h-3.5 w-3.5" />
        )}
        {value ? "Show original" : "Hide original"}
      </Button>
    </div>
  )
}