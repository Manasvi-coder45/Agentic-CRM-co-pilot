from sqlalchemy import Column, Integer, String, DateTime, Boolean, ForeignKey
from sqlalchemy.sql import func
from database import Base

class Task(Base):
    __tablename__ = "tasks"

    id          = Column(Integer, primary_key=True, index=True)
    title       = Column(String, nullable=False)
    description = Column(String)
    contact_id  = Column(Integer, ForeignKey("contacts.id"), nullable=True)
    deal_id     = Column(Integer, ForeignKey("deals.id"), nullable=True)
    due_date    = Column(DateTime(timezone=True))
    completed   = Column(Boolean, default=False)
    priority    = Column(String, default="medium")   # low | medium | high
    created_at  = Column(DateTime(timezone=True), server_default=func.now())