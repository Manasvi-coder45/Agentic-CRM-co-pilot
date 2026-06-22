from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from dotenv import load_dotenv
from database import engine, Base
from routes import contacts, deals, agent, activity, scores
import os

load_dotenv()

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Agentic CRM Co-Pilot",
    description="AI agent powered by Groq + LLaMA that autonomously manages CRM workflows",
    version="2.0.0"
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:3000",
        "http://localhost:5173",          # if using Vite
        "https://agentic-crm-frontend.onrender.com/",  # add after you know exact URL
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(contacts.router)
app.include_router(deals.router)
app.include_router(agent.router)
app.include_router(activity.router)
app.include_router(scores.router)

@app.get("/")
def root():
    return {"status": "Agentic CRM Co-Pilot v2.0 running",
            "model": os.getenv("MODEL_NAME")}

@app.get("/health")
def health_check():
    return {
        "status": "healthy",
        "environment": os.getenv("ENVIRONMENT", "development"),
        "ai_provider": "Groq",
        "model": os.getenv("MODEL_NAME", "llama-3.3-70b-versatile"),
        "version": "2.0.0"
    }