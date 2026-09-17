from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from contextlib import asynccontextmanager
from sqlalchemy import text

from app.database.connection import engine, Base
from app.api import auth, translation

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Startup: Ensure the vector extension is created before mapping models
    with engine.connect() as conn:
        conn.execute(text("CREATE EXTENSION IF NOT EXISTS vector;"))
        conn.commit()
    
    # Create all tables
    Base.metadata.create_all(bind=engine)
    yield
    # Shutdown logic if any

app = FastAPI(title="AI Language Translator API", lifespan=lifespan)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"], # In production, restrict this
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(translation.router, prefix="/api", tags=["Translation"])

@app.get("/")
def read_root():
    return {"message": "Welcome to AI Language Translator API"}
