from pydantic import BaseModel
from typing import Optional
from datetime import datetime

class DealBase(BaseModel):
    title:          str
    contact_id:     int
    value:          Optional[float] = 0.0
    stage:          Optional[str] = "prospecting"
    probability:    Optional[float] = 0.0
    expected_close: Optional[datetime] = None
    notes:          Optional[str] = None

class DealCreate(DealBase):
    pass

class DealUpdate(BaseModel):
    title:          Optional[str] = None
    value:          Optional[float] = None
    stage:          Optional[str] = None
    probability:    Optional[float] = None
    expected_close: Optional[datetime] = None
    notes:          Optional[str] = None
    last_activity:  Optional[datetime] = None

class DealResponse(DealBase):
    id:            int
    last_activity: Optional[datetime] = None
    created_at:    Optional[datetime] = None
    updated_at:    Optional[datetime] = None

    class Config:
        from_attributes = True