from sqlalchemy import inspect, text

from api.database.db import engine, Base
import api.database.models


def ensure_database_compatibility():
    inspector = inspect(engine)

    if "glossary_items" not in inspector.get_table_names():
        return

    glossary_columns = {
        column["name"] for column in inspector.get_columns("glossary_items")
    }

    if "context_meaning" in glossary_columns:
        with engine.begin() as conn:
            if conn.dialect.name == "postgresql":
                conn.execute(
                    text(
                        "ALTER TABLE glossary_items "
                        "DROP COLUMN IF EXISTS context_meaning"
                    )
                )
            else:
                conn.execute(
                    text("ALTER TABLE glossary_items DROP COLUMN context_meaning")
                )


def create_database():
    print("Creating database...")
    Base.metadata.create_all(bind=engine)
    ensure_database_compatibility()

    print("Done.")

if __name__ == "__main__":
    create_database()
