from database import SessionLocal, engine, Base
from models.contact import Contact
from models.deal import Deal
from models.task import Task
from datetime import datetime, timezone, timedelta

Base.metadata.create_all(bind=engine)

def seed():
    db = SessionLocal()

    # Clear existing data
    db.query(Task).delete()
    db.query(Deal).delete()
    db.query(Contact).delete()
    db.commit()

    # --- Contacts ---
    contacts = [
        Contact(name="Sarah Mitchell",  email="sarah@techcorp.io",    company="TechCorp",      phone="555-0101", status="prospect"),
        Contact(name="James Patel",     email="james@growfast.com",   company="GrowFast Inc",  phone="555-0102", status="lead"),
        Contact(name="Priya Nair",      email="priya@scaleit.ai",     company="ScaleIt AI",    phone="555-0103", status="customer"),
        Contact(name="David Chen",      email="david@bluewave.io",    company="BlueWave",      phone="555-0104", status="prospect"),
        Contact(name="Emily Torres",    email="emily@novaretail.com",  company="Nova Retail",   phone="555-0105", status="lead"),
        Contact(name="Marcus Johnson",  email="marcus@infracloud.net", company="InfraCloud",    phone="555-0106", status="customer"),
    ]
    db.add_all(contacts)
    db.commit()
    for c in contacts:
        db.refresh(c)

    now = datetime.now(timezone.utc)

    # --- Deals (some at-risk: last_activity > 7 days ago) ---
    deals = [
        Deal(title="TechCorp Enterprise License",  contact_id=contacts[0].id, value=48000,  stage="proposal",       probability=65, last_activity=now - timedelta(days=10), expected_close=now + timedelta(days=20), notes="Waiting on legal review"),
        Deal(title="GrowFast CRM Subscription",    contact_id=contacts[1].id, value=12000,  stage="qualification",  probability=40, last_activity=now - timedelta(days=3),  expected_close=now + timedelta(days=30)),
        Deal(title="ScaleIt AI Expansion",         contact_id=contacts[2].id, value=95000,  stage="negotiation",    probability=80, last_activity=now - timedelta(days=1),  expected_close=now + timedelta(days=10), notes="Discount requested"),
        Deal(title="BlueWave Pilot Program",       contact_id=contacts[3].id, value=8500,   stage="prospecting",    probability=25, last_activity=now - timedelta(days=14), expected_close=now + timedelta(days=45), notes="No response to last two emails"),
        Deal(title="Nova Retail Analytics",        contact_id=contacts[4].id, value=31000,  stage="proposal",       probability=55, last_activity=now - timedelta(days=9),  expected_close=now + timedelta(days=15)),
        Deal(title="InfraCloud Support Renewal",   contact_id=contacts[5].id, value=22000,  stage="negotiation",    probability=90, last_activity=now - timedelta(days=2),  expected_close=now + timedelta(days=5),  notes="Almost closed"),
    ]
    db.add_all(deals)
    db.commit()

    print("✅ Database seeded successfully!")
    print(f"   {len(contacts)} contacts created")
    print(f"   {len(deals)} deals created")
    at_risk = sum(1 for d in deals if (now - d.last_activity.replace(tzinfo=timezone.utc)).days > 7)
    print(f"   At-risk deals (inactive >7 days): {at_risk}")
    db.close()

if __name__ == "__main__":
    seed()