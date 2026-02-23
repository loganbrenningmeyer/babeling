# main.py
#
# Simple test harness for your EpubParser + EpubDocument that:
# - Builds the document
# - Prints metadata + cover info
# - Prints section/block previews showing where images appear in order
# - Verifies that image blocks reference entries in doc.images
# - Optionally writes a few images to disk so you can visually confirm placement
#
# Run (from the package root that contains this folder):
#   python -m testing.main
#
# Or if this file sits alongside parser.py/document.py in a package:
#   python -m <your_package>.main

from __future__ import annotations

from pathlib import Path
import re

from .parser import EpubParser


def _safe_snip(s: str | None, n: int = 140) -> str:
    if not s:
        return ""
    s = re.sub(r"\s+", " ", s).strip()
    return (s[:n] + "…") if len(s) > n else s


def _guess_ext(href: str, media_type: str | None) -> str:
    # Prefer extension from href if present
    ext = Path(href).suffix.lower()
    if ext:
        return ext
    # Otherwise guess from media type
    if media_type == "image/jpeg":
        return ".jpg"
    if media_type == "image/png":
        return ".png"
    if media_type == "image/gif":
        return ".gif"
    if media_type == "image/svg+xml":
        return ".svg"
    return ".bin"


def _print_doc_summary(doc) -> None:
    print("=" * 80)
    print("DOCUMENT SUMMARY")
    print("-" * 80)
    print(f"title:    {doc.title!r}")
    print(f"author:   {doc.author!r}")
    print(f"language: {doc.language!r}")
    print(f"sections: {len(doc.sections)}")
    print(f"images:   {len(doc.images) if isinstance(doc.images, dict) else '(!) doc.images is not a dict'}")

    if doc.cover_bytes:
        print(f"cover:    {len(doc.cover_bytes)} bytes ({doc.cover_media_type})")
    else:
        print("cover:    None")
    print("=" * 80)


def _print_section_preview(doc, max_sections: int = 6, max_blocks: int = 18) -> None:
    print("\nSECTION / BLOCK PREVIEW")
    print("-" * 80)

    missing_images = 0
    total_img_blocks = 0

    for si, sec in enumerate(doc.sections[:max_sections]):
        print("\n" + ("#" * 80))
        print(f"[section {si}] {sec.title!r}")
        print(f"  key:     {sec.key}")
        print(f"  spine_id:{sec.spine_id!r}")
        print(f"  path:    {sec.path!r}")
        print(f"  fragment:{sec.fragment!r}")
        print(f"  blocks:  {len(sec.blocks)}")

        for bi, b in enumerate(sec.blocks[:max_blocks]):
            if b.type == "text":
                print(f"    - TEXT  <{b.tag}> {_safe_snip(b.text)}")
            elif b.type == "image":
                total_img_blocks += 1
                img = doc.images.get(b.image_id) if isinstance(doc.images, dict) else None
                if img is None:
                    missing_images += 1
                    print(f"    - IMAGE id={b.image_id!r}  (MISSING in doc.images!) alt={b.alt!r}")
                else:
                    print(
                        f"    - IMAGE id={b.image_id!r} href={img.href!r} "
                        f"type={img.media_type!r} bytes={len(img.bytes)} alt={b.alt!r}"
                    )
            else:
                print(f"    - UNKNOWN block: {b}")

        if len(sec.blocks) > max_blocks:
            print(f"    ... ({len(sec.blocks) - max_blocks} more blocks)")

    print("\n" + "-" * 80)
    print(f"Total IMAGE blocks seen in preview: {total_img_blocks}")
    if missing_images:
        print(f"WARNING: {missing_images} image blocks referenced IDs not found in doc.images.")
        print("This usually means your build_document() didn't add images correctly, or image_id mismatched.")
    print("-" * 80)


def _slug_filename(s: str) -> str:
    # Replace path separators + other annoying characters
    s = s.replace("\\", "_").replace("/", "_").replace(":", "_")
    s = re.sub(r"[^A-Za-z0-9._-]+", "_", s)
    return s.strip("_")


def _dump_images(doc, out_dir: Path, limit: int = 10) -> None:
    """
    Write the first N images from doc.images to disk so you can inspect them.
    """
    if not isinstance(doc.images, dict) or not doc.images:
        print("\nNo images to dump (doc.images empty or not a dict).")
        return

    out_dir.mkdir(parents=True, exist_ok=True)

    print(f"\nDUMPING UP TO {limit} IMAGES -> {out_dir}")
    print("-" * 80)

    for i, (image_id, img) in enumerate(list(doc.images.items())[:limit]):
        ext = _guess_ext(img.href, img.media_type)

        # Make all filename parts safe
        href_stem = _slug_filename(Path(img.href).stem)
        id_snip = _slug_filename(image_id)[:24]  # safe snippet

        fname = f"{i:03d}_{href_stem}_{id_snip}{ext}"
        fpath = out_dir / fname
        fpath.write_bytes(img.bytes)

        print(f"[{i}] {image_id}  ->  {fpath}   ({img.media_type}, {len(img.bytes)} bytes)")

    print("-" * 80)


def _check_common_pitfalls(doc) -> None:
    """
    Your current code has a couple likely pitfalls; this prints actionable warnings.
    """
    print("\nSANITY CHECKS")
    print("-" * 80)

    # 1) doc.images default_factory in document.py should be dict, not list
    if not isinstance(doc.images, dict):
        print("WARNING: doc.images is not a dict. In document.py you likely have:")
        print("  images: dict[str, EpubImage] = field(default_factory=list)")
        print("Change to:")
        print("  images: dict[str, EpubImage] = field(default_factory=dict)")
        print()

    # 2) build_document() has a typo: type='iamge'
    # If that typo exists, image blocks won't be recognized as type='image'
    bad_type_count = 0
    img_type_count = 0
    for sec in doc.sections:
        for b in sec.blocks:
            if b.type == "image":
                img_type_count += 1
            if b.type not in ("text", "image"):
                bad_type_count += 1

    if bad_type_count:
        print(f"WARNING: Found {bad_type_count} blocks with unexpected type values.")
        print("In parser.py build_document(), ensure you use type='image' (not 'iamge' / 'iamge').")
        print()

    if img_type_count == 0 and isinstance(doc.images, dict) and len(doc.images) > 0:
        print("WARNING: doc.images has images, but no blocks have type='image'.")
        print("This strongly suggests the 'type' typo in build_document() when creating EpubBlock.")
        print()

    # 3) Paging helpers assume text blocks; image blocks have text=None
    # We'll just warn if there are image blocks.
    if img_type_count > 0:
        print("NOTE: Your EpubDocument.build_pages() currently does:")
        print("  add = len(b.text) + 2")
        print("This will crash on image blocks (b.text is None).")
        print("Fix by handling images separately, e.g.:")
        print("  if b.type == 'text': add = len(b.text or '') + 2")
        print("  else: add = 0 (or some weight)")
        print()

    print("Done.")
    print("-" * 80)


def main():
    epub_name = "the-jungle-book"
    epub_path = Path(f"testing/{epub_name}.epub")  # change as needed
    out_dir = Path(f"testing/_epub_image_dump/{epub_name}")

    parser = EpubParser()
    doc = parser.build_document(epub_path)

    _print_doc_summary(doc)
    _check_common_pitfalls(doc)
    _print_section_preview(doc, max_sections=6, max_blocks=18)
    _dump_images(doc, out_dir=out_dir, limit=12)


if __name__ == "__main__":
    main()