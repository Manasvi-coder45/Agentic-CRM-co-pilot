from fastapi import APIRouter, HTTPException
from fastapi.responses import StreamingResponse
from pydantic import BaseModel
from agent.graph import run_agent, run_agent_stream
import json

router = APIRouter(prefix="/agent", tags=["Agent"])

class AgentRequest(BaseModel):
    message: str
    history: list = []

class AgentResponse(BaseModel):
    response: str
    steps: list
    steps_count: int

@router.post("/run", response_model=AgentResponse)
def run_agent_endpoint(request: AgentRequest):
    if not request.message.strip():
        raise HTTPException(status_code=400, detail="Message cannot be empty")
    try:
        result = run_agent(request.message)
        return result
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Agent error: {str(e)}")

@router.get("/stream")
def stream_agent(message: str):
    """Stream agent steps as Server-Sent Events."""
    def generate():
        try:
            for event in run_agent_stream(message):
                yield f"data: {json.dumps(event)}\n\n"
        except Exception as e:
            yield f"data: {json.dumps({'type': 'error', 'content': str(e)})}\n\n"
        yield f"data: {json.dumps({'type': 'done'})}\n\n"

    return StreamingResponse(
        generate(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "X-Accel-Buffering": "no",
            "Access-Control-Allow-Origin": "*"
        }
    )

@router.get("/test")
def test_agent():
    return {"status": "Agent endpoint is live"}