from sqlalchemy import select

from api.database.db import SessionLocal
from api.database.models import Document, DocumentPage, PageTranslation


def list_documents() -> list[dict[str, str | int]]:
    with SessionLocal() as db:
        documents = db.execute(select(Document).order_by(Document.id.asc())).scalars().all()

        if not documents:
            return []

        page_rows = db.execute(
            select(
                DocumentPage.document_id,
                PageTranslation.tgt_lang,
            )
            .join(PageTranslation, PageTranslation.document_page_id == DocumentPage.id)
            .order_by(
                DocumentPage.document_id.asc(),
                PageTranslation.tgt_lang.asc(),
            )
        ).all()

        tgt_langs_by_document: dict[int, list[str]] = {}
        for document_id, tgt_lang in page_rows:
            doc_id = int(document_id)
            lang = str(tgt_lang)
            langs = tgt_langs_by_document.setdefault(doc_id, [])
            if lang not in langs:
                langs.append(lang)

        rows: list[dict[str, str | int]] = []
        for document in documents:
            tgt_langs = tgt_langs_by_document.get(int(document.id), [])
            if tgt_langs:
                language_pairs = ", ".join(
                    f"{document.src_lang}->{tgt_lang}" for tgt_lang in tgt_langs
                )
            else:
                language_pairs = f"{document.src_lang}->(none)"

            rows.append(
                {
                    "id": int(document.id),
                    "title": document.title,
                    "language_pairs": language_pairs,
                }
            )

        return rows


def _print_documents(rows: list[dict[str, str | int]]) -> None:
    if not rows:
        print("No documents found.")
        return

    id_width = max(len("ID"), *(len(str(row["id"])) for row in rows))
    title_width = max(len("Title"), *(len(str(row["title"])) for row in rows))

    print(
        f"{'ID'.ljust(id_width)}  "
        f"{'Title'.ljust(title_width)}  "
        "Language pairs"
    )
    print(
        f"{'-' * id_width}  "
        f"{'-' * title_width}  "
        "--------------"
    )

    for row in rows:
        print(
            f"{str(row['id']).ljust(id_width)}  "
            f"{str(row['title']).ljust(title_width)}  "
            f"{row['language_pairs']}"
        )


if __name__ == "__main__":
    _print_documents(list_documents())
