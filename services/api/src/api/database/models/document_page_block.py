import enum
from datetime import datetime
from sqlalchemy import (
    BigInteger,
    DateTime,
    ForeignKey,
    Integer,
    String,
    Text,
    UniqueConstraint,
    CheckConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column
from api.database.db import Base


class PageBlockType(str, enum.Enum):
    TEXT = "text"
    IMAGE = "image"


class DocumentPageBlock(Base):
    __tablename__ = "document_page_blocks"
    __table_args__ = (
        UniqueConstraint("document_page_id", "block_index", name="uq_doc_page_blocks_page_index"),
        CheckConstraint(
            "(block_type = 'text' AND text IS NOT NULL AND document_image_id IS NULL) OR "
            "(block_type = 'image' AND text IS NULL AND document_image_id IS NOT NULL)",
            name="ck_doc_page_blocks_payload_shape",
        ),
        CheckConstraint(
            "(char_start IS NULL AND char_end IS NULL) OR "
            "(char_start >= 0 AND char_end >= char_start)",
            name="ck_doc_page_blocks_char_range",
        ),
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )
    document_page_id: Mapped[int] = mapped_column(
        ForeignKey("document_pages.id"),
        index=True,
        nullable=False,
    )

    # -------------------------
    # Block order / render information
    # -------------------------
    # -- Render order within a page
    block_index: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    # -- Data type: "text" | "image"
    block_type: Mapped[str] = mapped_column(
        String(16),
        nullable=False,
    )
    # -- Text block type, e.g. "p, h1, li, etc."
    tag: Mapped[str | None] = mapped_column(
        String(32),
        nullable=True,
    )
    # -- Raw block text
    text: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # -------------------------
    # Image blocks
    # -------------------------
    document_image_id: Mapped[int | None] = mapped_column(
        ForeignKey("document_images.id"),
        index=True,
        nullable=True,
    )
    alt: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # -------------------------
    # Optional mapping into document_pages.src_text for text spans
    # -------------------------
    char_start: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )
    char_end: Mapped[int | None] = mapped_column(
        Integer,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
