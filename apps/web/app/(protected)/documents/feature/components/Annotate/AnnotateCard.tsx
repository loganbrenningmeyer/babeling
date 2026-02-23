"use client";

import { Bookmark } from "lucide-react";
import ReactMarkdown from "react-markdown";
import { Badge } from "@/components/ui/badge";
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
          className="absolute -top-2.25 right-8 z-10 p-0 focus-visible:outline-none"
          aria-label={m.reader.annotationCard.saveDefinition}
          title={m.reader.annotationCard.saveDefinition}
          onClick={onToggleBookmark}
        >
          <Bookmark
            strokeWidth={1}
            className={cn(
              "size-10 origin-top transition-all duration-200 ease-out",
              // make sure BOTH stroke and fill animate
              "[transition-color,fill,stroke,transform]",
              isBookmarked
                ? "text-rose-900 fill-rose-900 scale-y-120"
                : "text-foreground fill-white scale-y-95 translate-y-0 hover:text-foreground"
            )}
          />
        </button>
      )}

      {/* -------------------------
      //* Clicked Word Info
      //* ------------------------- */}
      {defineData && (
        <div className="space-y-3">
          <div className="flex flex-col gap-2">
            <div className="inline-flex items-baseline gap-2">
              <div className="font-reading text-2xl font-bold">{defineData.form}</div>
              {defineData.posForm && (
                <Badge
                  variant="secondary"
                  className="h-6 inline-flex text-md font-reading border border-border"
                >
                  {defineData.posForm}
                </Badge>
              )}
            </div>
          </div>

          {defineData.ipaForm && (
            <PronounceButton
              text={defineData.form}
              label={defineData.ipaForm}
              tgtLang={tgtLang}
              className="h-8 text-md"
              iconClassName="h-3 w-3"
            />
          )}

          <p className="text-lg leading-6 font-reading pt-4">
            {defineData.gloss ? defineData.gloss : m.reader.annotationCard.defUnavailable}
          </p>
        </div>
      )}

      {defineData && explainData && <div className="h-px bg-border" />}

      {/* -------------------------
      //* Explain Card
      //* ------------------------- */}
      {explainData && (
        <div className={cn("prose prose-sm max-w-none font-ui")}>
          <ReactMarkdown>{explainData.explanation}</ReactMarkdown>

          <TooltipProvider delayDuration={200}>
            <ul>
              {explainData.examples.map((ex, i) => (
                <li key={i}>
                  <Tooltip>
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

                    <TooltipContent className="text-sm font-ui">
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
