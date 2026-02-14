from pydantic import BaseModel, ConfigDict
from sqlalchemy import BigInteger, ForeignKey, Text, DateTime, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime

from api.database.db import Base


class PageTranslation(Base):
    """
    
    
    Parameters:
    
    """
    __tablename__ = "page_translations"

    # -------------------------
    # Page Translation ID / Document Page ID
    # -------------------------
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
    # Source / Target Languages
    # -------------------------
    src_lang: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    tgt_lang: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    # -------------------------
    # Translation / Alignment Data
    # -------------------------
    translated_text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    alignment_data: Mapped[dict] = mapped_column(
        JSONB,
        nullable=False,
    )

    # -------------------------
    # Translation Save Time
    # -------------------------
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
