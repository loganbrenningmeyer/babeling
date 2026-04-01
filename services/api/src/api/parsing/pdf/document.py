from dataclasses import dataclass, field
from typing import Iterable, Literal, Optional

BlockType = Literal["text", "image"]


@dataclass(frozen=True)
class PdfBlock:
    type: BlockType
    block_index: int
    bbox: tuple[float, float, float, float] | None = None
    # -- text
    tag: Optional[str] = None
    text: Optional[str] = None
    # -- image
    image_key: Optional[str] = None
    alt: Optional[str] = None


@dataclass(frozen=True)
class PdfImage:
    image_key: str
    href: str
    media_type: Optional[str]
    byte_length: int
    data: Optional[bytes] = None


@dataclass(frozen=True)
class PdfSection:
    title: str
    key: str
    order_index: int
    first_page_number: int
    last_page_number: int
    depth: int = 0
    parent_title: Optional[str] = None
    parent_key: Optional[str] = None


@dataclass
class PdfPage:
    page_number: int
    section_key: str
    section_title: str
    section_page_index: int
    blocks: tuple[PdfBlock, ...]

    def get_page_text(self) -> str:
        """
        Builds full page text from page blocks
        """
        text_blocks = [block.text for block in self.blocks if block.type == "text" and block.text]
        return "\n\n".join(text_blocks).strip()


@dataclass
class PdfDocument:
    title: Optional[str]
    author: Optional[str]
    language: Optional[str]
    cover_bytes: bytes | None = None
    cover_media_type: str | None = None
    sections: list[PdfSection] = field(default_factory=list)
    pages: list[PdfPage] = field(default_factory=list)
    images: dict[str, PdfImage] = field(default_factory=dict)

    def iter_content_pages(self) -> Iterable[PdfPage]:
        for page in self.pages:
            if not page.blocks:
                continue
            yield page

    def iter_content_blocks(self) -> Iterable[PdfBlock]:
        for page in self.iter_content_pages():
            for block in page.blocks:
                yield block

    def get_full_text(self) -> str:
        page_texts = [page.get_page_text() for page in self.iter_content_pages()]
        return "\n\n".join(text for text in page_texts if text).strip()
