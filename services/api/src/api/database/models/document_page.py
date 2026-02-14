from sqlalchemy import Integer, BigInteger, ForeignKey, Text, UniqueConstraint
from sqlalchemy.orm import Mapped, mapped_column

from api.database.db import Base


class DocumentPage(Base):
    """
    
    
    Parameters:
    
    """
    __tablename__ = "document_pages"
    
    # -------------------------
    # Page ID / Document ID / Page Number
    # -------------------------
    id: Mapped[int] = mapped_column(
        BigInteger,
        primary_key=True,
        autoincrement=True,
    )
    document_id: Mapped[int] = mapped_column(
        ForeignKey("documents.id"),
        index=True,
        nullable=False,
    )
    page_number: Mapped[int] = mapped_column(
        Integer,
        index=True,
        nullable=False,
    )

    # -------------------------
    # Page Source Text
    # -------------------------
    source_text: Mapped[str] = mapped_column(
        Text,
        nullable=False,
    )
