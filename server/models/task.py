from sqlalchemy import Column, Integer, String, Boolean, DateTime, ForeignKey, Text
from sqlalchemy.sql import func
from sqlalchemy.orm import relationship
from database import Base

class Task(Base):
    __tablename__ = "tasks"
    
    folder_path = Column(String, nullable=True)
    progress = Column(Integer, default=0)
    target_files = Column(Integer, default=10)
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    description = Column(Text, nullable=True)
    stage = Column(String, default="Todo")
    start_date = Column(String, nullable=True)
    end_date = Column(String, nullable=True)
    next_step = Column(String, nullable=True)
    is_archived = Column(Boolean, default=False)
    archived_at = Column(DateTime, nullable=True)
    created_at = Column(DateTime(timezone=True), server_default=func.now())
    updated_at = Column(DateTime(timezone=True), onupdate=func.now())
    folder_path = Column(String, nullable=True)
    priority = Column(Integer, default=0)

    owner = relationship("User", back_populates="tasks")