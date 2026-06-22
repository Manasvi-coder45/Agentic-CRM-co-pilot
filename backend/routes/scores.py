from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from database import get_db
from models.deal import Deal
from agent.scoring import calculate_health_score

router = APIRouter(prefix="/scores", tags=["Health Scores"])

@router.get("/deals")
def get_all_deal_scores(db: Session = Depends(get_db)):
    """Get health scores for all active deals."""
    deals = db.query(Deal).filter(
        Deal.stage.notin_(["closed_won", "closed_lost"])
    ).all()
    results = []
    for deal in deals:
        deal_dict = {
            "id": deal.id,
            "title": deal.title,
            "stage": deal.stage,
            "probability": deal.probability,
            "value": deal.value,
            "last_activity": deal.last_activity,
            "notes": deal.notes
        }
        health = calculate_health_score(deal_dict)
        results.append({
            "deal_id": deal.id,
            "deal_title": deal.title,
            "stage": deal.stage,
            "value": deal.value,
            **health
        })
    return sorted(results, key=lambda x: x["score"])

@router.get("/deals/{deal_id}")
def get_deal_score(deal_id: int, db: Session = Depends(get_db)):
    """Get health score for a specific deal."""
    deal = db.query(Deal).filter(Deal.id == deal_id).first()
    if not deal:
        return {"error": "Deal not found"}
    deal_dict = {
        "id": deal.id, "title": deal.title, "stage": deal.stage,
        "probability": deal.probability, "value": deal.value,
        "last_activity": deal.last_activity, "notes": deal.notes
    }
    health = calculate_health_score(deal_dict)
    return {"deal_id": deal.id, "deal_title": deal.title, **health}