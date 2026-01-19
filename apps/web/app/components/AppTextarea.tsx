import { Textarea } from "@/components/ui/textarea";
import { cn } from "@/lib/utils";

export function AppTextarea({
  className,
  ...props
}: React.ComponentProps<typeof Textarea>) {
  return (
    <Textarea
      className={cn(
        `
        resize-none
        !text-base font-sans leading-6
        border-0 p-4
        focus-visible:ring-0 focus-visible:ring-offset-0
        shadow
        `,
        className
      )}
      {...props}
    />
  );
}
