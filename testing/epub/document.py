from dataclasses import dataclass, field
from typing import Optional, Literal, Iterable

BlockType = Literal["text", "image"]


@dataclass(frozen=True)
class EpubBlock:
    type: BlockType
    # -- text
    tag: Optional[str] = None
    text: Optional[str] = None
    # -- image
    image_id: Optional[str] = None
    alt: Optional[str] = None

@dataclass(frozen=True)
class EpubImage:
    image_id: str
    href: str
    media_type: Optional[str]
    bytes: bytes

@dataclass(frozen=True)
class EpubSection:
    title: str
    path: str
    fragment: Optional[str]
    spine_id: str
    blocks: tuple[EpubBlock, ...]

    @property
    def key(self) -> str:
        return f"{self.path}#{self.fragment or ''}"
    
@dataclass
class EpubPage:
    section_key: str
    section_title: str
    page_index: int
    blocks: tuple[EpubBlock, ...]

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
    images: dict[str, EpubImage] = field(default_factory=list)


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

    def first_readable_section(self) -> Optional[EpubSection]:
        """
        Returns first readable content section in document
        """
        return next(iter(self.iter_content_sections()), None)
    
    def build_pages(self, max_chars: int = 4500) -> list[EpubPage]:
        """
        Returns list of EpubPages paginated by packing section blocks
        until max_chars.
        Preserves block boundaries (no mid-paragraph splitting)
        """
        pages: list[EpubPage] = []

        for s in self.iter_content_sections():
            page_blocks: list[EpubBlock] = []
            cur_len = 0
            page_idx = 0

            for b in s.blocks:
                if b.type == "text":
                    add = len(b.text) + 2
                else:
                    add = 0

                if page_blocks and cur_len + add > max_chars:
                    pages.append(EpubPage(
                        section_key=s.key,
                        section_title=s.title,
                        page_index=page_idx,
                        blocks=page_blocks,
                    ))
                    
                    page_idx += 1
                    page_blocks = []
                    cur_len = 0

                page_blocks.append(b)
                cur_len += add

            if page_blocks:
                pages.append(EpubPage(
                    section_key=s.key,
                    section_title=s.title,
                    page_index=page_idx,
                    blocks=page_blocks,
                ))

        return pages

    def get_page_text(self, page: EpubPage) -> str:
        """
        Builds full page text from page blocks (each block as a paragraph)
        """
        text = [b.text for b in page.blocks]
        return "\n\n".join(text)

    @staticmethod
    def _is_front_matter_title(title: str) -> bool:
        """
        Checks if section title indicates it is front matter (not text content)
        """
        t = (title or "").strip().lower()
        return (
            t in {"cover", "title page"}
            or "contents" in t
            or "table of conents" in t
            or "copyright" in t
        )


