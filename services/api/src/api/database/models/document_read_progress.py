from sqlalchemy import Integer, BigInteger, DateTime, Float, ForeignKey, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime

from api.database.db import Base


class DocumentReadProgress(Base):
    """
    
    
    Parameters:
    
    """
    __tablename__ = "document_read_progress"
    __table_args__ = (
        UniqueConstraint("user_id", "document_id", "tgt_lang", name="uq_read_progress_user_document_tgt_lang"),
    )

    # -------------------------
    # Read Progress ID
    # -------------------------
    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )

    # -------------------------
    # App User ID / Document ID / Target Language
    # -------------------------
    user_id: Mapped[int] = mapped_column(
        ForeignKey("app_users.id"),
        index=True,
        nullable=False,
    )
    document_id: Mapped[int] = mapped_column(
        ForeignKey("documents.id"),
        index=True,
        nullable=False,
    )
    tgt_lang: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    # -------------------------
    # Progress Fields
    # -------------------------
    current_page_number: Mapped[int] = mapped_column(
        Integer,
        server_default="1",
        nullable=False,
    )
    completion_percent: Mapped[int] = mapped_column(
        Integer,
        server_default="0",
        nullable=False,
    )

    started_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    last_read_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    completed_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        nullable=True,
    )
