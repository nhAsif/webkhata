import logging
import os
from contextlib import asynccontextmanager

from fastapi import FastAPI, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import JSONResponse
from fastapi.staticfiles import StaticFiles

from config import settings
from database import engine, SessionLocal
from middleware import RequestLoggingMiddleware
import models

# ─── Logging ────────────────────────────────────────────────────────────────

logging.basicConfig(
    level=logging.DEBUG if settings.DEBUG else logging.INFO,
    format="%(asctime)s  %(levelname)-8s  %(name)s  %(message)s",
)
logger = logging.getLogger("webkhata")


# ─── Lifespan ────────────────────────────────────────────────────────────────

@asynccontextmanager
async def lifespan(app: FastAPI):
    # Create all tables
    models.Base.metadata.create_all(bind=engine)

    # --- Safe column migrations (ALTER TABLE for existing DBs) ---
    from sqlalchemy import text
    with engine.connect() as conn:
        # Add weekly_timetable column to batches if it doesn't exist
        try:
            conn.execute(text("ALTER TABLE batches ADD COLUMN weekly_timetable TEXT"))
            conn.commit()
            logger.info("Migrated: added weekly_timetable column to batches")
        except Exception:
            pass  # Column already exists

        # Add monthly_fee column to students if it doesn't exist
        try:
            conn.execute(text("ALTER TABLE students ADD COLUMN monthly_fee REAL NOT NULL DEFAULT 0.0"))
            conn.commit()
            logger.info("Migrated: added monthly_fee column to students")
        except Exception:
            pass  # Column already exists

        # Add start_date column to students if it doesn't exist
        try:
            conn.execute(text("ALTER TABLE students ADD COLUMN start_date DATE"))
            # Back-fill existing rows with today's date so the column is usable
            conn.execute(text("UPDATE students SET start_date = DATE('now') WHERE start_date IS NULL"))
            conn.commit()
            logger.info("Migrated: added start_date column to students")
        except Exception:
            pass  # Column already exists

        # Create student_fee_cycles table if it doesn't exist
        try:
            conn.execute(text("""
                CREATE TABLE IF NOT EXISTS student_fee_cycles (
                    id INTEGER PRIMARY KEY AUTOINCREMENT,
                    student_id INTEGER NOT NULL REFERENCES students(id) ON DELETE CASCADE,
                    cycle_number INTEGER NOT NULL CHECK(cycle_number >= 1),
                    cycle_start_date DATE NOT NULL,
                    cycle_end_date DATE NOT NULL,
                    fee_amount REAL NOT NULL CHECK(fee_amount >= 0),
                    is_paid BOOLEAN NOT NULL DEFAULT 0,
                    payment_date DATE,
                    notes TEXT,
                    created_at DATETIME DEFAULT (datetime('now')),
                    UNIQUE(student_id, cycle_number)
                )
            """))
            conn.commit()
            logger.info("Migrated: created student_fee_cycles table")
        except Exception:
            pass  # Table already exists

    # Seed default tutor account on first run
    from auth import init_default_tutor
    db = SessionLocal()
    try:
        init_default_tutor(db)
        logger.info("Database initialized. Default tutor: admin / changeme")
    finally:
        db.close()

    yield
    logger.info("WebKhata shutting down.")


# ─── App ─────────────────────────────────────────────────────────────────────

app = FastAPI(
    title="WebKhata API",
    description="Tutor management system for private SSC/JSC tutors in Bangladesh",
    version="1.0.0",
    lifespan=lifespan,
)

# ─── Middleware ───────────────────────────────────────────────────────────────

app.add_middleware(RequestLoggingMiddleware)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",   # Vite dev server
        "http://localhost:6540",
        "http://127.0.0.1:6540",
        # LAN origins — allow 192.168.x.x and 10.x.x.x
    ],
    allow_origin_regex=r"http://(192\.168\.\d+\.\d+|10\.\d+\.\d+\.\d+)(:\d+)?",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


# ─── Exception Handlers ───────────────────────────────────────────────────────

@app.exception_handler(HTTPException)
async def http_exception_handler(request: Request, exc: HTTPException):
    return JSONResponse(
        status_code=exc.status_code,
        content={"error": exc.detail, "status": exc.status_code},
    )


@app.exception_handler(Exception)
async def general_exception_handler(request: Request, exc: Exception):
    logger.error(f"Unhandled error: {exc}", exc_info=True)
    return JSONResponse(
        status_code=500,
        content={"error": "Internal server error", "status": 500},
    )


# ─── Routers ─────────────────────────────────────────────────────────────────

from routers.auth import router as auth_router
from routers.students import router as students_router
from routers.batches import router as batches_router
from routers.attendance import attendance_router, sessions_router
from routers.fees import router as fees_router
from routers.homework import router as homework_router
from routers.results import router as results_router
from routers.dashboard import router as dashboard_router
from routers.parent import router as parent_router
from routers.reports import router as reports_router
from routers.vocabulary import router as vocabulary_router

app.include_router(auth_router)
app.include_router(students_router)
app.include_router(batches_router)
app.include_router(sessions_router)
app.include_router(attendance_router)
app.include_router(fees_router)
app.include_router(homework_router)
app.include_router(results_router)
app.include_router(dashboard_router)
app.include_router(parent_router)
app.include_router(reports_router)
app.include_router(vocabulary_router)
from routers.settings import router as settings_router
app.include_router(settings_router)


# ─── Uploads ─────────────────────────────────────────────────────────────────

UPLOAD_DIR = os.path.join(os.path.dirname(__file__), "uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")


# ─── Static Files (React Build) ───────────────────────────────────────────────

from fastapi.responses import FileResponse

STATIC_DIR = os.path.join(os.path.dirname(__file__), "static")
if os.path.isdir(STATIC_DIR):
    assets_dir = os.path.join(STATIC_DIR, "assets")
    if os.path.isdir(assets_dir):
        app.mount("/assets", StaticFiles(directory=assets_dir), name="assets")

    @app.get("/{full_path:path}")
    async def serve_spa(full_path: str):
        if full_path.startswith("api/"):
            raise HTTPException(status_code=404, detail="API route not found")
        
        file_path = os.path.join(STATIC_DIR, full_path)
        if full_path and os.path.isfile(file_path):
            return FileResponse(file_path)
            
        return FileResponse(os.path.join(STATIC_DIR, "index.html"))

    logger.info(f"Serving React SPA from {STATIC_DIR}")
else:
    @app.get("/{full_path:path}")
    def root(full_path: str):
        return {"message": "WebKhata API is running. Frontend not built yet."}


# ─── Entry Point ─────────────────────────────────────────────────────────────

if __name__ == "__main__":
    import uvicorn
    uvicorn.run(
        "main:app",
        host="0.0.0.0",
        port=settings.PORT,
        reload=settings.DEBUG,
        workers=1,
    )
