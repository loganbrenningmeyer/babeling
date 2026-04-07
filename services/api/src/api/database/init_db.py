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

    if "context_meaning" not in glossary_columns:
        with engine.begin() as conn:
            if conn.dialect.name == "postgresql":
                conn.execute(
                    text(
                        "ALTER TABLE glossary_items "
                        "ADD COLUMN IF NOT EXISTS context_meaning TEXT"
                    )
                )
            else:
                conn.execute(
                    text("ALTER TABLE glossary_items ADD COLUMN context_meaning TEXT")
                )


def create_database():
    print("Creating database...")
    Base.metadata.create_all(bind=engine)
    ensure_database_compatibility()

    print("Done.")

if __name__ == "__main__":
    create_database()
