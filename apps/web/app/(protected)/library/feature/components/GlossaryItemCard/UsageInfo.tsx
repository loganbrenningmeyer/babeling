import ReactMarkdown from "react-markdown";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import type { LibraryGlossaryItem } from "../../types/glossaryItem";


export function UsageInfo({
  explanation,
  examples,
}: {
  explanation: LibraryGlossaryItem["usage"]["explanation"],
  examples: LibraryGlossaryItem["usage"]["examples"],
}) {
  return (
    <div className="prose prose-md max-w-none font-ui">
      {/* -------------------------
      //* Explanation
      //* ------------------------- */}
      <ReactMarkdown>{explanation}</ReactMarkdown>

      {/* -------------------------
      //* Examples
      //* ------------------------- */}
      <TooltipProvider delayDuration={200}>
        <ul>
          {examples.map((ex, i) => (
            <li key={i}>
              <Tooltip>
                {/* ( Example ): Target Language */}
                <TooltipTrigger asChild>
                  <span className="cursor-help">
                    <ReactMarkdown
                      components={{
                        p: ({ children }) => <span>{children}</span>
                      }}
                      >
                      {ex.target}
                    </ReactMarkdown>
                  </span>
                </TooltipTrigger>
                {/* ( Hover Tooltip ): Source Language */}
                <TooltipContent className="text-sm font-ui">
                  <ReactMarkdown
                    components={{
                      p: ({ children }) => <p className="m-0">{children}</p>
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
  )
}