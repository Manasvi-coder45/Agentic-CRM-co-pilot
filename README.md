# Agentic CRM Co-Pilot

An autonomous AI agent that manages CRM workflows using natural language commands. Built with FastAPI, LangGraph, Groq (LLaMA 3.3 70B), and React.

## What it does

A sales rep can type commands like *"Find all at-risk deals and draft follow-up emails"* and the agent autonomously:
- Reads live CRM data (contacts, deals, tasks)
- Identifies deals with no activity in 7+ days
- Drafts personalized follow-up emails per contact
- Updates deal stages and logs activity
- Returns a full summary of every action taken

No manual clicking. The agent reasons, plans, and acts.

## Architecture

```
React Frontend  →  FastAPI Backend  →  LangGraph Agent  →  Groq LLM
                        ↓                    ↓
                   SQLite / PostgreSQL    CRM Tool Layer
```

## Tech Stack

| Layer       | Technology                        |
|-------------|-----------------------------------|
| Frontend    | React, React Router, Axios        |
| Backend     | Python, FastAPI, SQLAlchemy       |
| AI Agent    | LangGraph, LangChain              |
| LLM         | Groq API — LLaMA 3.3 70B         |
| Database    | SQLite (dev) / PostgreSQL (prod)  |
| Deploy      | Render |

## Agent Capabilities

- `get_all_contacts` — fetch all CRM contacts
- `get_all_deals` — fetch all deals with stage and value
- `get_at_risk_deals` — deals inactive for 7+ days
- `get_contact_by_id` — detailed contact lookup
- `get_deal_by_id` — detailed deal lookup
- `update_deal_stage` — move deals through pipeline
- `draft_followup_email` — personalized email generation

## Local Setup

### Prerequisites
- Python 3.11 (64-bit)
- Node.js 18+
- Groq API key (free at console.groq.com)

### Backend
```bash
cd backend
python -m venv venv
venv\Scripts\activate        # Windows
source venv/bin/activate     # Mac/Linux
pip install -r requirements.txt
cp .env.example .env         # Add your GROQ_API_KEY
python seed.py               # Load sample CRM data
uvicorn main:app --reload
```

### Frontend
```bash
cd frontend
npm install
npm run dev
```

Open `http://localhost:5173`

## Example Agent Commands

```
"Find all at-risk deals and draft follow-up emails for each one"
"Update the BlueWave deal stage to negotiation"
"Give me a pipeline summary by stage"
"Which deals are closing this month?"
"Show me all prospects and their deal values"
```

## API Endpoints

| Method | Endpoint           | Description                    |
|--------|--------------------|--------------------------------|
| GET    | /contacts/         | All contacts                   |
| GET    | /deals/            | All deals                      |
| GET    | /deals/at-risk     | Deals inactive 7+ days         |
| PUT    | /deals/{id}        | Update deal                    |
| POST   | /agent/run         | Run agent with natural language |

Full interactive docs: `http://localhost:8000/docs`

## Project Structure

```
agentic-crm-copilot/
├── backend/
│   ├── main.py           # FastAPI entry point
│   ├── database.py       # DB connection
│   ├── models/           # SQLAlchemy models
│   ├── routes/           # API route handlers
│   ├── agent/
│   │   ├── graph.py      # LangGraph agent loop
│   │   ├── tools.py      # Agent tool definitions
│   │   └── prompts.py    # System prompt
│   └── schemas/          # Pydantic schemas
├── frontend/
│   └── src/
│       ├── pages/        # Dashboard, AgentChat, Contacts, Deals
│       ├── components/   # Sidebar
│       └── api/          # Axios client
└── data/                 # Seed data
```
