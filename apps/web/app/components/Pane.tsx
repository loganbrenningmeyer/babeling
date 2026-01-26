import { cn } from "@/lib/utils";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

export function Pane({
  title,
  className,
  contentClassName,
  children,
}: {
  title?: string;
  className?: string;
  contentClassName?: string;
  children: React.ReactNode;
}) {
  return (
    <Card className={cn("w-full flex flex-col", className)}>
      {title && (
        <CardHeader className="shrink-0">
            <CardTitle>{title}</CardTitle>
        </CardHeader>
      )}
      <CardContent className={cn("flex-1 min-h-0 flex flex-col", contentClassName)}>
        {children}
      </CardContent>
    </Card>
  );
}
