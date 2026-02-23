"use client";

import React, { useEffect, useRef, useState } from "react";
import { cn } from "@/lib/utils";

import { Clipboard, FileUp, Link as LinkIcon, Upload } from "lucide-react";

import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";

import { UploadSurface } from "@/app/components/UploadSurface";

type TabKey = "paste" | "upload";

type InputPaylod = 
  | { type: "text"; text: string }
  | { type: "file"; file: File | null };

export function TabbedInputCard({
  className,
  samples,
  onPayloadChange,
}: {
  className?: string;
  samples: { id: string; label: string; filename: string }[];
  onPayloadChange?: (payload: InputPaylod) => void;
}) {
  const [tab, setTab] = useState<TabKey>("paste");

  const [text, setText] = useState("");
  const [file, setFile] = useState<File | null>(null);

  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // -------------------------
  // Keep parent in sync with active tab
  // -------------------------
  useEffect(() => {
    if (!onPayloadChange) return;
    if (tab === "paste") onPayloadChange({ type: "text", text });
    if (tab === "upload") onPayloadChange({ type: "file", file });
  }, [tab, text, file, onPayloadChange]);

  function chooseFile() {
    fileInputRef.current?.click();
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0] ?? null;
    setFile(f);
  }

  // function pickSample(id: string) {
  //   const s = samples.find((x) => x.id === id);
  //   if (!s) return;
  //   setText(s.text);
  //   setTab("paste");
  // }

  const tabClassName = cn(
    "h-full inline-flex items-center",
    "gap-2 py-2 text-sm",
    "rounded-none shadow-none border-b-2 border-transparent",
    "data-[state=inactive]:text-muted-foreground/60",
    "data-[state=active]:bg-transparent",
    "data-[state=active]:border-b-foreground",
    "data-[state=active]:shadow-none",
  )

  return (
    <div>
      <Tabs value={tab} onValueChange={(v) => setTab(v as TabKey)} className="gap-0">
        <div className="rounded-xl border border-foreground/20 shadow-sm overflow-hidden">

          {/* -------------------------
          * Top Bar (input type tabs)
          * ------------------------- */}
          <div className="font-ui h-12 px-2 border-b">
            <TabsList className="h-full bg-transparent p-0 gap-4 items-stretch">
              {/* -------------------------
              * Paste
              * ------------------------- */}
              <TabsTrigger value="paste" className={tabClassName}>
                <Clipboard className="h-4 w-4" />
                Paste text
              </TabsTrigger>
              {/* -------------------------
              * File Upload
              * ------------------------- */}
              <TabsTrigger value="upload" className={tabClassName}>
                <FileUp className="h-4 w-4" />
                Upload file
              </TabsTrigger>
            </TabsList>
          </div>

          {/* -------------------------
          * Content area
          * ------------------------- */}
          <div>
            {/* -------------------------
            * ( Paste ): Text input
            * ------------------------- */}
            <TabsContent value="paste" className="m-0 h-[320px] flex">
              <Textarea 
                value={text}
                onChange={(e) => setText(e.target.value)}
                placeholder="Paste or type your text here..."
                className="
                  flex-1
                  resize-none p-4
                  border-0 bg-background
                  shadow-none focus-visible:ring-0
                  font-ui placeholder:text-muted-foreground/60
              "/>
            </TabsContent>
            {/* -------------------------
            * ( File Upload ): Drop or browse
            * ------------------------- */}
            <TabsContent value="upload" className="m-0 h-[320px] flex">
              <UploadSurface 
                file={file}
                onFileChange={async (file) => {
                  setFile(file);
                  if (!file) return;
                }}
                text="Drag and drop"
                className="h-full flex-1 p-6 rounded-none"
              />
            </TabsContent>
          </div>
        </div>
      </Tabs>

    </div>
  )
}