from sqlalchemy import BigInteger, Integer, DateTime, ForeignKey, Text, func
from sqlalchemy.dialects.postgresql import JSONB
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime
from typing import Any

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
    form: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    pos_form: Mapped[str] = mapped_column(
        Text,
        nullable=True,
    )
    ipa_form: Mapped[str] = mapped_column(
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
    pos_lemma: Mapped[str] = mapped_column(
        Text,
        nullable=True,
    )
    ipa_lemma: Mapped[str] = mapped_column(
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
    context_meaning: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
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
    src_sentence: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    src_paragraph: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    tgt_sentence: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    tgt_paragraph: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )

    # -------------------------
    # Tokenized alignment snapshot
    # -------------------------
    context_alignment: Mapped[dict[str, Any]] = mapped_column(
        JSONB,
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
