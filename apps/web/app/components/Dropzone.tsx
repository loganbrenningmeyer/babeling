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
        over && "ring-1 ring-ring bg-muted/40",
        className
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