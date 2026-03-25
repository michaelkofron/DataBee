from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv

from database import init_db

load_dotenv(dotenv_path="../.env")

app = FastAPI(title="DataBee")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

_db = None


@app.on_event("startup")
def startup():
    global _db
    _db = init_db()
    print("DataBee: database initialised.")


@app.get("/api/health")
def health():
    return {"status": "ok"}
