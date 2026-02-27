import enum
from datetime import datetime
from sqlalchemy import (
    BigInteger,
    Integer,
    DateTime,
    ForeignKey,
    Text,
    String,
    UniqueConstraint,
    CheckConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column
from api.database.db import Base


class DocumentSourceKind(str, enum.Enum):
    TXT = "txt"
    EPUB = "epub"


class Document(Base):
    """
    
    
    Parameters:
    
    """
    __tablename__ = "documents"
    __table_args__ = (
        # text-based dedupe
        UniqueConstraint("src_lang", "src_text_hash", name="uq_documents_text_hash"),
        # file-based dedupe (for epub uploads)
        UniqueConstraint("source_kind", "source_file_hash", name="uq_documents_file_hash"),
        CheckConstraint(
            "(source_kind = 'txt' AND source_file_hash IS NULL) OR "
            "(source_kind = 'epub' AND source_file_hash IS NOT NULL)",
            name="ck_documents_source_kind_file_hash",
        ),
    )

    # -------------------------
    # Document ID / Document Title
    # -------------------------
    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )
    title: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        server_default="'Untitled document'",
    )
    
    # -------------------------
    # Source File Information
    # -------------------------
    source_kind: Mapped[str] = mapped_column(
        String(16),
        nullable=False,
        server_default="'txt'",
    )
    source_filename: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    source_file_hash: Mapped[str | None] = mapped_column(
        String(64),
        index=True,
        nullable=True,
    )

    # -------------------------
    # Raw Source Text / Hash / Source Language
    # -------------------------
    src_text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    src_text_hash: Mapped[str] = mapped_column(
        String(64),
        index=True,
        nullable=False,
    )
    src_lang: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    total_pages: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    # -------------------------
    # Optional EPUB metadata
    # -------------------------
    epub_title: Mapped[str | None] = mapped_column(Text, nullable=True)
    epub_author: Mapped[str | None] = mapped_column(Text, nullable=True)
    epub_language: Mapped[str | None] = mapped_column(Text, nullable=True)

    # -------------------------
    # Cover Image ID: Maps to DocumentImage.id
    # -------------------------
    cover_image_id: Mapped[int | None] = mapped_column(
        BigInteger,
        ForeignKey(
            "document_images.id",
            name="fk_documents_cover_image_id",
            ondelete="SET NULL",
            use_alter=True,
        ),
        index=True,
        nullable=True,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )