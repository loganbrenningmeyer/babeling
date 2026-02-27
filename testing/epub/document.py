from dataclasses import dataclass, field
from pathlib import Path
from typing import Optional, Literal, Iterable

BlockType = Literal["text", "image"]


@dataclass(frozen=True)
class EpubBlock:
    type: BlockType
    # -- text
    tag: Optional[str] = None
    text: Optional[str] = None
    # -- image
    image_key: Optional[str] = None
    alt: Optional[str] = None

@dataclass(frozen=True)
class EpubImage:
    image_key: str
    href: str
    media_type: Optional[str]
    byte_length: int
    data: Optional[bytes] = None

@dataclass(frozen=True)
class EpubSection:
    title: str
    path: str
    fragment: Optional[str]
    spine_id: str
    blocks: tuple[EpubBlock, ...]
    depth: int = 0
    parent_title: Optional[str] = None
    parent_key: Optional[str] = None

    @property
    def key(self) -> str:
        return f"{self.path}#{self.fragment or ''}"
    
@dataclass
class EpubPage:
    section_key: str
    section_title: str
    page_index: int
    blocks: tuple[EpubBlock, ...]

    def get_page_text(self) -> str:
        """
        Builds full page text from page blocks (each block as a paragraph)
        """
        text = [b.text for b in self.blocks if b.type == "text"]
        return "\n\n".join(text)

@dataclass
class EpubDocument:
    # -- Document-level info
    title: Optional[str]
    author: Optional[str]
    language: Optional[str]
    # -- Cover image
    cover_bytes: Optional[bytes] = None
    cover_media_type: Optional[str] = None
    # -- Normalized content
    sections: list[EpubSection] = field(default_factory=list)
    # -- Images
    images: dict[str, EpubImage] = field(default_factory=dict)


    def iter_content_sections(self) -> Iterable[EpubSection]:
        """
        Returns iterable of EpubSections, skipping empty sections / front matter
        """
        for s in self.sections:
            if not s.blocks:
                continue
            if self._is_front_matter_title(s.title):
                continue
            yield s

    def iter_content_blocks(self) -> Iterable[EpubBlock]:
        """
        Returns iterable of EpubBlocks
        """
        for s in self.sections:
            if not s.blocks:
                continue
            if self._is_front_matter_title(s.title):
                continue
            for b in s.blocks:
                yield b

    def first_readable_section(self) -> Optional[EpubSection]:
        """
        Returns first readable content section in document
        """
        return next(iter(self.iter_content_sections()), None)
    
    def build_pages(self, max_chars: int = 1800) -> list[EpubPage]:
        """
        Returns list of EpubPages paginated by packing section blocks
        until max_chars.
        Preserves block boundaries (no mid-paragraph splitting)
        """
        pages: list[EpubPage] = []

        for s in self.iter_content_sections():
            if not s.blocks:
                continue

            page_blocks: list[EpubBlock] = []
            cur_len = 0
            page_idx = 0

            for b_i, b in enumerate(s.blocks):
                if b.type == "text":
                    add = len(b.text) + 2
                else:
                    add = 0

                if page_blocks and cur_len + add > max_chars:
                    # -- Add final block
                    page_blocks.append(b)

                    # -- If second to last section block, add final block if small enough (< quarter of page size)
                    if b_i == len(s.blocks) - 2 and s.blocks[-1].text is not None:
                        if len(s.blocks[-1].text) < max_chars // 4:
                            page_blocks.append(s.blocks[-1])

                            pages.append(EpubPage(
                                section_key=s.key,
                                section_title=s.title,
                                page_index=page_idx,
                                blocks=tuple(page_blocks),
                            ))

                            page_idx += 1
                            page_blocks = []
                            cur_len = 0
                            break

                    page_idx += 1
                    page_blocks = []
                    cur_len = 0
                    continue

                page_blocks.append(b)
                cur_len += add

            if page_blocks:
                pages.append(EpubPage(
                    section_key=s.key,
                    section_title=s.title,
                    page_index=page_idx,
                    blocks=tuple(page_blocks),
                ))

        return pages
    
    def save_pages(self, out_path: Path | str, max_chars: int = 1800):
        # -- Build EpubPages
        pages = self.build_pages(max_chars)
        page_texts = [p.get_page_text() for p in pages]

        # -------------------------
        # Save to file
        # -------------------------
        Path(out_path).parent.mkdir(parents=True, exist_ok=True)

        with open(out_path, "w", encoding="utf-8") as f:
            for text in page_texts:
                f.write(f"{text}\n\n")

    @staticmethod
    def _is_front_matter_title(title: str) -> bool:
        """
        Checks if section title indicates it is front matter (not text content)
        """
        t = (title or "").strip().lower()
        if not t:
            return False
        
        keywords = (
            "cover",
            "title page",
            "contents",
            "table of contents",
            "copyright",
            "imprint",
            "colophon",
        )
        return any(k in t for k in keywords)


