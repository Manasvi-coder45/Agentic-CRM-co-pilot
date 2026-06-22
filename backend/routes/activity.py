from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import desc
from database import get_db
from models.activity_log import ActivityLog
from typing import List
from pydantic import BaseModel
from datetime import datetime
from typing import Optional

router = APIRouter(prefix="/activity", tags=["Activity Log"])

class ActivityResponse(BaseModel):
    id: int
    action_type: str
    tool_name: str
    summary: str
    entity_type: Optional[str] = None
    entity_id: Optional[int] = None
    entity_name: Optional[str] = None
    created_at: Optional[datetime] = None

    class Config:
        from_attributes = True

@router.get("/", response_model=List[ActivityResponse])
def get_activity_log(limit: int = 50, db: Session = Depends(get_db)):
    """Get recent agent activity, newest first."""
    return db.query(ActivityLog)\
             .order_by(desc(ActivityLog.created_at))\
             .limit(limit).all()

@router.delete("/")
def clear_activity_log(db: Session = Depends(get_db)):
    db.query(ActivityLog).delete()
    db.commit()
    return {"message": "Activity log cleared"}