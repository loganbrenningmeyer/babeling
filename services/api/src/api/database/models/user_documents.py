from sqlalchemy import Integer, BigInteger, DateTime, ForeignKey, Text, UniqueConstraint, func
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime

from api.database.db import Base


class UserDocuments(Base):
    """
    
    
    Parameters:
    
    """
    __tablename__ = "user_documents"
    __table_args__ = (
        UniqueConstraint("user_id", "document_id", name="uq_user_documents_user_document"),
    )

    # -------------------------
    # User Document ID / App User Id / Document ID
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
    document_id: Mapped[int] = mapped_column(
        ForeignKey("documents.id"),
        index=True,
        nullable=False,
    )

    # -------------------------
    # Metadata
    # -------------------------
    added_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )
    last_opened_at: Mapped[datetime] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False,
    )