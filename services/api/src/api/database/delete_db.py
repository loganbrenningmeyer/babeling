from api.database.db import engine, Base
import api.database.models


def delete_database():
    print("Dropping all tables...")
    Base.metadata.drop_all(bind=engine)

    print("Done.")


if __name__ == "__main__":
    delete_database()