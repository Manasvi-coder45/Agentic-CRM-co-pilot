from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func
from database import get_db
from models.deal import Deal
from schemas.deal import DealCreate, DealUpdate, DealResponse
from typing import List
from datetime import datetime, timezone, timedelta

router = APIRouter(prefix="/deals", tags=["Deals"])

@router.get("/", response_model=List[DealResponse])
def get_all_deals(db: Session = Depends(get_db)):
    return db.query(Deal).all()

@router.get("/at-risk", response_model=List[DealResponse])
def get_at_risk_deals(db: Session = Depends(get_db)):
    """Deals with no activity in the last 7 days — key input for the agent"""
    cutoff = datetime.now(timezone.utc) - timedelta(days=7)
    return db.query(Deal).filter(
        Deal.last_activity < cutoff,
        Deal.stage.notin_(["closed_won", "closed_lost"])
    ).all()

@router.get("/{deal_id}", response_model=DealResponse)
def get_deal(deal_id: int, db: Session = Depends(get_db)):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    return deal

@router.post("/", response_model=DealResponse)
def create_deal(deal: DealCreate, db: Session = Depends(get_db)):
    db_deal = Deal(**deal.model_dump())
    db.add(db_deal)
    db.commit()
    db.refresh(db_deal)
    return db_deal

@router.put("/{deal_id}", response_model=DealResponse)
def update_deal(deal_id: int, updates: DealUpdate, db: Session = Depends(get_db)):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    for key, value in updates.model_dump(exclude_unset=True).items():
        setattr(deal, key, value)
    db.commit()
    db.refresh(deal)
    return deal

@router.delete("/{deal_id}")
def delete_deal(deal_id: int, db: Session = Depends(get_db)):
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        raise HTTPException(status_code=404, detail="Deal not found")
    db.delete(deal)
    db.commit()
    return {"message": f"Deal {deal_id} deleted"}