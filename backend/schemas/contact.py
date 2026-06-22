from pydantic import BaseModel, EmailStr
from typing import Optional
from datetime import datetime

class ContactBase(BaseModel):
    name:    str
    email:   EmailStr
    company: Optional[str] = None
    phone:   Optional[str] = None
    status:  Optional[str] = "lead"

class ContactCreate(ContactBase):
    pass

class ContactUpdate(BaseModel):
    name:    Optional[str] = None
    email:   Optional[EmailStr] = None
    company: Optional[str] = None
    phone:   Optional[str] = None
    status:  Optional[str] = None

class ContactResponse(ContactBase):
    id:         int
    created_at: Optional[datetime] = None
    updated_at: Optional[datetime] = None

    class Config:
        from_attributes = True