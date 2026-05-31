from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from database import get_db
from models.task import Task
from middleware.auth import get_current_user
from models.user import User
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

router = APIRouter()

class TaskInput(BaseModel):
    title: str
    description: Optional[str] = None
    stage: Optional[str] = "Todo"
    start_date: Optional[str] = None
    end_date: Optional[str] = None
    next_step: Optional[str] = None
    folder_path: Optional[str] = None
    progress: Optional[int] = 0
    target_files: Optional[int] = 10
    priority: Optional[int] = 0

@router.get("/")
def get_tasks(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Task).filter(Task.user_id == current_user.id, Task.is_archived == False).all()

@router.post("/")
def create_task(data: TaskInput, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = Task(user_id=current_user.id, **data.dict())
    db.add(task)
    db.commit()
    db.refresh(task)
    return task

@router.put("/{task_id}")
def update_task(task_id: int, data: TaskInput, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    for key, value in data.dict().items():
        setattr(task, key, value)
    db.commit()
    db.refresh(task)
    return task

@router.delete("/{task_id}")
def archive_task(task_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.is_archived = True
    task.archived_at = datetime.utcnow()
    db.commit()
    return {"message": "Archived"}

@router.get("/archive")
def get_archive(db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    return db.query(Task).filter(Task.user_id == current_user.id, Task.is_archived == True).all()

@router.post("/archive/{task_id}/restore")
def restore_task(task_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.is_archived = False
    task.archived_at = None
    db.commit()
    return task

@router.delete("/archive/{task_id}/delete")
def permanent_delete(task_id: int, db: Session = Depends(get_db), current_user: User = Depends(get_current_user)):
    task = db.query(Task).filter(Task.id == task_id, Task.user_id == current_user.id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    db.delete(task)
    db.commit()
    return {"message": "Deleted permanently"}

class ProgressUpdate(BaseModel):
    progress: int
    folder_path: Optional[str] = None

@router.post("/{task_id}/progress")
def update_progress(task_id: int, data: ProgressUpdate, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.progress = data.progress
    if data.folder_path:
        task.folder_path = data.folder_path
    if data.progress >= 100 and task.stage != 'Done':
        task.stage = 'Done'
    elif data.progress >= 30 and task.stage == 'Todo':
        task.stage = 'In Progress'
    db.commit()
    return {"progress": task.progress, "stage": task.stage}

class ProgressUpdate(BaseModel):
    progress: int
    folder_path: Optional[str] = None

@router.post("/{task_id}/progress")
def update_progress(task_id: int, data: ProgressUpdate, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.progress = data.progress
    if data.folder_path:
        task.folder_path = data.folder_path
    if data.progress >= 100 and task.stage != 'Done':
        task.stage = 'Done'
    elif data.progress >= 30 and task.stage == 'Todo':
        task.stage = 'In Progress'
    db.commit()
    return {"progress": task.progress, "stage": task.stage}

class ProgressUpdate(BaseModel):
    progress: int
    folder_path: Optional[str] = None

@router.post("/{task_id}/progress")
def update_progress(task_id: int, data: ProgressUpdate, db: Session = Depends(get_db)):
    task = db.query(Task).filter(Task.id == task_id).first()
    if not task:
        raise HTTPException(status_code=404, detail="Task not found")
    task.progress = data.progress
    if data.folder_path:
        task.folder_path = data.folder_path
    if data.progress >= 100 and task.stage != 'Done':
        task.stage = 'Done'
    elif data.progress >= 30 and task.stage == 'Todo':
        task.stage = 'In Progress'
    db.commit()
    return {"progress": task.progress, "stage": task.stage}