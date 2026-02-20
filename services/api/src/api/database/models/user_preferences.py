from sqlalchemy import ForeignKey, Text, text, CheckConstraint
from sqlalchemy.orm import Mapped, mapped_column

from api.database.db import Base


class UserPreferences(Base):
    """
    
    
    Parameters:
    
    """
    __tablename__ = "user_preferences"
    # -------------------------
    # Enforce src != tgt
    # -- If either is NULL, allow it (user hasn't set yet)
    # -------------------------
    __table_args__ = (
        CheckConstraint(
            "preferred_src_lang IS NULL "
            "OR preferred_tgt_lang IS NULL "
            "OR preferred_src_lang <> preferred_tgt_lang",
            name="ck_user_preferences_src_tgt_no_same",
        ),
    )

    # -------------------------
    # App User ID
    # -------------------------
    user_id: Mapped[int] = mapped_column(
        ForeignKey("app_users.id"),
        primary_key=True,
    )

    # -------------------------
    # Preferred translation languages
    # -- Null initially, persists once initial translation or set in preferences
    # -------------------------
    preferred_src_lang: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )
    preferred_tgt_lang: Mapped[str | None] = mapped_column(
        Text,
        nullable=True,
    )

    # -------------------------
    # Preferred UI language
    # -- Language for all UI components / definitions / explanations, etc.
    # -------------------------
    preferred_ui_lang: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        server_default=text("'en'"),
    )

    # -------------------------
    # UI theme
    # -- Defaults to system theme
    # -------------------------
    theme: Mapped[str] = mapped_column(
        Text,
        nullable=False,
        server_default=text("'system'"),
    )