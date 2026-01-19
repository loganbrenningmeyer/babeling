import { cn } from "@/lib/utils";

export function LoadingSurface({ className }: { className?: string }) {
  return (
    <div
      className={cn(
        "rounded-md bg-gradient-to-r from-muted via-muted-foreground/10 to-muted animate-pulse",
        className
      )}
    />
  );
}
