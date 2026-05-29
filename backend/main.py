from fastapi import FastAPI, Depends, HTTPException, Request
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from fastapi.responses import JSONResponse
from backend.routes import sensors, disease, alerts, automation
from backend.routes import security as security_router
from backend.routes import auth
from backend.database.connection import get_db
from backend.database.supabase_sync import run_full_sync
from sqlalchemy.orm import Session
from jose import JWTError, jwt
from backend.routes.cameras import router as cameras_router
import asyncio
import logging
import os

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

SECRET_KEY = os.getenv("JWT_SECRET_KEY", "fyp-oil-palm-secret-key-2024")
ALGORITHM  = "HS256"

PUBLIC_ROUTES = {
    "/health", "/", "/auth/login",
    "/docs", "/openapi.json", "/redoc","/favicon.ico"
}

app = FastAPI(
    title="FYP Oil Palm IoT API",
    description="Backend API for Oil Palm IoT Monitoring & Disease Detection",
    version="1.0.0"
)

# ── Auth Middleware ───────────────────────────────────────────
@app.middleware("http")
async def auth_middleware(request: Request, call_next):
    # Always allow WebSocket and public routes
    if request.url.path in PUBLIC_ROUTES:
        return await call_next(request)

    # Get token from Authorization header
    auth_header = request.headers.get("Authorization")
    if not auth_header or not auth_header.startswith("Bearer "):
        return JSONResponse(
            status_code=401,
            content={"detail": "Authentication required"}
        )

    token = auth_header.split(" ")[1]
    try:
        payload  = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username = payload.get("sub")
        if not username:
            return JSONResponse(
                status_code=401,
                content={"detail": "Invalid token"}
            )
    except JWTError:
        return JSONResponse(
            status_code=401,
            content={"detail": "Invalid or expired token"}
        )

    return await call_next(request)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "https://app.project2030.me"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sensors.router)
app.include_router(disease.router)
app.include_router(alerts.router)
app.include_router(automation.router)
app.include_router(security_router.router)
app.include_router(auth.router)
app.include_router(cameras_router, prefix="/cameras", tags=["cameras"])


@app.get("/")
def root():
    return {
        "project": "FYP Oil Palm IoT System",
        "status":  "running",
        "docs":    "/docs"
    }

@app.get("/health")
def health_check():
    return {
        "project":   "FYP Oil Palm IoT System",
        "status":    "healthy",
        "version":   "1.0.0",
        "docs":      "/docs",
        "dashboard": "https://app.project2030.me"
    }

@app.post("/sync")
def manual_sync(db: Session = Depends(get_db)):
    result = run_full_sync(db)
    return result

@app.on_event("startup")
async def start_auto_sync():
    async def sync_loop():
        while True:
            await asyncio.sleep(60)
            try:
                from backend.database.connection import SessionLocal
                from datetime import datetime, timedelta
                db        = SessionLocal()
                last_sync = datetime.now() - timedelta(seconds=65)
                run_full_sync(db, last_sync)
                db.close()
            except Exception as e:
                logger.error(f"Auto sync error: {e}")
    asyncio.create_task(sync_loop())
