import os
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from api.routes import (
    align,
    annotate,
    auth,
    documents,
    library,
    page_translations,
    pronounce,
    translate,
)

# -------------------------
# Initialize FastAPI / CORS Middleware
# -------------------------
print("Initializing FastAPI...", flush=False)
app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=[os.environ["CORS_ORIGINS"]],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# -------------------------
# Include API Routers
# -------------------------
app.include_router(align.router)
app.include_router(annotate.router)
app.include_router(auth.router)
app.include_router(library.router)
app.include_router(page_translations.router)
app.include_router(pronounce.router)
app.include_router(documents.router)
app.include_router(translate.router)
