from sqlalchemy import Column, Integer, String, DateTime, Float, ForeignKey
from sqlalchemy.sql import func
from database import Base

class Deal(Base):
    __tablename__ = "deals"

    id              = Column(Integer, primary_key=True, index=True)
    title           = Column(String, nullable=False)
    contact_id      = Column(Integer, ForeignKey("contacts.id"), nullable=False)
    value           = Column(Float, default=0.0)        # deal value in USD
    stage           = Column(String, default="prospecting")
    # stages: prospecting | qualification | proposal | negotiation | closed_won | closed_lost
    probability     = Column(Float, default=0.0)        # 0-100%
    expected_close  = Column(DateTime(timezone=True))
    last_activity   = Column(DateTime(timezone=True), server_default=func.now())
    notes           = Column(String)
    created_at      = Column(DateTime(timezone=True), server_default=func.now())
    updated_at      = Column(DateTime(timezone=True), onupdate=func.now())