"use client";

import * as React from "react";
import { cn } from "@/lib/utils";
import { AppSurface } from "./AppSurface";
import { Dropzone } from "./Dropzone";


type UploadSurfaceProps = {
  className?: string;
  file: File | null;
  onFileChange: (file: File | null) => void;
  text: string;
}

export function UploadSurface({ 
  className,
  file,
  onFileChange,
  text,
}: UploadSurfaceProps) {

  function handleFiles(files: FileList | null) {
    const f = files?.[0] ?? null;
    onFileChange(f);
  }

  const inputId = React.useId();

  return (
    <AppSurface className={cn("h-full p-4", className)}>
      {/* Hidden file input */}
      <input
        id={inputId}
        type="file"
        className="sr-only"
        accept=".pdf,.epub,.txt"
        onChange={(e) => handleFiles(e.target.files)}
      />

      {/* Drag & Drop Files */}
      <label htmlFor={inputId} className="block h-full cursor-pointer">
        <Dropzone
          className="
            h-full rounded-md p-3
            border border-dashed border-border
            transition-colors hover:border-ring hover:bg-muted/40
          "
          onFiles={(files) => handleFiles(files)}
        >
          <div className="h-full flex items-center justify-center text-sm text-muted-foreground text-center">
            <span>
              {file ? (
                file.name
              ) : (
                <span>
                  {text}
                </span>
              )}
            </span>
          </div>
        </Dropzone>
      </label>

    </AppSurface>
  );
}
