"use client";

import * as React from "react";
import { cn } from "@/lib/utils";


type DropzoneProps = {
  className?: string;
  onFiles: (files: FileList) => void;
  children?: React.ReactNode;
}

export function Dropzone({
  className,
  onFiles,
  children,
}: DropzoneProps) {
  const [over, setOver] = React.useState(false);

  return (
    <div
      className={cn(
        "transition-colors",
        className,
        over &&
          "ring-1 ring-primary/30 border-primary/30 bg-muted/55 dark:ring-primary/25 dark:border-primary/25 dark:bg-muted/45"
      )}
      onDragEnter={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setOver(true);
      }}
      onDragOver={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setOver(true);
      }}
      onDragLeave={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setOver(false);
      }}
      onDrop={(e) => {
        e.preventDefault();
        e.stopPropagation();
        setOver(false);
        if (e.dataTransfer.files?.length) onFiles(e.dataTransfer.files);
      }}
    >
      {children}
    </div>
  )
}
