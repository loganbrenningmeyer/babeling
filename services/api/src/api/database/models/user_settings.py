from sqlalchemy import BigInteger, DateTime, ForeignKey, Text, func
from sqlalchemy.orm import Mapped, mapped_column
from datetime import datetime

from api.database.db import Base


class UserSettings(Base):
    """
    
    
    Parameters:
    
    """
    __tablename__ = "user_settings"

    # -------------------------
    # App User ID
    # -------------------------
    user_id: Mapped[int] = mapped_column(
        ForeignKey("app_users.id"),
        primary_key=True,
    )

    preferred_src_lang: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    preferred_tgt_lang: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    preferred_ui_lang: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        server_default="'en'",
    )

    theme: Mapped[str | None] = mapped_column(Text)