from api.database.db import engine, Base
import api.database.models


def create_database():
    print("Creating database...")
    Base.metadata.create_all(bind=engine)

    print("Done.")

if __name__ == "__main__":
    create_database()