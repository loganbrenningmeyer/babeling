from fastapi import FastAPI
from sqlalchemy.orm import Session

from db import SessionLocal
from models import User

app = FastAPI()

def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()

@app.post("/users")
def create_user(name: str):
    db: Session = next(get_db())

    user = User(name=name)
    db.add(user)
    db.commit()
    db.refresh(user)

    return {"id": user.id, "name": user.name}

@app.get("/users")
def list_users():
    db: Session = next(get_db())
    users = db.query(User).all()

    return [{"id": u.id, "name": u.name} for u in users]
