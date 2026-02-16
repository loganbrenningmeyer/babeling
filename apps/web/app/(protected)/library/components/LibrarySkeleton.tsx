import { cn } from "@/lib/utils";

type LibrarySkeletonProps = {
  containerClassName?: string;
  animateClassName?: string;
  rowCount?: number;
};

export function LibrarySkeleton({
  containerClassName,
  animateClassName = "bg-muted-foreground/20 animate-pulse",
  rowCount = 8,
}: LibrarySkeletonProps) {
  return (
    <div className={cn("space-y-4", containerClassName)}>
      {/* -------------------------
      //* Table Controls
      //* ------------------------- */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
        <div className={cn("h-9 w-full rounded-md sm:max-w-sm", animateClassName)} />
        <div className={cn("h-9 w-full rounded-md sm:w-32", animateClassName)} />
      </div>

      <div className={cn("h-3 w-44 rounded", animateClassName)} />

      {/* -------------------------
      //* Table Skeleton
      //* ------------------------- */}
      <div className="overflow-hidden rounded-md border">
        <div className="border-b px-3 py-3">
          <div className="grid grid-cols-4 gap-3">
            <div className={cn("h-4 w-20 rounded", animateClassName)} />
            <div className={cn("h-4 w-20 rounded", animateClassName)} />
            <div className={cn("h-4 w-24 rounded", animateClassName)} />
            <div className={cn("h-4 w-20 rounded", animateClassName)} />
          </div>
        </div>

        <div className="divide-y">
          {Array.from({ length: rowCount }).map((_, i) => (
            <div key={i} className="grid grid-cols-4 gap-3 px-3 py-3">
              <div className={cn("h-4 w-5/6 rounded", animateClassName)} />
              <div className={cn("h-4 w-16 rounded-full", animateClassName)} />
              <div className={cn("h-4 w-24 rounded", animateClassName)} />
              <div className={cn("h-4 w-full rounded", animateClassName)} />
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
