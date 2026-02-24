import { cn } from "@/lib/utils";

type LibrarySkeletonProps = {
  containerClassName?: string;
  animateClassName?: string;

  /** How many cards to show in the grid */
  cardCount?: number;

  /** Show grouped-by-language skeleton sections */
  grouped?: boolean;

  /** How many language groups to render when grouped */
  groupCount?: number;

  /** How many cards per group when grouped */
  cardsPerGroup?: number;
};

function DocCardSkeleton({ animateClassName }: { animateClassName: string }) {
  return (
    <div
      className={cn(
        "overflow-hidden rounded-xl border bg-card",
        "shadow-sm"
      )}
    >
      {/* CardHeader */}
      <div className="p-6 space-y-3">
        {/* Badges row + progress ring */}
        <div className="flex items-start justify-between gap-3">
          <div className="flex flex-wrap items-center gap-2">
            <div className={cn("h-5 w-20 rounded-full", animateClassName)} />
            <div className={cn("h-3 w-3 rounded", animateClassName)} />
            <div className={cn("h-5 w-28 rounded-full", animateClassName)} />
          </div>

          {/* Radial progress placeholder */}
          <div className={cn("h-[34px] w-[34px] rounded-full", animateClassName)} />
        </div>

        {/* Title + date */}
        <div className="space-y-2">
          <div className={cn("h-4 w-4/5 rounded", animateClassName)} />
          <div className={cn("h-3 w-24 rounded", animateClassName)} />
        </div>
      </div>

      {/* CardContent */}
      <div className="px-6 pb-6 space-y-2">
        <div className={cn("h-3 w-full rounded", animateClassName)} />
        <div className={cn("h-3 w-11/12 rounded", animateClassName)} />
        <div className={cn("h-3 w-4/6 rounded", animateClassName)} />
      </div>

      {/* CardFooter */}
      <div className="px-6 pb-5 flex items-center justify-between">
        <div className="flex items-center gap-2">
          <div className={cn("h-4 w-4 rounded", animateClassName)} />
          <div className={cn("h-3 w-10 rounded", animateClassName)} />
        </div>
        <div className={cn("h-3 w-3 rounded", animateClassName)} />
      </div>
    </div>
  );
}

export function LibrarySkeleton({
  containerClassName,
  animateClassName = "bg-muted-foreground/20 animate-pulse",
  cardCount = 9,
  grouped = false,
  groupCount = 2,
  cardsPerGroup = 6,
}: LibrarySkeletonProps) {
  return (
    <div className={cn("min-h-screen mx-auto w-full max-w-5xl space-y-4 font-ui", containerClassName)}>
      {/* -------------------------
       * Controls
       * ------------------------- */}
      <div className="flex flex-col pt-12 gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className={cn("h-9 w-full rounded-md sm:max-w-sm", animateClassName)} />
        <div className={cn("h-9 w-full rounded-md sm:w-40", animateClassName)} />
      </div>

      {/* Meta line */}
      <div className="text-xs text-muted-foreground">
        <div className={cn("h-3 w-60 rounded", animateClassName)} />
      </div>

      {/* Separator */}
      <div className="h-px w-full bg-border" />

      {/* -------------------------
       * Card Grid (or Grouped)
       * ------------------------- */}
      {grouped ? (
        <div className="space-y-8">
          {Array.from({ length: groupCount }).map((_, g) => (
            <div key={g} className="space-y-4">
              {/* Group header */}
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <div className={cn("h-4 w-36 rounded", animateClassName)} />
                  <div className={cn("h-3 w-10 rounded", animateClassName)} />
                </div>
              </div>

              {/* Group grid */}
              <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {Array.from({ length: cardsPerGroup }).map((_, i) => (
                  <DocCardSkeleton key={i} animateClassName={animateClassName} />
                ))}
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
          {Array.from({ length: cardCount }).map((_, i) => (
            <DocCardSkeleton key={i} animateClassName={animateClassName} />
          ))}
        </div>
      )}
    </div>
  );
}