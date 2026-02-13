from sqlalchemy import BigInteger, DateTime, Text, func
from sqlalchemy.orm import Mapped, mapped_column

from api.database.db import Base


class AppUser(Base):
    """
    App user information
    
        id (BigInteger): App user ID
        clerk_user_id (Text): User ID for Clerk authentication
        created_at (DateTime): Time the user account was made
        last_seen_at (DateTime): Time the user last logged in
    """
    __tablename__ = "app_users"

    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True
    )

    clerk_user_id: Mapped[str] = mapped_column(
        Text,
        unique=True,
        index=True,
        nullable=False
    )

    created_at: Mapped[object] = mapped_column(
        DateTime(timezone=True),
        server_default=func.now(),
        nullable=False
    )

    last_seen_at: Mapped[object | None] = mapped_column(
        DateTime(timezone=True),
        nullable=True
    )