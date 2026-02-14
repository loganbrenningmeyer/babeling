from sqlalchemy import BigInteger, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime

from api.database.db import Base


class Document(Base):
    """
    
    
    Parameters:
    
    """
    __tablename__ = "documents"

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
    # Raw Source Text
    # -------------------------
    source_text: Mapped[str] = mapped_column(
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