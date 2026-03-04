"use client";

import * as React from "react";
import { Upload } from "lucide-react";
import { cn } from "@/lib/utils";
import { AppSurface } from "./AppSurface";
import { Dropzone } from "./Dropzone";
import { Button } from "@/components/ui/button";

type UploadSurfaceProps = {
  className?: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  text?: string;
};

function FileChip({ children }: { children: React.ReactNode }) {
  return (
    <span className="
        rounded-md border border-border bg-background/80
        px-2 py-0.5 
        text-[11px] font-medium text-muted-foreground
      "
    >
      {children}
    </span>
  );
}

export function UploadSurface({
  className,
  file,
  onFileChange,
  text = "Drop your file here",
}: UploadSurfaceProps) {

  const inputId = React.useId();
  const inputRef = React.useRef<HTMLInputElement | null>(null);

  function handleFiles(files: FileList | null) {
    const f = files?.[0] ?? null;
    onFileChange(f);
  }

  return (
    <AppSurface className={className}>
      <input
        ref={inputRef}
        id={inputId}
        type="file"
        className="sr-only"
        accept=".epub,.txt"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Make the whole thing clickable via label */}
      <label htmlFor={inputId} className="block h-full">
        <Dropzone
          onFiles={(files) => handleFiles(files)}
          className={cn(
            "h-full rounded-lg border-2 border-dashed border-foreground/10",
            "bg-card transition-colors",
            "hover:border-primary/35 hover:bg-accent/60",
            "dark:hover:border-primary/25 dark:hover:bg-accent/45"
          )}
        >
          <div className="flex h-full items-center justify-center p-10">
            {!file ? (
              <div className="flex w-full max-w-sm flex-col items-center text-center">
                {/* Icon */}
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-background/85 shadow-sm">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </div>

                {/* Headline */}
                <div className="text-sm font-medium text-foreground">
                  {text}
                </div>

                {/* Or */}
                <div className="mt-2 text-xs text-muted-foreground">or</div>

                {/* Browse button */}
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="
                    mt-3 rounded-xl
                    bg-primary/10 text-primary
                    border border-primary/20
                    hover:bg-primary/15 hover:border-primary/35
                    dark:bg-primary/12 dark:hover:bg-primary/18
                    dark:border-primary/25 dark:hover:border-primary/40
                    focus-visible:ring-primary/30
                    cursor-pointer
                  "
                  // keep it a label-driven click; prevent Dropzone click handlers from interfering
                  onClick={() => inputRef.current?.click()}
                >
                  Browse files
                </Button>

                {/* Filetype chips */}
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <FileChip>TXT</FileChip>
                  <FileChip>EPUB</FileChip>
                </div>
              </div>
            ) : (
              // Selected state
              <div className="flex w-full max-w-sm flex-col items-center text-center">
                <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-lg border border-border bg-background/85 shadow-sm">
                  <Upload className="h-5 w-5 text-muted-foreground" />
                </div>

                <div className="text-sm font-medium text-foreground">
                  {file.name}
                </div>
                <div className="mt-2 text-xs text-muted-foreground">
                  Click to choose a different file
                </div>

                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  className="
                    mt-3 rounded-xl
                    bg-primary/10 text-primary
                    border border-primary/20
                    hover:bg-primary/15 hover:border-primary/35
                    dark:bg-primary/12 dark:hover:bg-primary/18
                    dark:border-primary/25 dark:hover:border-primary/40
                    focus-visible:ring-primary/30
                    cursor-pointer
                  "
                  onClick={() => inputRef.current?.click()}
                >
                  Change file
                </Button>

                {/* Filetype chips */}
                <div className="mt-4 flex flex-wrap justify-center gap-2">
                  <FileChip>TXT</FileChip>
                  <FileChip>EPUB</FileChip>
                </div>
              </div>
            )}
          </div>
        </Dropzone>
      </label>
    </AppSurface>
  );
}
