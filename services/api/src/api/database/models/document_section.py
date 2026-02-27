from datetime import datetime
from sqlalchemy import (
    BigInteger,
    DateTime,
    ForeignKey,
    Integer,
    Text,
    UniqueConstraint,
    CheckConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column
from api.database.db import Base


class DocumentSection(Base):
    __tablename__ = "document_sections"
    __table_args__ = (
        UniqueConstraint("document_id", "section_key", name="uq_doc_sections_doc_key"),
        UniqueConstraint("document_id", "order_index", name="uq_doc_sections_doc_order"),
        CheckConstraint("depth >= 0", name="ck_doc_sections_depth_nonneg"),
        CheckConstraint("first_page_number >= 1", name="ck_doc_sections_first_page_pos"),
        CheckConstraint("last_page_number >= first_page_number", name="ck_doc_sections_page_range"),
    )

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )
    document_id: Mapped[int] = mapped_column(
        ForeignKey("documents.id"),
        index=True,
        nullable=False,
    )

    # -------------------------
    # Section Navigation / Information
    # -------------------------
    # -- Stable key from parser, e.g. "OEBPS/ch1.xhtml#frag123"
    section_key: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    title: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    # -- Nesting depth for indented TOC
    depth: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
        server_default="0",
    )
    # -- DocumentSection ID of parent for nested TOC
    parent_section_id: Mapped[int | None] = mapped_column(
        ForeignKey("document_sections.id"),
        index=True,
        nullable=True,
    )
    # -- Reading order (defined by spine/TOC)
    order_index: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    # -------------------------
    # Page bounds for fast navigation
    # -------------------------
    first_page_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    last_page_number: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
