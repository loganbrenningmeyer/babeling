import { cn } from "@/lib/utils";

type TextSkeletonProps = {
  containerClassName?: string;
  animateClassName?: string;
  blurClassName?: string;
};

export function TextSkeleton({
  containerClassName,
  animateClassName = "bg-muted-foreground/20 animate-pulse",
  blurClassName = "blur-none",
}: TextSkeletonProps) {
  return (
    <div className={cn("space-y-2", containerClassName)}>
      {/* Paragraph 1 */}
      <div className="space-y-2">
        <div className={cn("h-4 w-full rounded", animateClassName, blurClassName)} />
        <div className={cn("h-4 w-full rounded", animateClassName, blurClassName)} />
        <div className={cn("h-4 w-full rounded", animateClassName, blurClassName)} />
        <div className={cn("h-4 w-2/3 rounded", animateClassName, blurClassName)} />
      </div>

      {/* Paragraph 2 */}
      <div className="space-y-2 pt-4">
        <div className={cn("h-4 w-full rounded", animateClassName, blurClassName)} />
        <div className={cn("h-4 w-full rounded", animateClassName, blurClassName)} />
        <div className={cn("h-4 w-full rounded", animateClassName, blurClassName)} />
      </div>

      {/* Paragraph 3 */}
      <div className="space-y-2 pt-4">
        <div className={cn("h-4 w-full rounded", animateClassName, blurClassName)} />
        <div className={cn("h-4 w-full rounded", animateClassName, blurClassName)} />
        <div className={cn("h-4 w-full rounded", animateClassName, blurClassName)} />
        <div className={cn("h-4 w-full rounded", animateClassName, blurClassName)} />
        <div className={cn("h-4 w-5/6 rounded", animateClassName, blurClassName)} />
      </div>
    </div>
  );
}
