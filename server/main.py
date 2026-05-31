from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from database import engine, Base
from routes import auth, tasks
import models.user, models.task
from apscheduler.schedulers.background import BackgroundScheduler
from sqlalchemy.orm import Session
from database import SessionLocal
from models.task import Task
from datetime import datetime, timedelta

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

Base.metadata.create_all(bind=engine)

app.include_router(auth.router, prefix="/api/auth")
app.include_router(tasks.router, prefix="/api/tasks")

def purge_old_archives():
    db: Session = SessionLocal()
    cutoff = datetime.utcnow() - timedelta(days=10)
    db.query(Task).filter(Task.is_archived == True, Task.archived_at <= cutoff).delete()
    db.commit()
    db.close()

scheduler = BackgroundScheduler()
scheduler.add_job(purge_old_archives, 'interval', hours=24)
scheduler.start()

@app.get("/")
def root():
    return {"message": "Task Manager API running"}