import { cn } from "@/lib/utils";

type ExplainSkeletonProps = {
  containerClassName?: string;
  animateClassName?: string;
}

function BulletSkeletonLine({
  className = "bg-muted-foreground/20 animate-pulse",
}: {
  className?: string;
}) {
  return (
    <div className="flex items-center gap-3">
      {/* Bullet */}
      <div className={cn("h-2.5 w-2.5 shrink-0 rounded-full", className)} />
      {/* Line */}
      <div className={cn("h-3 w-full rounded", className)} />
    </div>
  );
}

export function ExplainSkeleton({
  containerClassName = "min-h-[360px]",
  animateClassName = "bg-muted-foreground/20 animate-pulse",
}: ExplainSkeletonProps) {
  return (
    <div className={cn("space-y-4 p-4", containerClassName)}>
      {/* Definition */}
      <div className="space-y-4">
        <div className="flex gap-2">
          <div className={cn("h-4 w-1/6 rounded", animateClassName)} />
          <div className={cn("h-3 w-1/8 rounded", animateClassName)} />
        </div>
        <div className={cn("h-3 w-1/8 rounded", animateClassName)} />
        <div className={cn("h-4 w-full rounded", animateClassName)} />
      </div>

      <div className="h-px bg-border" />

      {/* Explanation */}
      <div className="space-y-4">
        <div className={cn("h-4 w-full rounded", animateClassName)} />
        <div className={cn("h-4 w-full rounded", animateClassName)} />
        <div className={cn("h-4 w-full rounded", animateClassName)} />
        <div className={cn("h-4 w-full rounded", animateClassName)} />
      </div>

      {/* Examples */}
      <div className="space-y-8">
        <BulletSkeletonLine className={animateClassName} />
        <BulletSkeletonLine className={animateClassName} />
        <BulletSkeletonLine className={animateClassName} />
      </div>

      <div className="h-px bg-border" />

      {/* Pronunciation Buttons */}
      <div className="flex w-full justify-between gap-2">
        <div className={cn("h-6 w-2/5 rounded", animateClassName)} />
        <div className={cn("h-6 w-2/5 rounded", animateClassName)} />
      </div>
    </div>
  );
}
