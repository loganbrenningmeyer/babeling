#!/usr/bin/env python3
"""
Build a synthetic Babeling-style document preview from a PDF using PyMuPDF.

This script does not touch the database. It approximates the payload shape
 returned by the current `/documents/{id}` backend route so it is easy to judge
 whether PDF extraction fits Babeling's page/block model.

Usage:
    python scripts/preview_pdf_as_babeling.py /path/to/file.pdf
    python scripts/preview_pdf_as_babeling.py /path/to/file.pdf --max-pages 5
    python scripts/preview_pdf_as_babeling.py /path/to/file.pdf --json
"""

from __future__ import annotations

import argparse
import json
import mimetypes
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


def _extract_text_from_block(block: dict[str, Any]) -> str:
    parts: list[str] = []

    for line in block.get("lines", []):
        line_parts: list[str] = []
        for span in line.get("spans", []):
            text = span.get("text", "")
            if text:
                line_parts.append(text)

        joined = "".join(line_parts).strip()
        if joined:
            parts.append(joined)

    return "\n".join(parts).strip()


def _guess_media_type(ext: str | None) -> str | None:
    if not ext:
        return None
    media_type, _ = mimetypes.guess_type(f"image.{ext}")
    return media_type


def _preview_text(text: str, width: int = 96) -> str:
    normalized = " ".join(text.split())
    if not normalized:
        return ""
    if len(normalized) <= width:
        return normalized
    return normalized[: width - 3] + "..."


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


def _build_sections_from_toc(toc: list[list[Any]], page_count: int) -> list[dict[str, Any]]:
    if not toc:
        return [
            {
                "id": 1,
                "title": "PDF",
                "depth": 0,
                "parent_section_id": None,
                "order_index": 0,
                "first_page_number": 1,
                "last_page_number": max(1, page_count),
            }
        ]

    sections: list[dict[str, Any]] = []
    id_by_depth: dict[int, int] = {}

    for index, item in enumerate(toc):
        if len(item) < 3:
            continue

        raw_level, raw_title, raw_page = item[:3]
        level = max(1, int(raw_level))
        title = str(raw_title or "").strip() or f"Section {index + 1}"
        first_page_number = max(1, min(page_count, int(raw_page)))

        last_page_number = page_count
        for next_item in toc[index + 1 :]:
            if len(next_item) < 3:
                continue

            next_level = max(1, int(next_item[0]))
            next_page = max(1, min(page_count, int(next_item[2])))
            if next_level <= level:
                last_page_number = max(first_page_number, next_page - 1)
                break

        section_id = len(sections) + 1
        parent_section_id = id_by_depth.get(level - 1)
        id_by_depth[level] = section_id

        for depth in list(id_by_depth):
            if depth > level:
                del id_by_depth[depth]

        sections.append(
            {
                "id": section_id,
                "title": title,
                "depth": level - 1,
                "parent_section_id": parent_section_id,
                "order_index": index,
                "first_page_number": first_page_number,
                "last_page_number": last_page_number,
            }
        )

    return sections


def _pick_section_for_page(
    page_number: int,
    sections: list[dict[str, Any]],
) -> dict[str, Any] | None:
    matching = [
        section
        for section in sections
        if section["first_page_number"] <= page_number <= section["last_page_number"]
    ]
    if not matching:
        return None

    matching.sort(key=lambda section: (section["depth"], section["order_index"]))
    return matching[-1]


def preview_pdf_as_babeling(
    pdf_path: Path,
    *,
    title: str | None = None,
    src_lang: str = "unknown",
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

        selected_page_numbers = {index + 1 for index in selected_indices}

        metadata = doc.metadata or {}
        effective_title = (
            title
            or str(metadata.get("title") or "").strip()
            or pdf_path.stem.replace("_", " ").replace("-", " ").strip()
            or "Untitled PDF"
        )
        author = str(metadata.get("author") or "").strip() or None

        toc = doc.get_toc(simple=True)
        all_sections = _build_sections_from_toc(toc, doc.page_count)

        images: list[dict[str, Any]] = []
        image_id_by_key: dict[tuple[int, int | None, int], int] = {}

        pages: list[dict[str, Any]] = []
        next_block_id = 1

        for page_index in selected_indices:
            page = doc.load_page(page_index)
            layout = page.get_text("dict", sort=True)
            raw_blocks = layout.get("blocks", [])
            page_number = page.number + 1
            section = _pick_section_for_page(page_number, all_sections)
            section_id = section["id"] if section else None
            section_page_index = (
                page_number - section["first_page_number"] if section else None
            )

            blocks: list[dict[str, Any]] = []
            page_text_parts: list[str] = []

            for block_index, raw_block in enumerate(raw_blocks):
                block_type = int(raw_block.get("type", -1))
                bbox = _round_bbox(raw_block.get("bbox", (0, 0, 0, 0)))

                if block_type == 0:
                    text = _extract_text_from_block(raw_block)
                    if not text:
                        continue

                    blocks.append(
                        {
                            "id": next_block_id,
                            "block_index": block_index,
                            "block_type": "text",
                            "tag": "p",
                            "text": text,
                            "document_image_id": None,
                            "alt": None,
                            "debug_bbox": bbox,
                        }
                    )
                    next_block_id += 1
                    page_text_parts.append(text)
                    continue

                if block_type == 1:
                    xref = raw_block.get("xref")
                    image_key = (page_number, int(xref) if xref is not None else None, block_index)
                    image_id = image_id_by_key.get(image_key)

                    if image_id is None:
                        image_id = len(images) + 1
                        image_id_by_key[image_key] = image_id

                        image_bytes = raw_block.get("image")
                        ext = raw_block.get("ext")
                        images.append(
                            {
                                "id": image_id,
                                "media_type": _guess_media_type(ext),
                                "byte_length": len(image_bytes) if isinstance(image_bytes, (bytes, bytearray)) else 0,
                                "debug": {
                                    "page_number": page_number,
                                    "xref": xref,
                                    "ext": ext,
                                    "bbox": bbox,
                                    "width": raw_block.get("width"),
                                    "height": raw_block.get("height"),
                                    "xres": raw_block.get("xres"),
                                    "yres": raw_block.get("yres"),
                                },
                            }
                        )

                    blocks.append(
                        {
                            "id": next_block_id,
                            "block_index": block_index,
                            "block_type": "image",
                            "tag": None,
                            "text": None,
                            "document_image_id": image_id,
                            "alt": raw_block.get("alt"),
                            "debug_bbox": bbox,
                        }
                    )
                    next_block_id += 1

            pages.append(
                {
                    "id": len(pages) + 1,
                    "page_number": page_number,
                    "src_text": "\n\n".join(page_text_parts).strip(),
                    "section_id": section_id,
                    "section_page_index": section_page_index,
                    "blocks": blocks,
                    "debug": {
                        "page_rect": _round_bbox(
                            (page.rect.x0, page.rect.y0, page.rect.x1, page.rect.y1)
                        ),
                        "raw_block_count": len(raw_blocks),
                    },
                }
            )

        sections = [
            section
            for section in all_sections
            if any(
                section["first_page_number"] <= page_number <= section["last_page_number"]
                for page_number in selected_page_numbers
            )
        ]

        return {
            "document_id": 0,
            "title": effective_title,
            "author": author,
            "source_kind": "pdf-preview",
            "cover_image_id": None,
            "src_lang": src_lang,
            "tgt_lang": None,
            "pages": pages,
            "sections": sections,
            "images": images,
            "debug": {
                "path": str(pdf_path),
                "page_count_in_file": doc.page_count,
                "pages_in_preview": len(pages),
                "toc_entries_in_file": len(toc),
                "note": (
                    "Synthetic Babeling preview from PyMuPDF; ids are temporary and "
                    "debug fields are not part of the current persisted schema."
                ),
            },
        }
    finally:
        doc.close()


def _print_report(preview: dict[str, Any]) -> None:
    pages = preview["pages"]
    sections = preview["sections"]
    images = preview["images"]

    pages_with_text = sum(1 for page in pages if page["src_text"].strip())
    image_only_pages = sum(
        1
        for page in pages
        if not page["src_text"].strip()
        and any(block["block_type"] == "image" for block in page["blocks"])
    )

    print(f"Title: {preview['title']}")
    print(f"Author: {preview['author']}")
    print(f"Source kind preview: {preview['source_kind']}")
    print(
        f"Pages previewed: {len(pages)} / {preview['debug']['page_count_in_file']} | "
        f"Sections: {len(sections)} | Images: {len(images)}"
    )
    print(
        f"Pages with extracted text: {pages_with_text} | "
        f"Image-only pages: {image_only_pages}"
    )
    print(
        "Fit check: each PDF page is mapped to one Babeling DocumentPage, "
        "with ordered text/image DocumentPageBlocks."
    )

    for page in pages:
        text_blocks = sum(1 for block in page["blocks"] if block["block_type"] == "text")
        image_blocks = sum(1 for block in page["blocks"] if block["block_type"] == "image")
        preview_text = _preview_text(page["src_text"])

        print()
        print(
            f"=== Page {page['page_number']} | "
            f"section_id={page['section_id']} "
            f"section_page_index={page['section_page_index']} | "
            f"text_blocks={text_blocks} image_blocks={image_blocks} ==="
        )

        if preview_text:
            print(
                textwrap.fill(
                    f"src_text: {preview_text}",
                    width=100,
                    subsequent_indent="          ",
                )
            )
        else:
            print("src_text: <empty>")

        for block in page["blocks"]:
            if block["block_type"] == "text":
                line = (
                    f"  [{block['block_index']:02d}] text "
                    f"bbox={block['debug_bbox']} "
                    f"{_preview_text(block['text'], width=80)}"
                )
            else:
                line = (
                    f"  [{block['block_index']:02d}] image "
                    f"bbox={block['debug_bbox']} "
                    f"document_image_id={block['document_image_id']}"
                )
            print(textwrap.fill(line, width=100, subsequent_indent="      "))


def _parse_args(argv: list[str]) -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Build a synthetic Babeling document preview from a PDF using PyMuPDF."
        )
    )
    parser.add_argument("pdf_path", help="Path to a PDF file")
    parser.add_argument(
        "--title",
        default=None,
        help="Override the preview document title",
    )
    parser.add_argument(
        "--src-lang",
        default="unknown",
        help="Set the preview src_lang value",
    )
    parser.add_argument(
        "--max-pages",
        type=int,
        default=None,
        help="Preview only the first N pages",
    )
    parser.add_argument(
        "--pages",
        type=str,
        default=None,
        help="Comma-separated 1-indexed page numbers to preview, e.g. 1,3,10",
    )
    parser.add_argument(
        "--json",
        action="store_true",
        help="Emit the synthetic Babeling document JSON",
    )
    args = parser.parse_args(argv)

    pdf_path = Path(args.pdf_path)
    if not pdf_path.is_file():
        raise SystemExit(f"PDF not found: {pdf_path}")

    if args.max_pages is not None and args.max_pages <= 0:
        raise SystemExit("--max-pages must be a positive integer")

    return args


def main(argv: list[str]) -> int:
    args = _parse_args(argv)
    page_numbers = _parse_page_numbers(args.pages)

    preview = preview_pdf_as_babeling(
        Path(args.pdf_path),
        title=args.title,
        src_lang=args.src_lang,
        max_pages=args.max_pages,
        page_numbers=page_numbers,
    )

    if args.json:
        json.dump(preview, sys.stdout, indent=2, ensure_ascii=False)
        sys.stdout.write("\n")
    else:
        _print_report(preview)

    return 0


if __name__ == "__main__":
    raise SystemExit(main(sys.argv[1:]))
