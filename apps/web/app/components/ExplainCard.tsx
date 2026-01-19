import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";

export type ExplainEntry = {
  explanation: string;
  examples: string[];
};

export function ExplainCard({
  data,
  className,
}: {
  data: ExplainEntry | null;
  className?: string;
}) {
  if (!data) {
    return (
      <div className={cn("text-base text-muted-foreground", className)}>
        Click a French word to get an explanation...
      </div>
    );
  }

  return (
    <div className="prose max-w-none dark:prose-invert">
      <ReactMarkdown>{data.explanation}</ReactMarkdown>
      <ul>
        {data.examples.map((ex, i) => (
          <li key={i}>
            <ReactMarkdown>{ex}</ReactMarkdown>
          </li>
        ))}
      </ul>
    </div>
  );
}
