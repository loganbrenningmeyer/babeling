import { ArrowLeftRight } from "lucide-react";

import { Button } from "@/components/ui/button";
import { Pane } from "@/app/components/Pane";
import { AppTextarea } from "@/app/components/AppTextarea";
import { UploadSurface } from "@/app/components/UploadSurface";

import type { SampleText } from "../sampleTexts";

type TranslateInputPaneProps = {
  paneHeightClassName: string;
  paneWrapperClassName: string;
  languages: readonly { code: string; label: string }[];

  srcLang: string;
  tgtLang: string;
  onSrcLangChange: (value: string) => void;
  onTgtLangChange: (value: string) => void;
  onSwapLanguages: () => void;

  sampleId: string;
  sampleOptions: SampleText[];
  sampleLoading: boolean;
  onSampleSelect: (id: string) => void;

  sourceText: string;
  onSourceTextChange: (value: string) => void;

  sourceFile: File | null;
  onSourceFileChange: (file: File | null) => void;

  sourcePlaceholder: string;
  canTranslate: boolean;
  translationLoading: boolean;
  onStartReadingSession: () => void;
};

export function TranslateInputPane({
  paneHeightClassName,
  paneWrapperClassName,
  languages,

  srcLang,
  tgtLang,
  onSrcLangChange,
  onTgtLangChange,
  onSwapLanguages,

  sampleId,
  sampleOptions,
  sampleLoading,
  onSampleSelect,

  sourceText,
  onSourceTextChange,

  sourceFile,
  onSourceFileChange,

  sourcePlaceholder,
  canTranslate,
  translationLoading,
  onStartReadingSession,
}: TranslateInputPaneProps) {
  return (
    <div className={paneWrapperClassName}>
      <Pane className={`${paneHeightClassName} flex flex-col min-h-0 bg-muted font-ui`}>
        <div className="mb-4 rounded-xl border border-border/70 bg-background/70 px-4 py-3 shadow-sm">
          <div className="flex items-center gap-4">
            <div className="flex-1">
              <div className="pb-1 text-[11px] uppercase tracking-wide text-muted-foreground">Original</div>
              <select
                className="w-full h-10 rounded-lg border border-border bg-muted/40 px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={srcLang}
                onChange={(e) => onSrcLangChange(e.target.value)}
                disabled={translationLoading}
              >
                {languages.map((lang) => {
                  const isDisabled = lang.code === tgtLang;
                  return (
                    <option
                      key={lang.code}
                      value={lang.code}
                      disabled={isDisabled}
                      className={!isDisabled ? "font-semibold" : "font-normal"}
                    >
                      {lang.label}
                    </option>
                  );
                })}
              </select>
            </div>

            <div className="hidden sm:flex items-center justify-center">
              <Button
                type="button"
                variant="secondary"
                size="icon"
                className="h-11 w-11 rounded-full border border-border/70 bg-muted text-foreground shadow-sm transition-colors hover:bg-foreground/10 hover:text-foreground/90"
                onClick={onSwapLanguages}
                aria-label="Swap source and target languages"
                disabled={translationLoading}
              >
                <ArrowLeftRight className="h-4 w-4" />
              </Button>
            </div>

            <div className="flex-1">
              <div className="pb-1 text-[11px] uppercase tracking-wide text-muted-foreground">Translation</div>
              <select
                className="w-full h-10 rounded-lg border border-border bg-muted/40 px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
                value={tgtLang}
                onChange={(e) => onTgtLangChange(e.target.value)}
                disabled={translationLoading}
              >
                {languages.map((lang) => {
                  const isDisabled = lang.code === srcLang;
                  return (
                    <option
                      key={lang.code}
                      value={lang.code}
                      disabled={isDisabled}
                      className={!isDisabled ? "font-semibold" : "font-normal"}
                    >
                      {lang.label}
                    </option>
                  );
                })}
              </select>
            </div>
          </div>

          <div className="mt-4">
            <div className="pb-1 text-[11px] uppercase tracking-wide text-muted-foreground">Sample text</div>
            <select
              className="w-full h-10 rounded-lg border border-border bg-muted/40 px-3 text-sm font-semibold focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring"
              value={sampleId}
              onChange={(e) => onSampleSelect(e.target.value)}
              disabled={translationLoading || sampleLoading || sampleOptions.length === 0}
            >
              <option value="">Select a sample...</option>
              {sampleOptions.map((sample) => (
                <option key={sample.id} value={sample.id} className="font-semibold">
                  {sample.label}
                </option>
              ))}
            </select>
            {sampleLoading && <div className="pt-1 text-xs text-muted-foreground">Loading sample...</div>}
          </div>
        </div>

        <div className="font-ui flex-1 min-h-0">
          <AppTextarea
            className="h-full min-h-0 overflow-y-auto"
            value={sourceText}
            onChange={(e) => onSourceTextChange(e.target.value)}
            placeholder={sourcePlaceholder}
          />
        </div>

        <div className="shrink-0 pt-3">
          <UploadSurface
            className="h-36"
            file={sourceFile}
            onFileChange={onSourceFileChange}
          />
        </div>

        <div className="font-ui shrink-0 flex flex-col items-center gap-2 pt-6">
          <Button
            onClick={onStartReadingSession}
            disabled={translationLoading || !srcLang || !tgtLang || !canTranslate}
            className="group relative shadow w-full h-12 transition hover:bg-primary hover:shadow-md hover:-translate-y-[1px] disabled:shadow-none disabled:translate-y-0"
          >
            <span className="relative font-semibold">
              Translate
              <span className="absolute left-0 -bottom-1 h-[2px] w-full bg-current origin-left scale-x-0 transition-transform duration-300 group-hover:scale-x-100" />
            </span>
          </Button>

          {!canTranslate && (
            <div className="text-xs text-muted-foreground">Paste text or upload a file to translate.</div>
          )}
        </div>
      </Pane>
    </div>
  );
}
