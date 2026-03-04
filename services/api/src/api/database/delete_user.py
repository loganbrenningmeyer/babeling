import sys
from collections.abc import Sequence

from sqlalchemy import delete, select, update

from api.database.db import SessionLocal
from api.database.models import (
    AppUser,
    Document,
    DocumentImage,
    DocumentPage,
    DocumentPageBlock,
    DocumentReadProgress,
    DocumentSection,
    GlossaryItem,
    PageTranslation,
    UserDocuments,
    UserPreferences,
)


def _delete_count(db, statement) -> int:
    result = db.execute(statement)
    return int(result.rowcount or 0)


def _find_orphan_document_ids(db, user_id: int) -> tuple[list[int], list[int]]:
    user_document_ids = list(
        db.scalars(
            select(UserDocuments.document_id).where(UserDocuments.user_id == user_id)
        )
    )

    if not user_document_ids:
        return [], []

    rows = db.execute(
        select(
            UserDocuments.document_id,
            UserDocuments.user_id,
        ).where(UserDocuments.document_id.in_(user_document_ids))
    ).all()

    doc_users: dict[int, set[int]] = {}
    for document_id, owner_user_id in rows:
        doc_users.setdefault(int(document_id), set()).add(int(owner_user_id))

    orphan_document_ids: list[int] = []
    shared_document_ids: list[int] = []

    for document_id in user_document_ids:
        owner_ids = doc_users.get(int(document_id), set())
        if owner_ids == {user_id}:
            orphan_document_ids.append(int(document_id))
        else:
            shared_document_ids.append(int(document_id))

    return orphan_document_ids, shared_document_ids


def delete_user(user_id: int) -> dict[str, int | list[int]]:
    with SessionLocal() as db:
        user = db.get(AppUser, user_id)
        if user is None:
            raise ValueError(f"No app_users row found for user_id={user_id}")

        orphan_document_ids, shared_document_ids = _find_orphan_document_ids(db, user_id)

        orphan_page_ids: list[int] = []
        if orphan_document_ids:
            orphan_page_ids = list(
                db.scalars(
                    select(DocumentPage.id).where(
                        DocumentPage.document_id.in_(orphan_document_ids)
                    )
                )
            )

        summary: dict[str, int | list[int]] = {
            "user_id": user_id,
            "shared_document_ids": shared_document_ids,
            "deleted_document_ids": orphan_document_ids,
            "user_preferences_deleted": 0,
            "glossary_items_deleted": 0,
            "read_progress_deleted": 0,
            "user_document_links_deleted": 0,
            "orphan_page_translations_deleted": 0,
            "orphan_page_blocks_deleted": 0,
            "orphan_doc_glossary_items_deleted": 0,
            "orphan_doc_read_progress_deleted": 0,
            "orphan_doc_user_links_deleted": 0,
            "orphan_document_pages_deleted": 0,
            "orphan_document_sections_deleted": 0,
            "orphan_document_images_deleted": 0,
            "orphan_documents_deleted": 0,
            "app_users_deleted": 0,
        }

        try:
            summary["user_preferences_deleted"] = _delete_count(
                db,
                delete(UserPreferences).where(UserPreferences.user_id == user_id),
            )
            summary["glossary_items_deleted"] = _delete_count(
                db,
                delete(GlossaryItem).where(GlossaryItem.user_id == user_id),
            )
            summary["read_progress_deleted"] = _delete_count(
                db,
                delete(DocumentReadProgress).where(DocumentReadProgress.user_id == user_id),
            )
            summary["user_document_links_deleted"] = _delete_count(
                db,
                delete(UserDocuments).where(UserDocuments.user_id == user_id),
            )

            if orphan_document_ids:
                if orphan_page_ids:
                    summary["orphan_page_translations_deleted"] = _delete_count(
                        db,
                        delete(PageTranslation).where(
                            PageTranslation.document_page_id.in_(orphan_page_ids)
                        ),
                    )
                    summary["orphan_page_blocks_deleted"] = _delete_count(
                        db,
                        delete(DocumentPageBlock).where(
                            DocumentPageBlock.document_page_id.in_(orphan_page_ids)
                        ),
                    )

                summary["orphan_doc_glossary_items_deleted"] = _delete_count(
                    db,
                    delete(GlossaryItem).where(
                        GlossaryItem.document_id.in_(orphan_document_ids)
                    ),
                )
                summary["orphan_doc_read_progress_deleted"] = _delete_count(
                    db,
                    delete(DocumentReadProgress).where(
                        DocumentReadProgress.document_id.in_(orphan_document_ids)
                    ),
                )
                summary["orphan_doc_user_links_deleted"] = _delete_count(
                    db,
                    delete(UserDocuments).where(
                        UserDocuments.document_id.in_(orphan_document_ids)
                    ),
                )

                db.execute(
                    update(Document)
                    .where(Document.id.in_(orphan_document_ids))
                    .values(cover_image_id=None)
                )

                summary["orphan_document_pages_deleted"] = _delete_count(
                    db,
                    delete(DocumentPage).where(
                        DocumentPage.document_id.in_(orphan_document_ids)
                    ),
                )
                summary["orphan_document_sections_deleted"] = _delete_count(
                    db,
                    delete(DocumentSection).where(
                        DocumentSection.document_id.in_(orphan_document_ids)
                    ),
                )
                summary["orphan_document_images_deleted"] = _delete_count(
                    db,
                    delete(DocumentImage).where(
                        DocumentImage.document_id.in_(orphan_document_ids)
                    ),
                )
                summary["orphan_documents_deleted"] = _delete_count(
                    db,
                    delete(Document).where(Document.id.in_(orphan_document_ids)),
                )

            summary["app_users_deleted"] = _delete_count(
                db,
                delete(AppUser).where(AppUser.id == user_id),
            )
            db.commit()
        except Exception:
            db.rollback()
            raise

        return summary


def _parse_user_id(argv: Sequence[str]) -> int:
    if len(argv) != 2:
        raise SystemExit("Usage: python -m api.database.delete_user <user_id>")

    try:
        user_id = int(argv[1])
    except ValueError as exc:
        raise SystemExit("user_id must be an integer") from exc

    if user_id <= 0:
        raise SystemExit("user_id must be a positive integer")

    return user_id


if __name__ == "__main__":
    try:
        summary = delete_user(_parse_user_id(sys.argv))
    except ValueError as exc:
        raise SystemExit(str(exc)) from exc

    print(f"Deleted database data for user_id={summary['user_id']}")
    print(f"Shared documents kept: {summary['shared_document_ids']}")
    print(f"Documents fully deleted: {summary['deleted_document_ids']}")
    print(f"User preferences deleted: {summary['user_preferences_deleted']}")
    print(f"Glossary items deleted: {summary['glossary_items_deleted']}")
    print(f"Read progress rows deleted: {summary['read_progress_deleted']}")
    print(f"User-document links deleted: {summary['user_document_links_deleted']}")
    print(
        "Orphan document page translations deleted: "
        f"{summary['orphan_page_translations_deleted']}"
    )
    print(f"Orphan document page blocks deleted: {summary['orphan_page_blocks_deleted']}")
    print(
        "Orphan document glossary items deleted: "
        f"{summary['orphan_doc_glossary_items_deleted']}"
    )
    print(
        "Orphan document read progress rows deleted: "
        f"{summary['orphan_doc_read_progress_deleted']}"
    )
    print(
        "Orphan document user links deleted: "
        f"{summary['orphan_doc_user_links_deleted']}"
    )
    print(f"Orphan document pages deleted: {summary['orphan_document_pages_deleted']}")
    print(
        f"Orphan document sections deleted: {summary['orphan_document_sections_deleted']}"
    )
    print(f"Orphan document images deleted: {summary['orphan_document_images_deleted']}")
    print(f"Orphan documents deleted: {summary['orphan_documents_deleted']}")
    print(f"App user rows deleted: {summary['app_users_deleted']}")
