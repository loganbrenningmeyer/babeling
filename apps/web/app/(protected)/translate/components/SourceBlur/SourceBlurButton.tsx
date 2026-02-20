import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Eye, EyeOff } from "lucide-react";


export function SourceBlurButton({
  value,
  onChange,
  showLabel,
  hideLabel,
}: {
  value: boolean,
  onChange: (v: boolean) => void;
  showLabel: string;
  hideLabel: string
}) {
  return (
    <div>
      <Button
        type="button"
        variant="ghost"
        className={`
          h-8 rounded-full px-3 gap-2
          text-[14px] font-semibold tracking-wide
          border border-border/200
          text-foreground/60
          hover:bg-muted
          transition-colors
        `}
        onClick={() => onChange(!value)}
        aria-pressed={value}  
      >
        {value ? (
          <Eye className="h-3.5 w-3.5" />
        ) : (
          <EyeOff className="h-3.5 w-3.5" />
        )}
        {value ? showLabel : hideLabel}
      </Button>
    </div>
  )
}