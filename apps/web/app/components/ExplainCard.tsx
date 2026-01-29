"use client";

import ReactMarkdown from "react-markdown";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

export type ExplainExample = { source: string; target: string };

export type ExplainEntry = {
  explanation: string;
  examples: ExplainExample[];
};

export function ExplainCard({
  data,
  className,
}: {
  data: ExplainEntry;
  className?: string;
}) {
  return (
    <div className={cn("prose prose-sm max-w-none", className)}>
      <ReactMarkdown>{data.explanation}</ReactMarkdown>
      
      <TooltipProvider delayDuration={200}>
        <ul>
          {data.examples.map((ex, i) => (
            <li key={i}>
              <Tooltip>
                {/* On hover, activate English tooltip */}
                <TooltipTrigger asChild>
                  <span className="cursor-help">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <span>{children}</span>,
                      }}
                    >
                      {ex.target}
                    </ReactMarkdown>
                  </span>
                </TooltipTrigger>

                {/* Popup English text on hover */}
                <TooltipContent className="max-w-xs text-sm">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="m-0">{children}</p>,
                    }}
                  >
                    {ex.source}
                  </ReactMarkdown>
                </TooltipContent>
              </Tooltip>
            </li>
          ))}
        </ul>
      </TooltipProvider>
    </div>
  );
}
