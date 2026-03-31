import argparse

from sqlalchemy import delete, func, select, update

from api.database.db import SessionLocal
from api.database.models import (
    Document,
    DocumentImage,
    DocumentPage,
    DocumentPageBlock,
    DocumentReadProgress,
    DocumentSection,
    GlossaryItem,
    PageTranslation,
    UserDocuments,
)


def _delete_count(db, statement) -> int:
    result = db.execute(statement)
    return int(result.rowcount or 0)


def _count_rows(db, model, *criteria) -> int:
    statement = select(func.count()).select_from(model)
    if criteria:
        statement = statement.where(*criteria)
    return int(db.scalar(statement) or 0)


def _get_document_or_raise(db, document_id: int) -> Document:
    document = db.get(Document, document_id)
    if document is None:
        raise ValueError(f"No documents row found for document_id={document_id}")
    return document


def _get_document_page_ids(db, document_id: int) -> list[int]:
    return [
        int(page_id)
        for page_id in db.scalars(
            select(DocumentPage.id).where(DocumentPage.document_id == document_id)
        )
    ]


def _build_summary(db, document: Document) -> dict[str, int | str | None]:
    page_ids = _get_document_page_ids(db, document.id)

    summary: dict[str, int | str | None] = {
        "document_id": int(document.id),
        "title": document.title,
        "source_kind": document.source_kind,
        "src_lang": document.src_lang,
        "total_pages": int(document.total_pages),
        "cover_image_id": int(document.cover_image_id) if document.cover_image_id else None,
        "user_document_links_deleted": _count_rows(
            db,
            UserDocuments,
            UserDocuments.document_id == document.id,
        ),
        "read_progress_deleted": _count_rows(
            db,
            DocumentReadProgress,
            DocumentReadProgress.document_id == document.id,
        ),
        "glossary_items_deleted": _count_rows(
            db,
            GlossaryItem,
            GlossaryItem.document_id == document.id,
        ),
        "document_pages_deleted": len(page_ids),
        "document_sections_deleted": _count_rows(
            db,
            DocumentSection,
            DocumentSection.document_id == document.id,
        ),
        "document_images_deleted": _count_rows(
            db,
            DocumentImage,
            DocumentImage.document_id == document.id,
        ),
        "page_translations_deleted": 0,
        "document_page_blocks_deleted": 0,
        "documents_deleted": 1,
    }

    if page_ids:
        summary["page_translations_deleted"] = _count_rows(
            db,
            PageTranslation,
            PageTranslation.document_page_id.in_(page_ids),
        )
        summary["document_page_blocks_deleted"] = _count_rows(
            db,
            DocumentPageBlock,
            DocumentPageBlock.document_page_id.in_(page_ids),
        )

    return summary


def delete_document(document_id: int, *, execute: bool = False) -> dict[str, int | str | None]:
    with SessionLocal() as db:
        document = _get_document_or_raise(db, document_id)
        page_ids = _get_document_page_ids(db, document.id)
        summary = _build_summary(db, document)
        summary["committed"] = int(execute)

        if not execute:
            return summary

        try:
            if page_ids:
                summary["page_translations_deleted"] = _delete_count(
                    db,
                    delete(PageTranslation).where(
                        PageTranslation.document_page_id.in_(page_ids)
                    ),
                )
                summary["document_page_blocks_deleted"] = _delete_count(
                    db,
                    delete(DocumentPageBlock).where(
                        DocumentPageBlock.document_page_id.in_(page_ids)
                    ),
                )

            summary["glossary_items_deleted"] = _delete_count(
                db,
                delete(GlossaryItem).where(GlossaryItem.document_id == document.id),
            )
            summary["read_progress_deleted"] = _delete_count(
                db,
                delete(DocumentReadProgress).where(
                    DocumentReadProgress.document_id == document.id
                ),
            )
            summary["user_document_links_deleted"] = _delete_count(
                db,
                delete(UserDocuments).where(UserDocuments.document_id == document.id),
            )

            db.execute(
                update(Document)
                .where(Document.id == document.id)
                .values(cover_image_id=None)
            )

            summary["document_pages_deleted"] = _delete_count(
                db,
                delete(DocumentPage).where(DocumentPage.document_id == document.id),
            )
            summary["document_sections_deleted"] = _delete_count(
                db,
                delete(DocumentSection).where(DocumentSection.document_id == document.id),
            )
            summary["document_images_deleted"] = _delete_count(
                db,
                delete(DocumentImage).where(DocumentImage.document_id == document.id),
            )
            summary["documents_deleted"] = _delete_count(
                db,
                delete(Document).where(Document.id == document.id),
            )
            db.commit()
        except Exception:
            db.rollback()
            raise

        return summary


def _parse_args() -> argparse.Namespace:
    parser = argparse.ArgumentParser(
        description=(
            "Delete a document and all dependent rows. "
            "Runs in dry-run mode unless --execute is provided."
        )
    )
    parser.add_argument("document_id", type=int, help="Document ID to inspect or delete")
    parser.add_argument(
        "--execute",
        action="store_true",
        help="Commit the deletion instead of only printing a dry-run summary",
    )
    args = parser.parse_args()

    if args.document_id <= 0:
        raise SystemExit("document_id must be a positive integer")

    return args


def _print_summary(summary: dict[str, int | str | None]) -> None:
    committed = bool(summary["committed"])
    mode = "Deleted" if committed else "Dry run for"

    print(f"{mode} document_id={summary['document_id']}")
    print(f"Title: {summary['title']}")
    print(f"Source kind: {summary['source_kind']}")
    print(f"Source language: {summary['src_lang']}")
    print(f"Total pages: {summary['total_pages']}")
    print(f"Cover image id: {summary['cover_image_id']}")
    print(f"User-document links deleted: {summary['user_document_links_deleted']}")
    print(f"Read progress rows deleted: {summary['read_progress_deleted']}")
    print(f"Glossary items deleted: {summary['glossary_items_deleted']}")
    print(f"Page translations deleted: {summary['page_translations_deleted']}")
    print(f"Document page blocks deleted: {summary['document_page_blocks_deleted']}")
    print(f"Document pages deleted: {summary['document_pages_deleted']}")
    print(f"Document sections deleted: {summary['document_sections_deleted']}")
    print(f"Document images deleted: {summary['document_images_deleted']}")
    print(f"Document rows deleted: {summary['documents_deleted']}")

    if not committed:
        print("Run again with --execute to commit these deletions.")


if __name__ == "__main__":
    args = _parse_args()

    try:
        result = delete_document(args.document_id, execute=args.execute)
    except ValueError as exc:
        raise SystemExit(str(exc)) from exc

    _print_summary(result)
