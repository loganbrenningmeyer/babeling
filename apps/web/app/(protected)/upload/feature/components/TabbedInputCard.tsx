"use client";

import { useEffect, useState } from "react";
import { cn } from "@/lib/utils";

import { Clipboard, FileUp, BookDown } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";

import { UploadSurface } from "@/app/components/UploadSurface";
import { ImportEbookPanel } from "./ImportEbook/ImportEbookPanel";

import type { LangLabels } from "@/app/i18n/messages";

type UploadMsgs = {
  tabs: {
    importEbook: string;
    uploadFile: string;
    pasteText: string;
  };
  importEbook: {
    searchBy: string;
    language: string;
    author: string;
    filterByAuthor: string;
    searchGutenberg: string;
    enterTitle: string;
    booksFound: string;
    showing: string;
    prev: string;
    next: string;
  };
  uploadFile: {
    dragAndDrop: string;
    or: string;
    browseFiles: string;
  };
  pasteText: {
    pasteOrType: string;
  };
};

type TabKey = "paste" | "upload" | "import";

type InputPaylod = 
  | { type: "text"; text: string }
  | { type: "file"; file: File | null }
  | {
      type: "gutenberg";
      bookId: number | null;
      format: string;
      title: string;
      epubUrl: string | null;
    };

export function TabbedInputCard({
  className,
  onPayloadChange,
  langLabels,
  uploadMsgs,
}: {
  className?: string;
  onPayloadChange?: (payload: InputPaylod) => void;
  langLabels: LangLabels;
  uploadMsgs: UploadMsgs;
}) {
  const [tab, setTab] = useState<TabKey>("import");

  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);

  // -------------------------
  // Selected Gutendex book metadata
  // -------------------------
  const [bookId, setBookId] = useState<number | null>(null);
  const [format, setFormat] = useState<string>("application/epub+zip");
  const [bookTitle, setBookTitle] = useState("");
  const [epubUrl, setEpubUrl] = useState<string | null>(null);

  // -------------------------
  // Keep parent in sync with active tab
  // -------------------------
  useEffect(() => {
    if (!onPayloadChange) return;
    if (tab === "paste") onPayloadChange({ type: "text", text });
    if (tab === "upload") onPayloadChange({ type: "file", file });
    if (tab === "import") {
      onPayloadChange({ type: "gutenberg", bookId, format, title: bookTitle, epubUrl });
    }
  }, [tab, text, file, bookId, format, bookTitle, epubUrl, onPayloadChange]);

  const tabClassName = cn(
    "h-full inline-flex items-center",
    "gap-2 py-2 text-sm",
    "!rounded-none shadow-none",
    "!border-x-0 !border-t-0 !border-b-2 border-transparent",
    "data-[state=inactive]:text-muted-foreground/60",
    "data-[state=active]:!bg-transparent dark:data-[state=active]:!bg-transparent",
    "data-[state=active]:!border-x-0 data-[state=active]:!border-t-0 data-[state=active]:!border-b-2",
    "data-[state=active]:border-b-foreground dark:data-[state=active]:border-b-foreground/70",
    "data-[state=active]:shadow-none",
  );

  // Define tab heights depending on tab type
  const tabHeightClass = 
    tab === "import" ? "h-[520px]" : "h-[320px]";

  return (
    <div className={className}>
      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="gap-0">
        <div className="rounded-xl border border-foreground/20 shadow-sm overflow-hidden">

          {/* -------------------------
          * Top Bar (input type tabs)
          * ------------------------- */}
          <div className="font-ui h-12 px-2 bg-card/20 border-b">
            <TabsList className="h-full bg-transparent p-0 gap-4 items-stretch">
              {/* -------------------------
              * Gutenberg Ebook Import
              * ------------------------- */}
              <TabsTrigger value="import" className={tabClassName}>
                <BookDown className="h-4 w-4" />
                {uploadMsgs.tabs.importEbook}
              </TabsTrigger>
              {/* -------------------------
              * File Upload
              * ------------------------- */}
              <TabsTrigger value="upload" className={tabClassName}>
                <FileUp className="h-4 w-4" />
                {uploadMsgs.tabs.uploadFile}
              </TabsTrigger>
              {/* -------------------------
              * Paste
              * ------------------------- */}
              <TabsTrigger value="paste" className={tabClassName}>
                <Clipboard className="h-4 w-4" />
                {uploadMsgs.tabs.pasteText}
              </TabsTrigger>
            </TabsList>
          </div>

          {/* -------------------------
          * Content area
          * ------------------------- */}
          <div
            className={cn(
              "overflow-hidden transition-[height] duration-300 ease-in-out",
              tabHeightClass,
            )}
          >
            {/* -------------------------
            * ( Import Ebook )
            * ------------------------- */}
            <TabsContent value="import" className="m-0 h-full min-w-0 overflow-hidden flex">
              <ImportEbookPanel
                selectedBookId={bookId}
                onSelectBook={({ bookId, format, title, epubUrl }) => {
                  setBookId(bookId);
                  setFormat(format);
                  setBookTitle(title);
                  setEpubUrl(epubUrl);
                }}
                langLabels={langLabels}
                msgs={uploadMsgs.importEbook}
              />
            </TabsContent>
            {/* -------------------------
            * ( File Upload ): Drop or browse
            * ------------------------- */}
            <TabsContent value="upload" className="m-0 h-full flex">
              <UploadSurface 
                file={file}
                onFileChange={async (file) => {
                  setFile(file);
                  if (!file) return;
                }}
                text={uploadMsgs.uploadFile.dragAndDrop}
                orLabel={uploadMsgs.uploadFile.or}
                browseFilesLabel={uploadMsgs.uploadFile.browseFiles}
                className="h-full bg-muted/20 flex-1 p-6 rounded-none font-ui"
              />
            </TabsContent>
            {/* -------------------------
            * ( Paste ): Text input
            * ------------------------- */}
            <TabsContent value="paste" className="m-0 h-full flex">
              <Textarea 
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder={uploadMsgs.pasteText.pasteOrType}
                className="
                  flex-1
                  resize-none p-4
                  rounded-none
                  border-0 bg-card
                  shadow-none focus-visible:ring-0
                  font-ui placeholder:text-muted-foreground/60
                "
              />
            </TabsContent>
          </div>
        </div>
      </Tabs>

    </div>
  );
}
