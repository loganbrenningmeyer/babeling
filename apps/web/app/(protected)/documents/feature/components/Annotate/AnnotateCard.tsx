"use client";

import ReactMarkdown from "react-markdown";
import { Star } from "lucide-react";
import { cn } from "@/lib/utils";
import {
  Tooltip,
  TooltipContent,
  TooltipProvider,
  TooltipTrigger,
} from "@/components/ui/tooltip";

import { PronounceButton } from "../Pronounce/PronounceButton";
import { useMessages } from "@/app/hooks/useMessages";

export type DefineEntry = {
  form: string;
  posForm: string;
  ipaForm: string;

  lemma: string;
  posLemma: string;
  ipaLemma: string;

  gloss: string;

  srcSentence: string;
  srcParagraph: string;
  tgtSentence: string;
  tgtParagraph: string;
};

export type ExplainExample = { source: string; target: string };

export type ExplainEntry = {
  explanation: string;
  examples: ExplainExample[];
};

export function AnnotateCard({
  defineData,
  explainData,
  tgtLang,
  isBookmarked = false,
  onToggleBookmark,
  className,
}: {
  defineData: DefineEntry | null;
  explainData: ExplainEntry | null;
  tgtLang: string;
  isBookmarked?: boolean;
  onToggleBookmark?: () => void;
  className?: string;
}) {
  // -------------------------
  // Use UI language text
  // -------------------------
  const m = useMessages();

  return (
    <div className={cn("relative p-4 space-y-4", className)}>
      {/* -------------------------
      //* Save Glossary Item Bookmark
      //* ------------------------- */}
      {onToggleBookmark && (
        <button
          type="button"
          className="
            absolute top-6 right-6 z-10 rounded-md p-1
            transition-colors
            hover:bg-muted/50
            focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring/30
          "
          aria-label={m.reader.annotationCard.saveDefinition}
          title={m.reader.annotationCard.saveDefinition}
          onClick={onToggleBookmark}
        >
          <Star
            strokeWidth={2}
            className={cn(
              "size-6 origin-top transition-all duration-200 ease-out",
              // make sure BOTH stroke and fill animate
              "[transition-color,fill,stroke,transform]",
              isBookmarked
                ? "text-amber-500 fill-amber-500 dark:text-amber-300 dark:fill-amber-300"
                : "text-amber-300/80 fill-transparent hover:text-amber-500 dark:text-amber-500/55 dark:hover:text-amber-300"
            )}
          />
        </button>
      )}

      {/* -------------------------
      //* ( Form ): Clicked Word Info
      //* ------------------------- */}
      {defineData && (
        <div className="space-y-2">
          <div className="flex flex-col gap-2">
            <div className="space-y-1">
              {/* Form */}
              <div className="font-reading text-xl font-bold">
                {defineData.form.toLowerCase()}
              </div>
              {/* POS + IPA */}
              <div className="flex flex-wrap items-center gap-2">
                {defineData.posForm && (
                  <div
                    className="
                      h-6 inline-flex 
                      text-md text-warning-subtle-foreground font-ui 
                  ">
                    {defineData.posForm}
                  </div>
                )}

                {defineData.ipaForm && (
                  <PronounceButton
                    text={defineData.form}
                    label={defineData.ipaForm}
                    tgtLang={tgtLang}
                    className="h-6 text-sm font-ui"
                    iconClassName="h-3 w-3"
                  />
                )}
              </div>
            </div>
          </div>


          <p className="text-md leading-6 font-ui">
            {defineData.gloss ? defineData.gloss : m.reader.annotationCard.defUnavailable}
          </p>
        </div>
      )}

      {defineData && explainData && <div className="h-px bg-border" />}

      {/* -------------------------
      //* Explain Card
      //* ------------------------- */}
      {explainData && (
        <div
          className={cn(`
            prose prose-sm max-w-none font-ui
            text-foreground
            prose-headings:text-foreground
            prose-p:text-foreground
            prose-li:text-foreground
            prose-strong:text-foreground
            prose-em:text-foreground/90
            prose-code:text-foreground
            [&_li::marker]:text-muted-foreground
          `)}
        >
          <ReactMarkdown>{explainData.explanation}</ReactMarkdown>

          <TooltipProvider delayDuration={200}>
            <ul>
              {explainData.examples.map((ex, i) => (
                <li key={i}>
                  <Tooltip>
                    <TooltipTrigger asChild>
                      <span className="cursor-help text-foreground">
                        <ReactMarkdown
                          components={{
                            p: ({ children }) => <span>{children}</span>,
                          }}
                        >
                          {ex.target}
                        </ReactMarkdown>
                      </span>
                    </TooltipTrigger>

                    <TooltipContent className="text-sm font-ui text-background">
                      <ReactMarkdown
                        components={{
                          p: ({ children }) => <p className="m-0 text-background">{children}</p>,
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
      )}

      {/* -------------------------
      //* Lemma Info
      //* ------------------------- */}
      {defineData && (
        <div className="space-y-3">
          <div className="h-px w-full bg-border" />

          <div className="flex w-full items-center justify-between gap-3">
            <div className="flex flex-col gap-2">
              <div className="inline-flex items-baseline gap-1.5">
                <span className="text-sm text-muted-foreground">
                  {m.reader.annotationCard.baseForm}:
                </span>
                <div className="text-md font-reading font-semibold text-muted-foreground">
                  {defineData.lemma}
                </div>
              </div>

              {defineData.ipaLemma && (
                <PronounceButton
                  text={defineData.lemma}
                  label={defineData.ipaLemma}
                  tgtLang={tgtLang}
                  className="h-6 text-sm"
                  iconClassName="h-3 w-3"
                />
              )}
            </div>

            <div className="flex items-center gap-2">
              <PronounceButton
                text={defineData.tgtSentence}
                label={m.reader.annotationCard.sentence}
                tgtLang={tgtLang}
                iconClassName="h-4 w-4"
              />
              <PronounceButton
                text={defineData.tgtParagraph}
                label={m.reader.annotationCard.paragraph}
                tgtLang={tgtLang}
                iconClassName="h-4 w-4"
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
