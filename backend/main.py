from fastapi import FastAPI, Depends
from fastapi.middleware.cors import CORSMiddleware
from backend.routes import sensors, disease, alerts, automation
from backend.database.connection import get_db
from backend.database.supabase_sync import run_full_sync
from sqlalchemy.orm import Session
from backend.routes import security
import asyncio
import logging

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)

app = FastAPI(
    title="FYP Oil Palm IoT API",
    description="Backend API for Oil Palm IoT Monitoring & Disease Detection",
    version="1.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(sensors.router)
app.include_router(disease.router)
app.include_router(alerts.router)
app.include_router(automation.router)
app.include_router(security.router)

@app.get("/")
def root():
    return {
        "project": "FYP Oil Palm IoT System",
        "status": "running",
        "docs": "/docs"
    }

@app.get("/health")
def health_check():
    return {"status": "healthy"}

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
                db = SessionLocal()
                last_sync = datetime.now() - timedelta(seconds=65)
                run_full_sync(db, last_sync)
                db.close()
            except Exception as e:
                logger.error(f"Auto sync error: {e}")
    asyncio.create_task(sync_loop())