"use client";

import React, { useEffect, useMemo, useRef, useState } from "react";
import { cn } from "@/lib/utils";

import { Separator } from "@/components/ui/separator";

import { HoverText } from "@/app/(protected)/documents/feature/components/HoverText/HoverText";
import type { BlurMode } from "@/app/(protected)/documents/feature/components/SourceBlur/BlurModeToggle";
import type { LoadedDocumentImage, SavedPageBlock } from "../../types/document";
import type { ReaderSession } from "../../types/readerSession";

type ParagraphGridProps = {
  session: ReaderSession;
  documentId: number;
  pageBlocks: SavedPageBlock[];
  documentImages: LoadedDocumentImage[];
  isSwapped: boolean;

  // Blur
  blurMode: BlurMode;
  blurredSource: Set<number>;
  setBlurredSource: React.Dispatch<React.SetStateAction<Set<number>>>;

  // Highlight + hover
  sourceHighlightIndices: number[];
  targetHighlightIndices: number[];
  sourceHighlightClassName: string;
  targetHighlightClassName: string;
  onSourceHover?: (idx: number | null) => void;
  onTargetHover?: (idx: number | null) => void;

  // Target click
  onTargetWordClick?: (idx: number, el: HTMLElement) => void;
  targetDisabled?: boolean;

  className?: string;
  gapAndPad?: string;
};

type TextSlice = {
  words: string[];
  spaces: string[];
  offset: number;
};

type ReaderRow =
  | {
      kind: "text";
      key: React.Key;
      parId: number;
    }
  | {
      kind: "image";
      key: React.Key;
      imageId: number;
      alt: string | null;
    };

const IMAGE_MAX_HEIGHT_PX = 400;
const IMAGE_MAX_WIDTH_RATIO = 0.8;

// -------------------------
// Slice words/spaces by word index range
// -- Keeps the original global index offset so hover/alignment still maps correctly
// -------------------------
function sliceWordsSpaces(
  words: string[],
  spaces: string[],
  idxs?: number[]
): TextSlice | null {
  if (!idxs?.length) return null;

  const start = Math.min(...idxs);
  const end = Math.max(...idxs);

  return {
    words: words.slice(start, end + 1),
    spaces: spaces.slice(start, end + 1),
    offset: start,
  };
}

// -------------------------
// Remove paragraph-level trailing newlines
// -- Paragraph rows are already separated by grid rows + separators
// -------------------------
function stripTrailingParagraphBreak(spaces: string[]) {
  if (!spaces.length) return spaces;
  const out = [...spaces];
  const last = out.length - 1;
  out[last] = out[last].replace(/\n+$/, "");
  return out;
}

// -------------------------
// Fallback empty target slice
// -- Defensive only; target alignment should normally exist for each source paragraph
// -------------------------
function emptyTextSlice(): TextSlice {
  return {
    words: [],
    spaces: [],
    offset: 0,
  };
}

// -------------------------
// Build stable ordered paragraph IDs from aligned source text
// -------------------------
function buildOrderedParIds(session: ReaderSession) {
  const uniq = Array.from(new Set(session.alignment.src.parIds));
  uniq.sort((a, b) => a - b);
  return uniq;
}

// Get target paragraph id --> word idx map
function buildTgtParToWordIds(session: ReaderSession) {
  const out: Record<number, number[]> = {};
  for (let i = 0; i < session.alignment.tgt.words.length; i++) {
    const sentId = session.alignment.tgt.sentIds[i];
    const parId = session.alignment.src.sentToParIds[sentId];
    (out[parId] ??= []).push(i);
  }
  return out;
}

function buildRows(
  pageBlocks: SavedPageBlock[],
  orderedParIds: number[]
): ReaderRow[] {
  // -------------------------
  // No saved page blocks:
  // -- Fall back to the previous behavior and render pure text paragraphs in order
  // -------------------------
  if (!pageBlocks.length) {
    return orderedParIds.map((parId) => ({
      kind: "text",
      key: `par-${parId}`,
      parId,
    }));
  }

  const rows: ReaderRow[] = [];
  const sortedBlocks = [...pageBlocks].sort(
    (a, b) => a.blockIndex - b.blockIndex
  );
  let textRowIndex = 0;

  // -------------------------
  // Walk the persisted page blocks in block_index order
  // -- Text blocks consume the next aligned paragraph
  // -- Image blocks are emitted directly into the render row stream
  // -------------------------
  for (const block of sortedBlocks) {
    if (block.blockType === "image") {
      if (!block.documentImageId) continue;

      rows.push({
        kind: "image",
        key: `image-${block.id}`,
        imageId: block.documentImageId,
        alt: block.alt ?? null,
      });
      continue;
    }

    const parId = orderedParIds[textRowIndex];
    textRowIndex += 1;

    if (parId == null) continue;

    rows.push({
      kind: "text",
      key: `text-${block.id}`,
      parId,
    });
  }

  // -------------------------
  // Safety fallback:
  // -- If there are more aligned paragraphs than persisted text blocks,
  //    append the remaining text rows so reader content does not disappear
  // -------------------------
  for (; textRowIndex < orderedParIds.length; textRowIndex++) {
    const parId = orderedParIds[textRowIndex];
    rows.push({
      kind: "text",
      key: `text-fallback-${parId}`,
      parId,
    });
  }

  return rows;
}

// -------------------------
// [Source] | [Target] content rows with images interleaved in page-block order
// -------------------------
export function ParagraphGrid({
  session,
  documentId,
  pageBlocks,
  documentImages,
  isSwapped,
  blurMode,
  blurredSource,
  setBlurredSource,
  sourceHighlightIndices,
  targetHighlightIndices,
  sourceHighlightClassName,
  targetHighlightClassName,
  onSourceHover,
  onTargetHover,
  onTargetWordClick,
  targetDisabled,
  className,
  gapAndPad,
}: ParagraphGridProps) {
  // -------------------------
  // Derived render helpers
  // -------------------------
  const orderedParIds = useMemo(() => buildOrderedParIds(session), [session]);

  const tgtParToWordIds = useMemo(
    () => buildTgtParToWordIds(session),
    [session]
  );
  const imageIds = useMemo(
    () => new Set(documentImages.map((image) => image.id)),
    [documentImages]
  );
  const rootRef = useRef<HTMLDivElement | null>(null);
  const [gridWidth, setGridWidth] = useState<number | null>(null);
  const [imageNaturalSizes, setImageNaturalSizes] = useState<
    Record<number, { width: number; height: number }>
  >({});
  const rows = useMemo(
    () => buildRows(pageBlocks, orderedParIds),
    [pageBlocks, orderedParIds]
  );
  const maxImageWidth = gridWidth
    ? Math.max(gridWidth * IMAGE_MAX_WIDTH_RATIO, 0)
    : null;

  useEffect(() => {
    const node = rootRef.current;
    if (!node) return;

    const updateGridWidth = () => {
      setGridWidth(node.clientWidth);
    };

    updateGridWidth();

    const observer = new ResizeObserver(updateGridWidth);
    observer.observe(node);

    return () => {
      observer.disconnect();
    };
  }, []);

  return (
    <div
      ref={rootRef}
      className={cn(
        "relative h-full overflow-y-auto overscroll-y-contain no-scrollbar",
        className
      )}
    >
      <div className="min-h-full py-8">
        {rows.map((row, idx) => {
          // -------------------------
          // Image row
          // -------------------------
          if (row.kind === "image") {
            // Skip stale references if the page points at an image that was not loaded
            if (!imageIds.has(row.imageId)) return null;

            const naturalSize = imageNaturalSizes[row.imageId];
            const renderedWidth =
              naturalSize && maxImageWidth
                ? Math.round(
                    naturalSize.width *
                      Math.min(
                        maxImageWidth / naturalSize.width,
                        IMAGE_MAX_HEIGHT_PX / naturalSize.height
                      )
                  )
                : null;

            return (
              <React.Fragment key={row.key}>
                <div className={`grid grid-cols-2 ${gapAndPad ?? ""}`}>
                  <div className="col-span-2 flex justify-center py-2">
                    <figure
                      className="
                      mx-auto flex max-w-full flex-col
                      gap-3 overflow-hidden rounded-xl
                      border border-border bg-background p-3
                    "
                      style={
                        renderedWidth
                          ? { width: `${renderedWidth}px` }
                          : undefined
                      }
                    >
                      {/* -------------------------
                       * Get image data from database by imageId
                       * -- /api/documents/[documentId]/images/[imageId]
                       * ------------------------- */}
                      <img
                        src={`/api/documents/${documentId}/images/${row.imageId}`}
                        alt={row.alt ?? ""}
                        loading="lazy"
                        onLoad={(event) => {
                          const { naturalWidth, naturalHeight } =
                            event.currentTarget;
                          if (!naturalWidth || !naturalHeight) return;

                          setImageNaturalSizes((prev) => {
                            const prevSize = prev[row.imageId];
                            if (
                              prevSize?.width === naturalWidth &&
                              prevSize?.height === naturalHeight
                            ) {
                              return prev;
                            }

                            return {
                              ...prev,
                              [row.imageId]: {
                                width: naturalWidth,
                                height: naturalHeight,
                              },
                            };
                          });
                        }}
                        className="mx-auto block h-auto max-h-[25rem] w-full rounded-md"
                      />
                    </figure>
                  </div>
                </div>

                {idx < rows.length - 1 && (
                  <div className={`grid grid-cols-2 ${gapAndPad ?? ""}`}>
                    <div className="col-span-2 py-4">
                      <Separator />
                    </div>
                  </div>
                )}
              </React.Fragment>
            );
          }

          // -------------------------
          // Text row
          // -- Render the next aligned source/target paragraph pair
          // -------------------------
          const srcIdxs = session.alignment.src.parToWordIds[row.parId];
          const srcSlice = sliceWordsSpaces(
            session.alignment.src.words,
            session.alignment.src.spaces,
            srcIdxs
          );

          if (!srcSlice) return null;

          // Paragraph spacing is handled by the grid row, not by trailing linebreaks
          srcSlice.spaces = stripTrailingParagraphBreak(srcSlice.spaces);

          const tgtSlice =
            sliceWordsSpaces(
              session.alignment.tgt.words,
              session.alignment.tgt.spaces,
              tgtParToWordIds[row.parId]
            ) ?? emptyTextSlice();

          tgtSlice.spaces = stripTrailingParagraphBreak(tgtSlice.spaces);

          const sourceBlock = isSwapped
            ? session.alignment.tgt
            : session.alignment.src;
          const sourceSlice = isSwapped ? tgtSlice : srcSlice;
          const targetSlice = isSwapped ? srcSlice : tgtSlice;

          return (
            <React.Fragment key={row.key}>
              <div className={`grid grid-cols-2 ${gapAndPad ?? ""}`}>
                <div>
                  <HoverText
                    words={sourceSlice.words}
                    spaces={sourceSlice.spaces}
                    indexOffset={sourceSlice.offset}
                    onHover={onSourceHover}
                    highlightClassName={sourceHighlightClassName}
                    highlightIndices={sourceHighlightIndices}
                    blur={{
                      mode: blurMode,
                      sentIds: sourceBlock.sentIds,
                      parIds: sourceBlock.parIds,
                      sentToWordIds: sourceBlock.sentToWordIds,
                      parToWordIds: sourceBlock.parToWordIds,
                      blurred: blurredSource,
                      setBlurred: setBlurredSource,
                    }}
                    indentFirstLine={true}
                    className="text-muted-foreground"
                  />
                </div>

                <div>
                  <HoverText
                    words={targetSlice.words}
                    spaces={targetSlice.spaces}
                    indexOffset={targetSlice.offset}
                    disabled={targetDisabled}
                    onHover={onTargetHover}
                    highlightClassName={targetHighlightClassName}
                    highlightIndices={targetHighlightIndices}
                    onWordClick={onTargetWordClick}
                    indentFirstLine={true}
                  />
                </div>
              </div>

              {/* -------------------------
               * Paragraph Separator Lines
               * ------------------------- */}
              {idx < rows.length - 1 && (
                <div className={`grid grid-cols-2 ${gapAndPad ?? ""}`}>
                  <div className="py-4">
                    <Separator />
                  </div>
                  <div className="py-4">
                    <Separator />
                  </div>
                </div>
              )}
            </React.Fragment>
          );
        })}
      </div>
    </div>
  );
}
