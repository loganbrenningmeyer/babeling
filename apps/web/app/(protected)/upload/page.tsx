"use client";

import { useCallback, useState } from "react";
import { useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ArrowRight, Clock, Repeat } from "lucide-react";

import { CreateDocumentInput, useCreateDocument } from "./feature/hooks/useCreateDocument";
import { useRecentDocuments } from "../library/feature/hooks/useRecentDocuments";

// =========================
// ( User Information / UI Language Providers & Helpers )
// =========================
import { useUserPreferences } from "@/components/UserPreferencesProvider";
import { useMessages } from "@/app/hooks/useMessages";

// =========================
// ( Components )
// =========================
import { TabbedInputCard } from "./feature/components/TabbedInputCard";
import { RecentDocumentsPanel } from "./feature/components/RecentDocumentsPanel";

export default function UploadPage() {
  const router = useRouter();

  const {
    srcLang: prefSrcLang,
    tgtLang: prefTgtLang,
  } = useUserPreferences();

  type LangCode = "en" | "fr" | "es" | "de" | "it";

  const LANGS: LangCode[] = ["en", "fr", "es", "de", "it"];

  // -------------------------
  // Use UI language messages from user preferences
  // -------------------------
  const m = useMessages();

  // -------------------------
  // Load document creation hook / recent documents hook
  // -------------------------
  const { create, creating, error: createError } = useCreateDocument();
  const {
    documents: recentDocuments,
    loading: recentLoading,
    error: recentError,
  } = useRecentDocuments({ limit: 3 });

  // -------------------------
  // Set source / target language codes & labels
  // -------------------------
  const [localSrcLang, setLocalSrcLang] = useState<string | null>(null);
  const [localTgtLang, setLocalTgtLang] = useState<string | null>(null);

  const srcLang = localSrcLang ?? prefSrcLang ?? "en";
  const tgtLang = localTgtLang ?? prefTgtLang ?? "es";

  // -------------------------
  // Upload File Information
  // -------------------------
  const [title, setTitle] = useState("");
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
      } else {
        setSelectedGutenbergBook(null);
      }
    }
  }, []);

  return (
    <div className="min-h-screen mx-auto w-full max-w-6xl py-12">
      {/* -------------------------
       * Hero
       * ------------------------- */}
      <div className="">
        <h1 className="font-reading font-semibold text-4xl tracking-tight">
          {m.upload.hero}
        </h1>
        <p className="font-ui mt-4 text-sm text-muted-foreground">
          {m.upload.heroInfo}
        </p>
      </div>

      {/* -------------------------
       * Source / Target Language Selection
       * ------------------------- */}
      <div className="font-ui mt-10">
        <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-3">
          {/* -------------------------
           * Source Language
           * ------------------------- */}
          <div className="w-full">
            <div className="mb-2 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
              {m.upload.sourceLang}
            </div>
            <Select value={srcLang} onValueChange={(v) => setLocalSrcLang(v)}>
              <SelectTrigger className="w-full bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                {LANGS.map((l) => (
                  <SelectItem
                    key={l}
                    value={l}
                    disabled={l === tgtLang}
                  >
                    {m.langs[l]}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          {/* -------------------------
           * Swap Languages
           * ------------------------- */}
          <div className="flex items-center justify-center pb-[2px]">
            <Button
              type="button"
              variant="outline"
              size="icon"
              className="
                h-9 w-9 rounded-full
                border-border bg-card
                text-muted-foreground shadow-sm
                transition duration-300 ease-out
                hover:text-foreground
                hover:rotate-180
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
          <div className="w-full">
            <div className="mb-2 text-[11px] font-medium tracking-wider text-muted-foreground uppercase">
              {m.upload.targetLang}
            </div>
            <Select value={tgtLang} onValueChange={(v) => setLocalTgtLang(v)}>
              <SelectTrigger className="w-full bg-card">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                {LANGS.map((l) => (
                  <SelectItem
                    key={l}
                    value={l}
                    disabled={l === srcLang}
                  >
                    {m.langs[l]}
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
      <div className="mt-10">
        <TabbedInputCard
          onPayloadChange={handleInputPayloadChange}
          langLabels={m.langs}
          uploadMsgs={m.upload}
        />
      </div>

      {/* -------------------------
       * ( Start Reading Button ): Save document -> Reader Page
       * ------------------------- */}
      <div className="font-ui mt-8 flex items-center justify-between">
        {/* Translation / Alignment Hint */}
        <span className="inline-flex gap-2 items-center text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>{m.upload.translateAlignInfo}</span>
        </span>
        {/* Start Reading Button */}
        <Button
          type="button"
          onClick={() => void onClickTranslate()}
          disabled={!canTranslate || creating}
          className="
            group h-12 rounded-xl px-6 font-semibold
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
            <span className="inline-flex gap-3 items-center text-[16px]">
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

      {/* -------------------------
      * Recent Documents
      * ------------------------- */} 
      {/* <div className="font-ui mt-8 flex items-center justify-between">
        <RecentDocumentsPanel
          documents={recentDocuments}
          loading={recentLoading}
          error={recentError}
          onOpenDocument={(doc) => {
            const sp = new URLSearchParams();
            sp.set("page", "0");

            if (doc.latestTgtLang) {
              sp.set("tgt", doc.latestTgtLang);
            }

            router.push(`/documents/${doc.id}?${sp.toString()}`);
          }}
        />
      </div> */}
    </div>
  );
}
