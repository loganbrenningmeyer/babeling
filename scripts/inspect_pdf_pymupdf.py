#!/usr/bin/env python3
"""
Inspect a PDF with PyMuPDF and print a block stream that approximates
reading order for text and images.

This is an exploratory script for designing Babeling PDF ingestion.
It relies on `page.get_text("dict", sort=True)`, which yields text/image
blocks in top-to-bottom, left-to-right order based on their bounding boxes.

Usage:
    python scripts/inspect_pdf_pymupdf.py /path/to/file.pdf
    python scripts/inspect_pdf_pymupdf.py /path/to/file.pdf --max-pages 3
    python scripts/inspect_pdf_pymupdf.py /path/to/file.pdf --json
"""

from __future__ import annotations

import argparse
import json
import sys
import textwrap
from pathlib import Path
from typing import Any


def _load_fitz():
    try:
        import fitz  # type: ignore
    except ImportError as exc:
        raise SystemExit(
            "PyMuPDF is required for this script. Install it with: pip install pymupdf"
        ) from exc

    return fitz


def _round_bbox(bbox: tuple[float, float, float, float] | list[float]) -> list[float]:
    return [round(float(v), 2) for v in bbox]


def _preview_text(text: str, width: int = 88) -> str:
    normalized = " ".join(text.split())
    if not normalized:
        return ""
    if len(normalized) <= width:
        return normalized
    return normalized[: width - 3] + "..."


def _extract_text_from_block(block: dict[str, Any]) -> str:
    parts: list[str] = []

    for line in block.get("lines", []):
        line_text_parts: list[str] = []
        for span in line.get("spans", []):
            text = span.get("text", "")
            if text:
                line_text_parts.append(text)

        joined = "".join(line_text_parts).strip()
        if joined:
            parts.append(joined)

    return "\n".join(parts).strip()


def _image_summary(block: dict[str, Any]) -> dict[str, Any]:
    summary = {
        "width": block.get("width"),
        "height": block.get("height"),
        "ext": block.get("ext"),
        "colorspace": block.get("colorspace"),
        "xres": block.get("xres"),
        "yres": block.get("yres"),
        "bpc": block.get("bpc"),
    }
    transform = block.get("transform")
    if transform:
        summary["transform"] = [round(float(v), 4) for v in transform]
    return summary


def _serialize_block(page_number: int, order_index: int, block: dict[str, Any]) -> dict[str, Any]:
    block_type = int(block.get("type", -1))
    bbox = _round_bbox(block.get("bbox", (0, 0, 0, 0)))

    record: dict[str, Any] = {
        "page_number": page_number,
        "order_index": order_index,
        "block_number": block.get("number"),
        "kind": "unknown",
        "bbox": bbox,
    }

    if block_type == 0:
        text = _extract_text_from_block(block)
        if not text:
            record["kind"] = "empty-text"
            return record

        record["kind"] = "text"
        record["text"] = text
        record["char_count"] = len(text)
        record["line_count"] = len(block.get("lines", []))
        record["preview"] = _preview_text(text)
        return record

    if block_type == 1:
        record["kind"] = "image"
        record["image"] = _image_summary(block)
        return record

    return record


def inspect_pdf(
    pdf_path: Path,
    *,
    max_pages: int | None = None,
    page_numbers: list[int] | None = None,
) -> dict[str, Any]:
    fitz = _load_fitz()
    doc = fitz.open(pdf_path)

    try:
        selected_indices: list[int]
        if page_numbers:
            selected_indices = []
            for page_number in page_numbers:
                if page_number < 1 or page_number > doc.page_count:
                    raise SystemExit(
                        f"Requested page {page_number} is out of range 1..{doc.page_count}"
                    )
                selected_indices.append(page_number - 1)
        else:
            selected_indices = list(range(doc.page_count))

        if max_pages is not None:
            selected_indices = selected_indices[:max_pages]

        pages: list[dict[str, Any]] = []
        for page_index in selected_indices:
            page = doc.load_page(page_index)
            layout = page.get_text("dict", sort=True)
            blocks = layout.get("blocks", [])

            serialized_blocks = [
                _serialize_block(page.number + 1, order_index, block)
                for order_index, block in enumerate(blocks)
            ]

            pages.append(
                {
                    "page_number": page.number + 1,
                    "width": round(float(page.rect.width), 2),
                    "height": round(float(page.rect.height), 2),
                    "block_count": len(serialized_blocks),
                    "blocks": serialized_blocks,
                }
            )

        return {
            "path": str(pdf_path),
            "page_count": doc.page_count,
            "inspected_pages": len(pages),
            "pages": pages,
        }
    finally:
        doc.close()


def _print_report(report: dict[str, Any]) -> None:
    print(f"PDF: {report['path']}")
    print(
        f"Pages in file: {report['page_count']} | "
        f"Pages inspected: {report['inspected_pages']}"
    )
    print(
        "Order heuristic: PyMuPDF `page.get_text(\"dict\", sort=True)` "
        "(top-to-bottom, left-to-right by bbox)"
    )

    for page in report["pages"]:
        print()
        print(
            f"=== Page {page['page_number']} "
            f"({page['width']} x {page['height']}) | "
            f"{page['block_count']} blocks ==="
        )

        for block in page["blocks"]:
            bbox = block["bbox"]
            bbox_label = f"bbox={bbox}"
            prefix = f"[{block['order_index']:02d}] {block['kind'].upper():10s} {bbox_label}"

            if block["kind"] == "text":
                print(f"{prefix} chars={block['char_count']}")
                wrapped = textwrap.fill(
                    block["preview"],
                    width=96,
                    initial_indent="      ",
                    subsequent_indent="      ",
                )
                if wrapped.strip():
                    print(wrapped)
                continue

            if block["kind"] == "image":
                image = block["image"]
                print(
                    f"{prefix} "
                    f"size={image.get('width')}x{image.get('height')} "
                    f"ext={image.get('ext')} "
                    f"xres={image.get('xres')} yres={image.get('yres')}"
                )
                continue

            print(prefix)


def _parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Inspect PDF page blocks using PyMuPDF to understand text/image order."
        )
    )
    parser.add_argument("pdf_path", help="Path to a PDF file")
    parser.add_argument(
        "--max-pages",
        type=int,
        default=None,
        help="Inspect only the first N pages",
    )
    parser.add_argument(
        "--pages",
        type=str,
        default=None,
        help="Comma-separated 1-indexed page numbers to inspect, e.g. 1,3,10",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Emit full JSON instead of the human-readable report",
    )
    args = parser.parse_args(argv)

    pdf_path = Path(args.pdf_path)
    if not pdf_path.is_file():
        raise SystemExit(f"PDF not found: {pdf_path}")

    if args.max_pages is not None and args.max_pages <= 0:
        raise SystemExit("--max-pages must be a positive integer")

    return args


def _parse_page_numbers(raw: str | None) -> list[int] | None:
    if raw is None:
        return None

    page_numbers: list[int] = []
    for part in raw.split(","):
        token = part.strip()
        if not token:
            continue
        try:
            page_number = int(token)
        except ValueError as exc:
            raise SystemExit(f"Invalid page number: {token}") from exc
        if page_number <= 0:
            raise SystemExit("Page numbers must be positive integers")
        page_numbers.append(page_number)

    if not page_numbers:
        raise SystemExit("--pages must include at least one page number")

    return page_numbers


def main(argv: list[str]) -> int:
    args = _parse_args(argv)
    page_numbers = _parse_page_numbers(args.pages)

    report = inspect_pdf(
        Path(args.pdf_path),
        max_pages=args.max_pages,
        page_numbers=page_numbers,
    )

    if args.json:
        json.dump(report, sys.stdout, indent=2, ensure_ascii=False)
        sys.stdout.write("\n")
    else:
        _print_report(report)

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
