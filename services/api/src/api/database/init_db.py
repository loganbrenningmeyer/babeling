from api.database.db import engine
from api.database.models import Base

Base.metadata.create_all(bind=engine)
print("Tables created")
