from typing import TypedDict, Annotated
from langgraph.graph import StateGraph, END
from langgraph.prebuilt import ToolNode
from langchain_groq import ChatGroq
from langchain_core.messages import HumanMessage, SystemMessage, BaseMessage, AIMessage
from langgraph.graph.message import add_messages
from agent.tools import TOOLS
from agent.prompts import SYSTEM_PROMPT
from dotenv import load_dotenv
import os

load_dotenv()

# ── State ─────────────────────────────────────────────────────────────────────
class AgentState(TypedDict):
    messages: Annotated[list[BaseMessage], add_messages]
    seen_tool_calls: list  # tracks tool+input combos already executed

# ── LLM ───────────────────────────────────────────────────────────────────────
def get_llm():
    return ChatGroq(
        model=os.getenv("MODEL_NAME", "llama3-groq-70b-8192-tool-use-preview"),
        api_key=os.getenv("GROQ_API_KEY"),
        temperature=0.1,
    ).bind_tools(TOOLS)

# ── Agent node ────────────────────────────────────────────────────────────────
def agent_node(state: AgentState):
    llm = get_llm()
    messages = [SystemMessage(content=SYSTEM_PROMPT)] + state["messages"]
    response = llm.invoke(messages)

    # Deduplicate tool calls — drop any the agent already made
    if hasattr(response, "tool_calls") and response.tool_calls:
        seen = state.get("seen_tool_calls", [])
        fresh_tool_calls = []

        for tc in response.tool_calls:
            key = f"{tc['name']}:{sorted(tc['args'].items()) if tc['args'] else ''}"
            if key not in seen:
                fresh_tool_calls.append(tc)
                seen.append(key)

        if not fresh_tool_calls:
            # All tool calls were duplicates — force stop by stripping tool_calls
            response = AIMessage(content=response.content or "Task completed.")

        else:
            # Patch response to only contain fresh tool calls
            response.tool_calls = fresh_tool_calls

        return {"messages": [response], "seen_tool_calls": seen}

    return {"messages": [response], "seen_tool_calls": state.get("seen_tool_calls", [])}

# ── Router ────────────────────────────────────────────────────────────────────
def should_continue(state: AgentState):
    last = state["messages"][-1]
    if hasattr(last, "tool_calls") and last.tool_calls:
        return "tools"
    return END

# ── Graph ─────────────────────────────────────────────────────────────────────
def build_graph():
    tool_node = ToolNode(TOOLS)
    graph = StateGraph(AgentState)
    graph.add_node("agent", agent_node)
    graph.add_node("tools", tool_node)
    graph.set_entry_point("agent")
    graph.add_conditional_edges("agent", should_continue, {"tools": "tools", END: END})
    graph.add_edge("tools", "agent")
    return graph.compile()

# ── Public interface ──────────────────────────────────────────────────────────
def run_agent(user_message: str) -> dict:
    app = build_graph()
    steps_log = []
    messages = []

    initial_state = {
        "messages": [HumanMessage(content=user_message)],
        "seen_tool_calls": []
    }

    for event in app.stream(
        initial_state,
        config={"recursion_limit": 15},
        stream_mode="values"
    ):
        messages = event.get("messages", [])
        for msg in messages:
            msg_type = type(msg).__name__
            if msg_type == "AIMessage":
                if hasattr(msg, "tool_calls") and msg.tool_calls:
                    for tc in msg.tool_calls:
                        steps_log.append({
                            "type": "tool_call",
                            "tool": tc["name"],
                            "input": tc["args"]
                        })
            elif msg_type == "ToolMessage":
                steps_log.append({
                    "type": "tool_result",
                    "tool": msg.name,
                    "output": msg.content[:300]
                })

    final_response = ""
    for msg in reversed(messages):
        if type(msg).__name__ == "AIMessage" and msg.content:
            final_response = msg.content
            break

    # Deduplicate steps_log for clean display
    seen = set()
    unique_steps = []
    for step in steps_log:
        key = f"{step['type']}:{step['tool']}:{str(step.get('input', ''))}"
        if key not in seen:
            seen.add(key)
            unique_steps.append(step)

    return {
        "response": final_response,
        "steps": unique_steps,
        "steps_count": len([s for s in unique_steps if s["type"] == "tool_call"])
    }

def run_agent_stream(user_message: str):
    """
    Stream agent steps as they happen.
    Yields dicts with type: 'step' | 'response' | 'error'
    """
    app = build_graph()
    seen_tool_calls = set()
    messages = []

    initial_state = {
        "messages": [HumanMessage(content=user_message)],
        "seen_tool_calls": []
    }

    for event in app.stream(
        initial_state,
        config={"recursion_limit": 15},
        stream_mode="values"
    ):
        messages = event.get("messages", [])
        for msg in messages:
            msg_type = type(msg).__name__

            if msg_type == "AIMessage":
                if hasattr(msg, "tool_calls") and msg.tool_calls:
                    for tc in msg.tool_calls:
                        key = f"{tc['name']}:{str(tc['args'])}"
                        if key not in seen_tool_calls:
                            seen_tool_calls.add(key)
                            yield {
                                "type": "tool_call",
                                "tool": tc["name"],
                                "input": tc["args"]
                            }

            elif msg_type == "ToolMessage":
                yield {
                    "type": "tool_result",
                    "tool": msg.name,
                    "output": msg.content[:200]
                }

    # Final response
    for msg in reversed(messages):
        if type(msg).__name__ == "AIMessage" and msg.content:
            yield {
                "type": "response",
                "content": msg.content
            }
            break