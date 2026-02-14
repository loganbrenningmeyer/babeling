from sqlalchemy import BigInteger, Integer, DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime

from api.database.db import Base


class GlossaryItem(Base):
    """
    
    
    Parameters:
    
    """
    __tablename__ = "glossary_items"

    # -------------------------
    # Glossary ID / App User ID
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

    # -------------------------
    # Clicked word info
    # -------------------------
    word: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    pos: Mapped[str] = mapped_column(
        Text,
        nullable=True,
    )
    ipa: Mapped[str] = mapped_column(
        Text,
        nullable=True,
    )

    # -------------------------
    # Lemma info
    # -------------------------
    lemma: Mapped[str] = mapped_column(
        Text,
        nullable=True,
    )
    lemma_pos: Mapped[str] = mapped_column(
        Text,
        nullable=True,
    )
    lemma_ipa: Mapped[str] = mapped_column(
        Text,
        nullable=True,
    )

    # -------------------------
    # Definition (gloss) / Explanation / Examples
    # -------------------------
    gloss: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    explanation: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    examples: Mapped[list[dict]] = mapped_column(
        JSONB,
        nullable=False,
    )

    # -------------------------
    # Source / target languages
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
    # Document -> Word IDs
    # -------------------------
    document_id: Mapped[int] = mapped_column(
        ForeignKey("documents.id"),
        index=True,
        nullable=False,
    )
    page_id: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    par_id: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    sent_id: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )
    word_id: Mapped[int] = mapped_column(
        Integer,
        nullable=False,
    )

    # -------------------------
    # Sentence / Paragraph of Clicked Word
    # -------------------------
    sentence: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    paragraph: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    # -------------------------
    # Glossary Item Save Time
    # -------------------------
    created_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )