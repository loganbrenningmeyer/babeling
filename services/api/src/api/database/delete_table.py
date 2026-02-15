import sys
from sqlalchemy import text

from api.database.db import engine, Base
import api.database.models


def drop_table(table_name: str):
    with engine.begin() as conn:
        conn.execute(text(f'DROP TABLE IF EXISTS "{table_name}" CASCADE'))
    print(f"Dropped table: {table_name}")


if __name__ == "__main__":
    if len(sys.argv) != 2:
        raise SystemExit("Usage: python -m api.database.delete_db <table_name>")
    drop_table(sys.argv[1])