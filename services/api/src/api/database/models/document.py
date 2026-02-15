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
        UniqueConstraint("user_id", "source_text_hash", name="uq_documents_user_text_hash"),
    )

    # -------------------------
    # Document ID / App User ID
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
    # Raw Source Text / Hash
    # -------------------------
    source_text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
    source_text_hash: Mapped[str] = mapped_column(
        String(64),
        index=True,
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