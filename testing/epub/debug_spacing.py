#!/usr/bin/env python3
"""
Debug spacing mismatches between EPUB and raw-text pipelines.

This script compares two flows using the same Segmenter logic:

1) EPUB pipeline:
   EpubParser -> EpubDocument.build_pages -> page_text -> split_words/get_token_spaces

2) Raw-text pipeline:
   EpubParser -> flatten text blocks -> Segmenter.split_pages -> split_words/get_token_spaces

It prints per-page diagnostics that help isolate root causes when tokens
render without spaces in the reader.
"""

from __future__ import annotations

import argparse
import sys
from collections import Counter
from dataclasses import dataclass
from pathlib import Path


REPO_ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(REPO_ROOT / "services" / "api" / "src"))
sys.path.insert(0, str(REPO_ROOT / "packages" / "binaryalign" / "src"))


@dataclass
class PageDebug:
    page_number: int
    char_count: int
    token_count: int
    empty_space_count: int
    missing_token_count: int
    suspicious_join_count: int
    first_diff_index: int | None
    missing_examples: list[str]
    suspicious_examples: list[str]
    whitespace_summary: str


def _safe_snippet(text: str, start: int, width: int = 48) -> str:
    lo = max(0, start - 16)
    hi = min(len(text), start + width)
    chunk = text[lo:hi]
    return chunk.replace("\n", "\\n").replace("\r", "\\r")


def _first_diff(a: str, b: str) -> int | None:
    max_len = min(len(a), len(b))
    for i in range(max_len):
        if a[i] != b[i]:
            return i
    if len(a) != len(b):
        return max_len
    return None


def _whitespace_summary(text: str) -> str:
    counts = Counter(ch for ch in text if ch.isspace())
    if not counts:
        return "none"

    parts = []
    for ch, count in sorted(counts.items(), key=lambda x: x[0]):
        if ch == " ":
            label = "space(U+0020)"
        elif ch == "\n":
            label = "newline(U+000A)"
        elif ch == "\t":
            label = "tab(U+0009)"
        else:
            label = f"U+{ord(ch):04X}"
        parts.append(f"{label}={count}")
    return ", ".join(parts)


def _trace_token_spaces(text: str, tokens: list[str]) -> tuple[list[str], list[str]]:
    """
    Mirrors Segmenter.get_token_spaces exactly, but records misses.
    """
    i = 0
    spaces: list[str] = []
    misses: list[str] = []

    for idx, token in enumerate(tokens):
        start = text.find(token, i)

        if start == -1:
            spaces.append("")
            misses.append(
                f"token_idx={idx} token={token!r} search_from={i} near={_safe_snippet(text, i)}"
            )
            continue

        end = start + len(token)
        j = end
        while j < len(text) and text[j].isspace():
            j += 1

        spaces.append(text[end:j])
        i = j

    return spaces, misses


def _debug_page(page_number: int, text: str, segmenter, max_examples: int) -> PageDebug:
    tokens = segmenter.split_words(text)
    spaces, misses = _trace_token_spaces(text, tokens)

    empty_space_count = sum(1 for s in spaces if s == "")
    missing_token_count = len(misses)

    suspicious = []
    for i in range(len(tokens) - 1):
        if spaces[i] != "":
            continue
        left = tokens[i]
        right = tokens[i + 1]
        if not left or not right:
            continue
        if left[-1].isalnum() and right[0].isalnum():
            suspicious.append(f"idx={i}: {left!r}+{right!r}")

    rebuilt = "".join(t + spaces[i] for i, t in enumerate(tokens))
    first_diff = _first_diff(text, rebuilt)

    return PageDebug(
        page_number=page_number,
        char_count=len(text),
        token_count=len(tokens),
        empty_space_count=empty_space_count,
        missing_token_count=missing_token_count,
        suspicious_join_count=len(suspicious),
        first_diff_index=first_diff,
        missing_examples=misses[:max_examples],
        suspicious_examples=suspicious[:max_examples],
        whitespace_summary=_whitespace_summary(text),
    )


def _print_report(label: str, pages: list[str], segmenter, page_limit: int, max_examples: int) -> str:
    out: list[str] = []
    out.append(f"\n===== {label} =====")
    out.append(f"pages={len(pages)}")

    if not pages:
        out.append("no pages to analyze")
        report = "\n".join(out)
        print(report)
        return report

    results = [
        _debug_page(page_number=i + 1, text=page_text, segmenter=segmenter, max_examples=max_examples)
        for i, page_text in enumerate(pages)
    ]

    total_tokens = sum(r.token_count for r in results)
    total_missing = sum(r.missing_token_count for r in results)
    total_suspicious = sum(r.suspicious_join_count for r in results)
    total_empty_spaces = sum(r.empty_space_count for r in results)

    out.append(
        "summary: "
        f"tokens={total_tokens}, "
        f"missing_token_matches={total_missing}, "
        f"empty_spaces={total_empty_spaces}, "
        f"suspicious_alpha_joins={total_suspicious}"
    )

    sorted_pages = sorted(
        results,
        key=lambda r: (
            r.missing_token_count,
            r.suspicious_join_count,
            r.empty_space_count,
        ),
        reverse=True,
    )

    top_pages = sorted_pages[:page_limit]
    out.append(f"showing_top_pages={len(top_pages)} (sorted by mismatch severity)")

    for r in top_pages:
        missing_pct = (r.missing_token_count / r.token_count * 100.0) if r.token_count else 0.0
        out.append("")
        out.append(
            f"[page {r.page_number}] chars={r.char_count}, tokens={r.token_count}, "
            f"missing={r.missing_token_count} ({missing_pct:.2f}%), "
            f"empty_spaces={r.empty_space_count}, suspicious_joins={r.suspicious_join_count}, "
            f"first_rebuild_diff={r.first_diff_index}"
        )
        out.append(f"whitespace: {r.whitespace_summary}")
        if r.missing_examples:
            out.append("missing_examples:")
            out.extend(f"  - {m}" for m in r.missing_examples)
        if r.suspicious_examples:
            out.append("suspicious_join_examples:")
            out.extend(f"  - {s}" for s in r.suspicious_examples)

    report = "\n".join(out)
    print(report)
    return report


def _flatten_epub_text(epub_doc) -> str:
    chunks = []
    for section in epub_doc.iter_content_sections():
        section_text = [b.text for b in section.blocks if b.type == "text" and b.text]
        if section_text:
            chunks.append("\n\n".join(section_text))
    return "\n\n".join(chunks).strip()


def main() -> int:
    parser = argparse.ArgumentParser(description="Debug EPUB spacing/token-space mismatches")
    parser.add_argument("epub", type=Path, help="Path to .epub file")
    parser.add_argument("--lang", default="en", help="Language code for Segmenter (default: en)")
    parser.add_argument("--max-chars", type=int, default=1800, help="Max chars per page (default: 1800)")
    parser.add_argument(
        "--page-limit",
        type=int,
        default=8,
        help="How many highest-severity pages to print per pipeline",
    )
    parser.add_argument(
        "--max-examples",
        type=int,
        default=6,
        help="How many missing/suspicious examples to print per page",
    )
    parser.add_argument(
        "--out",
        type=Path,
        default=None,
        help="Optional output report path",
    )
    args = parser.parse_args()

    if not args.epub.exists():
        print(f"ERROR: epub file not found: {args.epub}")
        return 1

    try:
        from api.parsing.epub import EpubParser  # noqa: WPS433
    except ModuleNotFoundError as e:
        print(f"ERROR: missing dependency while importing EPUB parser: {e}")
        print("Hint: install api service deps (ebooklib, bs4, lxml, etc.) in your active env.")
        return 1

    try:
        from binaryalign.tokenization import Segmenter  # noqa: WPS433
    except ModuleNotFoundError as e:
        print(f"ERROR: missing dependency while importing Segmenter: {e}")
        print("Hint: install binaryalign deps (spacy + language model) in your active env.")
        return 1

    epub_bytes = args.epub.read_bytes()
    epub_doc = EpubParser().build_document(epub_bytes=epub_bytes)
    if epub_doc is None:
        print("ERROR: parser returned None")
        return 1

    segmenter = Segmenter(args.lang)

    # Pipeline A: EPUB-native pages from block-aware pagination.
    epub_pages = epub_doc.build_pages(max_chars=args.max_chars)
    epub_page_texts = [p.get_page_text() for p in epub_pages]

    # Pipeline B: Raw text path similar to .txt flow.
    raw_text = _flatten_epub_text(epub_doc)
    raw_pages = segmenter.split_pages(raw_text, max_chars=args.max_chars)

    header = [
        "===== INPUT =====",
        f"epub={args.epub}",
        f"title={epub_doc.title!r}",
        f"author={epub_doc.author!r}",
        f"lang={args.lang}",
        f"sections={len(epub_doc.sections)}",
        f"images={len(epub_doc.images)}",
        f"epub_pipeline_pages={len(epub_page_texts)}",
        f"raw_pipeline_pages={len(raw_pages)}",
        f"raw_text_chars={len(raw_text)}",
    ]
    header_report = "\n".join(header)
    print(header_report)

    report_epub = _print_report(
        label="PIPELINE A: EpubDocument.build_pages -> token spaces",
        pages=epub_page_texts,
        segmenter=segmenter,
        page_limit=args.page_limit,
        max_examples=args.max_examples,
    )
    report_raw = _print_report(
        label="PIPELINE B: flattened raw text -> Segmenter.split_pages -> token spaces",
        pages=raw_pages,
        segmenter=segmenter,
        page_limit=args.page_limit,
        max_examples=args.max_examples,
    )

    if args.out:
        args.out.parent.mkdir(parents=True, exist_ok=True)
        args.out.write_text(
            "\n\n".join([header_report, report_epub, report_raw]),
            encoding="utf-8",
        )
        print(f"\nreport_saved={args.out}")

    return 0


if __name__ == "__main__":
    raise SystemExit(main())
