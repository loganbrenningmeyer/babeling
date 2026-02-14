from sqlalchemy import BigInteger, Integer, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime

from api.database.db import Base


class Glossary(Base):
    """
    
    
    Parameters:
    
    """
    __tablename__ = "glossaries"

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
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
        nullable=False,
    )
    ipa: Mapped[str] = mapped_column(
        Text,
        nullable=False,
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