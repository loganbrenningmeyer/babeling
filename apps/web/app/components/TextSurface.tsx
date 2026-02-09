import { cn } from "@/lib/utils";

export function TextSurface({
  className,
  children,
}: {
  className?: string;
  children: React.ReactNode;
}) {
  return (
    <div
      className={cn(
        `
        leading-6
        `,
        className
      )}
    >
      {children}
    </div>
  );
}
