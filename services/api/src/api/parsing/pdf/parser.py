import math
import mimetypes
from pathlib import Path
from typing import Any

from .document import PdfBlock, PdfDocument, PdfImage, PdfPage, PdfSection

FALLBACK_IMAGE_RENDER_SCALE = 2.0
IMAGE_ASPECT_RATIO_TOLERANCE = 0.02


class PdfParser:
    """
    PDF parsing strategy:
    - Read the PDF with PyMuPDF
    - Use embedded metadata for title / author / language when present
    - Use PDF bookmarks (TOC) as section boundaries when available
    - Use `page.get_text("dict", sort=True)` for ordered text / image blocks
    - Keep a minimal document model that matches Babeling's page / block structure
    """

    def __init__(self):
        pass

    def build_document(
        self,
        *,
        pdf_bytes: bytes | None = None,
        pdf_path: str | Path | None = None,
    ) -> PdfDocument | None:
        """
        1) Read PDF with PyMuPDF
        2) Extract metadata / sections / pages / images
        3) Build PdfDocument dataclass
        """
        fitz = self._load_fitz()

        if pdf_bytes is not None:
            doc = fitz.open(stream=pdf_bytes, filetype="pdf")
            pdf_name = None
        elif pdf_path is not None:
            doc = fitz.open(pdf_path)
            pdf_name = Path(pdf_path).name
        else:
            return None

        try:
            # -------------------------
            # Metadata
            # -------------------------
            metadata = doc.metadata or {}
            title = self.get_metadata(metadata, "title") or self._fallback_title(pdf_path)
            author = self.get_metadata(metadata, "author")
            language = self.get_metadata(metadata, "language")
            cover_bytes, cover_media_type = self.render_cover_image(doc=doc, fitz=fitz)

            # -------------------------
            # Sections
            # -------------------------
            raw_sections = self.build_sections_from_toc(
                doc.get_toc(simple=True),
                page_count=doc.page_count,
                fallback_title=title or pdf_name or "PDF",
            )

            # -------------------------
            # Pages / Images
            # -------------------------
            pages: list[PdfPage] = []
            images: dict[str, PdfImage] = {}

            for page_index in range(doc.page_count):
                page = doc.load_page(page_index)
                section = self.pick_section_for_page(page.number + 1, raw_sections)

                blocks, page_images = self.extract_page_blocks(
                    doc=doc,
                    page=page,
                )

                for image_key, image in page_images.items():
                    images[image_key] = image

                pages.append(
                    PdfPage(
                        page_number=page.number + 1,
                        section_key=section["key"],
                        section_title=section["title"],
                        section_page_index=(page.number + 1) - section["first_page_number"],
                        blocks=tuple(blocks),
                    )
                )

            # -------------------------
            # Convert sections into typed PdfSection objects
            # -------------------------
            sections = [
                PdfSection(
                    title=section["title"],
                    key=section["key"],
                    order_index=section["order_index"],
                    first_page_number=section["first_page_number"],
                    last_page_number=section["last_page_number"],
                    depth=section["depth"],
                    parent_title=section.get("parent_title"),
                    parent_key=section.get("parent_key"),
                )
                for section in raw_sections
            ]

            return PdfDocument(
                title=title,
                author=author,
                language=language,
                cover_bytes=cover_bytes,
                cover_media_type=cover_media_type,
                sections=sections,
                pages=pages,
                images=images,
            )
        finally:
            doc.close()

    def get_metadata(self, metadata: dict[str, Any], label: str) -> str | None:
        """
        Returns normalized PDF metadata value if present
        """
        value = metadata.get(label)
        if value is None:
            return None

        text = str(value).strip()
        return text or None

    def build_sections_from_toc(
        self,
        toc: list[list[Any]],
        *,
        page_count: int,
        fallback_title: str,
    ) -> list[dict[str, Any]]:
        """
        Converts PDF TOC rows into section ranges
        """
        if not toc:
            return [
                {
                    "title": fallback_title,
                    "key": "pdf:root",
                    "depth": 0,
                    "parent_title": None,
                    "parent_key": None,
                    "order_index": 0,
                    "first_page_number": 1,
                    "last_page_number": max(1, page_count),
                }
            ]

        sections: list[dict[str, Any]] = []
        key_by_depth: dict[int, str] = {}
        title_by_depth: dict[int, str] = {}

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

            section_key = f"toc:{index + 1}:{first_page_number}"
            parent_key = key_by_depth.get(level - 1)
            parent_title = title_by_depth.get(level - 1)

            key_by_depth[level] = section_key
            title_by_depth[level] = title

            for depth in list(key_by_depth):
                if depth > level:
                    del key_by_depth[depth]

            for depth in list(title_by_depth):
                if depth > level:
                    del title_by_depth[depth]

            sections.append(
                {
                    "title": title,
                    "key": section_key,
                    "depth": level - 1,
                    "parent_title": parent_title,
                    "parent_key": parent_key,
                    "order_index": index,
                    "first_page_number": first_page_number,
                    "last_page_number": last_page_number,
                }
            )

        return sections

    def pick_section_for_page(
        self,
        page_number: int,
        sections: list[dict[str, Any]],
    ) -> dict[str, Any]:
        """
        Returns the deepest matching section for a page number
        """
        matching = [
            section
            for section in sections
            if section["first_page_number"] <= page_number <= section["last_page_number"]
        ]

        if not matching:
            return {
                "title": "PDF",
                "key": "pdf:root",
                "depth": 0,
                "parent_title": None,
                "parent_key": None,
                "order_index": 0,
                "first_page_number": 1,
                "last_page_number": page_number,
            }

        matching.sort(key=lambda section: (section["depth"], section["order_index"]))
        return matching[-1]

    def extract_page_blocks(
        self,
        *,
        doc,
        page,
    ) -> tuple[list[PdfBlock], dict[str, PdfImage]]:
        """
        Extracts ordered page blocks from PyMuPDF
        """
        layout = page.get_text("dict", sort=True)
        raw_blocks = layout.get("blocks", [])

        blocks: list[PdfBlock] = []
        images: dict[str, PdfImage] = {}

        for block_index, raw_block in enumerate(raw_blocks):
            block_type = int(raw_block.get("type", -1))
            bbox = self._round_bbox(raw_block.get("bbox", (0, 0, 0, 0)))

            # -------------------------
            # Text blocks
            # -------------------------
            if block_type == 0:
                text = self.extract_text_from_block(raw_block)
                if not text:
                    continue

                blocks.append(
                    PdfBlock(
                        type="text",
                        block_index=block_index,
                        bbox=bbox,
                        tag="p",
                        text=text,
                    )
                )
                continue

            # -------------------------
            # Image blocks
            # -------------------------
            if block_type == 1:
                try:
                    image = self.extract_image(
                        doc=doc,
                        page=page,
                        page_number=page.number + 1,
                        block_index=block_index,
                        block=raw_block,
                    )
                except Exception as exc:
                    print(
                        f"Skipping PDF image block on page {page.number + 1}, block {block_index}: {exc}",
                        flush=False,
                    )
                    continue

                if image is None:
                    continue

                images[image.image_key] = image
                blocks.append(
                    PdfBlock(
                        type="image",
                        block_index=block_index,
                        bbox=bbox,
                        image_key=image.image_key,
                        alt=raw_block.get("alt"),
                    )
                )

        return blocks, images

    def extract_text_from_block(self, block: dict[str, Any]) -> str:
        """
        Collects text from PyMuPDF line / span dictionaries
        """
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

    def extract_image(
        self,
        doc,
        page,
        page_number: int,
        block_index: int,
        block: dict[str, Any],
    ) -> PdfImage | None:
        bbox = block.get("bbox")
        if not bbox or len(bbox) != 4:
            return None

        try:
            x0, y0, x1, y1 = (float(value) for value in bbox)
        except (TypeError, ValueError):
            return None

        if not all(math.isfinite(value) for value in (x0, y0, x1, y1)):
            return None

        if x1 <= x0 or y1 <= y0:
            return None

        page_rect = page.rect
        clipped_bbox = (
            max(x0, page_rect.x0),
            max(y0, page_rect.y0),
            min(x1, page_rect.x1),
            min(y1, page_rect.y1),
        )

        if clipped_bbox[2] <= clipped_bbox[0] or clipped_bbox[3] <= clipped_bbox[1]:
            return None

        rect = self._load_fitz().Rect(clipped_bbox)
        embedded_image = self._extract_embedded_image(
            doc=doc,
            page_number=page_number,
            block_index=block_index,
            block=block,
            bbox=clipped_bbox,
        )
        if embedded_image is not None:
            return embedded_image

        pix = page.get_pixmap(
            clip=rect,
            matrix=self._load_fitz().Matrix(
                FALLBACK_IMAGE_RENDER_SCALE,
                FALLBACK_IMAGE_RENDER_SCALE,
            ),
            alpha=False,
        )

        if pix.width <= 0 or pix.height <= 0:
            return None

        image_bytes = pix.tobytes("png")
        if not image_bytes:
            return None

        image_key = f"page:{page_number}:block:{block_index}"

        return PdfImage(
            image_key=image_key,
            href=image_key,
            media_type="image/png",
            byte_length=len(image_bytes),
            data=image_bytes,
        )

    def _extract_embedded_image(
        self,
        *,
        doc,
        page_number: int,
        block_index: int,
        block: dict[str, Any],
        bbox: tuple[float, float, float, float],
    ) -> PdfImage | None:
        if not self._block_matches_embedded_aspect_ratio(block, bbox):
            return None

        xref = self._parse_positive_int(block.get("xref"))
        if xref is not None:
            try:
                extracted = doc.extract_image(xref)
            except Exception:
                extracted = None

            if extracted:
                image_bytes = extracted.get("image")
                if image_bytes:
                    ext = extracted.get("ext")
                    image_key = f"xref:{xref}"
                    return PdfImage(
                        image_key=image_key,
                        href=image_key,
                        media_type=self._guess_media_type(ext),
                        byte_length=len(image_bytes),
                        data=image_bytes,
                    )

        raw_image_bytes = block.get("image")
        if isinstance(raw_image_bytes, (bytes, bytearray)) and raw_image_bytes:
            ext = block.get("ext")
            image_key = f"page:{page_number}:block:{block_index}:embedded"
            return PdfImage(
                image_key=image_key,
                href=image_key,
                media_type=self._guess_media_type(str(ext) if ext else None),
                byte_length=len(raw_image_bytes),
                data=bytes(raw_image_bytes),
            )

        return None

    def _block_matches_embedded_aspect_ratio(
        self,
        block: dict[str, Any],
        bbox: tuple[float, float, float, float],
    ) -> bool:
        source_width = self._parse_positive_float(block.get("width"))
        source_height = self._parse_positive_float(block.get("height"))
        if source_width is None or source_height is None:
            return True

        bbox_width = max(float(bbox[2] - bbox[0]), 0.0)
        bbox_height = max(float(bbox[3] - bbox[1]), 0.0)
        if bbox_width <= 0 or bbox_height <= 0:
            return False

        source_ratio = source_width / source_height
        bbox_ratio = bbox_width / bbox_height

        return abs(source_ratio - bbox_ratio) <= IMAGE_ASPECT_RATIO_TOLERANCE

    def _parse_positive_int(self, value: Any) -> int | None:
        try:
            parsed = int(value)
        except (TypeError, ValueError):
            return None
        return parsed if parsed > 0 else None

    def _parse_positive_float(self, value: Any) -> float | None:
        try:
            parsed = float(value)
        except (TypeError, ValueError):
            return None
        return parsed if parsed > 0 else None

    def render_cover_image(
        self,
        *,
        doc,
        fitz,
    ) -> tuple[bytes | None, str | None]:
        """
        Renders a lightweight snapshot of the first PDF page for use as a cover
        """
        if doc.page_count == 0:
            return None, None

        try:
            first_page = doc.load_page(0)
            pix = first_page.get_pixmap(
                matrix=fitz.Matrix(0.6, 0.6),
                alpha=False,
            )
            if pix.width <= 0 or pix.height <= 0:
                return None, None

            image_bytes = pix.tobytes("png")
            if not image_bytes:
                return None, None

            return image_bytes, "image/png"
        except Exception as exc:
            print(f"Skipping PDF cover render: {exc}", flush=False)
            return None, None

    def _fallback_title(self, pdf_path: str | Path | None) -> str | None:
        """
        Returns fallback title from filename
        """
        if pdf_path is None:
            return None

        stem = Path(pdf_path).stem.replace("_", " ").replace("-", " ").strip()
        return stem or "Untitled PDF"

    def _guess_media_type(self, ext: str | None) -> str | None:
        """
        Guesses media type from image extension
        """
        if not ext:
            return None

        media_type, _ = mimetypes.guess_type(f"image.{ext}")
        return media_type

    def _round_bbox(
        self,
        bbox: tuple[float, float, float, float] | list[float],
    ) -> tuple[float, float, float, float]:
        return tuple(round(float(value), 2) for value in bbox)

    def _load_fitz(self):
        try:
            import fitz  # type: ignore
        except ImportError as exc:
            raise RuntimeError(
                "PyMuPDF is required for PDF parsing. Install it with: pip install pymupdf"
            ) from exc

        return fitz
