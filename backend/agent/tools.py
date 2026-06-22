import httpx
import json
from langchain_core.tools import tool
from database import SessionLocal
from models.activity_log import ActivityLog
from agent.scoring import calculate_health_score

import os
BASE_URL = os.getenv("BACKEND_URL", "http://localhost:8000")

def _log(action_type: str, tool_name: str, summary: str,
         entity_type: str = None, entity_id: int = None,
         entity_name: str = None, extra_data: dict = None):
    try:
        db = SessionLocal()
        log = ActivityLog(
            action_type=action_type,
            tool_name=tool_name,
            summary=summary,
            entity_type=entity_type,
            entity_id=entity_id,
            entity_name=entity_name,
            extra_data=json.dumps(extra_data) if extra_data else None
        )
        db.add(log)
        db.commit()
        db.close()
    except Exception as e:
        print(f"Logging error: {e}")

@tool
def get_all_contacts() -> str:
    """Get all contacts from the CRM database."""
    response = httpx.get(f"{BASE_URL}/contacts/")
    contacts = response.json()
    if not contacts:
        return "No contacts found in the CRM."
    result = []
    for c in contacts:
        result.append(
            f"ID:{c['id']} | {c['name']} | {c['company']} | "
            f"{c['email']} | Status: {c['status']}"
        )
    _log("contact_fetched", "get_all_contacts",
         f"Fetched all {len(contacts)} contacts from CRM",
         entity_type="contact")
    return "\n".join(result)

@tool
def get_all_deals() -> str:
    """Get all deals from the CRM database."""
    response = httpx.get(f"{BASE_URL}/deals/")
    deals = response.json()
    if not deals:
        return "No deals found in the CRM."
    result = []
    for d in deals:
        result.append(
            f"ID:{d['id']} | {d['title']} | Stage: {d['stage']} | "
            f"Value: ${d['value']:,.0f} | Probability: {d['probability']}% | "
            f"Last Activity: {d['last_activity'][:10] if d['last_activity'] else 'N/A'}"
        )
    _log("deal_fetched", "get_all_deals",
         f"Fetched all {len(deals)} deals from CRM",
         entity_type="deal")
    return "\n".join(result)

@tool
def get_at_risk_deals() -> str:
    """Get deals that have had no activity in the last 7 days."""
    response = httpx.get(f"{BASE_URL}/deals/at-risk")
    deals = response.json()
    if not deals:
        return "No at-risk deals found."
    result = ["AT-RISK DEALS (No activity in 7+ days):"]
    for d in deals:
        from datetime import datetime, timezone
        last = datetime.fromisoformat(d['last_activity'])
        if last.tzinfo is None:
            last = last.replace(tzinfo=timezone.utc)
        days = (datetime.now(timezone.utc) - last).days
        result.append(
            f"ID:{d['id']} | {d['title']} | Stage: {d['stage']} | "
            f"Value: ${d['value']:,.0f} | {days} days inactive | "
            f"Notes: {d['notes'] or 'None'}"
        )
    _log("risk_scan", "get_at_risk_deals",
         f"Scanned pipeline — found {len(deals)} at-risk deals",
         entity_type="deal",
         extra_data={"at_risk_count": len(deals),
                   "deal_ids": [d['id'] for d in deals]})
    return "\n".join(result)

@tool
def get_contact_by_id(contact_id: int) -> str:
    """Get detailed information about a specific contact by their ID."""
    response = httpx.get(f"{BASE_URL}/contacts/{contact_id}")
    if response.status_code == 404:
        return f"Contact with ID {contact_id} not found."
    c = response.json()
    _log("contact_fetched", "get_contact_by_id",
         f"Fetched contact details for {c['name']} ({c['company']})",
         entity_type="contact", entity_id=c['id'], entity_name=c['name'])
    return (
        f"Contact Details:\n"
        f"  Name: {c['name']}\n"
        f"  Email: {c['email']}\n"
        f"  Company: {c['company']}\n"
        f"  Phone: {c['phone']}\n"
        f"  Status: {c['status']}"
    )

@tool
def get_deal_by_id(deal_id: int) -> str:
    """Get detailed information about a specific deal by its ID."""
    response = httpx.get(f"{BASE_URL}/deals/{deal_id}")
    if response.status_code == 404:
        return f"Deal with ID {deal_id} not found."
    d = response.json()
    _log("deal_fetched", "get_deal_by_id",
         f"Fetched deal details for {d['title']}",
         entity_type="deal", entity_id=d['id'], entity_name=d['title'])
    return (
        f"Deal Details:\n"
        f"  Title: {d['title']}\n"
        f"  Stage: {d['stage']}\n"
        f"  Value: ${d['value']:,.0f}\n"
        f"  Probability: {d['probability']}%\n"
        f"  Last Activity: {d['last_activity'][:10] if d['last_activity'] else 'N/A'}\n"
        f"  Notes: {d['notes'] or 'None'}"
    )

@tool
def get_deal_health_scores() -> str:
    """Get AI-powered health scores for all active deals.
    Use this to understand which deals are healthy vs at risk."""
    response = httpx.get(f"{BASE_URL}/scores/deals")
    scores = response.json()
    if not scores:
        return "No deals to score."
    result = ["DEAL HEALTH SCORES (sorted worst to best):"]
    for s in scores:
        result.append(
            f"ID:{s['deal_id']} | {s['deal_title']} | "
            f"Score: {s['score']}/100 | Status: {s['label']} | "
            f"Stage: {s['stage']} | Value: ${s['value']:,.0f}"
        )
    _log("risk_scan", "get_deal_health_scores",
         f"Generated health scores for {len(scores)} deals — "
         f"{sum(1 for s in scores if s['score'] < 50)} deals need attention",
         extra_data={"scores": [{
             "id": s['deal_id'], "title": s['deal_title'],
             "score": s['score'], "label": s['label']
         } for s in scores]})
    return "\n".join(result)

@tool
def update_deal_stage(deal_id: int, stage: str, notes: str = "") -> str:
    """Update the stage of a deal.
    Valid stages: prospecting, qualification, proposal, negotiation, closed_won, closed_lost."""
    payload = {"stage": stage}
    if notes:
        payload["notes"] = notes
    response = httpx.put(f"{BASE_URL}/deals/{deal_id}", json=payload)
    if response.status_code == 404:
        return f"Deal with ID {deal_id} not found."
    d = response.json()
    _log("deal_updated", "update_deal_stage",
         f"Updated '{d['title']}' stage to '{stage}'" +
         (f" — {notes}" if notes else ""),
         entity_type="deal", entity_id=deal_id, entity_name=d['title'],
         extra_data={"new_stage": stage, "notes": notes})
    return f"✅ Deal '{d['title']}' updated to stage: {stage}"

@tool
def draft_followup_email(contact_name: str, contact_email: str,
                          company: str, deal_title: str,
                          deal_stage: str, context: str = "") -> str:
    """Draft a personalized follow-up email for a contact."""
    email = f"""TO: {contact_email}
SUBJECT: Following up — {deal_title}

Hi {contact_name.split()[0]},

I wanted to follow up on our ongoing conversation about {deal_title} for {company}.

{f'Given that {context}, ' if context else ''}I'd love to reconnect and discuss where things stand from your end.

Would you have 20 minutes this week for a quick call?

Best regards,
[Your Name]"""

    _log("email_drafted", "draft_followup_email",
         f"Drafted follow-up email for {contact_name} at {company} re: {deal_title}",
         entity_type="contact", entity_name=contact_name,
         extra_data={"to": contact_email, "deal": deal_title,
                   "stage": deal_stage, "context": context})
    return email.strip()

TOOLS = [
    get_all_contacts,
    get_all_deals,
    get_at_risk_deals,
    get_contact_by_id,
    get_deal_by_id,
    get_deal_health_scores,
    update_deal_stage,
    draft_followup_email,
]