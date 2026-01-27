import { cn } from "@/lib/utils";

export function AppSurface({
  className,
  ...props
}: React.HTMLAttributes<HTMLDivElement>) {
  return (
    <div
      className={cn(
        `
        w-full
        rounded-md
        bg-background
        shadow
        `,
        className
      )}
      {...props}
    />
  );
}
