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
        rounded-md
        p-4
        !text-base font-sans leading-6
        shadow
        bg-background
        `,
        className
      )}
    >
      {children}
    </div>
  );
}
