from datetime import datetime, timezone
from typing import Optional

STAGE_WEIGHTS = {
    "prospecting":   10,
    "qualification": 25,
    "proposal":      50,
    "negotiation":   75,
    "closed_won":    100,
    "closed_lost":   0,
}

NEGATIVE_KEYWORDS = [
    "no response", "unresponsive", "hesitant", "not interested",
    "delayed", "on hold", "cancelled", "budget cut", "ghosted",
    "waiting", "stalled", "no reply"
]

POSITIVE_KEYWORDS = [
    "excited", "interested", "moving forward", "confirmed",
    "approved", "signed", "agreed", "positive", "closing soon"
]

def calculate_health_score(deal: dict) -> dict:
    """
    Returns a health score (0-100) and breakdown for a deal.
    Components:
      - Activity recency (30 pts)
      - Stage progression (25 pts)
      - Close probability (25 pts)
      - Notes sentiment (20 pts)
    """
    score = 0
    breakdown = {}

    # 1. Activity recency (30 pts)
    last_activity = deal.get("last_activity")
    if last_activity:
        if isinstance(last_activity, str):
            last_activity = datetime.fromisoformat(last_activity)
        if last_activity.tzinfo is None:
            last_activity = last_activity.replace(tzinfo=timezone.utc)
        days_inactive = (datetime.now(timezone.utc) - last_activity).days
        if days_inactive <= 1:
            activity_score = 30
        elif days_inactive <= 3:
            activity_score = 25
        elif days_inactive <= 7:
            activity_score = 15
        elif days_inactive <= 14:
            activity_score = 5
        else:
            activity_score = 0
        breakdown["activity_recency"] = {
            "score": activity_score, "max": 30,
            "detail": f"{days_inactive} days since last activity"
        }
        score += activity_score
    else:
        breakdown["activity_recency"] = {"score": 0, "max": 30, "detail": "No activity recorded"}

    # 2. Stage progression (25 pts)
    stage = deal.get("stage", "prospecting")
    stage_score = round(STAGE_WEIGHTS.get(stage, 0) * 0.25)
    breakdown["stage_progression"] = {
        "score": stage_score, "max": 25,
        "detail": f"Stage: {stage.replace('_', ' ')}"
    }
    score += stage_score

    # 3. Close probability (25 pts)
    probability = deal.get("probability", 0) or 0
    prob_score = round(probability * 0.25)
    breakdown["close_probability"] = {
        "score": prob_score, "max": 25,
        "detail": f"{probability}% close probability"
    }
    score += prob_score

    # 4. Notes sentiment (20 pts)
    notes = (deal.get("notes") or "").lower()
    if not notes:
        sentiment_score = 10  # neutral if no notes
        sentiment = "neutral"
    else:
        neg_hits = sum(1 for kw in NEGATIVE_KEYWORDS if kw in notes)
        pos_hits = sum(1 for kw in POSITIVE_KEYWORDS if kw in notes)
        if pos_hits > neg_hits:
            sentiment_score = 20
            sentiment = "positive"
        elif neg_hits > pos_hits:
            sentiment_score = 0
            sentiment = "negative"
        else:
            sentiment_score = 10
            sentiment = "neutral"
    breakdown["notes_sentiment"] = {
        "score": sentiment_score, "max": 20,
        "detail": f"Sentiment: {sentiment}"
    }
    score += sentiment_score

    # Health label
    if score >= 75:
        label = "Healthy"
        color = "green"
    elif score >= 50:
        label = "At Risk"
        color = "amber"
    elif score >= 25:
        label = "Needs Attention"
        color = "red"
    else:
        label = "Critical"
        color = "red"

    return {
        "score": min(score, 100),
        "label": label,
        "color": color,
        "breakdown": breakdown
    }