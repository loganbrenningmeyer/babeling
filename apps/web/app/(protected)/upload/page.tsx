"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
} from "@/components/ui/select";
import { ArrowRight, Clock, Repeat } from "lucide-react";

import { CreateDocumentInput, useCreateDocument } from "./feature/hooks/useCreateDocument";

// =========================
// ( User Information / UI Language Providers & Helpers )
// =========================
import { useUserPreferences } from "@/components/UserPreferencesProvider";
import { useMessages } from "@/app/hooks/useMessages";
import { toUiLang } from "@/app/i18n/messages";

// =========================
// ( Components )
// =========================
import { LangBadge } from "@/app/components/LangBadge";
import { TabbedInputCard } from "./feature/components/TabbedInputCard";
import { Separator } from "@/components/ui/separator";
import { LANG_COLOR_BY_CODE } from "@/types/langs";

type LangCode = "en" | "fr" | "es" | "de" | "it";

const LANGS: LangCode[] = ["en", "fr", "es", "de", "it"];

export default function UploadPage() {
  const router = useRouter();

  const {
    srcLang: prefSrcLang,
    tgtLang: prefTgtLang,
  } = useUserPreferences();

  // -------------------------
  // Use UI language messages from user preferences
  // -------------------------
  const m = useMessages();

  // -------------------------
  // Load document creation hook
  // -------------------------
  const { create, creating, error: createError } = useCreateDocument();

  // -------------------------
  // Set source / target language codes & labels
  // -------------------------
  const [localSrcLang, setLocalSrcLang] = useState<string | null>(null);
  const [localTgtLang, setLocalTgtLang] = useState<string | null>(null);

  const srcLang = localSrcLang ?? prefSrcLang ?? "en";
  const tgtLang = localTgtLang ?? prefTgtLang ?? "es";
  const fallbackLangColors = {
    border: "border-foreground/20",
    focusBorder: "focus-visible:border-foreground/20 dark:focus-visible:border-foreground/20",
    bg: "bg-background/20",
    hoverBg: "hover:bg-background/20 dark:hover:bg-background/20",
  };

  function getSelectBorderClasses(lang: string) {
    const colors = LANG_COLOR_BY_CODE[toUiLang(lang)];
    if (!colors) return fallbackLangColors;

    return {
      border: colors.border,
      focusBorder: colors.border.replaceAll("border-", "focus-visible:border-"),
      bg: colors.bg,
      hoverBg: colors.bg
        .replaceAll("bg-", "hover:bg-")
        .replaceAll("dark:hover:bg-", "dark:bg-")
        .replaceAll("dark:bg-", "dark:hover:bg-"),
    };
  }

  // -------------------------
  // Upload File Information
  // -------------------------
  const title = "";
  const [srcText, setSrcText] = useState("");
  const [srcFile, setSrcFile] = useState<File | null>(null);

  // -------------------------
  // Selected Gutendex book
  // -------------------------
  const [selectedGutenbergBook, setSelectedGutenbergBook] = useState<{
    bookId: number;
    format: string;
    title: string;
    epubUrl: string;
  } | null>(null);

  // Allow translating only if file / text has been uploaded
  const canTranslate =
    srcText.trim().length > 0 ||
    !!srcFile ||
    !!selectedGutenbergBook?.epubUrl;

  const srcSelectColors = getSelectBorderClasses(srcLang);
  const tgtSelectColors = getSelectBorderClasses(tgtLang);

  /**************************
   * `handleSwapLanguages()`
   * -- Swaps source / target languages in upload UI
   **************************/
  function handleSwapLanguages() {
    const nextSrc = tgtLang;
    const nextTgt = srcLang;
    setLocalSrcLang(nextSrc);
    setLocalTgtLang(nextTgt);
  }

  const syncLanguagesForImportedBook = useCallback((bookLanguages: string[]) => {
    const importedSrcLang = LANGS.find((lang) => bookLanguages.includes(lang));
    if (!importedSrcLang) return;

    setLocalSrcLang(importedSrcLang);

    if (tgtLang === importedSrcLang) {
      const nextTgtLang =
        LANGS.find((lang) => lang !== importedSrcLang) ?? importedSrcLang;
      setLocalTgtLang(nextTgtLang);
    }
  }, [tgtLang]);

  /**************************
   * `fetchSelectedGutenbergFile()`
   * -- Downloads the selected Gutendex EPUB through a local proxy route
   *    so the browser never hits the external EPUB URL directly
   **************************/
  async function fetchSelectedGutenbergFile(args: {
    title: string;
    format: string;
    epubUrl: string;
  }) {
    const res = await fetch("/api/gutendex/download", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        epub_url: args.epubUrl,
      }),
      cache: "no-store",
    });

    if (!res.ok) {
      let message = "Failed to download selected eBook";

      try {
        const data = (await res.json()) as { error?: string };
        if (data?.error) {
          message = data.error;
        }
      } catch {
        // Ignore JSON parse errors and keep the default message
      }

      throw new Error(message);
    }

    const blob = await res.blob();
    const normalizedTitle =
      args.title
        .replace(/[<>:"/\\|?*\u0000-\u001F]+/g, " ")
        .replace(/\s+/g, " ")
        .trim() || "Imported eBook";

    return new File(
      [blob],
      `${normalizedTitle}.epub`,
      { type: blob.type || args.format },
    );
  }

  /**************************
   * `onClickTranslate()`
   * -- Uploads or loads document to/from database, then begins reading session
   **************************/
  async function onClickTranslate() {
    if (!canTranslate) return;

    try {
      const normalizedFileTitle = srcFile?.name
        .replace(/\.[^/.]+$/, "")
        .replace(/[-_]+/g, " ")
        .trim();
      const documentTitle =
        title.trim() ||
        selectedGutenbergBook?.title ||
        normalizedFileTitle ||
        "Untitled document";

      // -------------------------
      // Create document creation input
      // -------------------------
      let input: CreateDocumentInput;

      if (selectedGutenbergBook?.epubUrl) {
        const importedFile = await fetchSelectedGutenbergFile({
          title: selectedGutenbergBook.title,
          format: selectedGutenbergBook.format,
          epubUrl: selectedGutenbergBook.epubUrl,
        });

        input = {
          title: documentTitle,
          srcLang,
          source: {
            kind: "file",
            file: importedFile,
          },
        };
      } else if (srcFile) {
        input = {
          title: documentTitle,
          srcLang,
          source: {
            kind: "file",
            file: srcFile,
          },
        };
      } else {
        input = {
          title: documentTitle,
          srcLang,
          source: {
            kind: "text",
            text: srcText,
          }
        };
      }

      const result = await create(input);

      if (!result) return;

      // Begin document reading session with tgtLang on the first page
      router.push(
        `/documents/${result.documentId}?tgt=${encodeURIComponent(tgtLang)}&page=0`
      );
    } catch (e) {
      console.error("Failed to start reading session", e);
    }
  }

  /**************************
   * `handleInputPayloadChange()`
   * -- Syncs the active tab payload into the upload page state
   **************************/
  const handleInputPayloadChange = useCallback((payload: {
    type: "text";
    text: string;
  } | {
    type: "file";
    file: File | null;
  } | {
    type: "gutenberg";
    bookId: number | null;
    format: string;
    title: string;
    epubUrl: string | null;
    languages: string[];
  }) => {
    if (payload.type === "text") {
      setSrcText(payload.text);
      setSrcFile(null);
      setSelectedGutenbergBook(null);
    }

    if (payload.type === "file") {
      setSrcFile(payload.file);
      if (payload.file) setSrcText("");
      setSelectedGutenbergBook(null);
    }

    if (payload.type === "gutenberg") {
      setSrcText("");
      setSrcFile(null);

      if (payload.bookId != null && payload.epubUrl) {
        setSelectedGutenbergBook({
          bookId: payload.bookId,
          format: payload.format,
          title: payload.title,
          epubUrl: payload.epubUrl,
        });
        syncLanguagesForImportedBook(payload.languages);
      } else {
        setSelectedGutenbergBook(null);
      }
    }
  }, [syncLanguagesForImportedBook]);

  return (
    <div className="mx-auto min-h-screen w-full max-w-6xl px-4 py-8 sm:px-6 sm:py-10 lg:px-8 lg:py-12">
      {/* -------------------------
       * Hero
       * ------------------------- */}
      <div className="">
        <h1 className="font-reading text-3xl font-semibold tracking-tight sm:text-4xl">
          {m.upload.hero}
        </h1>
        <p className="font-ui mt-4 text-sm text-muted-foreground">
          {m.upload.heroInfo}
        </p>
      </div>

      {/* -------------------------
       * Source / Target Language Selection
       * ------------------------- */}
      <div 
        className="
          flex flex-col gap-4
          rounded-lg p-4 sm:rounded-xl sm:p-5
          border border-foreground/20 shadow-sm
          bg-card
          font-ui mt-8 sm:mt-10
        "
      >
        {/* -------------------------
        //* Reading direction info
        //* ------------------------- */} 
        <div className="flex flex-col gap-2 font-ui">
          <h2 className="text-sm font-semibold uppercase tracking-widest">
            {m.upload.readingDirection}
          </h2>
          <p className="text-sm">{m.upload.readingDirectionInfo}</p>
        </div>

        <Separator />

        <div className="grid gap-3 sm:grid-cols-[minmax(0,1fr)_auto_minmax(0,1fr)] sm:items-end">
          {/* -------------------------
           * Source Language
           * ------------------------- */}
          <div className="flex min-w-0 flex-col gap-2">
            <div className="w-full text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {m.upload.sourceLang}
            </div>
            <Select value={srcLang} onValueChange={(v) => setLocalSrcLang(v)}>
              <SelectTrigger
                className={cn(
                  "w-full py-7 sm:py-8",
                  srcSelectColors.border,
                  srcSelectColors.focusBorder,
                  srcSelectColors.bg,
                  srcSelectColors.hoverBg,
                )}
              >
                <div className="flex w-full items-center justify-between gap-3 pr-2">
                  <div className="flex min-w-0 flex-col items-start leading-4">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {m.upload.from}
                    </span>
                    <span className="truncate text-lg font-semibold">
                      {m.langs[toUiLang(srcLang)]}
                    </span>
                  </div>
                  <LangBadge lang={srcLang} className="shrink-0" />
                </div>
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                {LANGS.map((l) => (
                  <SelectItem
                    key={l}
                    value={l}
                    disabled={l === tgtLang}
                  >
                    <span className="flex w-full items-center justify-between gap-3">
                      <span>{m.langs[toUiLang(l)]}</span>
                      <LangBadge lang={l} className="shrink-0" />
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* -------------------------
           * Swap Languages
           * ------------------------- */}
          <div className="flex items-center justify-center py-1 sm:pb-3">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="
                h-9 w-9 rounded-full
                border-foreground/40 dark:border-foreground/40 
                bg-card dark:bg-card
                text-muted-foreground shadow-sm
                transition duration-300 ease-out
                hover:text-foreground
                hover:rotate-180
                hover:bg-background
                motion-reduce:transition-none
              "
              onClick={handleSwapLanguages}
              aria-label="Swap languages"
            >
              <Repeat
                className="h-4 w-4"
              />
            </Button>
          </div>

          {/* -------------------------
           * Target Language
           * ------------------------- */}
          <div className="flex min-w-0 flex-col gap-2">
            <div className="w-full text-[11px] font-medium uppercase tracking-wider text-muted-foreground">
              {m.upload.targetLang}
            </div>
            <Select value={tgtLang} onValueChange={(v) => setLocalTgtLang(v)}>
              <SelectTrigger
                className={cn(
                  "w-full bg-background/60 py-7 sm:py-8",
                  tgtSelectColors.border,
                  tgtSelectColors.focusBorder,
                  tgtSelectColors.bg,
                  tgtSelectColors.hoverBg,
                )}
              >
                <div className="flex w-full items-center justify-between gap-3 pr-2">
                  <div className="flex min-w-0 flex-col items-start leading-4">
                    <span className="text-[10px] uppercase tracking-wider text-muted-foreground">
                      {m.upload.to}
                    </span>
                    <span className="truncate text-lg font-semibold">
                      {m.langs[toUiLang(tgtLang)]}
                    </span>
                  </div>
                  <LangBadge lang={tgtLang} className="shrink-0" />
                </div>
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                {LANGS.map((l) => (
                  <SelectItem
                    key={l}
                    value={l}
                    disabled={l === srcLang}
                  >
                    <span className="flex w-full items-center justify-between gap-3">
                      <span>{m.langs[toUiLang(l)]}</span>
                      <LangBadge lang={l} className="shrink-0" />
                    </span>
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
        </div>
      </div>

      {/* -------------------------
       * Tabbed Input Area
       * ------------------------- */}
      <div className="mt-8 sm:mt-10">
        <TabbedInputCard
          onPayloadChange={handleInputPayloadChange}
          langLabels={m.langs}
          uploadMsgs={m.upload}
        />
      </div>

      {/* -------------------------
       * ( Start Reading Button ): Save document -> Reader Page
       * ------------------------- */}
      <div className="font-ui mt-6 flex flex-col gap-4 sm:mt-8 sm:flex-row sm:items-center sm:justify-between">
        {/* Translation / Alignment Hint */}
        <span className="inline-flex items-center gap-2 text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{m.upload.translateAlignInfo}</span>
        </span>
        {/* Start Reading Button */}
        <Button
          type="button"
          onClick={() => void onClickTranslate()}
          disabled={!canTranslate || creating}
          className="
            group h-12 w-full rounded-xl px-6 font-semibold sm:w-auto
            bg-primary/90 text-primary-foreground
            border border-primary/60
            shadow-lg shadow-primary/40
            cursor-pointer
            transition-transform duration-200 ease-out
            hover:bg-primary
            hover:-translate-y-0.5
            motion-reduce:transform-none
          "
        >
          {creating ? (
            "Uploading document..."
          ) : (
            <span className="inline-flex items-center gap-3 text-[16px]">
              <span>{m.upload.startReading}</span>
              <ArrowRight
                className="
                  h-6 w-6
                  transition-transform duration-200 ease-out
                  group-hover:translate-x-1
                  motion-reduce:transform-none
                "
              />
            </span>
          )}
        </Button>
      </div>
      {createError ? (
        <p className="mt-3 font-ui text-sm text-red-600">
          {createError}
        </p>
      ) : null}
    </div>
  );
}
