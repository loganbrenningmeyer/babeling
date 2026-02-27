from datetime import datetime
from sqlalchemy import (
    BigInteger,
    DateTime,
    ForeignKey,
    Integer,
    LargeBinary,
    String,
    Text,
    UniqueConstraint,
    func,
)
from sqlalchemy.orm import Mapped, mapped_column
from api.database.db import Base


class DocumentImage(Base):
    __tablename__ = "document_images"
    __table_args__ = (
        UniqueConstraint("document_id", "image_key", name="uq_document_images_doc_image"),
    )

    # -------------------------
    # DocumentImage ID / Document ID / EpubDocument Image ID (href)
    # -------------------------
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

    # -- Stable image_key set as href (e.g., "OEBPS/image767.jpg")
    image_key: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    href: Mapped[str] = mapped_column(
        Text,   
        nullable=False,
    )

    # -------------------------
    # Image Data
    # -------------------------
    media_type: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    byte_length: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    content_sha256: Mapped[str] = mapped_column(
        String(64),
        index=True,
        nullable=False,
    )
    data: Mapped[bytes] = mapped_column(
        LargeBinary,
        nullable=False,
    )

    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )


