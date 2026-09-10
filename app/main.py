from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.database import Base, engine
from app import models  # noqa: F401 - ensures models are registered on Base.metadata
from app.routers import admin, auth, transactions, subscriptions, goals, plans

app = FastAPI(title="Life Dashboard API", version="0.1.0")

# Allow your frontend (adjust origins for production)
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:3000", "http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(auth.router)
app.include_router(admin.router)
app.include_router(transactions.router)
app.include_router(subscriptions.router)
app.include_router(goals.router)
app.include_router(plans.router)


@app.on_event("startup")
def on_startup():
    # For the skeleton, create tables directly. Switch to Alembic migrations
    # once the schema stabilizes.
    Base.metadata.create_all(bind=engine)


@app.get("/health")
def health_check():
    return {"status": "ok"}
