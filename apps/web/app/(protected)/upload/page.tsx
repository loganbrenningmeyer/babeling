"use client";

import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";

// -------------------------
// User information provider
// -------------------------
import { useAppUser } from "@/components/AppUserProvider";

// -------------------------
// UI Components
// -------------------------
import { Pane } from "@/app/components/Pane";
import { UploadSurface } from "@/app/components/UploadSurface";
import { AppTextarea } from "@/app/components/AppTextarea";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";

// -------------------------
// Language Info Variables / Functions
// -------------------------
import { LANGS } from "@/types/langs";

type ExtractionState = "idle" | "ready" | "pending";

function stripExtension(filename: string) {
  return filename.replace(/\.[^/.]+$/, "");
}

export default function Upload() {
  // -------------------------
  // Load user information
  // -------------------------
  const { error: userError } = useAppUser();
  const router = useRouter();

  // -------------------------
  // Core state
  // -------------------------
  const [sourceFile, setSourceFile] = useState<File | null>(null);
  const [title, setTitle] = useState("");
  const [srcLang, setSrcLang] = useState("en");
  const [extractedText, setExtractedText] = useState("");
  const [statusMessage, setStatusMessage] = useState(
    "Upload a .txt, .pdf, or .epub file to begin."
  );
  const [extractionState, setExtractionState] = useState<ExtractionState>("idle");

  const canContinue = extractedText.trim().length > 0;

  const fileType = useMemo(() => {
    if (!sourceFile) return "Unknown";
    const lower = sourceFile.name.toLowerCase();
    if (lower.endsWith(".txt")) return "Text file";
    if (lower.endsWith(".pdf")) return "PDF";
    if (lower.endsWith(".epub")) return "EPUB";
    return "Unknown";
  }, [sourceFile]);

  // -------------------------
  // Handlers
  // -------------------------
  async function handleFileChange(file: File | null) {
    setSourceFile(file);

    if (!file) {
      setTitle("");
      setExtractedText("");
      setStatusMessage("Upload a .txt, .pdf, or .epub file to begin.");
      setExtractionState("idle");
      return;
    }

    setTitle(stripExtension(file.name));

    if (file.name.toLowerCase().endsWith(".txt")) {
      const text = await file.text();
      setExtractedText(text);
      setStatusMessage("Loaded .txt contents. Review and continue to translate.");
      setExtractionState("ready");
      return;
    }

    setExtractedText("");
    setStatusMessage(
      "Extraction API hook goes here for PDF/EPUB. Keep this page for upload + extraction review."
    );
    setExtractionState("pending");
  }

  function handleContinue() {
    if (!canContinue) return;

    // -------------------------
    // Temporary local handoff until upload/extraction API is wired
    // -------------------------
    const uploadDraft = {
      title,
      srcLang,
      sourceText: extractedText,
    };

    sessionStorage.setItem("upload_draft", JSON.stringify(uploadDraft));
    router.push("/translate");
  }

  if (userError) {
    return <div className="px-12">Account error: {userError}</div>;
  }

  return (
    <div className="w-full px-12">
      <Pane title="Upload" className="min-h-[80vh]" contentClassName="gap-4">
        {/* -------------------------
        //* Upload Steps
        //* ------------------------- */}
        <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 shadow-sm">
          <div className="text-sm text-muted-foreground">
            1. Upload file  •  2. Review extraction  •  3. Continue to translate
          </div>
        </div>

        {/* -------------------------
        //* Upload + Metadata + Preview
        //* ------------------------- */}
        <div className="grid grid-cols-1 gap-4 lg:grid-cols-[360px_minmax(0,1fr)]">
          {/* Left: Upload + metadata */}
          <div className="space-y-4">
            <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 shadow-sm">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Title
              </div>
              <div className="pt-1">
                <Input
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="Untitled document"
                />
              </div>
            </div>

            <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 shadow-sm">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Source Language
              </div>
              <div className="pt-1">
                <select
                  className="
                    w-full h-10 rounded-lg border border-border bg-muted/40 px-3
                    text-sm font-semibold
                    focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring
                  "
                  value={srcLang}
                  onChange={(e) => setSrcLang(e.target.value)}
                >
                  {LANGS.map((lang) => (
                    <option key={lang.code} value={lang.code}>
                      {lang.label}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            <UploadSurface className="h-40" file={sourceFile} onFileChange={handleFileChange} />

            <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 text-sm">
              <div className="font-semibold">File Summary</div>
              <div className="pt-2 text-muted-foreground">
                {sourceFile ? sourceFile.name : "No file selected"}
              </div>
              {sourceFile && (
                <div className="pt-1 text-xs text-muted-foreground">
                  {fileType} • {(sourceFile.size / 1024).toFixed(1)} KB
                </div>
              )}
            </div>
          </div>

          {/* Right: Extraction preview */}
          <div className="space-y-4">
            <div className="rounded-xl border border-border/70 bg-background/70 px-4 py-3 shadow-sm">
              <div className="text-xs uppercase tracking-wide text-muted-foreground">
                Extraction Status
              </div>
              <div className="pt-1 text-sm">{statusMessage}</div>
            </div>

            <div className="min-h-0 flex-1">
              <AppTextarea
                className="h-[420px] min-h-0 overflow-y-auto"
                value={extractedText}
                onChange={(e) => setExtractedText(e.target.value)}
                placeholder="Extracted text appears here. You can edit it before continuing."
              />
            </div>
          </div>
        </div>

        {/* -------------------------
        //* Continue Action
        //* ------------------------- */}
        <div className="flex items-center justify-between rounded-xl border border-border/70 bg-background/70 px-4 py-3 shadow-sm">
          <div className="text-sm text-muted-foreground">
            {extractionState === "ready"
              ? "Ready to continue to translate."
              : "Upload and extract text before continuing."}
          </div>
          <Button onClick={handleContinue} disabled={!canContinue}>
            Continue to Translate
          </Button>
        </div>
      </Pane>
    </div>
  );
}
