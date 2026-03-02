"use client";

import { useEffect, useState } from "react";
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
import { getLangLabel, getUiLangsMap, toUiLang } from "@/app/i18n/messages";

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
    uiLang: prefUiLang,
  } = useUserPreferences();

  type LangCode = "en" | "fr" | "es" | "de" | "it";

  const LANGS: { code: LangCode; label: string }[] = [
    { code: "en", label: "English" },
    { code: "fr", label: "French" },
    { code: "es", label: "Spanish" },
    { code: "de", label: "German" },
    { code: "it", label: "Italian" },
  ];

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

  const srcLabel = getLangLabel(srcLang, m.langs);
  const tgtLabel = getLangLabel(tgtLang, m.langs);

  // -------------------------
  // Ensure UI lang is supported (-> UiLang type)
  // -------------------------
  const uiLang = toUiLang(prefUiLang);
  const UI_LANGS_MAP = getUiLangsMap(uiLang); // e.g., UI_LANGS_MAP["en"] = "English"

  // -------------------------
  // Upload File Information
  // -------------------------
  const [title, setTitle] = useState("");
  const [srcText, setSrcText] = useState("");
  const [srcFile, setSrcFile] = useState<File | null>(null);

  // Allow translating only if file / text has been uploaded
  const canTranslate = srcText.trim().length > 0 || !!srcFile;

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
   * `onClickTranslate()`
   * -- Uploads or loads document to/from database, then begins reading session
   **************************/
  async function onClickTranslate() {
    if (!canTranslate) return;

    const normalizedFileTitle = srcFile?.name
      .replace(/\.[^/.]+$/, "")
      .replace(/[-_]+/g, " ")
      .trim();
    const documentTitle =
      title.trim() || normalizedFileTitle || "Untitled document";

    // Create document creation input
    let input: CreateDocumentInput;

    if (srcFile) {
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
  }

  return (
    <div className="min-h-screen mx-auto w-full max-w-6xl">
      {/* -------------------------
       * Hero
       * ------------------------- */}
      <div className="pt-12">
        <h1 className="font-reading font-semibold text-4xl tracking-tight">
          New reading
        </h1>
        <p className="font-ui mt-4 text-sm text-muted-foreground">
          Paste text, upload a file, or import an eBook to begin.
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
            <div className="mb-2 text-[11px] font-medium tracking-wider text-muted-foreground">
              SOURCE LANGUAGE
            </div>
            <Select value={srcLang} onValueChange={(v) => setLocalSrcLang(v)}>
              <SelectTrigger className="w-full bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                {LANGS.map((l) => (
                  <SelectItem
                    key={l.code}
                    value={l.code}
                    disabled={l.code === tgtLang}
                  >
                    {l.label}
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
              className="group h-9 w-9 rounded-full"
              onClick={handleSwapLanguages}
              aria-label="Swap languages"
            >
              <Repeat
                className="
                  h-4 w-4
                  transition-transform duration-300 ease-out
                  group-hover:rotate-180
                  motion-reduce:transition-none 
                "
              />
            </Button>
          </div>

          {/* -------------------------
           * Target Language
           * ------------------------- */}
          <div className="w-full">
            <div className="mb-2 text-[11px] font-medium tracking-wider text-muted-foreground">
              TARGET LANGUAGE
            </div>
            <Select value={tgtLang} onValueChange={(v) => setLocalTgtLang(v)}>
              <SelectTrigger className="w-full bg-background">
                <SelectValue />
              </SelectTrigger>
              <SelectContent position="popper" align="start">
                {LANGS.map((l) => (
                  <SelectItem
                    key={l.code}
                    value={l.code}
                    disabled={l.code === srcLang}
                  >
                    {l.label}
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
          onPayloadChange={(payload) => {
            if (payload.type === "text") {
              setSrcText(payload.text);
              setSrcFile(null);
            }

            if (payload.type === "file") {
              setSrcFile(payload.file);
              if (payload.file) setSrcText("");
            }
          }}
        />
      </div>

      {/* -------------------------
       * ( Start Reading Button ): Save document -> Reader Page
       * ------------------------- */}
      <div className="font-ui mt-8 flex items-center justify-between">
        {/* Translation / Alignment Hint */}
        <span className="inline-flex gap-2 items-center text-sm text-muted-foreground">
          <Clock className="h-4 w-4" />
          <span>Translation and alignment usually takes 15-30 seconds</span>
        </span>
        {/* Start Reading Button */}
        <Button
          type="button"
          onClick={() => void onClickTranslate()}
          disabled={!canTranslate || creating}
          className="
            group h-12 rounded-xl px-6 font-semibold
            bg-blue-600 text-white
            border border-blue-700
            shadow-lg shadow-blue-900/40
            transition-transform duration-200 ease-out
            hover:bg-blue-600/90
            hover:-translate-y-0.5
            motion-reduce:transform-none
          "
        >
          {creating ? (
            "Uploading document..."
          ) : (
            <span className="inline-flex gap-3 items-center text-[16px]">
              <span>Start reading</span>
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
      <div className="font-ui mt-8 flex items-center justify-between">
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
      </div>
    </div>
  );
}
