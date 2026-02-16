from sqlalchemy import BigInteger, DateTime, ForeignKey, Text, String, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime

from api.database.db import Base


class Document(Base):
    """
    
    
    Parameters:
    
    """
    __tablename__ = "documents"
    __table_args__ = (
        UniqueConstraint("user_id", "src_text_hash", name="uq_documents_user_text_hash"),
    )

    # -------------------------
    # Document ID / App User ID / Document Title
    # -------------------------
    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )
    user_id: Mapped[int] = mapped_column(
        ForeignKey("app_users.id"),
        index=True, 
        nullable=False,
    )
    title: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        server_default="'Untitled document'",
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

    # -------------------------
    # Document Save Time
    # -------------------------
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )