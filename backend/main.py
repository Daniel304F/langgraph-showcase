import json
import uuid
from typing import Any

from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from sse_starlette.sse import EventSourceResponse
from dotenv import load_dotenv
from langgraph.types import Command

from graph import build_graph
from state import ResearchState

load_dotenv()

app = FastAPI(title="LangGraph Research Assistant")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

graph = build_graph()

NODE_OUTPUT_KEYS = {
    "understand_topic": "sub_topics",
    "evaluate_sources": "gathered_info",
    "check_quality": "quality_sufficient",
    "refine_topic": "refinement_notes",
    "summarize": "summary",
    "generate_report": "report",
}

NODE_DESCRIPTIONS = {
    "understand_topic": "Zerlegt die Forschungsfrage in Teilaspekte und Suchbegriffe",
    "evaluate_sources": "Recherchiert und sammelt Informationen zu jedem Teilaspekt",
    "check_quality": "Bewertet ob die gesammelten Infos ausreichend sind",
    "refine_topic": "Verfeinert die Suchstrategie basierend auf Lücken",
    "summarize": "Verdichtet alle Informationen zu einem Überblick",
    "generate_report": "Erstellt den finalen, lesbaren Report",
}

# Store resume values between POST and GET
resume_store: dict[str, Any] = {}


class ResumeRequest(BaseModel):
    value: Any


def serialize_state(state: dict) -> dict:
    result = {}
    for key, value in state.items():
        if isinstance(value, (str, int, float, bool)):
            result[key] = value
        elif isinstance(value, list):
            result[key] = [str(item) for item in value]
        else:
            result[key] = str(value)
    return result


def format_output_text(node_name: str, node_output: dict) -> str:
    output_key = NODE_OUTPUT_KEYS.get(node_name)
    if not output_key:
        return str(node_output)
    output_value = node_output.get(output_key, "")
    if isinstance(output_value, list):
        return "\n".join(str(item) for item in output_value)
    if isinstance(output_value, bool):
        return "Ja" if output_value else "Nein"
    return str(output_value)


async def stream_graph_events(config: dict, input_value):
    """Stream graph execution events via SSE."""
    current_state = {}
    started_nodes = set()

    async for stream_mode, chunk in graph.astream(
        input_value, config, stream_mode=["updates", "messages"]
    ):
        if stream_mode == "messages":
            msg_chunk, metadata = chunk
            node = metadata.get("langgraph_node", "")

            # Emit node_start when first token arrives for a node
            if node and node not in started_nodes:
                started_nodes.add(node)
                yield {
                    "event": "node_start",
                    "data": json.dumps({
                        "node": node,
                        "description": NODE_DESCRIPTIONS.get(node, ""),
                    }, ensure_ascii=False),
                }

            # Only forward AI response tokens
            if (
                hasattr(msg_chunk, "content")
                and msg_chunk.content
                and getattr(msg_chunk, "type", "") in ("AIMessageChunk", "ai")
            ):
                yield {
                    "event": "token",
                    "data": json.dumps({
                        "node": node,
                        "content": msg_chunk.content,
                    }, ensure_ascii=False),
                }

        elif stream_mode == "updates":
            for node_name, node_output in chunk.items():
                if node_name == "__interrupt__":
                    continue

                # Send node_start if no tokens were streamed for this node
                if node_name not in started_nodes:
                    started_nodes.add(node_name)
                    yield {
                        "event": "node_start",
                        "data": json.dumps({
                            "node": node_name,
                            "description": NODE_DESCRIPTIONS.get(node_name, ""),
                        }, ensure_ascii=False),
                    }

                current_state.update(node_output)
                iteration = current_state.get("iteration", 0)
                output_text = format_output_text(node_name, node_output)

                yield {
                    "event": "node_update",
                    "data": json.dumps({
                        "node": node_name,
                        "status": "completed",
                        "iteration": iteration,
                        "output": output_text,
                        "state": serialize_state(current_state),
                        "changed_keys": list(node_output.keys()),
                    }, ensure_ascii=False),
                }

    # Check for interrupt
    graph_state = graph.get_state(config)
    if graph_state.tasks:
        for task in graph_state.tasks:
            if task.interrupts:
                node_name = task.name
                if node_name not in started_nodes:
                    yield {
                        "event": "node_start",
                        "data": json.dumps({
                            "node": node_name,
                            "description": NODE_DESCRIPTIONS.get(node_name, ""),
                        }, ensure_ascii=False),
                    }
                interrupt_value = task.interrupts[0].value
                yield {
                    "event": "interrupt",
                    "data": json.dumps({
                        **interrupt_value,
                        "node": node_name,
                    }, ensure_ascii=False),
                }
                return

    yield {"event": "done", "data": json.dumps({"status": "finished"})}


@app.get("/research")
async def research(question: str):
    session_id = str(uuid.uuid4())
    config = {"configurable": {"thread_id": session_id}}

    initial_state: ResearchState = {
        "question": question,
        "sub_topics": [],
        "gathered_info": "",
        "quality_sufficient": False,
        "iteration": 0,
        "refinement_notes": "",
        "summary": "",
        "report": "",
    }

    async def event_stream():
        yield {
            "event": "session",
            "data": json.dumps({"session_id": session_id}),
        }
        yield {
            "event": "state_init",
            "data": json.dumps(serialize_state(initial_state), ensure_ascii=False),
        }

        async for event in stream_graph_events(config, initial_state):
            yield event

    return EventSourceResponse(event_stream())


@app.post("/research/{session_id}/resume")
async def store_resume(session_id: str, body: ResumeRequest):
    resume_store[session_id] = body.value
    return {"ok": True}


@app.get("/research/{session_id}/stream")
async def stream_resume(session_id: str):
    config = {"configurable": {"thread_id": session_id}}
    value = resume_store.pop(session_id, None)

    if value is None:
        return {"error": "no resume value found"}

    async def event_stream():
        async for event in stream_graph_events(config, Command(resume=value)):
            yield event

    return EventSourceResponse(event_stream())


@app.get("/health")
async def health():
    return {"status": "ok"}
