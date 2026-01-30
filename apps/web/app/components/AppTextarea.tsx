import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";
import { AppSurface } from "./AppSurface";


export function AppTextarea({
  className,
  ...props
}: React.ComponentProps<typeof Textarea>) {
  return (
    <AppSurface className={cn("h-full", className)}>
      <Textarea
        className={cn(
          `
          h-full w-full resize-none
          !text-base leading-6
          border-0 p-4
          focus-visible:ring-0 focus-visible:ring-offset-0
          whitespace-pre-wrap
          `
        )}
        {...props}
      />
    </AppSurface>
  );
}
