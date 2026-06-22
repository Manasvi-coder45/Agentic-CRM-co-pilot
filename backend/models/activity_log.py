from sqlalchemy import Column, Integer, String, DateTime, Text
from sqlalchemy.sql import func
from database import Base

class ActivityLog(Base):
    __tablename__ = "activity_logs"

    id          = Column(Integer, primary_key=True, index=True)
    action_type = Column(String, nullable=False)
    tool_name   = Column(String, nullable=False)
    summary     = Column(Text, nullable=False)
    entity_type = Column(String)
    entity_id   = Column(Integer)
    entity_name = Column(String)
    extra_data  = Column(Text)
    created_at  = Column(DateTime(timezone=True), server_default=func.now())